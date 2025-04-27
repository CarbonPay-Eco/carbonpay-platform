import { Pool } from 'pg';
import { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, DB_HOST, POSTGRES_PORT } from '../config/constants';

// Create a PostgreSQL connection pool using Supabase URL
const pool = new Pool({
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  host: DB_HOST,
  port: parseInt((POSTGRES_PORT || '5432').toString(), 10),
  ssl: {
    rejectUnauthorized: false,
  },
});

// Function to test the database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

export default pool; 