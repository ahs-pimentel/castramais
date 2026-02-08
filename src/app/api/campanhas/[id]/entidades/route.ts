import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const { id } = await params
    const result = await pool.query(
      `SELECT e.id, e.nome, e.cidade, e.bairro, e.telefone, e.email, e.ativo
       FROM entidades e
       INNER JOIN campanhas_entidades ce ON e.id = ce."entidadeId"
       WHERE ce."campanhaId" = $1
       ORDER BY e.nome`,
      [id]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar entidades da campanha:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const { id } = await params
    const { entidadeId } = await request.json()

    if (!entidadeId) {
      return NextResponse.json({ error: 'entidadeId é obrigatório' }, { status: 400 })
    }

    await pool.query(
      `INSERT INTO campanhas_entidades ("campanhaId", "entidadeId")
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id, entidadeId]
    )

    return NextResponse.json({ message: 'Entidade vinculada com sucesso' }, { status: 201 })
  } catch (error) {
    console.error('Erro ao vincular entidade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const { id } = await params
    const { entidadeId } = await request.json()

    await pool.query(
      'DELETE FROM campanhas_entidades WHERE "campanhaId" = $1 AND "entidadeId" = $2',
      [id, entidadeId]
    )

    return NextResponse.json({ message: 'Entidade desvinculada com sucesso' })
  } catch (error) {
    console.error('Erro ao desvincular entidade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
