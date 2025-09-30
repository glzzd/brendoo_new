import Product from '../models/Product.js';
import jwt from 'jsonwebtoken';

// Add new stock/product
export const addStock = async (req, res) => {
  console.log(req.body);
  
  try {
    const {
      name,
      brand,
      price,
      currency = 'AZN',
      priceInRubles,
      discountedPrice,
      description,
      images = [],
      sizes = [],
      colors = [],
      productUrl,
      store,
      category,
      processedAt,
      stockStatus = 'in_stock'
    } = req.body;

    // Validate required fields
    if (!name || !price || !store || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, store, and category are required'
      });
    }

    // Normalize all text fields to lowercase
    const normalizedName = name.trim().toLowerCase();
    const normalizedBrand = brand?.trim().toLowerCase();
    const normalizedStore = store.trim().toLowerCase();
    const normalizedCategory = category.trim().toLowerCase();
    const normalizedDescription = description?.trim().toLowerCase();

    // Check if product with same name already exists
    const existingProduct = await Product.findOne({ 
      name: normalizedName,
      isActive: true 
    });

    if (existingProduct) {
      console.log(`🔄 Aynı isimde ürün bulundu (${normalizedName}), eskisi siliniyor...`);
      
      // Delete existing product
      await Product.findByIdAndDelete(existingProduct._id);
      console.log(`✅ Eski ürün silindi: ${existingProduct._id}`);
    }

    // Process sizes array - normalize size names to lowercase
    const normalizedSizes = Array.isArray(sizes) ? sizes.map(size => ({
      ...size,
      sizeName: size.sizeName?.toLowerCase() || ''
    })) : [];

    // Process colors array - handle both string and object formats
    const normalizedColors = Array.isArray(colors) ? colors.map(color => {
      if (typeof color === 'string') {
        return { name: color.toLowerCase(), hex: null };
      } else if (typeof color === 'object' && color.name) {
        return {
          name: color.name.toLowerCase(),
          hex: color.hex || null
        };
      }
      return color;
    }) : [];

    // Calculate priceInRubles based on price ranges
    let priceValue = parseFloat(price);
    
    // Handle prices ending with double zeros (e.g., 4900 -> 49.00)
    if (priceValue >= 1000 && priceValue % 100 === 0) {
      priceValue = priceValue / 100;
    }
    
    let calculatedPriceInRubles;
    
    if (priceValue >= 1 && priceValue <= 100) {
      calculatedPriceInRubles = priceValue * 120;
    } else if (priceValue >= 101 && priceValue <= 150) {
      calculatedPriceInRubles = priceValue * 100;
    } else if (priceValue >= 151 && priceValue <= 200) {
      calculatedPriceInRubles = priceValue * 90;
    } else if (priceValue >= 201 && priceValue <= 350) {
      calculatedPriceInRubles = priceValue * 85;
    } else if (priceValue > 350) {
      calculatedPriceInRubles = priceValue * 80;
    } else {
      calculatedPriceInRubles = priceValue; // Default case for values less than 1
    }

    // Create new product with normalized fields
    const product = new Product({
      name: normalizedName,
      brand: normalizedBrand,
      price: priceValue,
      currency,
      priceInRubles: calculatedPriceInRubles,
      discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
      description: normalizedDescription,
      images: Array.isArray(images) ? images : [],
      sizes: normalizedSizes,
      colors: normalizedColors,
      productUrl: productUrl?.trim(),
      store: normalizedStore,
      category: normalizedCategory,
      processedAt: processedAt || new Date().toLocaleTimeString('tr-TR'),
      stockStatus,
      createdBy: req.user?.userId
    });

    await product.save();

    console.log(`✅ Yeni ürün eklendi: ${normalizedName}`);

    res.status(201).json({
      success: true,
      message: 'Stock added successfully',
      data: product
    });

  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding stock',
      error: error.message
    });
  }
};

// Get all stocks with filtering and pagination
export const getStocks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 1000, // Default limit'i 1000'e çıkardık
      store,
      category,
      brand,
      stockStatus,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (store) filter.store = new RegExp(store, 'i');
    if (category) filter.category = new RegExp(category, 'i');
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (stockStatus) filter.stockStatus = stockStatus;
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') },
        { store: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') },
        { productUrl: new RegExp(search, 'i') },
        { 'colors': { $in: [new RegExp(search, 'i')] } },
        { 'sizes.sizeName': new RegExp(search, 'i') }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get products with pagination
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting stocks',
      error: error.message
    });
  }
};

// Get single stock by ID
export const getStockById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Error getting stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting stock',
      error: error.message
    });
  }
};

// Update stock
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: product
    });

  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      error: error.message
    });
  }
};

// Delete stock (soft delete)
export const deleteStock = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    res.json({
      success: true,
      message: 'Stock deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting stock',
      error: error.message
    });
  }
};

// Update stock status for specific size
export const updateSizeStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { sizeName, onStock } = req.body;

    if (!sizeName || typeof onStock !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Size name and stock status are required'
      });
    }

    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find and update the size
    const sizeIndex = product.sizes.findIndex(size => size.sizeName === sizeName);
    
    if (sizeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Size not found'
      });
    }

    product.sizes[sizeIndex].onStock = onStock;
    await product.save();

    res.json({
      success: true,
      message: 'Size stock updated successfully',
      data: product
    });

  } catch (error) {
    console.error('Error updating size stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating size stock',
      error: error.message
    });
  }
};

// Get stock statistics
export const getStockStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          inStock: {
            $sum: {
              $cond: [{ $eq: ['$stockStatus', 'in_stock'] }, 1, 0]
            }
          },
          outOfStock: {
            $sum: {
              $cond: [{ $eq: ['$stockStatus', 'out_of_stock'] }, 1, 0]
            }
          },
          lowStock: {
            $sum: {
              $cond: [{ $eq: ['$stockStatus', 'low_stock'] }, 1, 0]
            }
          },
          averagePrice: { $avg: '$price' },
          totalValue: { $sum: '$price' }
        }
      }
    ]);

    const storeStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$store',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalProducts: 0,
          inStock: 0,
          outOfStock: 0,
          lowStock: 0,
          averagePrice: 0,
          totalValue: 0
        },
        byStore: storeStats,
        byCategory: categoryStats
      }
    });

  } catch (error) {
    console.error('Error getting stock stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting stock statistics',
      error: error.message
    });
  }
};

// Get products by store for integration
export const getProductsByStore = async (req, res) => {
  try {
    const { store } = req.query;

    if (!store) {
      return res.status(400).json({
        success: false,
        message: 'Store parameter is required'
      });
    }

    // Find products by store
    const products = await Product.find({ 
      store: store,
      isActive: true 
    }).select('-__v');

    res.json({
      success: true,
      data: products,
      count: products.length,
      store: store
    });

  } catch (error) {
    console.error('Error getting products by store:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting products by store',
      error: error.message
    });
  }
};