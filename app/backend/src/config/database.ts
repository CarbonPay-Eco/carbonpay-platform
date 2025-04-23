import { Pool } from 'pg';
import { POSTGRES_USER, DB_HOST, POSTGRES_DB, POSTGRES_PASSWORD, DB_PORT } from './constants';

// Create a PostgreSQL connection pool
const pool = new Pool({
  user: POSTGRES_USER,
  host: DB_HOST,
  database: POSTGRES_DB,
  password: POSTGRES_PASSWORD, 
  port: parseInt((DB_PORT || '5432').toString(), 10),
});

export default pool; 