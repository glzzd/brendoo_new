import express from 'express';
import authRoutes from './authRoutes.js';
import storeRoutes from './storeRoutes.js';
import stockRoutes from './stockRoutes.js';
import testRoutes from './testRoutes.js';
import webhookRoutes from './webhookRoutes.js';
import asyncRequestRoutes from './asyncRequestRoutes.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Brendoo API'
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/stores', storeRoutes);
router.use('/stock', stockRoutes);
router.use('/test', testRoutes);
router.use('/webhook', webhookRoutes);
router.use('/async-requests', asyncRequestRoutes);

// 404 handler for undefined API routes
router.use((req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

export default router;