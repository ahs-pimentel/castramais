import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { extrairToken, verificarToken } from '@/lib/tutor-auth'
import { notificarCadastroPet, notificarListaEspera } from '@/lib/notifications'
import { validarSinpatinhas, getMensagemErroSinpatinhas } from '@/lib/validators'
import { verificarDisponibilidadeVaga } from '@/lib/services/vagas'
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

    // Validação do formato do código SinPatinhas
    if (!validarSinpatinhas(registroSinpatinhas)) {
      const mensagemErro = getMensagemErroSinpatinhas(registroSinpatinhas)
      return NextResponse.json({ error: mensagemErro || 'Código SinPatinhas inválido' }, { status: 400 })
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

    // Buscar dados do tutor para notificação e verificação de vagas
    const tutorResult = await pool.query(
      'SELECT nome, telefone, email, cidade FROM tutores WHERE id = $1',
      [payload.tutorId]
    )
    const tutor = tutorResult.rows[0]

    // Verificar disponibilidade de vagas na cidade do tutor
    const { disponivel, vagasInfo, cidadeValida } = await verificarDisponibilidadeVaga(tutor?.cidade || '')

    // Determinar status baseado na disponibilidade de vagas
    let statusFinal = 'pendente'
    if (cidadeValida && !disponivel) {
      statusFinal = 'lista_espera'
    }

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
        statusFinal,
      ]
    )

    // Enviar notificação apropriada via WhatsApp (async, não bloqueia resposta)
    if (tutor?.telefone) {
      const especieNotif = especie === 'cachorro' ? 'canino' : 'felino'

      if (statusFinal === 'lista_espera') {
        // Notificação de lista de espera
        const posicaoFila = (vagasInfo?.listaEspera || 0) + 1
        notificarListaEspera(
          tutor.telefone,
          tutor.email || null,
          tutor.nome,
          nome.trim(),
          especieNotif,
          posicaoFila
        ).catch(err => console.error('Erro ao enviar notificação de lista de espera:', err))
      } else {
        // Notificação de cadastro normal
        notificarCadastroPet(
          tutor.telefone,
          tutor.email || null,
          tutor.nome,
          nome.trim(),
          especieNotif
        ).catch(err => console.error('Erro ao enviar notificação de cadastro:', err))
      }
    }

    // Retornar com informação adicional sobre lista de espera
    return NextResponse.json({
      ...result.rows[0],
      listaEspera: statusFinal === 'lista_espera',
      posicaoListaEspera: statusFinal === 'lista_espera' ? (vagasInfo?.listaEspera || 0) + 1 : null
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao cadastrar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
