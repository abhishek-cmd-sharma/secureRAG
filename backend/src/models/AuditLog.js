import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required']
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    actorName: {
      type: String,
      default: 'System'
    },
    actorEmail: {
      type: String,
      default: 'system@internal'
    },
    actorRole: {
      type: String,
      default: 'system'
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      uppercase: true
    },
    resourceType: {
      type: String,
      enum: ['USER', 'ORGANIZATION', 'DOCUMENT', 'AUTH', 'SETTINGS', 'SYSTEM', 'AI_CHAT', 'CONVERSATION'],
      required: true
    },
    resourceId: {
      type: String,
      default: null
    },
    resourceName: {
      type: String,
      default: ''
    },
    result: {
      type: String,
      enum: ['allowed', 'denied'],
      default: 'allowed',
      lowercase: true
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    userAgent: {
      type: String,
      default: ''
    },
    requestId: {
      type: String,
      default: () => `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    },
    integrityHash: {
      type: String,
      default: ''
    },
    details: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Indexes
auditLogSchema.index({ organizationId: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, action: 1 });
auditLogSchema.index({ organizationId: 1, result: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
