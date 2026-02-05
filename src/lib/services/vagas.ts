import { pool } from '@/lib/pool'
import {
  CIDADES_CAMPANHA,
  normalizarCidade,
  CidadeCampanhaKey,
  getTodasCidadesKeys
} from '@/lib/config/cities'

export interface VagasCidade {
  cidade: string
  cidadeKey: CidadeCampanhaKey
  limite: number
  ocupadas: number
  disponiveis: number
  listaEspera: number
  esgotadas: boolean
}

// Status que ocupam vaga (contam para o limite)
const STATUS_OCUPAM_VAGA = ['pendente', 'agendado']

export async function contarVagasPorCidade(cidadeKey: CidadeCampanhaKey): Promise<VagasCidade> {
  const config = CIDADES_CAMPANHA[cidadeKey]

  // Monta padrões LIKE para todas as variações do nome da cidade
  const padroes = config.variacoes.flatMap(v => [
    `${v}/${config.uf}`,
    `${v.toLowerCase()}/${config.uf.toLowerCase()}`,
    v,
    v.toLowerCase()
  ])
  const padroesUnicos = [...new Set(padroes)]

  // Query para contar animais com status que ocupam vaga
  const likeConditions = padroesUnicos.map((_, i) => `LOWER(t.cidade) LIKE LOWER($${i + 1})`).join(' OR ')

  const queryOcupadas = `
    SELECT COUNT(*)::int as total
    FROM animais a
    INNER JOIN tutores t ON a."tutorId" = t.id
    WHERE a.status = ANY($${padroesUnicos.length + 1}::text[])
    AND (${likeConditions})
  `

  const paramsOcupadas = [...padroesUnicos.map(p => `%${p}%`), STATUS_OCUPAM_VAGA]
  const resultOcupadas = await pool.query(queryOcupadas, paramsOcupadas)

  // Query para contar lista de espera
  const queryEspera = `
    SELECT COUNT(*)::int as total
    FROM animais a
    INNER JOIN tutores t ON a."tutorId" = t.id
    WHERE a.status = 'lista_espera'
    AND (${likeConditions})
  `

  const paramsEspera = padroesUnicos.map(p => `%${p}%`)
  const resultEspera = await pool.query(queryEspera, paramsEspera)

  const ocupadas = resultOcupadas.rows[0]?.total || 0
  const listaEspera = resultEspera.rows[0]?.total || 0
  const disponiveis = Math.max(0, config.limite - ocupadas)

  return {
    cidade: config.nome,
    cidadeKey,
    limite: config.limite,
    ocupadas,
    disponiveis,
    listaEspera,
    esgotadas: disponiveis === 0
  }
}

export async function obterVagasTodasCidades(): Promise<VagasCidade[]> {
  const cidades = getTodasCidadesKeys()
  return Promise.all(cidades.map(contarVagasPorCidade))
}

export async function verificarDisponibilidadeVaga(cidadeTutor: string): Promise<{
  disponivel: boolean
  vagasInfo: VagasCidade | null
  cidadeValida: boolean
}> {
  const cidadeKey = normalizarCidade(cidadeTutor)

  if (!cidadeKey) {
    // Cidade não participa da campanha - ainda pode cadastrar como pendente normal
    return { disponivel: true, vagasInfo: null, cidadeValida: false }
  }

  const vagasInfo = await contarVagasPorCidade(cidadeKey)

  return {
    disponivel: !vagasInfo.esgotadas,
    vagasInfo,
    cidadeValida: true
  }
}
