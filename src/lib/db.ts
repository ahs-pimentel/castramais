import 'reflect-metadata'
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm'
import { User } from '@/entities/User'
import { Tutor } from '@/entities/Tutor'
import { Animal } from '@/entities/Animal'

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Tutor, Animal],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

let initialized = false

export async function getDataSource(): Promise<DataSource> {
  if (!initialized) {
    await AppDataSource.initialize()
    initialized = true
  }
  return AppDataSource
}

export async function getRepository<T extends ObjectLiteral>(
  entity: EntityTarget<T>
): Promise<Repository<T>> {
  const dataSource = await getDataSource()
  return dataSource.getRepository(entity)
}
