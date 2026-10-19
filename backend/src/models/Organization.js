import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: [true, 'Organization slug is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    tier: {
      type: String,
      enum: ['Enterprise Plus', 'Enterprise HIPAA', 'Business Pro', 'Starter'],
      default: 'Enterprise Plus'
    },
    compliance: {
      type: [String],
      default: ['SOC 2 Type II', 'ISO 27001']
    },
    seats: {
      type: Number,
      default: 50,
      min: [1, 'Seats must be at least 1']
    },
    storageLimit: {
      type: String,
      default: '25 GB'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
organizationSchema.index({ isActive: 1 });

export const Organization = mongoose.model('Organization', organizationSchema);
