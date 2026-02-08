import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getEntidadeJwtSecret } from '@/lib/jwt-secrets'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS, JWT_EXPIRY } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Rate limiting
    const limit = await checkRateLimit(`login:entidade:${email}`, RATE_LIMITS.LOGIN_PER_EMAIL.max, RATE_LIMITS.LOGIN_PER_EMAIL.windowMs)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 })
    }

    // Buscar entidade
    const result = await pool.query(
      'SELECT id, nome, email, password, cidade, bairro, ativo FROM entidades WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    const entidade = result.rows[0]

    // Verificar se está ativa
    if (!entidade.ativo) {
      return NextResponse.json(
        { error: 'Sua conta ainda não foi aprovada. Aguarde a ativação.' },
        { status: 403 }
      )
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, entidade.password)

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: entidade.id,
        nome: entidade.nome,
        email: entidade.email,
        cidade: entidade.cidade,
        bairro: entidade.bairro,
      },
      getEntidadeJwtSecret(),
      { expiresIn: JWT_EXPIRY.ENTIDADE }
    )

    return NextResponse.json({
      token,
      entidade: {
        id: entidade.id,
        nome: entidade.nome,
        email: entidade.email,
        cidade: entidade.cidade,
        bairro: entidade.bairro,
      },
    })
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
