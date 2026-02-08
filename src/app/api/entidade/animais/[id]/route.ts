import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import jwt from 'jsonwebtoken'
import { getEntidadeJwtSecret } from '@/lib/jwt-secrets'

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let entidadePayload: { id: string }
    try {
      entidadePayload = jwt.verify(authHeader.substring(7), getEntidadeJwtSecret()) as { id: string }
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verify animal belongs to a campaign linked to this entidade
    const check = await pool.query(
      `SELECT a.id FROM animais a
       INNER JOIN campanhas_entidades ce ON a."campanhaId" = ce."campanhaId"
       WHERE a.id = $1 AND ce."entidadeId" = $2`,
      [id, entidadePayload.id]
    )
    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Animal não encontrado ou sem permissão' }, { status: 403 })
    }

    // Only allow editing specific fields (not status, campanhaId)
    const allowedFields: Record<string, string> = {
      nome: 'nome',
      especie: 'especie',
      raca: 'raca',
      peso: 'peso',
      observacoes: 'observacoes',
    }

    const updateFields = []
    const values: (string | number | null)[] = []
    let paramIndex = 1

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
      `UPDATE animais SET ${updateFields.join(', ')}, "updatedAt" = NOW()
       WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao editar animal pela entidade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
