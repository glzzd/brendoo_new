import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    minlength: [2, 'Store name must be at least 2 characters long'],
    maxlength: [100, 'Store name cannot exceed 100 characters']
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty website
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid URL starting with http:// or https://'
    }
  },
  logo: {
    type: String,
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: 'Mağaza haqqında məlumat qeyd edilməyib.'
  },
  endpoints: [{
    name: {
      type: String,
      required: [true, 'Endpoint name is required'],
      trim: true,
      maxlength: [100, 'Endpoint name cannot exceed 100 characters']
    },
    url: {
      type: String,
      required: [true, 'Endpoint URL is required'],
      trim: true,
      validate: {
        validator: function(v) {
          // Allow relative URLs (starting with /), full URLs, IP addresses with ports, or template URLs
          return /^(https?:\/\/.+|\/.*|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?.*|\{.*\}.*)$/.test(v);
        },
        message: 'Please enter a valid URL or endpoint path'
      }
    },
    method: {
      type: String,
      required: [true, 'HTTP method is required'],
      enum: {
        values: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        message: 'Method must be one of: GET, POST, PUT, PATCH, DELETE'
      },
      uppercase: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Endpoint description cannot exceed 300 characters'],
      default: ''
    },
    headers: [{
      key: {
        type: String,
        required: true,
        trim: true
      },
      value: {
        type: String,
        required: true,
        trim: true
      }
    }],
    parameters: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'object', 'array'],
        default: 'string'
      },
      required: {
        type: Boolean,
        default: false
      },
      description: {
        type: String,
        trim: true,
        default: ''
      }
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  contact: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty email
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email'
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for products
storeSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'store'
});

// Indexes for better performance
storeSchema.index({ name: 1 });
storeSchema.index({ isActive: 1 });
storeSchema.index({ createdBy: 1 });

const Store = mongoose.model('Store', storeSchema);

export default Store;