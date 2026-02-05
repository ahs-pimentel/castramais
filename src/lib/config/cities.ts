// Configuração das cidades participantes da campanha de castração

export interface CidadeConfig {
  nome: string
  uf: string
  limite: number
  variacoes: string[]
}

export const CIDADES_CAMPANHA: Record<string, CidadeConfig> = {
  'entre-rios-de-minas': {
    nome: 'Entre Rios de Minas',
    uf: 'MG',
    limite: 200,
    variacoes: ['Entre Rios de Minas', 'entre rios de minas', 'Entre Rios De Minas']
  },
  'caranaiba': {
    nome: 'Caranaíba',
    uf: 'MG',
    limite: 200,
    variacoes: ['Caranaíba', 'caranaíba', 'Caranaiba', 'caranaiba']
  },
  'carandai': {
    nome: 'Carandaí',
    uf: 'MG',
    limite: 200,
    variacoes: ['Carandaí', 'carandaí', 'Carandai', 'carandai']
  },
  'barbacena': {
    nome: 'Barbacena',
    uf: 'MG',
    limite: 200,
    variacoes: ['Barbacena', 'barbacena']
  }
}

export const LIMITE_VAGAS_PADRAO = 200

export type CidadeCampanhaKey = keyof typeof CIDADES_CAMPANHA

// Remove acentos de uma string
function removerAcentos(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Normaliza e identifica a cidade a partir do nome completo (ex: "Barbacena/MG")
export function normalizarCidade(cidadeCompleta: string): CidadeCampanhaKey | null {
  if (!cidadeCompleta) return null

  // Remove /UF se existir e normaliza
  const cidade = cidadeCompleta.split('/')[0].trim()
  const cidadeNorm = removerAcentos(cidade).toLowerCase()

  for (const [key, config] of Object.entries(CIDADES_CAMPANHA)) {
    const variacoesNorm = config.variacoes.map(v => removerAcentos(v).toLowerCase())
    if (variacoesNorm.includes(cidadeNorm)) {
      return key as CidadeCampanhaKey
    }
  }
  return null
}

// Verifica se a cidade participa da campanha
export function cidadeParticipaCampanha(cidadeCompleta: string): boolean {
  return normalizarCidade(cidadeCompleta) !== null
}

// Retorna o nome formatado da cidade
export function getNomeCidade(cidadeKey: CidadeCampanhaKey): string {
  return CIDADES_CAMPANHA[cidadeKey]?.nome || ''
}

// Retorna todas as chaves das cidades
export function getTodasCidadesKeys(): CidadeCampanhaKey[] {
  return Object.keys(CIDADES_CAMPANHA) as CidadeCampanhaKey[]
}

// Retorna lista de cidades para dropdown
export function getCidadesCampanhaLista(): { key: CidadeCampanhaKey; nome: string; uf: string }[] {
  return Object.entries(CIDADES_CAMPANHA).map(([key, config]) => ({
    key: key as CidadeCampanhaKey,
    nome: config.nome,
    uf: config.uf
  }))
}
