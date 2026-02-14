// Integração com Evolution API para envio de mensagens WhatsApp
// Suporta multi-instância: todas as funções aceitam nome da instância como parâmetro

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

// Resolve nome da instância: parâmetro explícito > env fallback
function resolverInstancia(instancia?: string): string {
  return instancia || EVOLUTION_INSTANCE
}

/**
 * Envia mensagem de texto via WhatsApp usando Evolution API
 */
export async function enviarMensagemWhatsApp(
  telefone: string,
  mensagem: string,
  instancia?: string
): Promise<SendMessageResponse | null> {
  const inst = resolverInstancia(instancia)
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !inst) {
    console.log('[Evolution] API não configurada')
    return null
  }

  try {
    let numero = telefone.replace(/\D/g, '')
    if (!numero.startsWith('55')) {
      numero = '55' + numero
    }

    const res = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${inst}`,
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
      console.log(`[Evolution] Mensagem enviada para ${numero} via ${inst}`)
      return data
    }

    const error = await res.text()
    console.error(`[Evolution] Erro ao enviar mensagem via ${inst}:`, error)
    return null
  } catch (error) {
    console.error(`[Evolution] Erro ao enviar mensagem via ${inst}:`, error)
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
  fileName?: string,
  instancia?: string
): Promise<SendMessageResponse | null> {
  const inst = resolverInstancia(instancia)
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !inst) {
    console.log('[Evolution] API não configurada')
    return null
  }

  try {
    let numero = telefone.replace(/\D/g, '')
    if (!numero.startsWith('55')) {
      numero = '55' + numero
    }

    const res = await fetch(
      `${EVOLUTION_API_URL}/message/sendMedia/${inst}`,
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
      console.log(`[Evolution] Mídia enviada para ${numero} via ${inst}`)
      return data
    }

    return null
  } catch (error) {
    console.error(`[Evolution] Erro ao enviar mídia via ${inst}:`, error)
    return null
  }
}

/**
 * Verifica status da conexão de uma instância WhatsApp
 */
export async function verificarConexaoWhatsApp(instancia?: string): Promise<{
  conectado: boolean
  estado?: string
}> {
  const inst = resolverInstancia(instancia)
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !inst) {
    return { conectado: false }
  }

  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${inst}`,
      { headers: { 'apikey': EVOLUTION_API_KEY } }
    )

    if (res.ok) {
      const data = await res.json()
      const state = data.instance?.state || data.state
      return {
        conectado: state === 'open',
        estado: state,
      }
    }

    return { conectado: false }
  } catch (error) {
    console.error(`[Evolution] Erro ao verificar conexão ${inst}:`, error)
    return { conectado: false }
  }
}

/**
 * Configurar webhook no Evolution API
 */
export async function configurarWebhookEvolution(
  webhookUrl: string,
  instancia?: string
): Promise<boolean> {
  const inst = resolverInstancia(instancia)
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !inst) {
    console.log('[Evolution] API não configurada')
    return false
  }

  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/webhook/set/${inst}`,
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
      console.log(`[Evolution] Webhook configurado para ${inst}: ${webhookUrl}`)
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
  return remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')
}

/**
 * Verificar se a API está configurada (pelo menos URL + key)
 */
export function isEvolutionConfigurada(): boolean {
  return !!(EVOLUTION_API_URL && EVOLUTION_API_KEY)
}
