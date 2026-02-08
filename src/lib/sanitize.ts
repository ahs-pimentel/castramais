// Utilitários de sanitização e validação de input

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
}

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] || char)
}

export function sanitizeInput(str: string, maxLength: number = 255): string {
  return str
    .trim()
    .slice(0, maxLength)
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

export function validarSenha(senha: string): { valida: boolean; erro?: string } {
  if (!senha || senha.length < 8) {
    return { valida: false, erro: 'Senha deve ter no mínimo 8 caracteres' }
  }
  if (senha.length > 128) {
    return { valida: false, erro: 'Senha deve ter no máximo 128 caracteres' }
  }
  return { valida: true }
}

export function validarEmail(email: string): boolean {
  if (!email || email.length > 255) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validarTelefone(telefone: string): boolean {
  const limpo = telefone.replace(/\D/g, '')
  return limpo.length === 10 || limpo.length === 11
}

// --- CPF ---

export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  if (/^(\d)\1+$/.test(cleaned)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(10))) return false

  return true
}

// --- SinPatinhas (RG Animal) ---

export const SINPATINHAS_REGEX = /^[Bb][Rr]-\d{12}$/
export const SINPATINHAS_FLEXIVEL_REGEX = /^[Bb][Rr]-?\d{12}$/
export const MICROCHIP_REGEX = /^\d{15}$/

/**
 * Valida o código de registro SinPatinhas
 * Formato: BR-000000000000 (BR + hífen + 12 dígitos)
 */
export function validarSinpatinhas(codigo: string): boolean {
  if (!codigo || typeof codigo !== 'string') return false
  const codigoLimpo = codigo.trim().toUpperCase()
  if (codigoLimpo.length === 0) return false
  return SINPATINHAS_REGEX.test(codigoLimpo)
}

/**
 * Formata o código SinPatinhas para o padrão correto
 */
export function formatarSinpatinhas(codigo: string): string {
  if (!codigo || typeof codigo !== 'string') return codigo
  const limpo = codigo.trim().toUpperCase()
  if (SINPATINHAS_REGEX.test(limpo)) return limpo
  if (/^BR\d{12}$/.test(limpo)) return `BR-${limpo.slice(2)}`
  return limpo
}

/**
 * Valida o número de microchip
 */
export function validarMicrochip(microchip: string): boolean {
  if (!microchip || typeof microchip !== 'string') return false
  return MICROCHIP_REGEX.test(microchip.replace(/\D/g, ''))
}

/**
 * Retorna mensagem de erro para código SinPatinhas inválido
 */
export function getMensagemErroSinpatinhas(codigo: string): string | null {
  if (!codigo || codigo.trim().length === 0) {
    return 'O código de registro é obrigatório'
  }

  const codigoLimpo = codigo.trim().toUpperCase()

  if (!codigoLimpo.startsWith('BR')) {
    return 'O código deve começar com "BR"'
  }

  if (codigoLimpo.length > 2 && codigoLimpo[2] !== '-') {
    return 'Formato inválido. Use: BR-000000000000'
  }

  const numeros = codigoLimpo.slice(3)
  if (numeros.length !== 12) {
    return `O código deve ter 12 números após "BR-" (você tem ${numeros.length})`
  }

  if (!/^\d{12}$/.test(numeros)) {
    return 'Os 12 dígitos devem ser apenas números'
  }

  if (!SINPATINHAS_REGEX.test(codigoLimpo)) {
    return 'Formato inválido. Use: BR-000000000000'
  }

  return null
}
