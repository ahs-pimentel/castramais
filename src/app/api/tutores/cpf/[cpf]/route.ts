import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/pool'
import jwt from 'jsonwebtoken'
import { getEntidadeJwtSecret } from '@/lib/jwt-secrets'

type RouteParams = { params: Promise<{ cpf: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Accept admin session OR entidade JWT
  const session = await getServerSession(authOptions)
  if (!session) {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    try {
      jwt.verify(authHeader.substring(7), getEntidadeJwtSecret())
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
  }

  try {
    const { cpf: cpfParam } = await params
    const cpf = cpfParam.replace(/\D/g, '')

    const result = await pool.query(
      'SELECT * FROM tutores WHERE cpf = $1',
      [cpf]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tutor não encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao buscar tutor:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
