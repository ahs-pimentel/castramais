import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { gerarCodigo, salvarCodigo } from '@/lib/tutor-auth'
import { enviarCodigoVerificacao } from '@/lib/notifications'
import { cleanCPF, validateCPF } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'

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
      tutorId: tutorId,
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
