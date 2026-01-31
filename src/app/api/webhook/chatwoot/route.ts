import { NextRequest, NextResponse } from 'next/server'
import { enviarMensagemWhatsApp } from '@/lib/evolution'

// Webhook que recebe mensagens do Chatwoot e envia para WhatsApp via Evolution API
// Payload do Chatwoot tem campos no nível raiz (não dentro de "message")

// Cache para evitar duplicatas (Chatwoot envia 2x o mesmo evento às vezes)
const processedMessages = new Set<number>()
const MAX_CACHE_SIZE = 100

function addToCache(messageId: number) {
  if (processedMessages.size >= MAX_CACHE_SIZE) {
    // Remove o primeiro elemento (mais antigo)
    const first = processedMessages.values().next().value
    processedMessages.delete(first)
  }
  processedMessages.add(messageId)
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log('[Webhook Chatwoot] Recebido:', payload.event)

    // Só processar mensagens criadas
    if (payload.event !== 'message_created') {
      return NextResponse.json({ status: 'ignored', reason: 'not a message event' })
    }

    // Verificar se já processamos esta mensagem
    const messageId = payload.id
    if (messageId && processedMessages.has(messageId)) {
      console.log('[Webhook Chatwoot] Mensagem duplicada ignorada:', messageId)
      return NextResponse.json({ status: 'ignored', reason: 'duplicate message' })
    }

    // Campos estão no nível raiz do payload
    const messageType = payload.message_type
    const isPrivate = payload.private
    const senderType = payload.sender?.type?.toLowerCase()
    const content = payload.content

    console.log('[Webhook Chatwoot] message_type:', messageType, 'private:', isPrivate, 'sender.type:', senderType)

    // Ignorar mensagens privadas (notas internas)
    if (isPrivate) {
      return NextResponse.json({ status: 'ignored', reason: 'private message' })
    }

    // Ignorar mensagens recebidas (incoming) - só enviar outgoing
    if (messageType !== 'outgoing') {
      return NextResponse.json({ status: 'ignored', reason: 'not outgoing message' })
    }

    // Verificar se é de um agente (user)
    if (senderType !== 'user') {
      console.log('[Webhook Chatwoot] Ignorado - sender type:', senderType)
      return NextResponse.json({ status: 'ignored', reason: 'not from agent' })
    }

    // Obter o telefone do contato
    let telefone = ''

    // Tentar obter do contact_inbox.source_id (dentro de conversation)
    if (payload.conversation?.contact_inbox?.source_id) {
      telefone = payload.conversation.contact_inbox.source_id
    }
    // Ou do meta.sender.phone_number
    else if (payload.conversation?.meta?.sender?.phone_number) {
      telefone = payload.conversation.meta.sender.phone_number.replace(/\D/g, '')
    }
    // Ou do meta.sender.identifier
    else if (payload.conversation?.meta?.sender?.identifier) {
      telefone = payload.conversation.meta.sender.identifier
    }

    console.log('[Webhook Chatwoot] Telefone encontrado:', telefone)

    if (!telefone) {
      console.error('[Webhook Chatwoot] Telefone não encontrado no payload')
      return NextResponse.json({ status: 'error', reason: 'phone not found' }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ status: 'ignored', reason: 'no content' })
    }

    console.log(`[Webhook Chatwoot] Enviando para ${telefone}: ${content.substring(0, 50)}...`)

    // Marcar como processada antes de enviar (evita duplicatas)
    if (messageId) {
      addToCache(messageId)
    }

    // Enviar via Evolution API
    const resultado = await enviarMensagemWhatsApp(telefone, content)

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
