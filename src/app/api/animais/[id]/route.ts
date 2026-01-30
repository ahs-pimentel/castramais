import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/pool'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const result = await pool.query(
      `SELECT
        a.*,
        json_build_object(
          'id', t.id,
          'nome', t.nome,
          'cpf', t.cpf,
          'telefone', t.telefone,
          'email', t.email,
          'endereco', t.endereco,
          'cidade', t.cidade,
          'bairro', t.bairro
        ) as tutor
      FROM animais a
      LEFT JOIN tutores t ON a."tutorId" = t.id
      WHERE a.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao buscar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Verificar se animal existe
    const existing = await pool.query('SELECT id FROM animais WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })
    }

    const updateFields = []
    const values = []
    let paramIndex = 1

    const allowedFields = ['nome', 'especie', 'raca', 'sexo', 'peso', 'idadeAnos', 'idadeMeses', 'registroSinpatinhas', 'status', 'dataAgendamento', 'dataRealizacao', 'observacoes']

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        const dbField = ['idadeAnos', 'idadeMeses', 'registroSinpatinhas', 'dataAgendamento', 'dataRealizacao'].includes(field)
          ? `"${field}"`
          : field
        updateFields.push(`${dbField} = $${paramIndex}`)
        values.push(body[field])
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    values.push(id)
    const result = await pool.query(
      `UPDATE animais SET ${updateFields.join(', ')}, "updatedAt" = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    const result = await pool.query('DELETE FROM animais WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Animal removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
