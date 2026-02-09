import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'
import { sanitizeInput } from '@/lib/sanitize'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRole('admin', 'assistente')
    if (error) return error

    const { id } = await params
    const body = await request.json()
    const { ativo, resetPassword } = body

    if (resetPassword) {
      const novaSenha = crypto.randomBytes(6).toString('base64url')
      const hash = await bcrypt.hash(novaSenha, 10)

      const result = await pool.query(
        'UPDATE entidades SET password = $1 WHERE id = $2 RETURNING id, nome',
        [hash, id]
      )

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Entidade não encontrada' }, { status: 404 })
      }

      return NextResponse.json({ ...result.rows[0], novaSenha })
    }

    if (typeof ativo !== 'boolean') {
      return NextResponse.json({ error: 'Campo ativo é obrigatório' }, { status: 400 })
    }

    const result = await pool.query(
      'UPDATE entidades SET ativo = $1 WHERE id = $2 RETURNING id, nome, ativo',
      [ativo, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Entidade não encontrada' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar entidade:', error)
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
    const { nome, cnpj, responsavel, telefone, email, cidade, bairro, endereco } = body

    if (!nome || !responsavel || !telefone || !email || !cidade) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    const result = await pool.query(
      `UPDATE entidades SET nome = $1, cnpj = $2, responsavel = $3, telefone = $4, email = $5, cidade = $6, bairro = $7, endereco = $8
       WHERE id = $9
       RETURNING id, nome, cnpj, responsavel, telefone, email, cidade, bairro, endereco, ativo, "createdAt"`,
      [sanitizeInput(nome), cnpj || null, sanitizeInput(responsavel), telefone.replace(/\D/g, ''), email.trim(), sanitizeInput(cidade, 100), bairro ? sanitizeInput(bairro, 100) : null, endereco ? sanitizeInput(endereco, 255) : null, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Entidade não encontrada' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao editar entidade:', error)
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

    const result = await pool.query('DELETE FROM entidades WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Entidade não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar entidade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
