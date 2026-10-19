import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true
    },
    docName: {
      type: String,
      required: true
    },
    page: {
      type: Number,
      default: 1
    },
    chunkId: {
      type: String,
      default: ''
    },
    excerpt: {
      type: String,
      required: true
    },
    matchScore: {
      type: String,
      default: '95%'
    }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 10000
    },
    citations: [citationSchema],
    isDenied: {
      type: Boolean,
      default: false
    },
    feedback: {
      type: String,
      enum: ['up', 'down', null],
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      default: 'New Inquiry',
      trim: true,
      maxlength: 150
    },
    messages: [messageSchema]
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ organizationId: 1, userId: 1, updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
