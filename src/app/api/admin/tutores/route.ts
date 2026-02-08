import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireRole('admin', 'assistente')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Paginação (opcional - mantém compatibilidade)
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const usePagination = pageParam !== null || limitParam !== null
    const page = Math.max(1, Number(pageParam) || 1)
    const limit = Math.min(Math.max(1, Number(limitParam) || 50), 100)

    const params: (string | number)[] = []
    let paramIndex = 1

    let whereClause = ''
    if (search) {
      whereClause = `
        WHERE t.nome ILIKE $${paramIndex}
        OR t.cpf ILIKE $${paramIndex}
        OR t.telefone ILIKE $${paramIndex}
        OR t.email ILIKE $${paramIndex}
        OR t.cidade ILIKE $${paramIndex}
      `
      params.push(`%${search}%`)
      paramIndex++
    }

    let query = `
      SELECT
        t.id,
        t.nome,
        t.cpf,
        t.telefone,
        t.email,
        t.endereco,
        t.cidade,
        t.bairro,
        t."createdAt",
        COUNT(a.id)::int as "totalAnimais"
      FROM tutores t
      LEFT JOIN animais a ON a."tutorId" = t.id
      ${whereClause}
      GROUP BY t.id
      ORDER BY t."createdAt" DESC
    `

    if (usePagination) {
      const offset = (page - 1) * limit
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      // Conta total para metadados
      const countQuery = `SELECT COUNT(*)::int as total FROM tutores t ${whereClause}`
      const countResult = await pool.query(
        countQuery,
        search ? [params[0]] : []
      )
      const total = countResult.rows[0].total
      const result = await pool.query(query, params)

      return NextResponse.json({
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      })
    }

    // Sem paginação (comportamento original)
    const result = await pool.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar tutores:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
