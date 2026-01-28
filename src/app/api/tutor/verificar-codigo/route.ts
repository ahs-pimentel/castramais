import { NextRequest, NextResponse } from 'next/server'
import { getRepository } from '@/lib/db'
import { Tutor } from '@/entities'
import { verificarCodigo, gerarToken } from '@/lib/tutor-auth'
import { cleanCPF } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cpf, codigo } = body

    if (!cpf || !codigo) {
      return NextResponse.json({ error: 'CPF e código são obrigatórios' }, { status: 400 })
    }

    const cpfLimpo = cleanCPF(cpf)

    // Verificar código
    const codigoValido = verificarCodigo(cpfLimpo, codigo)
    if (!codigoValido) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 401 })
    }

    // Buscar tutor
    const tutorRepository = await getRepository(Tutor)
    const tutor = await tutorRepository.findOne({
      where: { cpf: cpfLimpo },
    })

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
