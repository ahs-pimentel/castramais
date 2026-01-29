// Pool de conexão PostgreSQL compartilhado
import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
})
