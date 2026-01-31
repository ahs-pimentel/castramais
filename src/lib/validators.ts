// Validadores para campos do sistema Castra+MG

/**
 * Validador do código de registro SinPatinhas (RG Animal)
 *
 * O SinPatinhas é o Sistema do Cadastro Nacional de Animais Domésticos do Governo Federal.
 *
 * Formato oficial: BR-000000000000
 * - "BR" (ou "br") em maiúsculo ou minúsculo
 * - Hífen separador
 * - 12 dígitos numéricos
 *
 * Exemplos válidos:
 * - BR-123456789012
 * - br-000000000001
 */

// Regex para código SINPATINHAS
// Formato: BR-000000000000 (BR + hífen + 12 dígitos)
export const SINPATINHAS_REGEX = /^[Bb][Rr]-\d{12}$/

// Regex alternativa que aceita sem hífen também (para flexibilidade)
export const SINPATINHAS_FLEXIVEL_REGEX = /^[Bb][Rr]-?\d{12}$/

// Regex para microchip (15 dígitos numéricos - padrão ISO 11784/11785)
export const MICROCHIP_REGEX = /^\d{15}$/

/**
 * Valida o código de registro SinPatinhas
 * Formato: BR-000000000000 (BR + hífen + 12 dígitos)
 * @param codigo - O código a ser validado
 * @returns true se válido, false se inválido
 */
export function validarSinpatinhas(codigo: string): boolean {
  if (!codigo || typeof codigo !== 'string') {
    return false
  }

  const codigoLimpo = codigo.trim().toUpperCase()

  // Verifica se está vazio após trim
  if (codigoLimpo.length === 0) {
    return false
  }

  // Verifica formato: BR-000000000000
  return SINPATINHAS_REGEX.test(codigoLimpo)
}

/**
 * Formata o código SinPatinhas para o padrão correto
 * @param codigo - O código a ser formatado
 * @returns código formatado ou o original se inválido
 */
export function formatarSinpatinhas(codigo: string): string {
  if (!codigo || typeof codigo !== 'string') {
    return codigo
  }

  const limpo = codigo.trim().toUpperCase()

  // Se já está no formato correto
  if (SINPATINHAS_REGEX.test(limpo)) {
    return limpo
  }

  // Se tem BR mas sem hífen, adiciona
  if (/^BR\d{12}$/.test(limpo)) {
    return `BR-${limpo.slice(2)}`
  }

  return limpo
}

/**
 * Valida o número de microchip
 * @param microchip - O número do microchip
 * @returns true se válido, false se inválido
 */
export function validarMicrochip(microchip: string): boolean {
  if (!microchip || typeof microchip !== 'string') {
    return false
  }

  const microchipLimpo = microchip.replace(/\D/g, '')

  return MICROCHIP_REGEX.test(microchipLimpo)
}

/**
 * Valida CPF brasileiro
 * @param cpf - O CPF a ser validado (com ou sem formatação)
 * @returns true se válido, false se inválido
 */
export function validarCPF(cpf: string): boolean {
  if (!cpf || typeof cpf !== 'string') {
    return false
  }

  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '')

  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return false
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpfLimpo)) {
    return false
  }

  // Calcula primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo[i]) * (10 - i)
  }
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpfLimpo[9])) return false

  // Calcula segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo[i]) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpfLimpo[10])) return false

  return true
}

/**
 * Valida telefone brasileiro (fixo ou celular)
 * @param telefone - O telefone a ser validado
 * @returns true se válido, false se inválido
 */
export function validarTelefone(telefone: string): boolean {
  if (!telefone || typeof telefone !== 'string') {
    return false
  }

  const telefoneLimpo = telefone.replace(/\D/g, '')

  // Aceita: 10 dígitos (fixo) ou 11 dígitos (celular com 9)
  if (telefoneLimpo.length !== 10 && telefoneLimpo.length !== 11) {
    return false
  }

  // Verifica se o DDD é válido (11-99)
  const ddd = parseInt(telefoneLimpo.substring(0, 2))
  if (ddd < 11 || ddd > 99) {
    return false
  }

  // Se celular, deve começar com 9
  if (telefoneLimpo.length === 11 && telefoneLimpo[2] !== '9') {
    return false
  }

  return true
}

/**
 * Valida email
 * @param email - O email a ser validado
 * @returns true se válido, false se inválido
 */
export function validarEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Valida CEP brasileiro
 * @param cep - O CEP a ser validado
 * @returns true se válido, false se inválido
 */
export function validarCEP(cep: string): boolean {
  if (!cep || typeof cep !== 'string') {
    return false
  }

  const cepLimpo = cep.replace(/\D/g, '')

  return cepLimpo.length === 8 && /^\d{8}$/.test(cepLimpo)
}

/**
 * Retorna mensagem de erro para código SinPatinhas inválido
 * Formato esperado: BR-000000000000
 */
export function getMensagemErroSinpatinhas(codigo: string): string | null {
  if (!codigo || codigo.trim().length === 0) {
    return 'O código de registro é obrigatório'
  }

  const codigoLimpo = codigo.trim().toUpperCase()

  // Verifica se começa com BR
  if (!codigoLimpo.startsWith('BR')) {
    return 'O código deve começar com "BR"'
  }

  // Verifica se tem o hífen na posição correta
  if (codigoLimpo.length > 2 && codigoLimpo[2] !== '-') {
    return 'Formato inválido. Use: BR-000000000000'
  }

  // Verifica se tem 12 dígitos após o BR-
  const numeros = codigoLimpo.slice(3)
  if (numeros.length !== 12) {
    return `O código deve ter 12 números após "BR-" (você tem ${numeros.length})`
  }

  // Verifica se são apenas números
  if (!/^\d{12}$/.test(numeros)) {
    return 'Os 12 dígitos devem ser apenas números'
  }

  // Se passou todas as validações, está correto
  if (!SINPATINHAS_REGEX.test(codigoLimpo)) {
    return 'Formato inválido. Use: BR-000000000000'
  }

  return null
}
