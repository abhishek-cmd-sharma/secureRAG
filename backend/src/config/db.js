import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dns from 'dns';

let mongod = null;
let currentDbMode = 'disconnected'; // 'atlas', 'persistent_local', 'memory_dev'

export function getDatabaseStatus() {
  const isMongooseConnected = mongoose.connection.readyState === 1;
  return {
    status: isMongooseConnected ? 'connected' : 'disconnected',
    mode: currentDbMode,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'unknown',
    name: mongoose.connection.name || 'securerag'
  };
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const allowMemoryDb = process.env.ALLOW_MEMORY_DB === 'true' || (!uri && process.env.NODE_ENV !== 'production');

  // Fix querySrv ECONNREFUSED on Windows local networks by setting fallback DNS servers
  if (uri && uri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (e) {
      console.warn('[DB] Could not set custom DNS servers:', e.message);
    }
  }

  try {
    if (uri && uri.trim() !== '') {
      const sanitizedUri = uri.replace(/\/\/.*@/, '//***:***@');
      console.log(`[DB] Attempting connection to MongoDB at: ${sanitizedUri}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000
      });
      currentDbMode = uri.includes('mongodb.net') ? 'atlas' : 'persistent_local';
      console.log(`✅ [DB] Successfully connected to persistent MongoDB (${currentDbMode})`);
      return;
    }

    if (allowMemoryDb) {
      console.log('⚡ [DB] No MONGODB_URI provided. Starting in-memory development MongoDB server (ALLOW_MEMORY_DB enabled)...');
      mongod = await MongoMemoryServer.create({
        instance: { launchTimeout: 30000 }
      });
      const inMemoryUri = mongod.getUri();
      await mongoose.connect(inMemoryUri);
      currentDbMode = 'memory_dev';
      console.log(`⚠️  [DB] Running on temporary in-memory MongoDB (${inMemoryUri}). Data will not persist across restarts.`);
      return;
    }

    throw new Error('MONGODB_URI is not configured and ALLOW_MEMORY_DB is false.');
  } catch (err) {
    console.error(`❌ [DB] Persistent MongoDB connection failed: ${err.message}`);

    if (allowMemoryDb && process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  [DB] Falling back to MongoDB Memory Server because ALLOW_MEMORY_DB is enabled.');
      try {
        mongod = await MongoMemoryServer.create({
          instance: { launchTimeout: 30000 }
        });
        const inMemoryUri = mongod.getUri();
        await mongoose.connect(inMemoryUri);
        currentDbMode = 'memory_dev';
        console.log(`⚠️  [DB] Fallback connected to temporary MongoDB Memory Server: ${inMemoryUri}`);
        return;
      } catch (fallbackErr) {
        console.error('❌ [DB] Critical: In-memory fallback failed:', fallbackErr.message);
        process.exit(1);
      }
    } else {
      console.error('❌ [DB] Refusing to start with ephemeral database in persistent mode. Set ALLOW_MEMORY_DB=true to allow in-memory fallback.');
      process.exit(1);
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('❌ [DB] Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ [DB] Mongoose disconnected');
  });
}

export async function closeDB() {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.error('Error closing database:', err);
  }
}
