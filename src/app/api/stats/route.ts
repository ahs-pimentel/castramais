import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
        COUNT(*) FILTER (WHERE status = 'agendado') as agendados,
        COUNT(*) FILTER (WHERE status = 'realizado') as realizados,
        COUNT(*) FILTER (WHERE status = 'lista_espera') as lista_espera
      FROM animais
    `)

    const stats = result.rows[0]

    return NextResponse.json({
      total: parseInt(stats.total),
      pendentes: parseInt(stats.pendentes),
      agendados: parseInt(stats.agendados),
      realizados: parseInt(stats.realizados),
      listaEspera: parseInt(stats.lista_espera),
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
