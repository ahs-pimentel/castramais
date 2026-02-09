import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import bcrypt from 'bcryptjs'
import { checkRateLimit } from '@/lib/rate-limit'
import { validarSenha, validarEmail, validarTelefone, sanitizeInput } from '@/lib/sanitize'
import { RATE_LIMITS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, cnpj, responsavel, telefone, email, password, cidade, bairro, endereco } = body

    if (!nome || !responsavel || !telefone || !email || !password || !cidade) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }

    if (!validarEmail(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    if (!validarTelefone(telefone)) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    const senhaCheck = validarSenha(password)
    if (!senhaCheck.valida) {
      return NextResponse.json({ error: senhaCheck.erro }, { status: 400 })
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limit = await checkRateLimit(`cadastro:entidade:ip:${ip}`, RATE_LIMITS.CADASTRO_PER_IP.max, RATE_LIMITS.CADASTRO_PER_IP.windowMs)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })
    }

    // Verificar se email já existe
    const existingEmail = await pool.query(
      'SELECT id FROM entidades WHERE email = $1',
      [email]
    )

    if (existingEmail.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // Verificar se CNPJ já existe (se fornecido)
    if (cnpj) {
      const existingCNPJ = await pool.query(
        'SELECT id FROM entidades WHERE cnpj = $1',
        [cnpj]
      )

      if (existingCNPJ.rows.length > 0) {
        return NextResponse.json(
          { error: 'Este CNPJ já está cadastrado' },
          { status: 400 }
        )
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar entidade (inativa por padrão, aguardando aprovação)
    const result = await pool.query(
      `INSERT INTO entidades (nome, cnpj, responsavel, telefone, email, password, cidade, bairro, endereco, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
       RETURNING id, nome, email`,
      [sanitizeInput(nome), cnpj || null, sanitizeInput(responsavel), telefone.replace(/\D/g, ''), email.trim(), hashedPassword, sanitizeInput(cidade, 100), bairro ? sanitizeInput(bairro, 100) : null, endereco ? sanitizeInput(endereco, 255) : null]
    )

    return NextResponse.json({
      success: true,
      entidade: result.rows[0],
      message: 'Cadastro realizado. Aguarde aprovação.',
    })
  } catch (error) {
    console.error('Erro ao cadastrar entidade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
