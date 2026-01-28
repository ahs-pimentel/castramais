import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm'

@Entity('tutores')
export class Tutor {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  nome!: string

  @Column({ type: 'varchar', unique: true })
  cpf!: string

  @Column({ type: 'varchar' })
  telefone!: string

  @Column({ type: 'varchar', nullable: true })
  email!: string | null

  @Column({ type: 'varchar' })
  endereco!: string

  @Column({ type: 'varchar' })
  cidade!: string

  @Column({ type: 'varchar' })
  bairro!: string

  @OneToMany('Animal', 'tutor')
  animais!: unknown[]

  @CreateDateColumn()
  createdAt!: Date
}
