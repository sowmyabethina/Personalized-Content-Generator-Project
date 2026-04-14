import pg from 'pg';
const { Pool } = pg;

const hasConnectionUrl = !!process.env.DATABASE_URL;
const hasDbUser = !!process.env.DB_USER;
const hasDbPassword = !!process.env.DB_PASSWORD;

if (!hasConnectionUrl && (!hasDbUser || !hasDbPassword)) {
  throw new Error(
    "Database configuration missing. Set DATABASE_URL or DB_USER and DB_PASSWORD in your .env file."
  );
}

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rag_pdf_db',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ...(process.env.DATABASE_URL && { connectionString: process.env.DATABASE_URL }),
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err.message);
});

export default {
  query: (text, params) => pool.query(text, params),
  pool,
  close: () => pool.end()
};
