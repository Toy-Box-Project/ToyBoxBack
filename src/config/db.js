/**
 * Configures and exports the MySQL connection pool used across the
 * application. Connection settings are read from environment variables
 * (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT). This single pool
 * instance is imported by every module under src/models/ to run
 * parameterized SQL queries, avoiding per-request connection overhead.
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Shared mysql2/promise connection pool.
 * waitForConnections: queues requests instead of failing when the pool is full.
 * connectionLimit: caps concurrent connections at 10.
 * queueLimit: 0 means an unlimited number of queued connection requests.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
