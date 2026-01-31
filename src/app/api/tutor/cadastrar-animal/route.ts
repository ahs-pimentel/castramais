import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { extrairToken, verificarToken } from '@/lib/tutor-auth'
import { notificarCadastroPet } from '@/lib/notifications'
import { v4 as uuidv4 } from 'uuid'

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

    // Verificar se RG já existe
    const existeResult = await pool.query(
      'SELECT id FROM animais WHERE "registroSinpatinhas" = $1',
      [registroSinpatinhas]
    )
    if (existeResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este RG Animal já está cadastrado no sistema' },
        { status: 409 }
      )
    }

    // Buscar dados do tutor para notificação
    const tutorResult = await pool.query(
      'SELECT nome, telefone, email FROM tutores WHERE id = $1',
      [payload.tutorId]
    )
    const tutor = tutorResult.rows[0]

    // Criar animal vinculado ao tutor logado
    const animalId = uuidv4()
    const result = await pool.query(
      `INSERT INTO animais (
        id, nome, especie, raca, sexo, peso, "idadeAnos", "idadeMeses",
        "registroSinpatinhas", observacoes, "tutorId", status, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`,
      [
        animalId,
        nome.trim(),
        especie,
        raca.trim(),
        sexo,
        peso ? parseFloat(peso) : null,
        idadeAnos ? parseInt(idadeAnos) : null,
        idadeMeses ? parseInt(idadeMeses) : null,
        registroSinpatinhas.trim(),
        observacoes?.trim() || null,
        payload.tutorId,
        'pendente',
      ]
    )

    // Enviar notificação de cadastro via WhatsApp (async, não bloqueia resposta)
    if (tutor?.telefone) {
      const especieNotif = especie === 'cachorro' ? 'canino' : 'felino'
      notificarCadastroPet(
        tutor.telefone,
        tutor.email || null,
        tutor.nome,
        nome.trim(),
        especieNotif
      ).catch(err => console.error('Erro ao enviar notificação de cadastro:', err))
    }

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Erro ao cadastrar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
