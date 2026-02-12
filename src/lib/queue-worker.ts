// Worker singleton que processa a fila de mensagens com delay entre envios

import { processarProximaMensagem, limparFilaAntiga } from './message-queue'
import { QUEUE_CONFIG } from './constants'

let workerInterval: ReturnType<typeof setInterval> | null = null
let cleanupInterval: ReturnType<typeof setInterval> | null = null
let processando = false

export function iniciarWorker(): void {
  if (workerInterval) {
    return // já está rodando
  }

  console.log('[Worker] Iniciando processador de fila de mensagens')

  workerInterval = setInterval(async () => {
    if (processando) return // evita concorrência
    processando = true

    try {
      const enviou = await processarProximaMensagem()
      if (enviou) {
        // Se enviou algo, espera o delay antes de processar a próxima
        await new Promise(resolve => setTimeout(resolve, QUEUE_CONFIG.DELAY_MS))
      }
    } catch (error) {
      console.error('[Worker] Erro ao processar fila:', error)
    } finally {
      processando = false
    }
  }, 1000) // verifica a cada 1s, mas o delay real é controlado pelo DELAY_MS

  // Limpeza de mensagens antigas a cada 6h
  cleanupInterval = setInterval(async () => {
    try {
      const removidas = await limparFilaAntiga()
      if (removidas > 0) {
        console.log(`[Worker] ${removidas} mensagens antigas removidas`)
      }
    } catch (error) {
      console.error('[Worker] Erro na limpeza:', error)
    }
  }, 6 * 60 * 60 * 1000)
}

export function pararWorker(): void {
  if (workerInterval) {
    clearInterval(workerInterval)
    workerInterval = null
  }
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
  console.log('[Worker] Processador de fila parado')
}
