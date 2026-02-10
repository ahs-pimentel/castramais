import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isEvolutionConfigurada, verificarConexaoWhatsApp } from '@/lib/evolution'

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
    })
  }

  const { conectado, estado } = await verificarConexaoWhatsApp()

  console.log('[WhatsApp Status API] Resultado:', { conectado, estado })

  return NextResponse.json({
    status: estado || 'desconhecido',
    conectado,
  })
}
