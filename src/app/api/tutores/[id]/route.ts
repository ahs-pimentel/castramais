import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRepository } from '@/lib/db'
import { Tutor } from '@/entities'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const tutorRepository = await getRepository(Tutor)
    const tutor = await tutorRepository.findOne({
      where: { id },
      relations: ['animais'],
    })

    if (!tutor) {
      return NextResponse.json({ error: 'Tutor não encontrado' }, { status: 404 })
    }

    return NextResponse.json(tutor)
  } catch (error) {
    console.error('Erro ao buscar tutor:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
