import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true
    },
    internalStorageKey: {
      type: String,
      default: ''
    },
    storagePath: {
      type: String,
      default: ''
    },
    fileType: {
      type: String,
      enum: ['PDF', 'DOCX', 'TXT', 'MD', 'CSV'],
      default: 'PDF',
      uppercase: true
    },
    fileSize: {
      type: String,
      default: '1.5 MB'
    },
    fileSizeBytes: {
      type: Number,
      default: 0
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required']
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required']
    },
    accessLevel: {
      type: String,
      enum: {
        values: ['Public', 'Internal', 'Confidential', 'Restricted'],
        message: '{VALUE} is not a valid access level'
      },
      default: 'Internal'
    },
    allowedRoles: {
      type: [String],
      default: ['admin', 'manager', 'employee']
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'indexed', 'failed', 'Indexed', 'Processing', 'Ready', 'Archived', 'Failed'],
      default: 'indexed'
    },
    chunksCount: {
      type: Number,
      default: 0
    },
    embeddingModel: {
      type: String,
      default: 'text-embedding-004'
    },
    processingError: {
      type: String,
      default: null
    },
    summary: {
      type: String,
      default: ''
    },
    excerpt: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes
documentSchema.index({ organizationId: 1, accessLevel: 1 });
documentSchema.index({ organizationId: 1, status: 1 });
documentSchema.index({ title: 'text', summary: 'text' });

export const Document = mongoose.model('Document', documentSchema);
