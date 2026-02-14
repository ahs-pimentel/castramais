import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { gerarCodigo, salvarCodigo } from '@/lib/tutor-auth'
import { enviarCodigoVerificacao } from '@/lib/notifications'
import { cleanCPF, validateCPF } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf, preferencia, esqueceuSenha } = body

    if (!cpf) {
      return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 })
    }

    const cpfLimpo = cleanCPF(cpf)

    if (!validateCPF(cpfLimpo)) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const cpfLimit = await checkRateLimit(`otp:cpf:${cpfLimpo}`, RATE_LIMITS.OTP_PER_CPF.max, RATE_LIMITS.OTP_PER_CPF.windowMs)
    if (!cpfLimit.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 })
    }
    const ipLimit = await checkRateLimit(`otp:ip:${ip}`, RATE_LIMITS.OTP_PER_IP.max, RATE_LIMITS.OTP_PER_IP.windowMs)
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 })
    }

    // Buscar tutor por CPF
    const result = await pool.query(
      'SELECT id, nome, cpf, telefone, email, senha_hash FROM tutores WHERE cpf = $1',
      [cpfLimpo]
    )

    const tutor = result.rows[0]

    if (!tutor) {
      return NextResponse.json({
        cadastroNecessario: true,
        message: 'Código enviado',
        codigoEnviado: true,
        metodoEnvio: 'whatsapp',
      })
    }

    const temSenha = !!tutor.senha_hash

    // Se tutor tem senha e não está esquecendo, retorna sem enviar OTP
    if (temSenha && !esqueceuSenha) {
      return NextResponse.json({
        temSenha: true,
        message: 'Tutor possui senha cadastrada',
      })
    }

    // Gerar e salvar código
    const codigo = gerarCodigo()
    await salvarCodigo(cpfLimpo, codigo)

    // Enviar código por WhatsApp (ou email como fallback)
    const resultado = await enviarCodigoVerificacao(
      tutor.telefone,
      tutor.email,
      codigo,
      preferencia || 'whatsapp'
    )

    if (process.env.NODE_ENV === 'development') {
      console.log(`[CÓDIGO TUTOR] CPF: ${cpfLimpo} | Código: ${codigo} | Método: ${resultado.metodo}`)
    }

    // Retornar telefone completo (sem máscara) para uso com Firebase
    // O frontend precisa do número completo para enviar SMS
    const emailMascarado = tutor.email
      ? `${tutor.email.slice(0, 3)}***@${tutor.email.split('@')[1]}`
      : null

    return NextResponse.json({
      message: 'Código enviado',
      telefone: tutor.telefone, // Retorna número completo para Firebase
      email: emailMascarado,
      temEmail: !!tutor.email,
      temSenha,
      esqueceuSenha: !!esqueceuSenha,
      codigoEnviado: resultado.success,
      metodoEnvio: resultado.metodo,
      ...(process.env.NODE_ENV === 'development' && { codigo }),
    })
  } catch (error) {
    console.error('Erro ao enviar código:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
