// Pool de conexão PostgreSQL compartilhado
import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  // Otimizações de performance
  max: 50,                      // Máximo de conexões no pool
  min: 10,                      // Mínimo de conexões mantidas
  idleTimeoutMillis: 30000,     // Fecha conexões ociosas após 30s
  connectionTimeoutMillis: 5000, // Timeout para obter conexão
  maxUses: 7500,                // Recicla conexão após N usos (evita memory leak)
})
