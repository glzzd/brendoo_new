import Store from '../models/Store.js';
import mongoose from 'mongoose';

// Get all stores with pagination
export const getAllStores = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    
    // If no pagination parameters, return all stores
    if (!page && !limit) {
      const stores = await Store.find({ isActive: true })
        .populate('createdBy', 'username firstName lastName')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: stores
      });
    }

    // Apply pagination if parameters are provided
    const actualPage = page || 1;
    const actualLimit = limit || 5;
    const skip = (actualPage - 1) * actualLimit;

    // Get total count for pagination
    const totalStores = await Store.countDocuments({ isActive: true });
    
    // Get stores with pagination
    const stores = await Store.find({ isActive: true })
      .populate('createdBy', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(actualLimit);

    // Calculate pagination info
    const totalPages = Math.ceil(totalStores / actualLimit);
    const hasNextPage = actualPage < totalPages;
    const hasPrevPage = actualPage > 1;

    res.status(200).json({
      success: true,
      data: stores,
      pagination: {
        currentPage: actualPage,
        totalPages,
        totalStores,
        limit: actualLimit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stores',
      error: error.message
    });
  }
};

// Get single store by ID
export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID'
      });
    }

    const store = await Store.findById(id)
      .populate('createdBy', 'username firstName lastName');

    if (!store || !store.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.status(200).json({
      success: true,
      data: store
    });
  } catch (error) {
    console.error('Error fetching store:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching store'
    });
  }
};

// Create new store
export const createStore = async (req, res) => {
  try {
    const { name, website, logo, description } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Store name is required'
      });
    }

    // Check if store with same name already exists
    const existingStore = await Store.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isActive: true 
    });

    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: 'A store with this name already exists'
      });
    }

    const store = new Store({
      name: name.trim(),
      website: website || '',
      logo: logo || '',
      description: description || '',
      createdBy: userId
    });

    await store.save();

    // Populate the createdBy field before sending response
    await store.populate('createdBy', 'username firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: store
    });
  } catch (error) {
    console.error('Error creating store:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating store'
    });
  }
};

// Update store
export const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, website, logo, description, contact, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID'
      });
    }

    const store = await Store.findById(id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if another store with same name exists (excluding current store)
    if (name && name !== store.name) {
      const existingStore = await Store.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        isActive: true,
        _id: { $ne: id }
      });

      if (existingStore) {
        return res.status(400).json({
          success: false,
          message: 'A store with this name already exists'
        });
      }
    }

    // Update fields
    if (name) store.name = name;
    if (website !== undefined) store.website = website;
    if (logo !== undefined) store.logo = logo;
    if (description !== undefined) store.description = description;
    if (contact) store.contact = { ...store.contact, ...contact };
    if (isActive !== undefined) store.isActive = Boolean(isActive);

    await store.save();
    await store.populate('createdBy', 'username firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Store updated successfully',
      data: store
    });
  } catch (error) {
    console.error('Error updating store:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating store'
    });
  }
};

// Delete store (hard delete)
export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid store ID'
      });
    }

    const store = await Store.findById(id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Hard delete - remove from database completely
    await Store.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting store'
    });
  }
};

// Add endpoint to store
export const addEndpointToStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { name, url, method, description, headers = [], parameters = [] } = req.body;

    console.log('Adding endpoint to store:', storeId);
    console.log('User object:', req.user);
    console.log('Request body:', req.body);

    // Validate required fields
    if (!name || !url || !method) {
      return res.status(400).json({
        success: false,
        message: 'Name, URL and method are required'
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user.userId || req.user.id;

    // Validate store exists and user has permission
    const store = await Store.findOne({ 
      _id: storeId, 
      createdBy: userId 
    });

    console.log('Found store for endpoint creation:', store ? 'Yes' : 'No');

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found or you do not have permission'
      });
    }

    // Create new endpoint
    const newEndpoint = {
      name: name.trim(),
      url: url.trim(),
      method: method.toUpperCase(),
      description: description?.trim() || '',
      headers: headers.map(h => ({
        key: h.key?.trim(),
        value: h.value?.trim()
      })).filter(h => h.key && h.value),
      parameters: parameters.map(p => ({
        name: p.name?.trim(),
        type: p.type || 'string',
        required: Boolean(p.required),
        description: p.description?.trim() || ''
      })).filter(p => p.name),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add endpoint to store
    store.endpoints.push(newEndpoint);
    await store.save();

    // Get the added endpoint (last one)
    const addedEndpoint = store.endpoints[store.endpoints.length - 1];

    res.status(201).json({
      success: true,
      message: 'Endpoint successfully added',
      data: addedEndpoint
    });

  } catch (error) {
    console.error('Error adding endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding endpoint',
      error: error.message
    });
  }
};

// Update endpoint in store
export const updateEndpointInStore = async (req, res) => {
  try {
    const { storeId, endpointId } = req.params;
    const { name, url, method, description, headers = [], parameters = [], isActive } = req.body;

    console.log('Updating endpoint in store:', storeId, 'endpoint:', endpointId);
    console.log('User object:', req.user);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user.userId || req.user.id;

    // Validate store exists and user has permission
    const store = await Store.findOne({ 
      _id: storeId, 
      createdBy: userId 
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found or you do not have permission'
      });
    }

    // Find endpoint
    const endpoint = store.endpoints.id(endpointId);
    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found'
      });
    }

    // Update endpoint fields
    if (name) endpoint.name = name.trim();
    if (url) endpoint.url = url.trim();
    if (method) endpoint.method = method.toUpperCase();
    if (description !== undefined) endpoint.description = description.trim();
    if (isActive !== undefined) endpoint.isActive = Boolean(isActive);
    
    // Update headers
    endpoint.headers = headers.map(h => ({
      key: h.key?.trim(),
      value: h.value?.trim()
    })).filter(h => h.key && h.value);

    // Update parameters
    endpoint.parameters = parameters.map(p => ({
      name: p.name?.trim(),
      type: p.type || 'string',
      required: Boolean(p.required),
      description: p.description?.trim() || ''
    })).filter(p => p.name);

    endpoint.updatedAt = new Date();

    await store.save();

    res.status(200).json({
      success: true,
      message: 'Endpoint successfully updated',
      data: endpoint
    });

  } catch (error) {
    console.error('Error updating endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating endpoint',
      error: error.message
    });
  }
};

// Delete endpoint from store
export const deleteEndpointFromStore = async (req, res) => {
  try {
    const { storeId, endpointId } = req.params;

    console.log('Deleting endpoint from store:', storeId, 'endpoint:', endpointId);
    console.log('User object:', req.user);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user.userId || req.user.id;

    // Validate store exists and user has permission
    const store = await Store.findOne({ 
      _id: storeId, 
      createdBy: userId 
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found or you do not have permission'
      });
    }

    // Find and remove endpoint
    const endpoint = store.endpoints.id(endpointId);
    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found'
      });
    }

    // Remove endpoint
    store.endpoints.pull(endpointId);
    await store.save();

    res.status(200).json({
      success: true,
      message: 'Endpoint successfully deleted'
    });

  } catch (error) {
    console.error('Error deleting endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting endpoint',
      error: error.message
    });
  }
};

// Get all endpoints for a store
export const getStoreEndpoints = async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log('Getting endpoints for store:', storeId);
    console.log('User object:', req.user);
    console.log('User ID:', req.user?.userId || req.user?.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user.userId || req.user.id;

    // Validate store exists (removed permission check as requested)
    const store = await Store.findOne({ 
      _id: storeId,
      isActive: true 
    }).select('endpoints name isActive');

    console.log('Found store:', store ? 'Yes' : 'No');
    if (store) {
      console.log('Store active:', store.isActive);
      console.log('Endpoints count:', store.endpoints ? store.endpoints.length : 0);
    }

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found or you do not have permission'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        storeName: store.name,
        endpoints: store.endpoints || []
      }
    });

  } catch (error) {
    console.error('Error fetching endpoints:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching endpoints',
      error: error.message
    });
  }
};

// Trigger endpoint asynchronously (fire-and-forget)
export const triggerEndpointAsync = async (req, res) => {
  try {
    const { storeId, endpointId } = req.params;

    console.log('Triggering endpoint async:', { storeId, endpointId });

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user.userId || req.user.id;

    // Validate store exists and user has permission
    const store = await Store.findOne({ 
      _id: storeId, 
      createdBy: userId 
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found or you do not have permission'
      });
    }

    // Find the specific endpoint
    const endpoint = store.endpoints.id(endpointId);
    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found'
      });
    }

    // Generate a unique job ID for tracking
    const jobId = new mongoose.Types.ObjectId().toString();

    // Immediately respond to client with job ID
    res.status(202).json({
      success: true,
      message: 'Endpoint trigger initiated',
      jobId: jobId,
      endpoint: {
        name: endpoint.name,
        method: endpoint.method,
        url: endpoint.url
      }
    });

    // Execute the actual HTTP request asynchronously (fire-and-forget)
    setImmediate(async () => {
      try {
        console.log(`[Job ${jobId}] Starting async endpoint execution`);
        
        // Construct full URL
        let fullUrl = endpoint.url;
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
          if (store.website && (store.website.startsWith('http://') || store.website.startsWith('https://'))) {
            fullUrl = store.website.replace(/\/$/, '') + (endpoint.url.startsWith('/') ? endpoint.url : '/' + endpoint.url);
          } else {
            fullUrl = 'http://' + endpoint.url;
          }
        }

        console.log(`[Job ${jobId}] Making request to: ${fullUrl}`);
        
        const startTime = Date.now();
        
        // Make the actual HTTP request
        const response = await fetch(fullUrl, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Brendoo-API-Tester/1.0'
          },
          // No timeout - let it run as long as needed
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        let responseData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        console.log(`[Job ${jobId}] Completed successfully in ${responseTime}ms - Status: ${response.status}`);
        
        // Here you could store the result in database, send to queue, etc.
        // For now, we just log it
        const result = {
          jobId,
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          responseTime,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: new Date().toISOString(),
          url: fullUrl,
          endpoint: {
            name: endpoint.name,
            method: endpoint.method
          }
        };

        // You could implement result storage here
        // await storeJobResult(jobId, result);
        
      } catch (error) {
        console.error(`[Job ${jobId}] Failed:`, error.message);
        
        // You could implement error storage here
        // await storeJobError(jobId, error);
      }
    });

  } catch (error) {
    console.error('Error triggering endpoint async:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while triggering endpoint',
      error: error.message
    });
  }
};