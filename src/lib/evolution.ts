// Integração com Evolution API para envio de mensagens WhatsApp

import { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE } from './constants'

interface SendMessageResponse {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message: {
    conversation?: string
  }
  messageTimestamp: string
  status: string
}

interface EvolutionWebhookMessage {
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
    messageTimestamp?: number
  }
}

/**
 * Envia mensagem de texto via WhatsApp usando Evolution API
 */
export async function enviarMensagemWhatsApp(
  telefone: string,
  mensagem: string
): Promise<SendMessageResponse | null> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    console.log('[Evolution] API não configurada')
    return null
  }

  try {
    // Formatar telefone (apenas números, com código do país)
    let numero = telefone.replace(/\D/g, '')
    if (!numero.startsWith('55')) {
      numero = '55' + numero
    }

    const res = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: numero,
          text: mensagem,
        }),
      }
    )

    if (res.ok) {
      const data = await res.json()
      console.log(`[Evolution] Mensagem enviada para ${numero}`)
      return data
    }

    const error = await res.text()
    console.error('[Evolution] Erro ao enviar mensagem:', error)
    return null
  } catch (error) {
    console.error('[Evolution] Erro ao enviar mensagem:', error)
    return null
  }
}

/**
 * Envia mídia via WhatsApp (imagem, documento, etc)
 */
export async function enviarMidiaWhatsApp(
  telefone: string,
  tipo: 'image' | 'document' | 'audio' | 'video',
  mediaUrl: string,
  caption?: string,
  fileName?: string
): Promise<SendMessageResponse | null> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    console.log('[Evolution] API não configurada')
    return null
  }

  try {
    let numero = telefone.replace(/\D/g, '')
    if (!numero.startsWith('55')) {
      numero = '55' + numero
    }

    const res = await fetch(
      `${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: numero,
          mediatype: tipo,
          media: mediaUrl,
          caption: caption || '',
          fileName: fileName || '',
        }),
      }
    )

    if (res.ok) {
      const data = await res.json()
      console.log(`[Evolution] Mídia enviada para ${numero}`)
      return data
    }

    return null
  } catch (error) {
    console.error('[Evolution] Erro ao enviar mídia:', error)
    return null
  }
}

/**
 * Verifica status da conexão do WhatsApp
 */
export async function verificarConexaoWhatsApp(): Promise<{
  conectado: boolean
  estado?: string
}> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    return { conectado: false }
  }

  try {
    const url = `${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`
    console.log('[Evolution] Verificando conexão:', { url, instance: EVOLUTION_INSTANCE })

    const res = await fetch(url, {
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    })

    console.log('[Evolution] Response status:', res.status, res.statusText)

    if (res.ok) {
      const data = await res.json()
      console.log('[Evolution] Response data:', JSON.stringify(data, null, 2))
      return {
        conectado: data.state === 'open',
        estado: data.state,
      }
    }

    const errorText = await res.text()
    console.error('[Evolution] Erro na resposta:', { status: res.status, body: errorText })
    return { conectado: false }
  } catch (error) {
    console.error('[Evolution] Erro ao verificar conexão:', error)
    return { conectado: false }
  }
}

/**
 * Configurar webhook no Evolution API
 */
export async function configurarWebhookEvolution(
  webhookUrl: string
): Promise<boolean> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    console.log('[Evolution] API não configurada')
    return false
  }

  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/webhook/set/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: webhookUrl,
            webhookByEvents: false,
            events: [
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'CONNECTION_UPDATE',
              'SEND_MESSAGE',
            ],
          },
        }),
      }
    )

    if (res.ok) {
      console.log(`[Evolution] Webhook configurado: ${webhookUrl}`)
      return true
    }

    const error = await res.text()
    console.error('[Evolution] Erro ao configurar webhook:', error)
    return false
  } catch (error) {
    console.error('[Evolution] Erro ao configurar webhook:', error)
    return false
  }
}

/**
 * Extrair texto de uma mensagem do Evolution
 */
export function extrairTextoMensagem(data: EvolutionWebhookMessage['data']): string {
  if (data.message?.conversation) {
    return data.message.conversation
  }
  if (data.message?.extendedTextMessage?.text) {
    return data.message.extendedTextMessage.text
  }
  return ''
}

/**
 * Extrair número de telefone do remoteJid
 */
export function extrairTelefone(remoteJid: string): string {
  // remoteJid format: 5531999999999@s.whatsapp.net
  return remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')
}

/**
 * Verificar se a API está configurada
 */
export function isEvolutionConfigurada(): boolean {
  return !!(EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE)
}
