import mongoose from 'mongoose';

const asyncRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  endpoint: {
    url: {
      type: String,
      required: true
    },
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'timeout'],
    default: 'pending',
    index: true
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: {
    type: Date
  },
  results: [{
    receivedAt: {
      type: Date,
      default: Date.now
    },
    data: {
      type: mongoose.Schema.Types.Mixed
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  totalResults: {
    type: Number,
    default: 0
  },
  expectedResults: {
    type: Number,
    default: null // null means unknown
  },
  webhookUrl: {
    type: String,
    required: true
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  timeout: {
    type: Number,
    default: 86400000 // 24 hours in milliseconds
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
asyncRequestSchema.index({ status: 1, initiatedAt: -1 });
asyncRequestSchema.index({ storeId: 1, status: 1 });
asyncRequestSchema.index({ initiatedBy: 1, initiatedAt: -1 });

// Method to add a new result
asyncRequestSchema.methods.addResult = function(data, metadata = {}) {
  this.results.push({
    data,
    metadata,
    receivedAt: new Date()
  });
  this.totalResults = this.results.length;
  
  // Check if we should mark as completed
  if (this.expectedResults && this.totalResults >= this.expectedResults) {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Method to mark as completed
asyncRequestSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Method to mark as failed
asyncRequestSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.completedAt = new Date();
  if (reason) {
    this.notes = reason;
  }
  return this.save();
};

// Static method to cleanup old requests
asyncRequestSchema.statics.cleanupOldRequests = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    status: { $in: ['completed', 'failed'] },
    completedAt: { $lt: cutoffDate }
  });
};

const AsyncRequest = mongoose.model('AsyncRequest', asyncRequestSchema);

export default AsyncRequest;