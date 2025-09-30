import express from 'express';
import {
  addStock,
  getStocks,
  getStockById,
  updateStock,
  deleteStock,
  updateSizeStock,
  getStockStats,
  getProductsByStore
} from '../controllers/stockController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public endpoint for external systems to add stock
router.post('/add', addStock);

// Integration endpoint to get products by store
router.get('/integration/store', getProductsByStore);

// Protected routes (require authentication)
router.use(authenticateToken);

// Get all stocks with filtering and pagination
router.get('/', getStocks);

// Get stock statistics
router.get('/stats', getStockStats);

// Get single stock by ID
router.get('/:id', getStockById);

// Update stock
router.put('/:id', updateStock);

// Delete stock (soft delete)
router.delete('/:id', deleteStock);

// Update stock status for specific size
router.patch('/:id/size', updateSizeStock);

export default router;