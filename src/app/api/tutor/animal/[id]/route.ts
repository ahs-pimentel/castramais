import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { extrairToken, verificarToken } from '@/lib/tutor-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    const token = extrairToken(authHeader)

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const payload = verificarToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar animal usando raw SQL (garantindo que pertence ao tutor)
    const result = await pool.query(
      `SELECT * FROM animais WHERE id = $1 AND "tutorId" = $2`,
      [id, payload.tutorId]
    )

    const animal = result.rows[0]

    if (!animal) {
      return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })
    }

    return NextResponse.json(animal)
  } catch (error) {
    console.error('Erro ao buscar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
