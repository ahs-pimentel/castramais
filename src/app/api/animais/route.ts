import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRepository } from '@/lib/db'
import { Animal, Tutor } from '@/entities'
import { Like, ILike } from 'typeorm'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const animalRepository = await getRepository(Animal)

    const queryBuilder = animalRepository
      .createQueryBuilder('animal')
      .leftJoinAndSelect('animal.tutor', 'tutor')
      .orderBy('animal.createdAt', 'DESC')

    if (status) {
      queryBuilder.andWhere('animal.status = :status', { status })
    }

    if (search) {
      queryBuilder.andWhere(
        '(animal.nome ILIKE :search OR animal.registroSinpatinhas ILIKE :search OR tutor.nome ILIKE :search OR tutor.telefone ILIKE :search OR tutor.cidade ILIKE :search)',
        { search: `%${search}%` }
      )
    }

    const animais = await queryBuilder.getMany()

    return NextResponse.json(animais)
  } catch (error) {
    console.error('Erro ao buscar animais:', error)
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
    const { tutorId, tutor: tutorData, registroSinpatinhas, ...animalData } = body

    if (!registroSinpatinhas) {
      return NextResponse.json({ error: 'Número do RG Animal (SinPatinhas) é obrigatório' }, { status: 400 })
    }

    const animalRepository = await getRepository(Animal)
    const tutorRepository = await getRepository(Tutor)

    // Verificar se registro já existe
    const existingAnimal = await animalRepository.findOne({
      where: { registroSinpatinhas }
    })
    if (existingAnimal) {
      return NextResponse.json({ error: 'Este RG Animal já está cadastrado no sistema' }, { status: 409 })
    }

    let tutorIdFinal: string

    if (tutorId) {
      const existingTutor = await tutorRepository.findOne({ where: { id: tutorId } })
      if (!existingTutor) {
        return NextResponse.json({ error: 'Tutor não encontrado' }, { status: 404 })
      }
      tutorIdFinal = existingTutor.id
    } else if (tutorData) {
      const newTutor = tutorRepository.create(tutorData as Partial<Tutor>)
      const savedTutor = await tutorRepository.save(newTutor)
      tutorIdFinal = (savedTutor as unknown as Tutor).id
    } else {
      return NextResponse.json({ error: 'Tutor é obrigatório' }, { status: 400 })
    }

    const animal = animalRepository.create({
      ...animalData,
      registroSinpatinhas,
      tutorId: tutorIdFinal,
    })

    const savedAnimal = await animalRepository.save(animal)

    return NextResponse.json(savedAnimal, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
