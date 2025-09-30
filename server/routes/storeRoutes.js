import express from 'express';
import { 
  getAllStores, 
  getStoreById, 
  createStore, 
  updateStore, 
  deleteStore,
  addEndpointToStore,
  updateEndpointInStore,
  deleteEndpointFromStore,
  getStoreEndpoints,
  triggerEndpointAsync
} from '../controllers/storeController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All store routes require authentication
router.use(authenticateToken);

// GET /api/stores - Get all stores
router.get('/', getAllStores);

// GET /api/stores/:id - Get single store by ID
router.get('/:id', getStoreById);

// POST /api/stores - Create new store
router.post('/', createStore);

// PUT /api/stores/:id - Update store
router.put('/:id', updateStore);

// DELETE /api/stores/:id - Delete store (soft delete)
router.delete('/:id', deleteStore);

// Endpoint management routes
// GET /api/stores/:storeId/endpoints - Get all endpoints for a store
router.get('/:storeId/endpoints', getStoreEndpoints);

// POST /api/stores/:storeId/endpoints - Add new endpoint to store
router.post('/:storeId/endpoints', addEndpointToStore);

// PUT /api/stores/:storeId/endpoints/:endpointId - Update endpoint in store
router.put('/:storeId/endpoints/:endpointId', updateEndpointInStore);

// DELETE /api/stores/:storeId/endpoints/:endpointId - Delete endpoint from store
router.delete('/:storeId/endpoints/:endpointId', deleteEndpointFromStore);

// POST /api/stores/:storeId/endpoints/:endpointId/trigger - Trigger endpoint asynchronously
router.post('/:storeId/endpoints/:endpointId/trigger', triggerEndpointAsync);

export default router;