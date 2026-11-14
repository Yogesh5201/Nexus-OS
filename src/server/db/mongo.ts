import "server-only";

/**
 * MongoDB Atlas connection.
 *
 * Holds a single, lazily-created `MongoClient` cached on `globalThis` so that
 * Next.js hot-reloads (and serverless invocations that reuse the same process)
 * don't open a new connection pool every time. The connection string lives only
 * in `MONGODB_URI` (server-only env var) and is never exposed to the client.
 */
import { MongoClient, type Db } from "mongodb";

const DEFAULT_DB = "nexus";

/** True when a Mongo connection string is configured. */
export const isMongoConfigured = Boolean(process.env.MONGODB_URI);

/** Cache the client promise across HMR / warm invocations. */
const globalForMongo = globalThis as unknown as {
  _nexusMongo?: Promise<MongoClient>;
};

function createClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local to enable the database."
    );
  }
  const client = new MongoClient(uri, {
    // Keep the pool modest — many short-lived API-route calls.
    maxPoolSize: 10,
    retryWrites: true,
  });
  return client.connect();
}

/** Get the connected MongoClient (shared singleton). */
export async function getMongoClient(): Promise<MongoClient> {
  if (!globalForMongo._nexusMongo) {
    globalForMongo._nexusMongo = createClient();
  }
  return globalForMongo._nexusMongo;
}

/** Get the application database handle. */
export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || DEFAULT_DB);
}
