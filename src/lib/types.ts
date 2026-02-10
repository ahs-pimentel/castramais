import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
  }
}

export interface Campanha {
  id: string
  nome: string
  cidade: string
  uf: string
  dataInicio: string | null
  dataFim: string | null
  dataDescricao: string | null
  limite: number
  ativa: boolean
  createdAt: string
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
  status: 'pendente' | 'agendado' | 'realizado' | 'cancelado' | 'lista_espera'
  dataAgendamento: string | null
  horarioAgendamento: string | null
  localAgendamento: string | null
  enderecoAgendamento: string | null
  dataRealizacao: string | null
  observacoes: string | null
  campanhaId: string | null
  campanha: { id: string; nome: string; cidade: string } | null
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
  listaEspera: number
}

export interface Entidade {
  id: string
  nome: string
  cnpj?: string | null
  responsavel: string
  telefone: string
  email: string
  cidade: string
  bairro?: string | null
  endereco?: string | null
  ativo: boolean
  createdAt: string
}

export interface Tutor {
  id: string
  nome: string
  cpf: string
  telefone: string
  email?: string | null
  endereco: string
  cidade: string
  bairro: string
  createdAt: string
}

export interface Animal {
  id: string
  nome: string
  especie: 'cachorro' | 'gato'
  raca: string
  sexo: 'macho' | 'femea'
  peso?: number | null
  idadeAnos?: number | null
  idadeMeses?: number | null
  registroSinpatinhas?: string | null
  status: 'pendente' | 'agendado' | 'realizado' | 'cancelado' | 'lista_espera'
  dataAgendamento?: string | null
  dataRealizacao?: string | null
  observacoes?: string | null
  campanhaId?: string | null
  tutorId?: string
  createdAt: string
  updatedAt?: string
  tutor?: {
    id: string
    nome: string
    cpf?: string
    telefone?: string
    email?: string | null
  }
}

export interface Usuario {
  id: string
  email: string
  nome: string
  role: string
  createdAt: string
}

export interface CreateAnimalDTO {
  nome: string
  especie: 'cachorro' | 'gato'
  raca: string
  sexo: 'macho' | 'femea'
  peso?: number
  idadeAnos?: number
  idadeMeses?: number
  registroSinpatinhas?: string
  observacoes?: string
  campanhaId?: string
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
  registroSinpatinhas?: string | null
  status?: 'pendente' | 'agendado' | 'realizado' | 'cancelado' | 'lista_espera'
  dataAgendamento?: string | null
  horarioAgendamento?: string | null
  localAgendamento?: string | null
  enderecoAgendamento?: string | null
  dataRealizacao?: string | null
  observacoes?: string | null
  campanhaId?: string | null
}
