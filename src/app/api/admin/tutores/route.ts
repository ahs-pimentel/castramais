import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/pool'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const result = await pool.query(`
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
      GROUP BY t.id
      ORDER BY t."createdAt" DESC
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar tutores:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
