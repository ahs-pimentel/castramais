import { NextRequest, NextResponse } from 'next/server'
import { extrairTextoMensagem, extrairTelefone } from '@/lib/evolution'

// Webhook que recebe mensagens do Evolution API (WhatsApp) e encaminha para Chatwoot

const CHATWOOT_URL = process.env.CHATWOOT_URL || ''
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

    // Enviar para Chatwoot via API de inbox
    if (CHATWOOT_URL && CHATWOOT_INBOX_ID && CHATWOOT_API_ACCESS_TOKEN) {
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

    // Usar a API de inbox do Chatwoot para criar/atualizar conversa
    // POST /api/v1/accounts/{account_id}/inboxes/{inbox_id}/incoming_webhooks
    const webhookUrl = `${CHATWOOT_URL}/public/api/v1/inboxes/${CHATWOOT_INBOX_ID}/contacts`

    // Primeiro, criar ou buscar o contato
    const contactRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: numero,
        identifier_hash: '', // Opcional para inbox API
        name: nome,
        phone_number: `+${numero}`,
      }),
    })

    let contactData
    if (contactRes.ok) {
      contactData = await contactRes.json()
    } else {
      // Tentar buscar contato existente
      const searchRes = await fetch(
        `${CHATWOOT_URL}/public/api/v1/inboxes/${CHATWOOT_INBOX_ID}/contacts/${numero}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      if (searchRes.ok) {
        contactData = await searchRes.json()
      } else {
        console.error('[Chatwoot] Erro ao criar/buscar contato:', await contactRes.text())
        return
      }
    }

    const sourceId = contactData.source_id || contactData.id

    // Criar conversa ou buscar existente
    const conversationRes = await fetch(
      `${CHATWOOT_URL}/public/api/v1/inboxes/${CHATWOOT_INBOX_ID}/contacts/${sourceId}/conversations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    )

    let conversationData
    if (conversationRes.ok) {
      conversationData = await conversationRes.json()
    } else {
      // Buscar conversa existente
      const convListRes = await fetch(
        `${CHATWOOT_URL}/public/api/v1/inboxes/${CHATWOOT_INBOX_ID}/contacts/${sourceId}/conversations`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      if (convListRes.ok) {
        const convList = await convListRes.json()
        if (convList.length > 0) {
          conversationData = convList[0]
        }
      }
    }

    if (!conversationData) {
      console.error('[Chatwoot] Não foi possível criar/buscar conversa')
      return
    }

    // Enviar mensagem na conversa
    const messageRes = await fetch(
      `${CHATWOOT_URL}/public/api/v1/inboxes/${CHATWOOT_INBOX_ID}/contacts/${sourceId}/conversations/${conversationData.id}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: texto,
          echo_id: messageId, // ID único para evitar duplicação
        }),
      }
    )

    if (messageRes.ok) {
      console.log(`[Chatwoot] Mensagem encaminhada: ${texto.substring(0, 30)}...`)
    } else {
      console.error('[Chatwoot] Erro ao enviar mensagem:', await messageRes.text())
    }
  } catch (error) {
    console.error('[Chatwoot] Erro ao enviar mensagem:', error)
  }
}
