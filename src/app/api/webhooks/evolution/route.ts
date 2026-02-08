import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { verificarWebhookEvolution } from '@/lib/webhook-auth'

// Webhook para receber eventos do Evolution API
// Isso permite integração bidirecional com WhatsApp via Chatwoot

interface EvolutionWebhookPayload {
  event: string
  instance: string
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    pushName?: string
    message?: {
      conversation?: string
      extendedTextMessage?: {
        text: string
      }
    }
    messageType?: string
    messageTimestamp?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verificarWebhookEvolution(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload: EvolutionWebhookPayload = await request.json()

    console.log('[Evolution Webhook] Evento recebido:', payload.event)

    // Processar apenas mensagens recebidas
    if (payload.event === 'messages.upsert' && !payload.data.key.fromMe) {
      const telefone = payload.data.key.remoteJid.replace('@s.whatsapp.net', '')
      const nome = payload.data.pushName || 'Desconhecido'
      const mensagem =
        payload.data.message?.conversation ||
        payload.data.message?.extendedTextMessage?.text ||
        ''

      console.log(`[Evolution Webhook] Mensagem de ${nome} (${telefone}): ${mensagem.substring(0, 50)}...`)

      // Tentar encontrar o tutor pelo telefone
      const tutorResult = await pool.query(
        'SELECT id, nome FROM tutores WHERE telefone LIKE $1',
        [`%${telefone.slice(-9)}%`] // Busca pelos últimos 9 dígitos
      )

      if (tutorResult.rows.length > 0) {
        const tutor = tutorResult.rows[0]
        console.log(`[Evolution Webhook] Tutor identificado: ${tutor.nome}`)

        // Aqui você pode integrar com o Chatwoot ou processar a mensagem
        // Por exemplo, atualizar atributos do contato no Chatwoot
      }
    }

    // Evento de conexão/status da instância
    if (payload.event === 'connection.update') {
      console.log('[Evolution Webhook] Status da conexão:', payload.data)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Evolution Webhook] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

// GET para verificação de saúde do endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Evolution API Webhook',
    timestamp: new Date().toISOString(),
  })
}
