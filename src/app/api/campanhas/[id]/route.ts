import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const { id } = await params
    const result = await pool.query('SELECT * FROM campanhas WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao buscar campanha:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    const updateFields = []
    const values: (string | number | boolean | null)[] = []
    let paramIndex = 1

    const allowedFields: Record<string, string> = {
      nome: 'nome',
      cidade: 'cidade',
      uf: 'uf',
      dataInicio: '"dataInicio"',
      dataFim: '"dataFim"',
      dataDescricao: '"dataDescricao"',
      limite: 'limite',
      ativa: 'ativa',
    }

    for (const [key, dbField] of Object.entries(allowedFields)) {
      if (body[key] !== undefined) {
        updateFields.push(`${dbField} = $${paramIndex}`)
        values.push(body[key])
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    values.push(id)
    const result = await pool.query(
      `UPDATE campanhas SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar campanha:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole('admin')
  if (error) return error

  try {
    const { id } = await params
    const result = await pool.query('DELETE FROM campanhas WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Campanha removida com sucesso' })
  } catch (error) {
    console.error('Erro ao remover campanha:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
