import mongoose from 'mongoose';

const colorSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  hex: {
    type: String,
    trim: true
  }
}, { _id: false });

const sizeSchema = new mongoose.Schema({
  sizeName: {
    type: String,
    required: true,
    trim: true
  },
  onStock: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters long'],
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  brand: {
    type: String,
    trim: true,
    default: 'Marka belirtilmemiş'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'AZN',
    enum: ['AZN', 'USD', 'EUR', 'RUB']
  },
  priceInRubles: {
    type: Number,
    min: [0, 'Price in rubles cannot be negative']
  },
  discountedPrice: {
    type: Number,
    min: [0, 'Discounted price cannot be negative'],
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: 'Ürün açıklaması henüz eklenmemiş'
  },
  images: [{
    type: String, // Base64 encoded images or URLs
    default: []
  }],
  sizes: [sizeSchema],
  colors: [colorSchema],
  productUrl: {
    type: String,
    trim: true
  },
  store: {
    type: String, // Store name/identifier
    required: [true, 'Store is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  processedAt: {
    type: String // Time when processed
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'low_stock'],
    default: 'in_stock'
  },
  // Legacy stock field for backward compatibility
  stock: {
    quantity: {
      type: Number,
      min: [0, 'Stock quantity cannot be negative'],
      default: 0
    },
    isInStock: {
      type: Boolean,
      default: function() {
        return this.stock?.quantity > 0 || this.stockStatus === 'in_stock';
      }
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ store: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ stockStatus: 1 });
productSchema.index({ 'stock.isInStock': 1 });
productSchema.index({ productUrl: 1 });

// Update isInStock and stockStatus when quantity or sizes change
productSchema.pre('save', function(next) {
  // Check if any size is in stock
  const hasStockInSizes = this.sizes && this.sizes.some(size => size.onStock);
  
  // Update legacy stock field
  if (this.stock) {
    this.stock.isInStock = this.stock.quantity > 0 || hasStockInSizes || this.stockStatus === 'in_stock';
  }
  
  // Auto-update stockStatus based on sizes if not explicitly set
  if (this.sizes && this.sizes.length > 0) {
    if (hasStockInSizes) {
      this.stockStatus = 'in_stock';
    } else {
      this.stockStatus = 'out_of_stock';
    }
  }
  
  next();
});

// Method to check if product is available in specific size
productSchema.methods.isAvailableInSize = function(sizeName) {
  if (!this.sizes || this.sizes.length === 0) {
    return this.stockStatus === 'in_stock';
  }
  
  const size = this.sizes.find(s => s.sizeName === sizeName);
  return size ? size.onStock : false;
};

// Method to get available sizes
productSchema.methods.getAvailableSizes = function() {
  if (!this.sizes || this.sizes.length === 0) {
    return [];
  }
  
  return this.sizes.filter(size => size.onStock).map(size => size.sizeName);
};

const Product = mongoose.model('Product', productSchema);

export default Product;