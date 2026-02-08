import { NextRequest, NextResponse } from 'next/server'
import { extrairTextoMensagem, extrairTelefone } from '@/lib/evolution'
import { verificarWebhookEvolution } from '@/lib/webhook-auth'

// Webhook que recebe mensagens do Evolution API (WhatsApp) e encaminha para Chatwoot

const CHATWOOT_URL = process.env.CHATWOOT_URL || ''
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1'
const CHATWOOT_INBOX_ID = process.env.CHATWOOT_INBOX_ID || ''
const CHATWOOT_API_ACCESS_TOKEN = process.env.CHATWOOT_API_ACCESS_TOKEN || ''

interface EvolutionPayload {
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
      imageMessage?: {
        caption?: string
        url?: string
      }
    }
    messageTimestamp?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verificarWebhookEvolution(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload: EvolutionPayload = await request.json()

    console.log('[Webhook Evolution] Recebido:', payload.event)

    // Só processar mensagens recebidas (não enviadas por nós)
    if (payload.event !== 'messages.upsert' && payload.event !== 'MESSAGES_UPSERT') {
      return NextResponse.json({ status: 'ignored', reason: 'not a message event' })
    }

    // Ignorar mensagens enviadas por nós
    if (payload.data.key.fromMe) {
      return NextResponse.json({ status: 'ignored', reason: 'outgoing message' })
    }

    // Ignorar mensagens de grupo
    if (payload.data.key.remoteJid.includes('@g.us')) {
      return NextResponse.json({ status: 'ignored', reason: 'group message' })
    }

    // Extrair dados da mensagem
    const telefone = extrairTelefone(payload.data.key.remoteJid)
    const texto = extrairTextoMensagem(payload.data)
    const nome = payload.data.pushName || telefone

    if (!texto) {
      return NextResponse.json({ status: 'ignored', reason: 'no text content' })
    }

    console.log(`[Webhook Evolution] Mensagem de ${nome} (${telefone}): ${texto.substring(0, 50)}...`)

    // Enviar para Chatwoot via API privada
    if (CHATWOOT_URL && CHATWOOT_API_ACCESS_TOKEN) {
      await enviarParaChatwoot(telefone, nome, texto, payload.data.key.id)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[Webhook Evolution] Erro:', error)
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 })
  }
}

async function enviarParaChatwoot(
  telefone: string,
  nome: string,
  texto: string,
  messageId: string
) {
  try {
    // Formatar telefone com código do país
    let numero = telefone.replace(/\D/g, '')
    if (!numero.startsWith('55')) {
      numero = '55' + numero
    }

    const headers = {
      'Content-Type': 'application/json',
      'api_access_token': CHATWOOT_API_ACCESS_TOKEN,
    }

    // 1. Buscar ou criar contato
    let contactId: number | null = null

    // Buscar contato existente
    const searchRes = await fetch(
      `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/contacts/search?q=${numero}`,
      { headers }
    )

    if (searchRes.ok) {
      const searchData = await searchRes.json()
      if (searchData.payload && searchData.payload.length > 0) {
        contactId = searchData.payload[0].id
        console.log(`[Chatwoot] Contato encontrado: ${contactId}`)
      }
    }

    // Se não encontrou, criar novo contato
    if (!contactId) {
      const createContactRes = await fetch(
        `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/contacts`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            inbox_id: parseInt(CHATWOOT_INBOX_ID) || 1,
            name: nome,
            phone_number: `+${numero}`,
            identifier: numero,
          }),
        }
      )

      if (createContactRes.ok) {
        const contactData = await createContactRes.json()
        contactId = contactData.payload?.contact?.id || contactData.id
        console.log(`[Chatwoot] Contato criado: ${contactId}`)
      } else {
        const err = await createContactRes.text()
        console.error('[Chatwoot] Erro ao criar contato:', err)
        return
      }
    }

    if (!contactId) {
      console.error('[Chatwoot] Não foi possível obter ID do contato')
      return
    }

    // 2. Buscar ou criar conversa
    let conversationId: number | null = null

    // Buscar conversas do contato
    const convSearchRes = await fetch(
      `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/contacts/${contactId}/conversations`,
      { headers }
    )

    if (convSearchRes.ok) {
      const convData = await convSearchRes.json()
      // Procurar conversa aberta na inbox correta
      const openConv = convData.payload?.find(
        (c: { inbox_id: number; status: string }) =>
          c.status !== 'resolved'
      )
      if (openConv) {
        conversationId = openConv.id
        console.log(`[Chatwoot] Conversa encontrada: ${conversationId}`)
      }
    }

    // Se não tem conversa aberta, criar nova
    if (!conversationId) {
      const createConvRes = await fetch(
        `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            inbox_id: parseInt(CHATWOOT_INBOX_ID) || 1,
            contact_id: contactId,
            source_id: numero,
          }),
        }
      )

      if (createConvRes.ok) {
        const convData = await createConvRes.json()
        conversationId = convData.id
        console.log(`[Chatwoot] Conversa criada: ${conversationId}`)
      } else {
        const err = await createConvRes.text()
        console.error('[Chatwoot] Erro ao criar conversa:', err)
        return
      }
    }

    if (!conversationId) {
      console.error('[Chatwoot] Não foi possível obter ID da conversa')
      return
    }

    // 3. Enviar mensagem na conversa
    const messageRes = await fetch(
      `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: texto,
          message_type: 'incoming',
          private: false,
          sender: {
            name: nome,
            phone_number: `+${numero}`,
          },
        }),
      }
    )

    if (messageRes.ok) {
      console.log(`[Chatwoot] Mensagem encaminhada: ${texto.substring(0, 30)}...`)
    } else {
      const err = await messageRes.text()
      console.error('[Chatwoot] Erro ao enviar mensagem:', err)
    }
  } catch (error) {
    console.error('[Chatwoot] Erro ao enviar mensagem:', error)
  }
}

// GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook Evolution está funcionando',
    config: {
      chatwoot_url: CHATWOOT_URL ? 'configurado' : 'não configurado',
      chatwoot_account: CHATWOOT_ACCOUNT_ID,
      chatwoot_inbox: CHATWOOT_INBOX_ID ? 'configurado' : 'não configurado',
      chatwoot_token: CHATWOOT_API_ACCESS_TOKEN ? 'configurado' : 'não configurado',
    },
    timestamp: new Date().toISOString(),
  })
}
