import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { requireRole } from '@/lib/permissions'
import {
  gerarMensagemAgendamento,
  notificarAgendamento,
  notificarCastracaoRealizada,
  notificarCancelamento
} from '@/lib/notifications'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const { id } = await params
    const result = await pool.query(
      `SELECT
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
      FROM animais a
      LEFT JOIN tutores t ON a."tutorId" = t.id
      LEFT JOIN campanhas c ON a."campanhaId" = c.id
      WHERE a.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao buscar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole('admin', 'assistente')
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    
    // Debug log
    console.log('PUT /api/animais/[id] - Animal ID:', id)
    console.log('PUT /api/animais/[id] - Request body:', JSON.stringify(body, null, 2))

    // Buscar animal atual com dados do tutor para notificações
    const existingResult = await pool.query(
      `SELECT a.*, t.nome as tutor_nome, t.telefone as tutor_telefone, t.email as tutor_email
       FROM animais a
       LEFT JOIN tutores t ON a."tutorId" = t.id
       WHERE a.id = $1`,
      [id]
    )
    if (existingResult.rows.length === 0) {
      return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })
    }
    const animalAnterior = existingResult.rows[0]


    const updateFields = []
    const values = []
    let paramIndex = 1

    const allowedFields = ['nome', 'especie', 'raca', 'sexo', 'peso', 'idadeAnos', 'idadeMeses', 'registroSinpatinhas', 'status', 'dataAgendamento', 'dataRealizacao', 'observacoes', 'localAgendamento', 'enderecoAgendamento', 'horarioAgendamento', 'campanhaId']

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Todos os campos precisam de aspas em PostgreSQL se tiverem maiúsculas
        const dbField = field.toLowerCase() === field ? field : `"${field}"`
        updateFields.push(`${dbField} = $${paramIndex}`)
        values.push(body[field])
        paramIndex++
      }
    }
    
    console.log('PUT /api/animais/[id] - Update fields:', updateFields)
    console.log('PUT /api/animais/[id] - Values to update:', values)

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    // Validação de idade: 6 meses a 10 anos (se alterando idade)
    if (body.idadeAnos !== undefined || body.idadeMeses !== undefined) {
      const anos = (body.idadeAnos !== undefined ? parseInt(body.idadeAnos) : animalAnterior.idadeAnos) || 0
      const meses = (body.idadeMeses !== undefined ? parseInt(body.idadeMeses) : animalAnterior.idadeMeses) || 0
      const idadeTotalMeses = (anos * 12) + meses
      if (idadeTotalMeses < 6 || idadeTotalMeses > 120) {
        return NextResponse.json({ error: 'Idade do pet deve ser entre 6 meses e 10 anos' }, { status: 400 })
      }
    }

    values.push(id)
    const result = await pool.query(
      `UPDATE animais SET ${updateFields.join(', ')}, "updatedAt" = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    const animalAtualizado = result.rows[0]

    // Notificações baseadas na mudança de status
    let whatsappData = null

    if (animalAnterior.tutor_telefone && animalAnterior.tutor_nome && body.status && body.status !== animalAnterior.status) {
      const especieNotif = animalAtualizado.especie === 'cachorro' ? 'canino' : 'felino'

      // Status: agendado → Gerar mensagem para WhatsApp Web + enviar email
      if (body.status === 'agendado' && animalAtualizado.dataAgendamento) {
        // Formatar data corretamente interpretando como timezone local, não UTC
        const datePart = String(animalAtualizado.dataAgendamento).split('T')[0]
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

      // Status: castrado/realizado → Notificar castração realizada
      if (body.status === 'castrado' || body.status === 'realizado') {
        notificarCastracaoRealizada(
          animalAnterior.tutor_telefone,
          animalAnterior.tutor_email,
          animalAnterior.tutor_nome,
          animalAtualizado.nome,
          especieNotif
        ).catch(err => console.error('Erro ao enviar notificação de castração:', err))
      }

      // Status: cancelado → Notificar cancelamento
      if (body.status === 'cancelado') {
        notificarCancelamento(
          animalAnterior.tutor_telefone,
          animalAnterior.tutor_email,
          animalAnterior.tutor_nome,
          animalAtualizado.nome,
          body.motivoCancelamento
        ).catch(err => console.error('Erro ao enviar notificação de cancelamento:', err))
      }
    }

    return NextResponse.json({ ...animalAtualizado, whatsappData })
  } catch (error) {
    console.error('Erro ao atualizar animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireRole('admin')
  if (error) return error

  try {
    const { id } = await params

    const result = await pool.query('DELETE FROM animais WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Animal removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover animal:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
