import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

async function seedAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  console.log('Conectado ao banco de dados')

  const email = process.env.ADMIN_EMAIL || 'admin@castramaismg.org'
  const password = process.env.ADMIN_PASSWORD || 'admin123'

  // Verificar se já existe um admin
  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  )

  if (existing.rows.length > 0) {
    console.log('Usuário admin já existe!')
    await pool.end()
    return
  }

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash(password, 10)

  await pool.query(
    `INSERT INTO users (id, email, password, nome, role, "createdAt")
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [uuidv4(), email, hashedPassword, 'Administrador', 'admin']
  )

  console.log('Usuário admin criado com sucesso!')
  console.log(`Email: ${email}`)
  console.log('IMPORTANTE: Altere a senha após o primeiro login!')

  await pool.end()
}

seedAdmin().catch(console.error)
