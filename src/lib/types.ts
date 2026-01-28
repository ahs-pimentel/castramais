import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}

export interface AnimalWithTutor {
  id: string
  nome: string
  especie: 'cachorro' | 'gato'
  raca: string
  sexo: 'macho' | 'femea'
  peso: number | null
  idadeAnos: number | null
  idadeMeses: number | null
  registroSinpatinhas: string
  status: 'pendente' | 'agendado' | 'realizado' | 'cancelado'
  dataAgendamento: string | null
  dataRealizacao: string | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
  tutor: {
    id: string
    nome: string
    cpf: string
    telefone: string
    email: string | null
    endereco: string
    cidade: string
    bairro: string
  }
}

export interface Stats {
  total: number
  pendentes: number
  agendados: number
  realizados: number
}

export interface CreateAnimalDTO {
  nome: string
  especie: 'cachorro' | 'gato'
  raca: string
  sexo: 'macho' | 'femea'
  peso?: number
  idadeAnos?: number
  idadeMeses?: number
  registroSinpatinhas: string
  observacoes?: string
  tutorId?: string
  tutor?: {
    nome: string
    cpf: string
    telefone: string
    email?: string
    endereco: string
    cidade: string
    bairro: string
  }
}

export interface UpdateAnimalDTO {
  nome?: string
  especie?: 'cachorro' | 'gato'
  raca?: string
  sexo?: 'macho' | 'femea'
  peso?: number | null
  idadeAnos?: number | null
  idadeMeses?: number | null
  status?: 'pendente' | 'agendado' | 'realizado' | 'cancelado'
  dataAgendamento?: string | null
  dataRealizacao?: string | null
  observacoes?: string | null
}
