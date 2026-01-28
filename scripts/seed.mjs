import 'reflect-metadata'
import bcrypt from 'bcryptjs'
import pg from 'pg'

const { Pool } = pg

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:castrapet123@db:5432/castrapet'
  })

  try {
    console.log('Conectando ao banco...')

    // Verificar se admin existe
    const result = await pool.query("SELECT id FROM users WHERE email = 'admin@castrapet.com'")

    if (result.rows.length > 0) {
      console.log('Admin já existe')
    } else {
      const hash = await bcrypt.hash('admin123', 10)
      await pool.query(
        "INSERT INTO users (id, email, password, nome, \"createdAt\") VALUES (uuid_generate_v4(), $1, $2, $3, NOW())",
        ['admin@castrapet.com', hash, 'Administrador']
      )
      console.log('Admin criado!')
      console.log('Email: admin@castrapet.com')
      console.log('Senha: admin123')
    }
  } catch (error) {
    console.log('Erro no seed (tabela pode não existir ainda):', error.message)
  } finally {
    await pool.end()
  }
}

seed()
