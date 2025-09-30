import express from 'express';

const router = express.Router();

// Test endpoint for frontend-backend communication
router.post('/test', (req, res) => {
  const { message } = req.body;
  
  console.log('Received message from frontend:', message);
  
  res.json({
    success: true,
    message: `Backend received: "${message}" - Connection successful!`,
    timestamp: new Date().toISOString(),
    server: 'Node.js Express Server'
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

export default router;