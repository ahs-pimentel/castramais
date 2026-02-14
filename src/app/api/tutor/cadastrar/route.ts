import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { cleanCPF, validateCPF } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, cpf, telefone, email, endereco, cidade, bairro } = body

    // Validações
    if (!nome || !cpf || !telefone || !endereco || !cidade || !bairro) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      )
    }

    const cpfLimpo = cleanCPF(cpf)

    if (!validateCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const limit = await checkRateLimit(`cadastro:ip:${ip}`, RATE_LIMITS.CADASTRO_PER_IP.max, RATE_LIMITS.CADASTRO_PER_IP.windowMs)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })
    }

    // Verificar se CPF já existe
    const existeResult = await pool.query(
      'SELECT id FROM tutores WHERE cpf = $1',
      [cpfLimpo]
    )

    if (existeResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'CPF já cadastrado no sistema' },
        { status: 409 }
      )
    }

    // Limpar telefone
    const telefoneLimpo = telefone.replace(/\D/g, '')

    // Criar tutor usando raw SQL
    const tutorId = uuidv4()
    await pool.query(
      `INSERT INTO tutores (id, nome, cpf, telefone, email, endereco, cidade, bairro, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        tutorId,
        nome.trim(),
        cpfLimpo,
        telefoneLimpo,
        email?.trim() || null,
        endereco.trim(),
        cidade.trim(),
        bairro.trim(),
      ]
    )

    // Log para debug
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CADASTRO TUTOR] CPF: ${cpfLimpo} | Telefone: ${telefoneLimpo}`)
    }

    return NextResponse.json({
      message: 'Cadastro realizado com sucesso',
      tutorId: tutorId,
      telefone: telefoneLimpo,
    })
  } catch (error) {
    console.error('Erro ao cadastrar tutor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
