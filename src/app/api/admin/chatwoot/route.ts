import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isChatwootConfigurado, getChatwootUrl } from '@/lib/chatwoot'

// API para verificar status do Chatwoot e obter URL

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const configurado = isChatwootConfigurado()
  const url = getChatwootUrl()

  return NextResponse.json({
    configurado,
    url: configurado ? url : null,
    mensagem: configurado
      ? 'Chatwoot está configurado e pronto para uso'
      : 'Chatwoot não está configurado. Configure as variáveis CHATWOOT_URL, CHATWOOT_API_ACCESS_TOKEN e CHATWOOT_INBOX_ID',
  })
}
