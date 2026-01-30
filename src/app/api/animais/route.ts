import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pool } from '@/lib/pool'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    let query = `
      SELECT
        a.*,
        json_build_object(
          'id', t.id,
          'nome', t.nome,
          'cpf', t.cpf,
          'telefone', t.telefone,
          'email', t.email,
          'endereco', t.endereco,
          'cidade', t.cidade,
          'bairro', t.bairro
        ) as tutor
      FROM animais a
      LEFT JOIN tutores t ON a."tutorId" = t.id
      WHERE 1=1
    `
    const params: string[] = []
    let paramIndex = 1

    if (status) {
      query += ` AND a.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (search) {
      query += ` AND (
        a.nome ILIKE $${paramIndex} OR
        a."registroSinpatinhas" ILIKE $${paramIndex} OR
        t.nome ILIKE $${paramIndex} OR
        t.telefone ILIKE $${paramIndex} OR
        t.cidade ILIKE $${paramIndex}
      )`
      params.push(`%${search}%`)
      paramIndex++
    }

    query += ` ORDER BY a."createdAt" DESC`

    const result = await pool.query(query, params)

    return NextResponse.json(result.rows)
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

    // Verificar se registro já existe
    const existingAnimal = await pool.query(
      'SELECT id FROM animais WHERE "registroSinpatinhas" = $1',
      [registroSinpatinhas]
    )
    if (existingAnimal.rows.length > 0) {
      return NextResponse.json({ error: 'Este RG Animal já está cadastrado no sistema' }, { status: 409 })
    }

    let tutorIdFinal: string

    if (tutorId) {
      const existingTutor = await pool.query('SELECT id FROM tutores WHERE id = $1', [tutorId])
      if (existingTutor.rows.length === 0) {
        return NextResponse.json({ error: 'Tutor não encontrado' }, { status: 404 })
      }
      tutorIdFinal = tutorId
    } else if (tutorData) {
      const newTutor = await pool.query(
        `INSERT INTO tutores (nome, cpf, telefone, email, endereco, cidade, bairro)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [tutorData.nome, tutorData.cpf, tutorData.telefone, tutorData.email, tutorData.endereco, tutorData.cidade, tutorData.bairro]
      )
      tutorIdFinal = newTutor.rows[0].id
    } else {
      return NextResponse.json({ error: 'Tutor é obrigatório' }, { status: 400 })
    }

    const animal = await pool.query(
      `INSERT INTO animais (
        nome, especie, raca, sexo, peso, "idadeAnos", "idadeMeses",
        "registroSinpatinhas", status, "dataAgendamento", observacoes, "tutorId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        animalData.nome,
        animalData.especie,
        animalData.raca,
        animalData.sexo,
        animalData.peso || null,
        animalData.idadeAnos || null,
        animalData.idadeMeses || null,
        registroSinpatinhas,
        animalData.status || 'pendente',
        animalData.dataAgendamento || null,
        animalData.observacoes || null,
        tutorIdFinal
      ]
    )

    return NextResponse.json(animal.rows[0], { status: 201 })
  } catch (error) {
    console.error('Erro ao criar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
