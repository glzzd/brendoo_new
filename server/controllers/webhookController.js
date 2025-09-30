import AsyncRequest from '../models/AsyncRequest.js';
import { v4 as uuidv4 } from 'uuid';

// Create a new async request
export const createAsyncRequest = async (req, res) => {
  try {
    const { storeId, endpoint, expectedResults, timeout, notes } = req.body;
    
    const requestId = uuidv4();
    const webhookUrl = `${req.protocol}://${req.get('host')}/api/webhook/result/${requestId}`;
    
    const asyncRequest = new AsyncRequest({
      requestId,
      storeId,
      endpoint,
      expectedResults,
      timeout: timeout || 86400000, // Default 24 hours
      notes,
      webhookUrl,
      initiatedBy: req.user.id
    });
    
    await asyncRequest.save();
    
    res.status(201).json({
      success: true,
      data: {
        requestId,
        webhookUrl,
        status: 'pending',
        message: 'Asenkron sorğu yaradıldı. Nəticələr webhook vasitəsilə göndəriləcək.'
      }
    });
  } catch (error) {
    console.error('Error creating async request:', error);
    res.status(500).json({
      success: false,
      message: 'Asenkron sorğu yaradılarkən xəta baş verdi',
      error: error.message
    });
  }
};

// Webhook endpoint to receive results
export const receiveWebhookResult = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { data, metadata, isComplete, isFailed, failureReason } = req.body;
    
    const asyncRequest = await AsyncRequest.findOne({ requestId, isActive: true });
    
    if (!asyncRequest) {
      return res.status(404).json({
        success: false,
        message: 'Asenkron sorğu tapılmadı'
      });
    }
    
    // Handle failure
    if (isFailed) {
      await asyncRequest.markFailed(failureReason || 'Dış backend xətası');
      return res.status(200).json({
        success: true,
        message: 'Xəta qeydə alındı'
      });
    }
    
    // Add result data
    if (data) {
      await asyncRequest.addResult(data, metadata);
    }
    
    // Mark as complete if indicated
    if (isComplete) {
      await asyncRequest.markCompleted();
    }
    
    res.status(200).json({
      success: true,
      message: 'Nəticə qəbul edildi',
      totalResults: asyncRequest.totalResults
    });
    
  } catch (error) {
    console.error('Error processing webhook result:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook nəticəsi emal edilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Get async request status and results
export const getAsyncRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const asyncRequest = await AsyncRequest.findOne({ requestId })
      .populate('storeId', 'name')
      .populate('initiatedBy', 'username email');
    
    if (!asyncRequest) {
      return res.status(404).json({
        success: false,
        message: 'Asenkron sorğu tapılmadı'
      });
    }
    
    // Check if user has permission to view this request
    if (asyncRequest.initiatedBy._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu sorğuya baxmaq icazəniz yoxdur'
      });
    }
    
    res.json({
      success: true,
      data: asyncRequest
    });
    
  } catch (error) {
    console.error('Error getting async request status:', error);
    res.status(500).json({
      success: false,
      message: 'Sorğu statusu alınarkən xəta baş verdi',
      error: error.message
    });
  }
};

// Get all async requests for a user
export const getUserAsyncRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, storeId } = req.query;
    const userId = req.user.id;
    
    const query = { initiatedBy: userId };
    
    if (status) {
      query.status = status;
    }
    
    if (storeId) {
      query.storeId = storeId;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { initiatedAt: -1 },
      populate: [
        { path: 'storeId', select: 'name' }
      ]
    };
    
    const asyncRequests = await AsyncRequest.paginate(query, options);
    
    res.json({
      success: true,
      data: asyncRequests
    });
    
  } catch (error) {
    console.error('Error getting user async requests:', error);
    res.status(500).json({
      success: false,
      message: 'Asenkron sorğular alınarkən xəta baş verdi',
      error: error.message
    });
  }
};

// Cancel an async request
export const cancelAsyncRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const asyncRequest = await AsyncRequest.findOne({ requestId });
    
    if (!asyncRequest) {
      return res.status(404).json({
        success: false,
        message: 'Asenkron sorğu tapılmadı'
      });
    }
    
    // Check if user has permission to cancel this request
    if (asyncRequest.initiatedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu sorğunu ləğv etmək icazəniz yoxdur'
      });
    }
    
    // Can only cancel pending or processing requests
    if (!['pending', 'processing'].includes(asyncRequest.status)) {
      return res.status(400).json({
        success: false,
        message: 'Yalnız gözləyən və ya emal olunan sorğular ləğv edilə bilər'
      });
    }
    
    asyncRequest.status = 'failed';
    asyncRequest.completedAt = new Date();
    asyncRequest.notes = 'İstifadəçi tərəfindən ləğv edildi';
    asyncRequest.isActive = false;
    
    await asyncRequest.save();
    
    res.json({
      success: true,
      message: 'Asenkron sorğu ləğv edildi'
    });
    
  } catch (error) {
    console.error('Error canceling async request:', error);
    res.status(500).json({
      success: false,
      message: 'Sorğu ləğv edilərkən xəta baş verdi',
      error: error.message
    });
  }
};

// Cleanup old completed requests (admin only)
export const cleanupOldRequests = async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu əməliyyat üçün admin icazəsi lazımdır'
      });
    }
    
    const result = await AsyncRequest.cleanupOldRequests(parseInt(daysOld));
    
    res.json({
      success: true,
      message: `${result.deletedCount} köhnə sorğu silindi`,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Error cleaning up old requests:', error);
    res.status(500).json({
      success: false,
      message: 'Köhnə sorğular silinərkən xəta baş verdi',
      error: error.message
    });
  }
};