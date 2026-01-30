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
      SELECT id, nome, cnpj, responsavel, telefone, email, cidade, bairro, ativo, "createdAt"
      FROM entidades
      ORDER BY ativo ASC, "createdAt" DESC
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar entidades:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
