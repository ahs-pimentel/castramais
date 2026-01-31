// Integração com Chatwoot para atendimento via WhatsApp
// O Chatwoot se conecta ao Evolution API para enviar/receber mensagens do WhatsApp

const CHATWOOT_URL = process.env.CHATWOOT_URL || 'http://localhost:3001'
const CHATWOOT_API_ACCESS_TOKEN = process.env.CHATWOOT_API_ACCESS_TOKEN || ''
const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1'
const CHATWOOT_INBOX_ID = process.env.CHATWOOT_INBOX_ID || ''

interface ChatwootContact {
  id: number
  name: string
  phone_number: string
  email?: string
  custom_attributes?: Record<string, string>
}

interface ChatwootConversation {
  id: number
  account_id: number
  inbox_id: number
  contact_id: number
  status: 'open' | 'resolved' | 'pending'
}

interface ChatwootMessage {
  id: number
  content: string
  message_type: 'incoming' | 'outgoing'
  conversation_id: number
}

/**
 * Criar ou buscar contato no Chatwoot
 */
export async function criarOuBuscarContato(
  nome: string,
  telefone: string,
  email?: string,
  tutorId?: string
): Promise<ChatwootContact | null> {
  if (!CHATWOOT_API_ACCESS_TOKEN || !CHATWOOT_INBOX_ID) {
    console.log('[Chatwoot] API não configurada')
    return null
  }

  try {
    // Formatar telefone
    let numero = telefone.replace(/\D/g, '')
    if (!numero.startsWith('55')) {
      numero = '55' + numero
    }

    // Buscar contato existente
    const searchRes = await fetch(
      `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/contacts/search?q=${numero}`,
      {
        headers: {
          'api_access_token': CHATWOOT_API_ACCESS_TOKEN,
        },
      }
    )

    if (searchRes.ok) {
      const searchData = await searchRes.json()
      if (searchData.payload && searchData.payload.length > 0) {
        return searchData.payload[0]
      }
    }

    // Criar novo contato
    const createRes = await fetch(
      `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/contacts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': CHATWOOT_API_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          inbox_id: CHATWOOT_INBOX_ID,
          name: nome,
          phone_number: `+${numero}`,
          email: email || undefined,
          custom_attributes: tutorId ? { tutor_id: tutorId } : undefined,
        }),
      }
    )

    if (createRes.ok) {
      const data = await createRes.json()
      console.log(`[Chatwoot] Contato criado: ${nome}`)
      return data.payload?.contact || data
    }

    return null
  } catch (error) {
    console.error('[Chatwoot] Erro ao criar/buscar contato:', error)
    return null
  }
}

/**
 * Criar conversa com um contato
 */
export async function criarConversa(
  contactId: number
): Promise<ChatwootConversation | null> {
  if (!CHATWOOT_API_ACCESS_TOKEN || !CHATWOOT_INBOX_ID) {
    return null
  }

  try {
    const res = await fetch(
      `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': CHATWOOT_API_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          inbox_id: CHATWOOT_INBOX_ID,
          contact_id: contactId,
          status: 'open',
        }),
      }
    )

    if (res.ok) {
      const data = await res.json()
      return data
    }

    return null
  } catch (error) {
    console.error('[Chatwoot] Erro ao criar conversa:', error)
    return null
  }
}

/**
 * Enviar mensagem via Chatwoot
 * A mensagem será encaminhada para o WhatsApp via Evolution API
 */
export async function enviarMensagemChatwoot(
  conversationId: number,
  mensagem: string,
  tipo: 'outgoing' | 'incoming' = 'outgoing'
): Promise<ChatwootMessage | null> {
  if (!CHATWOOT_API_ACCESS_TOKEN) {
    return null
  }

  try {
    const res = await fetch(
      `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': CHATWOOT_API_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          content: mensagem,
          message_type: tipo,
          private: false,
        }),
      }
    )

    if (res.ok) {
      const data = await res.json()
      return data
    }

    return null
  } catch (error) {
    console.error('[Chatwoot] Erro ao enviar mensagem:', error)
    return null
  }
}

/**
 * Adicionar nota interna à conversa (visível apenas para atendentes)
 */
export async function adicionarNotaInterna(
  conversationId: number,
  nota: string
): Promise<ChatwootMessage | null> {
  if (!CHATWOOT_API_ACCESS_TOKEN) {
    return null
  }

  try {
    const res = await fetch(
      `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': CHATWOOT_API_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          content: nota,
          message_type: 'outgoing',
          private: true, // Nota interna
        }),
      }
    )

    if (res.ok) {
      const data = await res.json()
      return data
    }

    return null
  } catch (error) {
    console.error('[Chatwoot] Erro ao adicionar nota:', error)
    return null
  }
}

/**
 * Atualizar atributos customizados do contato (ex: vincular ao tutor)
 */
export async function atualizarContatoChatwoot(
  contactId: number,
  dados: {
    nome?: string
    email?: string
    tutorId?: string
    animalNome?: string
    status?: string
  }
): Promise<boolean> {
  if (!CHATWOOT_API_ACCESS_TOKEN) {
    return false
  }

  try {
    const customAttributes: Record<string, string> = {}
    if (dados.tutorId) customAttributes.tutor_id = dados.tutorId
    if (dados.animalNome) customAttributes.animal_nome = dados.animalNome
    if (dados.status) customAttributes.status = dados.status

    const res = await fetch(
      `${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/contacts/${contactId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': CHATWOOT_API_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          name: dados.nome,
          email: dados.email,
          custom_attributes: customAttributes,
        }),
      }
    )

    return res.ok
  } catch (error) {
    console.error('[Chatwoot] Erro ao atualizar contato:', error)
    return false
  }
}

/**
 * Verificar se Chatwoot está configurado
 */
export function isChatwootConfigurado(): boolean {
  return !!(CHATWOOT_URL && CHATWOOT_API_ACCESS_TOKEN && CHATWOOT_INBOX_ID)
}

/**
 * Obter URL do Chatwoot para o painel admin
 */
export function getChatwootUrl(): string {
  return CHATWOOT_URL
}
