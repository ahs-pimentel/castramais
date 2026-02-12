// Endpoint para trigger manual ou via cron externo da fila de mensagens
// Protegido por CRON_SECRET

import { NextRequest, NextResponse } from 'next/server'
import { processarProximaMensagem, limparFilaAntiga } from '@/lib/message-queue'
import { QUEUE_CONFIG } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || request.nextUrl.searchParams.get('secret')

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    let processadas = 0
    const maxPorChamada = 10

    for (let i = 0; i < maxPorChamada; i++) {
      const enviou = await processarProximaMensagem()
      if (!enviou) break
      processadas++
      // Delay aleatório entre mensagens (anti-bloqueio)
      const delay = QUEUE_CONFIG.DELAY_MIN_MS + Math.random() * (QUEUE_CONFIG.DELAY_MAX_MS - QUEUE_CONFIG.DELAY_MIN_MS)
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    // Limpeza de mensagens antigas (aproveita a chamada)
    const removidas = await limparFilaAntiga()

    return NextResponse.json({
      processadas,
      removidas,
    })
  } catch (error) {
    console.error('[Cron] Erro ao processar fila:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
