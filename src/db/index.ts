import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as pg from 'pg';
import * as schema from './schema.js';
import * as relations from './relations.js';

const { Pool } = pg;

declare global {
  var _postgresPool: pg.Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connStr = process.env.DATABASE_URL;
    const isConnectionString = !!connStr;
    const isSupabase = connStr?.includes('supabase.com') || connStr?.includes('pooler.supabase.com');
    const poolConfig: pg.PoolConfig = isConnectionString
      ? {
          connectionString: connStr,
          ssl: isSupabase || process.env.SQL_SSL === 'true' || connStr?.includes('sslmode=require') 
            ? { rejectUnauthorized: false } 
            : false,
          max: 20,
          min: 2,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 30000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
        }
      : {
          host: process.env.SQL_HOST || 'localhost',
          port: Number(process.env.SQL_PORT) || 5432,
          user: process.env.SQL_ADMIN_USER || process.env.SQL_USER,
          password: process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
          max: 20,
          min: 2,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 30000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000,
          ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false
        };

    global._postgresPool = new Pool(poolConfig);
    global._postgresPool.on('error', (err) => {
      console.warn('Postgres client error caught on pool:', err.message);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema: { ...schema, ...relations } });
