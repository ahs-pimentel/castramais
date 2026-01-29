// Serviço de busca de CEP - ViaCEP (principal) e BrasilAPI (contingência)

export interface EnderecoViaCep {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export interface Endereco {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

async function buscarViaCEP(cep: string): Promise<Endereco | null> {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    if (!response.ok) return null

    const data: EnderecoViaCep = await response.json()
    if (data.erro) return null

    return {
      cep: data.cep.replace('-', ''),
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
    }
  } catch (error) {
    console.error('[ViaCEP] Erro:', error)
    return null
  }
}

async function buscarBrasilAPI(cep: string): Promise<Endereco | null> {
  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`)
    if (!response.ok) return null

    const data = await response.json()

    return {
      cep: data.cep.replace('-', ''),
      logradouro: data.street || '',
      bairro: data.neighborhood || '',
      cidade: data.city,
      uf: data.state,
    }
  } catch (error) {
    console.error('[BrasilAPI] Erro:', error)
    return null
  }
}

export async function buscarCEP(cep: string): Promise<Endereco | null> {
  // Limpar CEP - apenas números
  const cepLimpo = cep.replace(/\D/g, '')

  if (cepLimpo.length !== 8) {
    return null
  }

  // Tentar ViaCEP primeiro
  const viaCepResult = await buscarViaCEP(cepLimpo)
  if (viaCepResult) {
    console.log('[CEP] Encontrado via ViaCEP')
    return viaCepResult
  }

  // Fallback para BrasilAPI
  console.log('[CEP] ViaCEP falhou, tentando BrasilAPI...')
  const brasilApiResult = await buscarBrasilAPI(cepLimpo)
  if (brasilApiResult) {
    console.log('[CEP] Encontrado via BrasilAPI')
    return brasilApiResult
  }

  console.log('[CEP] CEP não encontrado em nenhuma API')
  return null
}

export function formatarCEP(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, '')
  if (cepLimpo.length <= 5) return cepLimpo
  return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5, 8)}`
}
