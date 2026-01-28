import { NextRequest, NextResponse } from 'next/server'
import { getRepository } from '@/lib/db'
import { Animal } from '@/entities'
import { extrairToken, verificarToken } from '@/lib/tutor-auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = extrairToken(authHeader)

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const payload = verificarToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const animalRepository = await getRepository(Animal)

    const animais = await animalRepository.find({
      where: { tutorId: payload.tutorId },
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'nome',
        'especie',
        'raca',
        'registroSinpatinhas',
        'status',
        'dataAgendamento',
        'dataRealizacao',
      ],
    })

    return NextResponse.json(animais)
  } catch (error) {
    console.error('Erro ao buscar animais do tutor:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
