import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'
import { validateCPF, cleanCPF } from '@/lib/utils'
import { validarTelefone, validarEmail } from '@/lib/sanitize'

export async function GET(request: NextRequest) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const result = await pool.query(
      'SELECT * FROM tutores ORDER BY nome ASC'
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar tutores:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const body = await request.json()

    if (!body.nome?.trim() || !body.cpf || !body.telefone || !body.endereco || !body.cidade || !body.bairro) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    const cpfLimpo = cleanCPF(body.cpf)
    if (!validateCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }

    if (!validarTelefone(body.telefone)) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    if (body.email && !validarEmail(body.email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Verificar se CPF já existe
    const existing = await pool.query(
      'SELECT id FROM tutores WHERE cpf = $1',
      [cpfLimpo]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO tutores (nome, cpf, telefone, email, endereco, cidade, bairro)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [body.nome.trim(), cpfLimpo, body.telefone.replace(/\D/g, ''), body.email?.trim() || null, body.endereco.trim(), body.cidade.trim(), body.bairro.trim()]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Erro ao criar tutor:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
