import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const { id } = await params

    // Buscar tutor
    const tutorResult = await pool.query(
      'SELECT * FROM tutores WHERE id = $1',
      [id]
    )

    if (tutorResult.rows.length === 0) {
      return NextResponse.json({ error: 'Tutor não encontrado' }, { status: 404 })
    }

    // Buscar animais do tutor
    const animaisResult = await pool.query(
      'SELECT * FROM animais WHERE "tutorId" = $1 ORDER BY "createdAt" DESC',
      [id]
    )

    return NextResponse.json({
      ...tutorResult.rows[0],
      animais: animaisResult.rows
    })
  } catch (error) {
    console.error('Erro ao buscar tutor:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
