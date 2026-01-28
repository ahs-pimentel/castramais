import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRepository } from '@/lib/db'
import { Animal } from '@/entities'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const animalRepository = await getRepository(Animal)

    const [total, pendentes, agendados, realizados] = await Promise.all([
      animalRepository.count(),
      animalRepository.count({ where: { status: 'pendente' } }),
      animalRepository.count({ where: { status: 'agendado' } }),
      animalRepository.count({ where: { status: 'realizado' } }),
    ])

    return NextResponse.json({
      total,
      pendentes,
      agendados,
      realizados,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
