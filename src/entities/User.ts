import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', unique: true })
  email!: string

  @Column({ type: 'varchar' })
  password!: string

  @Column({ type: 'varchar' })
  nome!: string

  @CreateDateColumn()
  createdAt!: Date
}
