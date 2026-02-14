import jwt from 'jsonwebtoken'
import { getTutorJwtSecret } from './jwt-secrets'
import { JWT_EXPIRY } from './constants'

export interface TutorTokenPayload {
  tutorId: string
  cpf: string
  nome: string
}

export function gerarToken(payload: TutorTokenPayload): string {
  return jwt.sign(payload, getTutorJwtSecret(), { expiresIn: JWT_EXPIRY.TUTOR })
}

export function verificarToken(token: string): TutorTokenPayload | null {
  try {
    return jwt.verify(token, getTutorJwtSecret()) as TutorTokenPayload
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
