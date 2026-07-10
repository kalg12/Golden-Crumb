import mongoose from 'mongoose';
import dns from 'dns';

try {
  // Set DNS servers to Cloudflare and Google to prevent querySrv ECONNREFUSED issues on local Windows dev environment
  dns.setServers(['1.1.1.1', '8.8.8.8']);
} catch (err) {
  console.warn('Warning: Failed to set custom DNS servers for MongoDB SRV resolution:', err);
}


const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set for this environment. Locally, define it in .env.local; ' +
      'on Vercel, add it under Project Settings > Environment Variables and redeploy ' +
      '(adding the variable does not affect deployments already built).'
    );
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}
