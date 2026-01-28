import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.TUTOR_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'tutor-secret-key'

// Armazenamento temporário de códigos (em produção usar Redis)
const codigosTemporarios = new Map<string, { codigo: string; expira: number }>()

export function gerarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function salvarCodigo(cpf: string, codigo: string): void {
  // Código expira em 5 minutos
  const expira = Date.now() + 5 * 60 * 1000
  codigosTemporarios.set(cpf, { codigo, expira })
}

export function verificarCodigo(cpf: string, codigo: string): boolean {
  const dados = codigosTemporarios.get(cpf)
  if (!dados) return false
  if (Date.now() > dados.expira) {
    codigosTemporarios.delete(cpf)
    return false
  }
  if (dados.codigo !== codigo) return false
  codigosTemporarios.delete(cpf)
  return true
}

export interface TutorTokenPayload {
  tutorId: string
  cpf: string
  nome: string
}

export function gerarToken(payload: TutorTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verificarToken(token: string): TutorTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TutorTokenPayload
  } catch {
    return null
  }
}

export function extrairToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}
