import { NextRequest, NextResponse } from 'next/server'
import { getRepository } from '@/lib/db'
import { Tutor } from '@/entities'
import { gerarCodigo, salvarCodigo } from '@/lib/tutor-auth'
import { enviarCodigoVerificacao } from '@/lib/notifications'
import { cleanCPF } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf, preferencia } = body

    if (!cpf) {
      return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 })
    }

    const cpfLimpo = cleanCPF(cpf)
    const tutorRepository = await getRepository(Tutor)

    const tutor = await tutorRepository.findOne({
      where: { cpf: cpfLimpo },
    })

    if (!tutor) {
      // Retornar indicação de que precisa cadastrar
      return NextResponse.json(
        {
          cadastroNecessario: true,
          message: 'CPF não encontrado. Realize seu cadastro para continuar.'
        },
        { status: 404 }
      )
    }

    // Gerar e salvar código
    const codigo = gerarCodigo()
    salvarCodigo(cpfLimpo, codigo)

    // Enviar código por WhatsApp (ou email como fallback)
    const resultado = await enviarCodigoVerificacao(
      tutor.telefone,
      tutor.email,
      codigo,
      preferencia || 'whatsapp'
    )

    console.log(`[CÓDIGO TUTOR] CPF: ${cpfLimpo} | Código: ${codigo} | Método: ${resultado.metodo}`)

    // Mascarar telefone e email para retorno
    const telefoneMascarado = tutor.telefone
      ? `${tutor.telefone.slice(0, 2)}*****${tutor.telefone.slice(-4)}`
      : null

    const emailMascarado = tutor.email
      ? `${tutor.email.slice(0, 3)}***@${tutor.email.split('@')[1]}`
      : null

    return NextResponse.json({
      message: 'Código enviado',
      telefone: telefoneMascarado,
      email: emailMascarado,
      temEmail: !!tutor.email,
      codigoEnviado: resultado.success,
      metodoEnvio: resultado.metodo,
      // Em dev, retorna o código para facilitar testes
      ...(process.env.NODE_ENV === 'development' && { codigo }),
    })
  } catch (error) {
    console.error('Erro ao enviar código:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
