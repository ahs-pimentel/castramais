import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all')

    // If ?all=true and user is admin, return all campaigns
    let whereClause = 'WHERE ativa = true'
    if (all === 'true') {
      const { error } = await requireRole('admin', 'assistente')
      if (error) return error
      whereClause = ''
    }

    const result = await pool.query(`
      SELECT id, nome, cidade, uf, endereco, bairro, "dataInicio", "dataFim", "dataDescricao", limite, ativa, "createdAt"
      FROM campanhas
      ${whereClause}
      ORDER BY ativa DESC, "dataInicio" ASC NULLS LAST
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar campanhas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const body = await request.json()
    const { nome, cidade, uf, endereco, bairro, dataInicio, dataFim, dataDescricao, limite } = body

    if (!nome?.trim() || !cidade?.trim()) {
      return NextResponse.json({ error: 'Nome e cidade são obrigatórios' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO campanhas (nome, cidade, uf, endereco, bairro, "dataInicio", "dataFim", "dataDescricao", limite, ativa)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
       RETURNING *`,
      [nome.trim(), cidade.trim(), uf || 'MG', endereco?.trim() || null, bairro?.trim() || null, dataInicio || null, dataFim || null, dataDescricao || null, limite || 200]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Erro ao criar campanha:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
