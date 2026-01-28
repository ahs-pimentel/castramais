import 'reflect-metadata'
import { DataSource } from 'typeorm'
import bcrypt from 'bcryptjs'
import { User } from '../src/entities/User'

async function seedAdmin() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: true,
    entities: [User],
  })

  await dataSource.initialize()
  console.log('Conectado ao banco de dados')

  const userRepository = dataSource.getRepository(User)

  // Verificar se já existe um admin
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@castrapet.com' },
  })

  if (existingAdmin) {
    console.log('Usuário admin já existe!')
    await dataSource.destroy()
    return
  }

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = userRepository.create({
    email: 'admin@castrapet.com',
    password: hashedPassword,
    nome: 'Administrador',
  })

  await userRepository.save(admin)
  console.log('Usuário admin criado com sucesso!')
  console.log('Email: admin@castrapet.com')
  console.log('Senha: admin123')
  console.log('')
  console.log('IMPORTANTE: Altere a senha após o primeiro login!')

  await dataSource.destroy()
}

seedAdmin().catch(console.error)
