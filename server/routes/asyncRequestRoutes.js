import express from 'express'
import AsyncRequest from '../models/AsyncRequest.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Get all async requests for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, storeId } = req.query
    
    const query = { initiatedBy: req.user.userId }
    
    if (status) {
      query.status = status
    }
    
    if (storeId) {
      query.storeId = storeId
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const requests = await AsyncRequest.find(query)
      .populate('storeId', 'name website')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await AsyncRequest.countDocuments(query)
    
    res.json({
      success: true,
      data: requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRequests: total,
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching async requests:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching async requests'
    })
  }
})

// Get notifications for recent async request updates
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    // Find recent updates (last 5 minutes) for user's requests
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const recentUpdates = await AsyncRequest.find({
      initiatedBy: req.user.userId,
      updatedAt: { $gte: fiveMinutesAgo },
      $or: [
        { status: 'completed' },
        { status: 'failed' },
        { 'results.0': { $exists: true } } // Has at least one result
      ]
    }).populate('storeId', 'name')
    
    const notifications = recentUpdates.map(request => {
      let message = ''
      
      if (request.status === 'completed') {
        message = `${request.storeId.name} mağazası üçün sorğu tamamlandı. ${request.totalResults} nəticə tapıldı.`
      } else if (request.status === 'failed') {
        message = `${request.storeId.name} mağazası üçün sorğu uğursuz oldu.`
      } else if (request.results.length > 0) {
        message = `${request.storeId.name} mağazası üçün ${request.results.length} yeni nəticə tapıldı.`
      }
      
      return {
        requestId: request.requestId,
        message,
        data: {
          storeId: request.storeId._id,
          storeName: request.storeId.name,
          status: request.status,
          totalResults: request.totalResults,
          newResults: request.results.length
        }
      }
    })
    
    res.json({
      success: true,
      notifications
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    })
  }
})

// Get a specific async request
router.get('/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params
    
    const request = await AsyncRequest.findOne({
      requestId,
      initiatedBy: req.user.userId
    }).populate('storeId', 'name website')
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Async request not found'
      })
    }
    
    res.json({
      success: true,
      data: request
    })
  } catch (error) {
    console.error('Error fetching async request:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while fetching async request'
    })
  }
})

// Create a new async request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { storeId, endpoint, parameters } = req.body
    
    if (!storeId || !endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Store ID and endpoint are required'
      })
    }

    const requestId = `async_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const asyncRequest = new AsyncRequest({
      requestId,
      storeId,
      endpoint: {
        name: endpoint.name,
        url: endpoint.url,
        method: endpoint.method || 'GET',
        parameters: parameters || {}
      },
      status: 'pending',
      initiatedBy: req.user.userId,
      webhookUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/webhook/async-result/${requestId}`
    })
    
    await asyncRequest.save()
    await asyncRequest.populate('storeId', 'name website')
    
    res.status(201).json({
      success: true,
      data: asyncRequest,
      message: 'Async request created successfully'
    })
  } catch (error) {
    console.error('Error creating async request:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while creating async request'
    })
  }
})

// Cancel an async request
router.patch('/:requestId/cancel', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params
    
    const request = await AsyncRequest.findOne({
      requestId,
      initiatedBy: req.user.userId
    })
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Async request not found'
      })
    }
    
    if (request.status === 'completed' || request.status === 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed or failed request'
      })
    }
    
    request.status = 'cancelled'
    request.updatedAt = new Date()
    await request.save()
    
    res.json({
      success: true,
      data: request,
      message: 'Async request cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling async request:', error)
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling async request'
    })
  }
})

export default router