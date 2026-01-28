import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'

export type Especie = 'cachorro' | 'gato'
export type Sexo = 'macho' | 'femea'
export type Status = 'pendente' | 'agendado' | 'realizado' | 'cancelado'

@Entity('animais')
export class Animal {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar' })
  nome!: string

  @Column({ type: 'varchar' })
  especie!: string

  @Column({ type: 'varchar' })
  raca!: string

  @Column({ type: 'varchar' })
  sexo!: string

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  peso!: number | null

  @Column({ type: 'int', nullable: true })
  idadeAnos!: number | null

  @Column({ type: 'int', nullable: true })
  idadeMeses!: number | null

  @ManyToOne('Tutor', 'animais', { eager: true })
  @JoinColumn({ name: 'tutorId' })
  tutor!: unknown

  @Column({ type: 'uuid' })
  tutorId!: string

  @Column({ type: 'varchar', unique: true })
  registroSinpatinhas!: string

  @Column({ type: 'varchar', default: 'pendente' })
  status!: string

  @Column({ type: 'date', nullable: true })
  dataAgendamento!: Date | null

  @Column({ type: 'date', nullable: true })
  dataRealizacao!: Date | null

  @Column({ type: 'text', nullable: true })
  observacoes!: string | null

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
