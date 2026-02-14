import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'
import { notificarCadastroAdmin } from '@/lib/notifications'
import { buscarAnimalPorRG, buscarTutorNotificacao } from '@/lib/repositories/animal-repository'

export async function GET(request: NextRequest) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const campanha = searchParams.get('campanha') || ''

    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const usePagination = pageParam !== null || limitParam !== null
    const page = Math.max(1, Number(pageParam) || 1)
    const limit = Math.min(Math.max(1, Number(limitParam) || 50), 100)

    let baseQuery = `
      FROM animais a
      LEFT JOIN tutores t ON a."tutorId" = t.id
      LEFT JOIN campanhas c ON a."campanhaId" = c.id
      WHERE 1=1
    `
    const params: (string | number)[] = []
    let paramIndex = 1

    if (status) {
      baseQuery += ` AND a.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (campanha) {
      baseQuery += ` AND a."campanhaId" = $${paramIndex}`
      params.push(campanha)
      paramIndex++
    }

    if (search) {
      baseQuery += ` AND (
        a.nome ILIKE $${paramIndex} OR
        a."registroSinpatinhas" ILIKE $${paramIndex} OR
        t.nome ILIKE $${paramIndex} OR
        t.telefone ILIKE $${paramIndex} OR
        t.cidade ILIKE $${paramIndex}
      )`
      params.push(`%${search}%`)
      paramIndex++
    }

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
        ) as tutor,
        CASE WHEN c.id IS NOT NULL THEN json_build_object(
          'id', c.id,
          'nome', c.nome,
          'cidade', c.cidade
        ) ELSE NULL END as campanha
      ${baseQuery}
      ORDER BY a."createdAt" DESC
    `

    if (usePagination) {
      const offset = (page - 1) * limit
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const countResult = await pool.query(
        `SELECT COUNT(*)::int as total ${baseQuery}`,
        params.slice(0, paramIndex - 1)
      )
      const total = countResult.rows[0].total
      const result = await pool.query(query, params)

      return NextResponse.json({
        data: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      })
    }

    const result = await pool.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Erro ao buscar animais:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const body = await request.json()
    const { tutorId, tutor: tutorData, registroSinpatinhas, campanhaId, ...animalData } = body

    // Validação de idade: 6 meses a 10 anos
    const anos = animalData.idadeAnos ? parseInt(animalData.idadeAnos) : 0
    const meses = animalData.idadeMeses ? parseInt(animalData.idadeMeses) : 0
    const idadeTotalMeses = (anos * 12) + meses
    if (idadeTotalMeses < 6 || idadeTotalMeses > 120) {
      return NextResponse.json({ error: 'Idade do pet deve ser entre 6 meses e 10 anos' }, { status: 400 })
    }

    // Verificar se RG já existe (se fornecido)
    if (registroSinpatinhas) {
      const existingAnimal = await buscarAnimalPorRG(registroSinpatinhas)
      if (existingAnimal) {
        return NextResponse.json({ error: 'Este RG Animal já está cadastrado no sistema' }, { status: 409 })
      }
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
        "registroSinpatinhas", status, "dataAgendamento", observacoes, "tutorId", "campanhaId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
        tutorIdFinal,
        campanhaId || null
      ]
    )

    // Notificar tutor via WhatsApp/email (async, não bloqueia resposta)
    const tutor = await buscarTutorNotificacao(tutorIdFinal)
    if (tutor) {
      notificarCadastroAdmin(tutor.telefone, tutor.email, tutor.nome, animalData.nome)
        .catch(err => console.error('Erro ao notificar tutor (admin cadastro):', err))
    }

    return NextResponse.json(animal.rows[0], { status: 201 })
  } catch (error) {
    console.error('Erro ao criar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
