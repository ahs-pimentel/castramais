import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import jwt from 'jsonwebtoken'
import { getEntidadeJwtSecret } from '@/lib/jwt-secrets'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let payload: { id: string }
    try {
      payload = jwt.verify(authHeader.substring(7), getEntidadeJwtSecret()) as { id: string }
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const result = await pool.query(
      `SELECT c.id, c.nome, c.cidade, c.uf, c."dataInicio", c."dataFim", c."dataDescricao", c.limite
       FROM campanhas c
       INNER JOIN campanhas_entidades ce ON c.id = ce."campanhaId"
       WHERE ce."entidadeId" = $1 AND c.ativa = true
       ORDER BY c."dataInicio" ASC NULLS LAST`,
      [payload.id]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar campanhas da entidade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
