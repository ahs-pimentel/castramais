import bcrypt from 'bcryptjs'
import pg from 'pg'

const { Pool } = pg

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  })

  try {
    console.log('Conectando ao banco de dados...')

    // Criar extensão UUID se não existir
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    // Verificar se admin existe
    const result = await pool.query("SELECT id FROM users WHERE email = $1", [process.env.ADMIN_EMAIL || 'admin@castramais.com.br'])

    if (result.rows.length > 0) {
      console.log('Admin já existe, pulando criação')
    } else {
      // Gerar hash da senha
      const password = process.env.ADMIN_PASSWORD || 'admin123'
      const hash = await bcrypt.hash(password, 10)

      await pool.query(
        `INSERT INTO users (id, email, password, nome, "createdAt")
         VALUES (uuid_generate_v4(), $1, $2, $3, NOW())`,
        [process.env.ADMIN_EMAIL || 'admin@castramais.com.br', hash, 'Administrador']
      )

      console.log('Admin criado com sucesso!')
      console.log('Email:', process.env.ADMIN_EMAIL || 'admin@castramais.com.br')
    }
  } catch (error) {
    console.error('Erro no seed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

seed()
