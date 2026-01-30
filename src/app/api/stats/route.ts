import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/pool'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
        COUNT(*) FILTER (WHERE status = 'agendado') as agendados,
        COUNT(*) FILTER (WHERE status = 'realizado') as realizados
      FROM animais
    `)

    const stats = result.rows[0]

    return NextResponse.json({
      total: parseInt(stats.total),
      pendentes: parseInt(stats.pendentes),
      agendados: parseInt(stats.agendados),
      realizados: parseInt(stats.realizados),
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
