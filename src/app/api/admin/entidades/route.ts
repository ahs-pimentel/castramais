import { NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'

export async function GET() {
  try {
    const { error } = await requireRole('admin', 'assistente')
    if (error) return error

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
