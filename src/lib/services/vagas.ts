import { pool } from '@/lib/pool'

export interface VagasCampanha {
  campanhaId: string
  campanhaNome: string
  cidade: string
  limite: number
  ocupadas: number
  disponiveis: number
  listaEspera: number
  esgotadas: boolean
}

const STATUS_OCUPAM_VAGA = ['pendente', 'agendado']

export async function contarVagasPorCampanha(campanhaId: string): Promise<VagasCampanha | null> {
  const campanha = await pool.query(
    'SELECT id, nome, cidade, limite FROM campanhas WHERE id = $1',
    [campanhaId]
  )

  if (campanha.rows.length === 0) return null

  const { id, nome, cidade, limite } = campanha.rows[0]

  const resultOcupadas = await pool.query(
    `SELECT COUNT(*)::int as total FROM animais
     WHERE "campanhaId" = $1 AND status = ANY($2::text[])`,
    [id, STATUS_OCUPAM_VAGA]
  )

  const resultEspera = await pool.query(
    `SELECT COUNT(*)::int as total FROM animais
     WHERE "campanhaId" = $1 AND status = 'lista_espera'`,
    [id]
  )

  const ocupadas = resultOcupadas.rows[0]?.total || 0
  const listaEspera = resultEspera.rows[0]?.total || 0
  const disponiveis = Math.max(0, limite - ocupadas)

  return {
    campanhaId: id,
    campanhaNome: nome,
    cidade,
    limite,
    ocupadas,
    disponiveis,
    listaEspera,
    esgotadas: disponiveis === 0
  }
}

export async function obterVagasTodasCampanhas(): Promise<VagasCampanha[]> {
  const campanhas = await pool.query(
    'SELECT id FROM campanhas WHERE ativa = true ORDER BY "dataInicio" ASC NULLS LAST'
  )
  const resultados = await Promise.all(
    campanhas.rows.map((c: { id: string }) => contarVagasPorCampanha(c.id))
  )
  return resultados.filter((v): v is VagasCampanha => v !== null)
}

export async function verificarDisponibilidadeVaga(campanhaId: string): Promise<{
  disponivel: boolean
  vagasInfo: VagasCampanha | null
}> {
  const vagasInfo = await contarVagasPorCampanha(campanhaId)

  if (!vagasInfo) {
    return { disponivel: false, vagasInfo: null }
  }

  return {
    disponivel: !vagasInfo.esgotadas,
    vagasInfo
  }
}
