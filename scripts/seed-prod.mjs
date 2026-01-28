import bcrypt from 'bcryptjs'
import pg from 'pg'

const { Pool } = pg

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  })

  try {
    console.log('Conectando ao banco de dados...')

    // Criar extensão UUID se não existir
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    // Criar tabelas se não existirem
    console.log('Criando tabelas...')

    // Tabela users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nome VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `)

    // Tabela tutor
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tutor (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome VARCHAR(255) NOT NULL,
        cpf VARCHAR(14) UNIQUE NOT NULL,
        telefone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        endereco VARCHAR(255) NOT NULL,
        cidade VARCHAR(100) NOT NULL,
        bairro VARCHAR(100) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `)

    // Tabela animal
    await pool.query(`
      CREATE TABLE IF NOT EXISTS animal (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome VARCHAR(255) NOT NULL,
        especie VARCHAR(20) NOT NULL,
        raca VARCHAR(100) NOT NULL,
        sexo VARCHAR(10) NOT NULL,
        peso DECIMAL(5,2),
        "idadeAnos" INTEGER,
        "idadeMeses" INTEGER,
        "registroSinpatinhas" VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pendente',
        "dataAgendamento" DATE,
        "dataRealizacao" DATE,
        observacoes TEXT,
        "tutorId" UUID REFERENCES tutor(id),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)

    console.log('Tabelas criadas com sucesso!')

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
    // Não sair com erro para permitir que a aplicação inicie
  } finally {
    await pool.end()
  }
}

seed()
