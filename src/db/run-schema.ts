import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const pool = new pg.Pool(
    process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
      : {
          host: process.env.SQL_HOST,
          user: process.env.SQL_ADMIN_USER,
          password: process.env.SQL_ADMIN_PASSWORD,
          database: process.env.SQL_DB_NAME,
          ssl: false,
        }
  );

  try {
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Resetting public schema...');
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
    console.log('Executing schema.sql...');
    await pool.query(sql);
    console.log('Schema executed successfully!');
  } catch (err) {
    console.error('Error executing schema:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
