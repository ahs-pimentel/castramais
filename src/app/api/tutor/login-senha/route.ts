import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { gerarToken, verificarSenha } from '@/lib/tutor-auth'
import { cleanCPF, validateCPF } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf, senha } = body

    if (!cpf || !senha) {
      return NextResponse.json({ error: 'CPF e senha são obrigatórios' }, { status: 400 })
    }

    const cpfLimpo = cleanCPF(cpf)

    if (!validateCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }

    // Rate limiting
    const limit = await checkRateLimit(`login-senha:cpf:${cpfLimpo}`, RATE_LIMITS.OTP_PER_CPF.max, RATE_LIMITS.OTP_PER_CPF.windowMs)
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 })
    }

    // Buscar tutor com senha
    const result = await pool.query(
      'SELECT id, cpf, nome, senha_hash FROM tutores WHERE cpf = $1',
      [cpfLimpo]
    )

    const tutor = result.rows[0]

    // Resposta genérica para não revelar se CPF existe
    if (!tutor || !tutor.senha_hash) {
      return NextResponse.json({ error: 'CPF ou senha incorretos' }, { status: 401 })
    }

    const senhaValida = await verificarSenha(senha, tutor.senha_hash)
    if (!senhaValida) {
      return NextResponse.json({ error: 'CPF ou senha incorretos' }, { status: 401 })
    }

    // Gerar JWT
    const token = gerarToken({
      tutorId: tutor.id,
      cpf: tutor.cpf,
      nome: tutor.nome,
    })

    return NextResponse.json({ token, nome: tutor.nome })
  } catch (error) {
    console.error('Erro no login com senha:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
