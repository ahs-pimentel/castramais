import { NextRequest, NextResponse } from 'next/server'
import { getRepository } from '@/lib/db'
import { Animal } from '@/entities'
import { extrairToken, verificarToken } from '@/lib/tutor-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const animal = await animalRepository.findOne({
      where: {
        id,
        tutorId: payload.tutorId, // Garante que o animal pertence ao tutor
      },
    })

    if (!animal) {
      return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })
    }

    return NextResponse.json(animal)
  } catch (error) {
    console.error('Erro ao buscar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
