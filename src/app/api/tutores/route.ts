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
    const result = await pool.query(
      'SELECT * FROM tutores ORDER BY nome ASC'
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar tutores:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Verificar se CPF já existe
    const existing = await pool.query(
      'SELECT id FROM tutores WHERE cpf = $1',
      [body.cpf]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO tutores (nome, cpf, telefone, email, endereco, cidade, bairro)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [body.nome, body.cpf, body.telefone, body.email, body.endereco, body.cidade, body.bairro]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Erro ao criar tutor:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
