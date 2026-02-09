import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { validarEmail, validarTelefone, sanitizeInput } from '@/lib/sanitize'

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

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireRole('admin')
    if (error) return error

    const body = await request.json()
    const { nome, cnpj, responsavel, telefone, email, cidade, bairro } = body

    if (!nome || !responsavel || !telefone || !email || !cidade) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    if (!validarEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    if (!validarTelefone(telefone)) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    const existingEmail = await pool.query('SELECT id FROM entidades WHERE email = $1', [email])
    if (existingEmail.rows.length > 0) {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 400 })
    }

    if (cnpj) {
      const existingCNPJ = await pool.query('SELECT id FROM entidades WHERE cnpj = $1', [cnpj])
      if (existingCNPJ.rows.length > 0) {
        return NextResponse.json({ error: 'Este CNPJ já está cadastrado' }, { status: 400 })
      }
    }

    const senhaGerada = crypto.randomBytes(6).toString('base64url')
    const hashedPassword = await bcrypt.hash(senhaGerada, 10)

    const result = await pool.query(
      `INSERT INTO entidades (nome, cnpj, responsavel, telefone, email, password, cidade, bairro, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING id, nome, cnpj, responsavel, telefone, email, cidade, bairro, ativo, "createdAt"`,
      [sanitizeInput(nome), cnpj || null, sanitizeInput(responsavel), telefone.replace(/\D/g, ''), email.trim(), hashedPassword, sanitizeInput(cidade, 100), bairro ? sanitizeInput(bairro, 100) : null]
    )

    return NextResponse.json({ ...result.rows[0], senhaGerada })
  } catch (error) {
    console.error('Erro ao criar entidade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
