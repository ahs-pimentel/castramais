import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/pool'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Buscar tutor
    const tutorResult = await pool.query(
      `SELECT id, nome, cpf, telefone, email, endereco, cidade, bairro, "createdAt"
       FROM tutores WHERE id = $1`,
      [id]
    )

    if (tutorResult.rows.length === 0) {
      return NextResponse.json({ error: 'Tutor não encontrado' }, { status: 404 })
    }

    // Buscar animais do tutor
    const animaisResult = await pool.query(
      `SELECT id, nome, especie, raca, sexo, status, "createdAt"
       FROM animais WHERE "tutorId" = $1 ORDER BY "createdAt" DESC`,
      [id]
    )

    const tutor = {
      ...tutorResult.rows[0],
      animais: animaisResult.rows,
    }

    return NextResponse.json(tutor)
  } catch (error) {
    console.error('Erro ao buscar tutor:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar se tutor existe
    const tutorResult = await pool.query('SELECT id FROM tutores WHERE id = $1', [id])

    if (tutorResult.rows.length === 0) {
      return NextResponse.json({ error: 'Tutor não encontrado' }, { status: 404 })
    }

    // Deletar animais do tutor primeiro
    await pool.query('DELETE FROM animais WHERE "tutorId" = $1', [id])

    // Deletar tutor
    await pool.query('DELETE FROM tutores WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar tutor:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
