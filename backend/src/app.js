import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import organizationRoutes from './routes/organization.routes.js';
import documentRoutes from './routes/document.routes.js';
import auditRoutes from './routes/audit.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { getDatabaseStatus } from './config/db.js';
import { getEmbeddingStatus } from './services/embedding.service.js';
import { getQdrantStatus } from './services/qdrant.service.js';
import { getGenerationStatus } from './services/gemini.service.js';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // Controlled CORS configuration with support for comma-separated origins and reverse-proxy same-origin requests
  const rawOrigins = process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
  const configuredOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);
  const devOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:80', 'http://localhost:5000'];
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? configuredOrigins
    : Array.from(new Set([...configuredOrigins, ...devOrigins]));

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., curl, same-origin reverse proxy)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id']
    })
  );

  // Request ID tracing middleware
  app.use((req, res, next) => {
    req.id = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    res.setHeader('X-Request-Id', req.id);
    next();
  });

  // Targeted rate limiters
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // max 20 login/register attempts per 15 min
    message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
  });

  const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30, // max 30 queries per minute per IP
    message: { success: false, message: 'Chat query rate limit exceeded. Please wait a minute.' }
  });

  const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // max 50 uploads per 15 min
    message: { success: false, message: 'Upload rate limit exceeded. Please try again later.' }
  });

  // General API limit
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP. Please try again after 15 minutes.'
    }
  });
  app.use('/api', limiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/chat', chatLimiter);
  app.use('/api/documents/upload', uploadLimiter);

  // Body and cookie parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    const dbStatus = getDatabaseStatus();
    const embStatus = getEmbeddingStatus();
    const qdrantStatus = getQdrantStatus();
    const geminiStatus = getGenerationStatus();

    // Overall status: healthy if DB is connected and embeddings are ready, degraded if running in mock/fallback
    const isDegraded = 
      dbStatus.status === 'fallback_memory' || 
      embStatus.mode === 'mock' || 
      qdrantStatus.mode === 'in_memory_fallback' ||
      dbStatus.status === 'disconnected';

    const ragReady = dbStatus.status !== 'disconnected' && embStatus.status !== 'error';

    res.json({
      status: isDegraded ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      service: 'SecureRAG AI Backend API',
      version: '2.0.0',
      uptime: process.uptime(),
      ragReady,
      subsystems: {
        database: dbStatus,
        embedding: embStatus,
        vectorStore: qdrantStatus,
        gemini: geminiStatus
      }
    });
  });

  // Mount API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/chat', chatRoutes);

  // 404 & Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
