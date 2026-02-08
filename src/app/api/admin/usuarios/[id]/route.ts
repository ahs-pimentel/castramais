import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import bcrypt from 'bcryptjs'
import { requireRole } from '@/lib/permissions'
import { validarSenha } from '@/lib/sanitize'

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireRole('admin')
  if (error) return error

  try {
    const { id } = await params
    const { nome, role } = await request.json()

    // Prevent changing own role
    if (session!.user.id === id) {
      return NextResponse.json({ error: 'Não é possível alterar o próprio role' }, { status: 400 })
    }

    if (!['admin', 'assistente'].includes(role)) {
      return NextResponse.json({ error: 'Role inválido' }, { status: 400 })
    }

    const result = await pool.query(
      `UPDATE users SET nome = $1, role = $2 WHERE id = $3
       RETURNING id, email, nome, role, "createdAt"`,
      [nome?.trim(), role, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole('admin')
  if (error) return error

  try {
    const { id } = await params
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Nova senha é obrigatória' }, { status: 400 })
    }

    const senhaCheck = validarSenha(password)
    if (!senhaCheck.valida) {
      return NextResponse.json({ error: senhaCheck.erro }, { status: 400 })
    }

    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id])
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const hash = await bcrypt.hash(password, 10)
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, id])

    return NextResponse.json({ success: true, message: 'Senha atualizada com sucesso' })
  } catch (err) {
    console.error('Erro ao resetar senha:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error, session } = await requireRole('admin')
  if (error) return error

  try {
    const { id } = await params

    // Prevent self-deletion
    if (session!.user.id === id) {
      return NextResponse.json({ error: 'Não é possível excluir a si mesmo' }, { status: 400 })
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro ao excluir usuário:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
