import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { getTutorJwtSecret } from './jwt-secrets'
import { pool } from './pool'
import { OTP_CONFIG, JWT_EXPIRY } from './constants'

export function gerarCodigo(): string {
  const buffer = crypto.randomBytes(4)
  const num = buffer.readUInt32BE(0) % 900000 + 100000
  return num.toString()
}

export async function salvarCodigo(cpf: string, codigo: string): Promise<void> {
  const expira = new Date(Date.now() + OTP_CONFIG.EXPIRY_MS)
  await pool.query(`
    INSERT INTO otp_codes (cpf, codigo, tentativas, expira)
    VALUES ($1, $2, 0, $3)
    ON CONFLICT (cpf) DO UPDATE SET
      codigo = $2, tentativas = 0, expira = $3, criado_em = NOW()
  `, [cpf, codigo, expira])
}

export async function verificarCodigo(cpf: string, codigo: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT codigo, tentativas, expira FROM otp_codes WHERE cpf = $1',
    [cpf]
  )
  if (result.rows.length === 0) return false

  const dados = result.rows[0]

  if (new Date() > new Date(dados.expira)) {
    await pool.query('DELETE FROM otp_codes WHERE cpf = $1', [cpf])
    return false
  }

  if (dados.tentativas >= OTP_CONFIG.MAX_ATTEMPTS) {
    await pool.query('DELETE FROM otp_codes WHERE cpf = $1', [cpf])
    return false
  }

  if (dados.codigo !== codigo) {
    await pool.query(
      'UPDATE otp_codes SET tentativas = tentativas + 1 WHERE cpf = $1',
      [cpf]
    )
    return false
  }

  await pool.query('DELETE FROM otp_codes WHERE cpf = $1', [cpf])
  return true
}

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
