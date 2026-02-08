import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import jwt from 'jsonwebtoken'
import { notificarCadastroAdmin } from '@/lib/notifications'
import { verificarDisponibilidadeVaga } from '@/lib/services/vagas'
import { getEntidadeJwtSecret } from '@/lib/jwt-secrets'
import { buscarAnimalPorRG, buscarTutorNotificacao } from '@/lib/repositories/animal-repository'
import { verificarLimitesAnimais } from '@/lib/repositories/tutor-repository'
import { verificarEntidadeVinculada } from '@/lib/repositories/campanha-repository'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let entidadePayload: { id: string }
    try {
      entidadePayload = jwt.verify(authHeader.substring(7), getEntidadeJwtSecret()) as { id: string }
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verify entidade is active
    const entidadeCheck = await pool.query(
      'SELECT id FROM entidades WHERE id = $1 AND ativo = true',
      [entidadePayload.id]
    )
    if (entidadeCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Entidade inativa' }, { status: 403 })
    }

    const body = await request.json()
    const {
      campanhaId,
      tutorCpf,
      tutor: tutorData,
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

    // Validations
    if (!campanhaId) {
      return NextResponse.json({ error: 'Campanha é obrigatória' }, { status: 400 })
    }
    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome do pet é obrigatório' }, { status: 400 })
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

    // Verify campanha belongs to this entidade
    const vinculada = await verificarEntidadeVinculada(campanhaId, entidadePayload.id)
    if (!vinculada) {
      return NextResponse.json({ error: 'Campanha não vinculada a esta entidade' }, { status: 403 })
    }

    // Check if RG already exists
    if (registroSinpatinhas) {
      const existeAnimal = await buscarAnimalPorRG(registroSinpatinhas)
      if (existeAnimal) {
        return NextResponse.json({ error: 'Este RG Animal já está cadastrado' }, { status: 409 })
      }
    }

    // Find or create tutor
    let tutorId: string

    if (tutorCpf) {
      const cpf = tutorCpf.replace(/\D/g, '')
      const existingTutor = await pool.query('SELECT id FROM tutores WHERE cpf = $1', [cpf])
      if (existingTutor.rows.length > 0) {
        tutorId = existingTutor.rows[0].id
      } else if (tutorData) {
        const newTutor = await pool.query(
          `INSERT INTO tutores (nome, cpf, telefone, email, endereco, cidade, bairro)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [tutorData.nome, cpf, tutorData.telefone, tutorData.email || null, tutorData.endereco, tutorData.cidade, tutorData.bairro]
        )
        tutorId = newTutor.rows[0].id
      } else {
        return NextResponse.json({ error: 'Tutor não encontrado. Preencha os dados do tutor.' }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: 'CPF do tutor é obrigatório' }, { status: 400 })
    }

    // Verificar limite de animais por tutor
    const limites = await verificarLimitesAnimais(tutorId, campanhaId)
    if (!limites.ok) {
      return NextResponse.json({ error: limites.erro }, { status: 400 })
    }

    // Check vacancy
    let statusFinal = 'pendente'
    if (campanhaId) {
      const resultado = await verificarDisponibilidadeVaga(campanhaId)
      if (resultado.vagasInfo && !resultado.disponivel) {
        statusFinal = 'lista_espera'
      }
    }

    // Create animal
    const animal = await pool.query(
      `INSERT INTO animais (
        nome, especie, raca, sexo, peso, "idadeAnos", "idadeMeses",
        "registroSinpatinhas", observacoes, "tutorId", "campanhaId", status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        nome.trim(),
        especie,
        raca.trim(),
        sexo,
        peso ? parseFloat(peso) : null,
        idadeAnos ? parseInt(idadeAnos) : null,
        idadeMeses ? parseInt(idadeMeses) : null,
        registroSinpatinhas?.trim() || null,
        observacoes?.trim() || null,
        tutorId,
        campanhaId,
        statusFinal,
      ]
    )

    // Notify tutor
    const tutor = await buscarTutorNotificacao(tutorId)
    if (tutor) {
      notificarCadastroAdmin(tutor.telefone, tutor.email, tutor.nome, nome.trim())
        .catch(err => console.error('Erro ao notificar tutor (entidade cadastro):', err))
    }

    return NextResponse.json(animal.rows[0], { status: 201 })
  } catch (error) {
    console.error('Erro ao cadastrar animal pela entidade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
