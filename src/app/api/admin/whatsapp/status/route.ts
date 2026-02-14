import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isEvolutionConfigurada } from '@/lib/evolution'
import { listarInstancias } from '@/lib/whatsapp-instances'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const configurada = isEvolutionConfigurada()

  if (!configurada) {
    return NextResponse.json({
      status: 'não configurada',
      conectado: false,
      instancias: [],
    })
  }

  // Buscar todas as instâncias do banco (status já atualizado pelo health check do worker)
  const instancias = await listarInstancias()

  // Se não há instâncias cadastradas, manter compatibilidade com formato antigo
  if (instancias.length === 0) {
    return NextResponse.json({
      status: 'sem instâncias',
      conectado: false,
      instancias: [],
    })
  }

  // Status geral: conectado se pelo menos uma instância está 'open'
  const algumConectado = instancias.some(i => i.ativo && i.status === 'open')
  const ativas = instancias.filter(i => i.ativo)

  return NextResponse.json({
    status: algumConectado ? 'open' : 'desconectado',
    conectado: algumConectado,
    instancias: ativas.map(i => ({
      id: i.id,
      nome: i.nome,
      descricao: i.descricao,
      status: i.status,
      conectado: i.status === 'open',
      mensagensHoje: i.mensagens_hoje,
      mensagensTotal: i.mensagens_enviadas,
      ultimoEnvio: i.ultimo_envio,
      ultimoCheck: i.ultimo_check,
    })),
  })
}
