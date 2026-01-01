// ============================================
// LORETTO SCHOOL PORTAL - DATABASE CONNECTION
// ============================================
// PostgreSQL with Drizzle ORM

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database URL from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Please add it to your environment variables.\n' +
    'For Replit PostgreSQL: Go to Tools > Database > PostgreSQL, then copy the connection string.'
  );
}

// Create postgres connection
// For migrations and one-off scripts, set max: 1
const client = postgres(connectionString, {
  max: process.env.NODE_ENV === 'production' ? 10 : 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Export for use in migrations
export { client };

// Export schema for convenience
export * from './schema';
