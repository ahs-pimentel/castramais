import { NextRequest, NextResponse } from 'next/server'
import { enviarMensagemWhatsApp } from '@/lib/evolution'

// Webhook que recebe mensagens do Chatwoot e envia para WhatsApp via Evolution API

interface ChatwootWebhookPayload {
  event: string
  id?: number
  account?: {
    id: number
    name: string
  }
  inbox?: {
    id: number
    name: string
  }
  conversation?: {
    id: number
    status: string
    contact_inbox?: {
      source_id: string
    }
    meta?: {
      sender?: {
        phone_number: string
        name: string
      }
    }
  }
  message?: {
    id: number
    content: string
    message_type: 'incoming' | 'outgoing'
    private: boolean
    sender?: {
      id: number
      name: string
      type: string
    }
  }
  sender?: {
    id: number
    name: string
    phone_number?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: ChatwootWebhookPayload = await request.json()

    console.log('[Webhook Chatwoot] Recebido:', payload.event)

    // Só processar mensagens de saída (enviadas pelo operador)
    if (payload.event !== 'message_created') {
      return NextResponse.json({ status: 'ignored', reason: 'not a message event' })
    }

    // Log para debug
    console.log('[Webhook Chatwoot] Message type:', payload.message?.message_type)
    console.log('[Webhook Chatwoot] Sender type:', payload.message?.sender?.type)
    console.log('[Webhook Chatwoot] Private:', payload.message?.private)

    // Ignorar mensagens privadas (notas internas)
    if (payload.message?.private) {
      return NextResponse.json({ status: 'ignored', reason: 'private message' })
    }

    // Ignorar mensagens recebidas (incoming) - só enviar outgoing
    if (payload.message?.message_type !== 'outgoing') {
      return NextResponse.json({ status: 'ignored', reason: 'not outgoing message' })
    }

    // Verificar se é de um agente (user ou User)
    const senderType = payload.message?.sender?.type?.toLowerCase()
    if (senderType !== 'user') {
      console.log('[Webhook Chatwoot] Ignorado - sender type:', senderType)
      return NextResponse.json({ status: 'ignored', reason: 'not from agent' })
    }

    // Obter o telefone do contato
    let telefone = ''

    // Log para debug - ver estrutura do payload
    console.log('[Webhook Chatwoot] contact_inbox:', JSON.stringify(payload.conversation?.contact_inbox))
    console.log('[Webhook Chatwoot] meta.sender:', JSON.stringify(payload.conversation?.meta?.sender))
    console.log('[Webhook Chatwoot] sender:', JSON.stringify(payload.sender))

    // Tentar obter do source_id (nosso identificador)
    if (payload.conversation?.contact_inbox?.source_id) {
      telefone = payload.conversation.contact_inbox.source_id
    }
    // Ou do meta.sender.phone_number
    else if (payload.conversation?.meta?.sender?.phone_number) {
      telefone = payload.conversation.meta.sender.phone_number.replace(/\D/g, '')
    }
    // Ou do sender principal
    else if (payload.sender?.phone_number) {
      telefone = payload.sender.phone_number.replace(/\D/g, '')
    }

    console.log('[Webhook Chatwoot] Telefone encontrado:', telefone)

    if (!telefone) {
      console.error('[Webhook Chatwoot] Telefone não encontrado no payload')
      return NextResponse.json({ status: 'error', reason: 'phone not found' }, { status: 400 })
    }

    const mensagem = payload.message?.content
    if (!mensagem) {
      return NextResponse.json({ status: 'ignored', reason: 'no content' })
    }

    console.log(`[Webhook Chatwoot] Enviando para ${telefone}: ${mensagem.substring(0, 50)}...`)

    // Enviar via Evolution API
    const resultado = await enviarMensagemWhatsApp(telefone, mensagem)

    if (resultado) {
      console.log(`[Webhook Chatwoot] Mensagem enviada com sucesso`)
      return NextResponse.json({ status: 'ok', messageId: resultado.key.id })
    } else {
      console.error(`[Webhook Chatwoot] Falha ao enviar mensagem`)
      return NextResponse.json({ status: 'error', reason: 'failed to send' }, { status: 500 })
    }
  } catch (error) {
    console.error('[Webhook Chatwoot] Erro:', error)
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 })
  }
}

// GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook Chatwoot está funcionando',
    timestamp: new Date().toISOString(),
  })
}
