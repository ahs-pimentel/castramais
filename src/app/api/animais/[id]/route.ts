import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRepository } from '@/lib/db'
import { Animal } from '@/entities'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const animalRepository = await getRepository(Animal)
    const animal = await animalRepository.findOne({
      where: { id },
      relations: ['tutor'],
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const animalRepository = await getRepository(Animal)

    const animal = await animalRepository.findOne({ where: { id } })
    if (!animal) {
      return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })
    }

    Object.assign(animal, body)
    const updatedAnimal = await animalRepository.save(animal)

    return NextResponse.json(updatedAnimal)
  } catch (error) {
    console.error('Erro ao atualizar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const animalRepository = await getRepository(Animal)

    const animal = await animalRepository.findOne({ where: { id } })
    if (!animal) {
      return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })
    }

    await animalRepository.remove(animal)

    return NextResponse.json({ message: 'Animal removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
