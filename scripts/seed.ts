import 'reflect-metadata'
import { DataSource } from 'typeorm'
import bcrypt from 'bcryptjs'
import { User } from '../src/entities/User'
import { Tutor } from '../src/entities/Tutor'
import { Animal } from '../src/entities/Animal'

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:castrapet123@localhost:5433/castrapet',
    synchronize: true,
    entities: [User, Tutor, Animal],
  })

  await dataSource.initialize()
  console.log('Conectado ao banco de dados')

  const userRepo = dataSource.getRepository(User)

  // Verificar se admin já existe
  const existingAdmin = await userRepo.findOne({
    where: { email: 'admin@castrapet.com' }
  })

  if (existingAdmin) {
    console.log('Admin já existe, pulando criação')
  } else {
    // Criar admin
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const admin = userRepo.create({
      email: 'admin@castrapet.com',
      password: hashedPassword,
      nome: 'Administrador'
    })
    await userRepo.save(admin)
    console.log('Admin criado com sucesso!')
    console.log('Email: admin@castrapet.com')
    console.log('Senha: admin123')
  }

  await dataSource.destroy()
}

seed().catch(console.error)
