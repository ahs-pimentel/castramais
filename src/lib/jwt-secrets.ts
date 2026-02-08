function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variável de ambiente ${name} é obrigatória mas não foi definida`)
  }
  return value
}

let _entidadeSecret: string | undefined
let _tutorSecret: string | undefined

export function getEntidadeJwtSecret(): string {
  if (!_entidadeSecret) {
    _entidadeSecret = requireEnv('NEXTAUTH_SECRET')
  }
  return _entidadeSecret
}

export function getTutorJwtSecret(): string {
  if (!_tutorSecret) {
    _tutorSecret = process.env.TUTOR_JWT_SECRET || requireEnv('NEXTAUTH_SECRET')
  }
  return _tutorSecret
}
