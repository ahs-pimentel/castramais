import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { verificarCodigo, gerarToken } from '@/lib/tutor-auth'
import { cleanCPF, validateCPF } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf, codigo } = body

    if (!cpf || !codigo) {
      return NextResponse.json({ error: 'CPF e código são obrigatórios' }, { status: 400 })
    }

    const cpfLimpo = cleanCPF(cpf)

    if (!validateCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }

    // Rate limiting
    const limit = await checkRateLimit(`verify:cpf:${cpfLimpo}`, RATE_LIMITS.OTP_PER_CPF.max, RATE_LIMITS.OTP_PER_CPF.windowMs)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 })
    }

    // Verificar código
    const codigoValido = await verificarCodigo(cpfLimpo, codigo)
    if (!codigoValido) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 401 })
    }

    // Buscar tutor usando raw SQL
    const result = await pool.query(
      'SELECT id, cpf, nome FROM tutores WHERE cpf = $1',
      [cpfLimpo]
    )

    const tutor = result.rows[0]

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor não encontrado' }, { status: 404 })
    }

    // Gerar token JWT
    const token = gerarToken({
      tutorId: tutor.id,
      cpf: tutor.cpf,
      nome: tutor.nome,
    })

    return NextResponse.json({
      token,
      nome: tutor.nome,
    })
  } catch (error) {
    console.error('Erro ao verificar código:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
