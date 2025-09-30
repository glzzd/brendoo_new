import express from 'express';
import {
  createAsyncRequest,
  receiveWebhookResult,
  getAsyncRequestStatus,
  getUserAsyncRequests,
  cancelAsyncRequest,
  cleanupOldRequests
} from '../controllers/webhookController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create a new async request (protected)
router.post('/async-request', authenticateToken, createAsyncRequest);

// Webhook endpoint to receive results (public - no auth needed)
router.post('/result/:requestId', receiveWebhookResult);

// Get async request status (protected)
router.get('/async-request/:requestId', authenticateToken, getAsyncRequestStatus);

// Get all async requests for current user (protected)
router.get('/async-requests', authenticateToken, getUserAsyncRequests);

// Cancel an async request (protected)
router.delete('/async-request/:requestId', authenticateToken, cancelAsyncRequest);

// Cleanup old requests (admin only)
router.delete('/cleanup', authenticateToken, cleanupOldRequests);

export default router;