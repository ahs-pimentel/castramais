import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRole('admin', 'assistente')
    if (error) return error

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRole('admin')
    if (error) return error

    const { id } = await params
    const body = await request.json()

    // Campos permitidos para edição
    const updateFields: string[] = []
    const values: (string | null)[] = []
    let paramIndex = 1

    // Campos que podem ser editados
    const allowedFields = ['nome', 'telefone', 'email', 'endereco', 'cidade', 'bairro']

    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== null) {
        // Validações
        if (field === 'telefone') {
          const telefone = String(body[field]).replace(/\D/g, '')
          if (telefone.length < 10) {
            return NextResponse.json({ error: 'Telefone deve ter no mínimo 10 dígitos' }, { status: 400 })
          }
          updateFields.push(`${field} = $${paramIndex}`)
          values.push(telefone)
        } else if (field === 'email' && body[field]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(String(body[field]))) {
            return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
          }
          updateFields.push(`${field} = $${paramIndex}`)
          values.push(String(body[field]))
        } else if (field === 'nome') {
          if (String(body[field]).trim().length < 2) {
            return NextResponse.json({ error: 'Nome deve ter no mínimo 2 caracteres' }, { status: 400 })
          }
          updateFields.push(`${field} = $${paramIndex}`)
          values.push(String(body[field]).trim())
        } else {
          // endereco, cidade, bairro
          updateFields.push(`${field} = $${paramIndex}`)
          values.push(String(body[field]).trim())
        }
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    // Executar update
    values.push(id)
    const result = await pool.query(
      `UPDATE tutores SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tutor não encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar tutor:', error)
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
