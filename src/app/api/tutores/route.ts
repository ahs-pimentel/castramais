import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRepository } from '@/lib/db'
import { Tutor } from '@/entities'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const tutorRepository = await getRepository(Tutor)
    const tutores = await tutorRepository.find({
      order: { nome: 'ASC' },
    })

    return NextResponse.json(tutores)
  } catch (error) {
    console.error('Erro ao buscar tutores:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const tutorRepository = await getRepository(Tutor)

    // Verificar se CPF já existe
    const existingTutor = await tutorRepository.findOne({
      where: { cpf: body.cpf },
    })

    if (existingTutor) {
      return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 400 })
    }

    const tutor = tutorRepository.create(body)
    const savedTutor = await tutorRepository.save(tutor)

    return NextResponse.json(savedTutor, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar tutor:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
