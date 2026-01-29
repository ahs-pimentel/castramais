import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { extrairToken, verificarToken } from '@/lib/tutor-auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = extrairToken(authHeader)

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const payload = verificarToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar animais do tutor usando raw SQL
    const result = await pool.query(
      `SELECT id, nome, especie, raca, "registroSinpatinhas", status, "dataAgendamento", "dataRealizacao"
       FROM animais
       WHERE "tutorId" = $1
       ORDER BY "createdAt" DESC`,
      [payload.tutorId]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar animais do tutor:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
