// Constantes centralizadas do sistema Castra+MG

// Rate limiting
export const RATE_LIMITS = {
  OTP_PER_CPF: { max: 5, windowMs: 15 * 60 * 1000 },
  OTP_PER_IP: { max: 20, windowMs: 15 * 60 * 1000 },
  LOGIN_PER_EMAIL: { max: 5, windowMs: 15 * 60 * 1000 },
  CADASTRO_PER_IP: { max: 3, windowMs: 60 * 60 * 1000 },
} as const

// Limites de animais
export const ANIMAL_LIMITS = {
  PER_TUTOR_TOTAL: 10,
  PER_TUTOR_PER_CAMPAIGN: 5,
} as const

// OTP
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MS: 5 * 60 * 1000,
  MAX_ATTEMPTS: 5,
} as const

// JWT
export const JWT_EXPIRY = {
  TUTOR: '7d',
  ENTIDADE: '7d',
} as const

// Evolution API
export const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || ''
export const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
export const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || ''
