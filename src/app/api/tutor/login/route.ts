import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { gerarToken } from '@/lib/tutor-auth'
import { cleanCPF, validateCPF } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf } = body

    if (!cpf) {
      return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 })
    }

    const cpfLimpo = cleanCPF(cpf)

    if (!validateCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }

    // Rate limiting por IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const ipLimit = await checkRateLimit(`login:ip:${ip}`, RATE_LIMITS.OTP_PER_IP.max, RATE_LIMITS.OTP_PER_IP.windowMs)
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 })
    }

    // Buscar tutor por CPF
    const result = await pool.query(
      'SELECT id, nome, cpf FROM tutores WHERE cpf = $1',
      [cpfLimpo]
    )

    const tutor = result.rows[0]

    if (!tutor) {
      return NextResponse.json({ cadastroNecessario: true })
    }

    // Gerar JWT
    const token = gerarToken({
      tutorId: tutor.id,
      cpf: tutor.cpf,
      nome: tutor.nome,
    })

    return NextResponse.json({ token, nome: tutor.nome })
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
