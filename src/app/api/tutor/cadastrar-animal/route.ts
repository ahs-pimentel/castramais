import { NextRequest, NextResponse } from 'next/server'
import { getRepository } from '@/lib/db'
import { Animal } from '@/entities'
import { extrairToken, verificarToken } from '@/lib/tutor-auth'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      nome,
      especie,
      raca,
      sexo,
      peso,
      idadeAnos,
      idadeMeses,
      registroSinpatinhas,
      observacoes,
    } = body

    // Validações
    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome do pet é obrigatório' }, { status: 400 })
    }
    if (!registroSinpatinhas?.trim()) {
      return NextResponse.json({ error: 'RG Animal (SinPatinhas) é obrigatório' }, { status: 400 })
    }
    if (!especie || !['cachorro', 'gato'].includes(especie)) {
      return NextResponse.json({ error: 'Espécie inválida' }, { status: 400 })
    }
    if (!sexo || !['macho', 'femea'].includes(sexo)) {
      return NextResponse.json({ error: 'Sexo inválido' }, { status: 400 })
    }
    if (!raca?.trim()) {
      return NextResponse.json({ error: 'Raça é obrigatória' }, { status: 400 })
    }

    const animalRepository = await getRepository(Animal)

    // Verificar se RG já existe
    const existingAnimal = await animalRepository.findOne({
      where: { registroSinpatinhas },
    })
    if (existingAnimal) {
      return NextResponse.json(
        { error: 'Este RG Animal já está cadastrado no sistema' },
        { status: 409 }
      )
    }

    // Criar animal vinculado ao tutor logado
    const animal = animalRepository.create({
      nome: nome.trim(),
      especie,
      raca: raca.trim(),
      sexo,
      peso: peso ? parseFloat(peso) : null,
      idadeAnos: idadeAnos ? parseInt(idadeAnos) : null,
      idadeMeses: idadeMeses ? parseInt(idadeMeses) : null,
      registroSinpatinhas: registroSinpatinhas.trim(),
      observacoes: observacoes?.trim() || null,
      tutorId: payload.tutorId,
      status: 'pendente',
    })

    const savedAnimal = await animalRepository.save(animal)

    return NextResponse.json(savedAnimal, { status: 201 })
  } catch (error) {
    console.error('Erro ao cadastrar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
