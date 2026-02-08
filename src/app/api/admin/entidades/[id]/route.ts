import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRole('admin', 'assistente')
    if (error) return error

    const { id } = await params
    const body = await request.json()
    const { ativo } = body

    if (typeof ativo !== 'boolean') {
      return NextResponse.json({ error: 'Campo ativo é obrigatório' }, { status: 400 })
    }

    const result = await pool.query(
      'UPDATE entidades SET ativo = $1 WHERE id = $2 RETURNING id, nome, ativo',
      [ativo, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Entidade não encontrada' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar entidade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRole('admin')
    if (error) return error

    const { id } = await params

    const result = await pool.query('DELETE FROM entidades WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Entidade não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar entidade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
