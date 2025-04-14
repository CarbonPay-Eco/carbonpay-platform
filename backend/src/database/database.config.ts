import { Pool } from 'pg';
import { DB_URL } from '../config/constants';

// Create a PostgreSQL connection pool using Supabase URL
const pool = new Pool({
  connectionString: DB_URL,
  ssl: {
    rejectUnauthorized: false
  }
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