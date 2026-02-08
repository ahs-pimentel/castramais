import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'
import { validarSenha, validarEmail } from '@/lib/sanitize'

export async function GET() {
  const { error } = await requireRole('admin')
  if (error) return error

  try {
    const result = await pool.query(
      'SELECT id, email, nome, role, "createdAt" FROM users ORDER BY "createdAt" ASC'
    )
    return NextResponse.json(result.rows)
  } catch (err) {
    console.error('Erro ao listar usuários:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole('admin')
  if (error) return error

  try {
    const { nome, email, password, role } = await request.json()

    if (!nome?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
    }

    if (!validarEmail(email.trim())) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const senhaCheck = validarSenha(password)
    if (!senhaCheck.valida) {
      return NextResponse.json({ error: senhaCheck.erro }, { status: 400 })
    }

    if (!['admin', 'assistente'].includes(role)) {
      return NextResponse.json({ error: 'Role inválido' }, { status: 400 })
    }

    // Check duplicate email
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim()])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (email, password, nome, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, nome, role, "createdAt"`,
      [email.trim(), hash, nome.trim(), role]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (err) {
    console.error('Erro ao criar usuário:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
