import { NextRequest, NextResponse } from 'next/server'
import { getRepository } from '@/lib/db'
import { Tutor } from '@/entities'
import { gerarCodigo, salvarCodigo } from '@/lib/tutor-auth'
import { enviarCodigoVerificacao } from '@/lib/notifications'
import { cleanCPF, validateCPF } from '@/lib/utils'

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

    // Verificar se CPF já existe
    const tutorRepository = await getRepository(Tutor)
    const tutorExistente = await tutorRepository.findOne({
      where: { cpf: cpfLimpo },
    })

    if (tutorExistente) {
      return NextResponse.json(
        { error: 'CPF já cadastrado no sistema' },
        { status: 409 }
      )
    }

    // Limpar telefone
    const telefoneLimpo = telefone.replace(/\D/g, '')

    // Criar tutor
    const novoTutor = tutorRepository.create({
      nome: nome.trim(),
      cpf: cpfLimpo,
      telefone: telefoneLimpo,
      email: email?.trim() || null,
      endereco: endereco.trim(),
      cidade: cidade.trim(),
      bairro: bairro.trim(),
    })

    await tutorRepository.save(novoTutor)

    // Gerar e enviar código de verificação
    const codigo = gerarCodigo()
    salvarCodigo(cpfLimpo, codigo)

    // Enviar código por WhatsApp (ou email como fallback)
    const resultado = await enviarCodigoVerificacao(
      telefoneLimpo,
      email?.trim() || null,
      codigo,
      'whatsapp'
    )

    // Mascarar telefone para retorno
    const telefoneMascarado = `${telefoneLimpo.slice(0, 2)}*****${telefoneLimpo.slice(-4)}`

    // Log para debug
    console.log(`[CADASTRO TUTOR] CPF: ${cpfLimpo} | Código: ${codigo} | Método: ${resultado.metodo}`)

    return NextResponse.json({
      message: 'Cadastro realizado com sucesso',
      tutorId: novoTutor.id,
      telefone: telefoneMascarado,
      codigoEnviado: resultado.success,
      metodoEnvio: resultado.metodo,
      // Em dev, retorna o código para facilitar testes
      ...(process.env.NODE_ENV === 'development' && { codigo }),
    })
  } catch (error) {
    console.error('Erro ao cadastrar tutor:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
