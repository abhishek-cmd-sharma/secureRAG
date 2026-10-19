import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { seedInitialData } from './utils/seed.js';
import { initializeQdrant } from './services/qdrant.service.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Seed initial data if empty
    await seedInitialData();

    // 3. Initialize or connect to Qdrant vector database
    await initializeQdrant();

    // 4. Create Express app
    const app = createApp();

    // 4. Start HTTP listener
    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🛡️  SecureRAG AI Backend running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🌐 Client Origin: ${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}`);
      console.log('====================================================');
    });

    // Graceful shutdown handling
    const shutdown = async () => {
      console.log('\n[Server] Shutting down gracefully...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
