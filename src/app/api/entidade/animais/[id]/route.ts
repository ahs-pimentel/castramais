import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import jwt from 'jsonwebtoken'
import { getEntidadeJwtSecret } from '@/lib/jwt-secrets'
import { gerarMensagemAgendamento, notificarAgendamento } from '@/lib/notifications'

type RouteParams = { params: Promise<{ id: string }> }

function verifyEntidadeToken(request: NextRequest): { id: string } | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  try {
    return jwt.verify(authHeader.substring(7), getEntidadeJwtSecret()) as { id: string }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const entidadePayload = verifyEntidadeToken(request)
  if (!entidadePayload) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    const result = await pool.query(
      `SELECT
        a.*,
        json_build_object(
          'id', t.id, 'nome', t.nome, 'cpf', t.cpf,
          'telefone', t.telefone, 'email', t.email,
          'endereco', t.endereco, 'cidade', t.cidade, 'bairro', t.bairro
        ) as tutor,
        CASE WHEN c.id IS NOT NULL THEN json_build_object(
          'id', c.id, 'nome', c.nome, 'cidade', c.cidade
        ) ELSE NULL END as campanha,
        json_build_object(
          'nome', e.nome, 'endereco', e.endereco,
          'cidade', e.cidade, 'bairro', e.bairro
        ) as entidade
      FROM animais a
      LEFT JOIN tutores t ON a."tutorId" = t.id
      LEFT JOIN campanhas c ON a."campanhaId" = c.id
      INNER JOIN campanhas_entidades ce ON a."campanhaId" = ce."campanhaId"
      INNER JOIN entidades e ON ce."entidadeId" = e.id
      WHERE a.id = $1 AND ce."entidadeId" = $2`,
      [id, entidadePayload.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Animal não encontrado ou sem permissão' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao buscar animal pela entidade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const entidadePayload = verifyEntidadeToken(request)
  if (!entidadePayload) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Buscar animal atual com dados do tutor (para validação e notificação)
    const existingResult = await pool.query(
      `SELECT a.*, t.nome as tutor_nome, t.telefone as tutor_telefone, t.email as tutor_email
       FROM animais a
       LEFT JOIN tutores t ON a."tutorId" = t.id
       INNER JOIN campanhas_entidades ce ON a."campanhaId" = ce."campanhaId"
       WHERE a.id = $1 AND ce."entidadeId" = $2`,
      [id, entidadePayload.id]
    )
    if (existingResult.rows.length === 0) {
      return NextResponse.json({ error: 'Animal não encontrado ou sem permissão' }, { status: 403 })
    }
    const animalAnterior = existingResult.rows[0]

    // Validar transição de status: entidade só pode pendente → agendado
    if (body.status && body.status !== animalAnterior.status) {
      if (!(animalAnterior.status === 'pendente' && body.status === 'agendado')) {
        return NextResponse.json(
          { error: 'Transição de status não permitida. Apenas animais pendentes podem ser agendados.' },
          { status: 403 }
        )
      }
      // Campos obrigatórios para agendamento
      if (!body.dataAgendamento || !body.horarioAgendamento) {
        return NextResponse.json(
          { error: 'Data e horário são obrigatórios para agendar a castração.' },
          { status: 400 }
        )
      }
    }

    const allowedFields: Record<string, string> = {
      nome: 'nome',
      especie: 'especie',
      raca: 'raca',
      peso: 'peso',
      observacoes: 'observacoes',
      status: 'status',
      dataAgendamento: '"dataAgendamento"',
      horarioAgendamento: '"horarioAgendamento"',
      localAgendamento: '"localAgendamento"',
      enderecoAgendamento: '"enderecoAgendamento"',
    }

    const updateFields = []
    const values: (string | number | null)[] = []
    let paramIndex = 1

    for (const [key, dbField] of Object.entries(allowedFields)) {
      if (body[key] !== undefined) {
        updateFields.push(`${dbField} = $${paramIndex}`)
        values.push(body[key])
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    values.push(id)
    const result = await pool.query(
      `UPDATE animais SET ${updateFields.join(', ')}, "updatedAt" = NOW()
       WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    const animalAtualizado = result.rows[0]

    // Notificar tutor se status mudou para agendado
    let whatsappData = null

    if (body.status === 'agendado' && animalAnterior.status !== 'agendado' && animalAnterior.tutor_telefone) {
      const especieNotif = animalAtualizado.especie === 'cachorro' ? 'canino' : 'felino'
      // Formatar data corretamente interpretando como timezone local, não UTC
      const datePart = animalAtualizado.dataAgendamento.split('T')[0]
      const [year, month, day] = datePart.split('-')
      const dataDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      const dataFormatada = dataDate.toLocaleDateString('pt-BR')
      const mensagem = gerarMensagemAgendamento(
        animalAnterior.tutor_nome,
        animalAtualizado.nome,
        especieNotif,
        dataFormatada,
        animalAtualizado.horarioAgendamento || 'A confirmar',
        animalAtualizado.localAgendamento || 'A confirmar',
        animalAtualizado.enderecoAgendamento || 'A confirmar'
      )
      whatsappData = {
        telefone: animalAnterior.tutor_telefone,
        mensagem,
      }
      // Envia apenas email automaticamente
      notificarAgendamento(
        animalAnterior.tutor_telefone,
        animalAnterior.tutor_email,
        animalAnterior.tutor_nome,
        animalAtualizado.nome,
        especieNotif,
        dataFormatada,
        animalAtualizado.horarioAgendamento || 'A confirmar',
        animalAtualizado.localAgendamento || 'A confirmar',
        animalAtualizado.enderecoAgendamento || 'A confirmar'
      ).catch(err => console.error('Erro ao enviar notificação de agendamento:', err))
    }

    return NextResponse.json({ ...animalAtualizado, whatsappData })
  } catch (error) {
    console.error('Erro ao editar animal pela entidade:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
