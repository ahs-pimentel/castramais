import { NextRequest, NextResponse } from 'next/server'
import { getRepository } from '@/lib/db'
import { Tutor } from '@/entities'
import { gerarCodigo, salvarCodigo } from '@/lib/tutor-auth'
import { cleanCPF } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf } = body

    if (!cpf) {
      return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 })
    }

    const cpfLimpo = cleanCPF(cpf)
    const tutorRepository = await getRepository(Tutor)

    const tutor = await tutorRepository.findOne({
      where: { cpf: cpfLimpo },
    })

    if (!tutor) {
      return NextResponse.json(
        { error: 'CPF não encontrado. Cadastre seu pet em uma unidade Castra+' },
        { status: 404 }
      )
    }

    // Gerar e salvar código
    const codigo = gerarCodigo()
    salvarCodigo(cpfLimpo, codigo)

    // Em produção, enviar via WhatsApp API (Twilio, etc)
    // Por enquanto, apenas logamos
    console.log(`[CÓDIGO TUTOR] CPF: ${cpfLimpo} | Código: ${codigo}`)

    // Mascarar telefone para retorno
    const telefoneMascarado = tutor.telefone
      ? `${tutor.telefone.slice(0, 2)}*****${tutor.telefone.slice(-4)}`
      : null

    return NextResponse.json({
      message: 'Código enviado',
      telefone: telefoneMascarado,
      // Em dev, retorna o código para facilitar testes
      ...(process.env.NODE_ENV === 'development' && { codigo }),
    })
  } catch (error) {
    console.error('Erro ao enviar código:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
