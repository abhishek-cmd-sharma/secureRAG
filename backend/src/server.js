import dotenv from 'dotenv';
dotenv.config();

import { connectDB, closeDB } from './config/db.js';
import { createApp } from './app.js';
import { seedInitialData } from './utils/seed.js';
import { initializeQdrant } from './services/qdrant.service.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Initialize or connect to Qdrant vector database
    await initializeQdrant();

    // 3. Seed initial data if empty
    await seedInitialData();

    // 4. Create Express app
    const app = createApp();

    // 5. Start HTTP listener
    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🛡️  SecureRAG AI Backend running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Client Origin: ${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}`);
      console.log('====================================================');
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        try {
          await closeDB();
          console.log('[Server] MongoDB connection closed.');
        } catch (dbErr) {
          console.error('[Server] Error closing database connection:', dbErr);
        }
        process.exit(0);
      });

      // Force shutdown after timeout if open connections hang
      setTimeout(() => {
        console.error('[Server] Forced shutdown due to timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
