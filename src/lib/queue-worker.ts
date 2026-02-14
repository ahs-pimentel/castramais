// Worker singleton que processa a fila de mensagens com delay entre envios
// Inclui health check de instâncias WhatsApp e reset de contadores diários

import { processarProximaMensagem, limparFilaAntiga } from './message-queue'
import { verificarSaudeInstancias, resetarContadoresDiarios } from './whatsapp-instances'
import { QUEUE_CONFIG } from './constants'

let workerInterval: ReturnType<typeof setInterval> | null = null
let cleanupInterval: ReturnType<typeof setInterval> | null = null
let healthCheckInterval: ReturnType<typeof setInterval> | null = null
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
        // Delay aleatório entre mensagens (simula comportamento humano)
        const delay = QUEUE_CONFIG.DELAY_MIN_MS + Math.random() * (QUEUE_CONFIG.DELAY_MAX_MS - QUEUE_CONFIG.DELAY_MIN_MS)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    } catch (error) {
      console.error('[Worker] Erro ao processar fila:', error)
    } finally {
      processando = false
    }
  }, 1000)

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

  // Health check das instâncias WhatsApp a cada 5 minutos
  healthCheckInterval = setInterval(async () => {
    try {
      await verificarSaudeInstancias()
    } catch (error) {
      console.error('[Worker] Erro no health check de instâncias:', error)
    }
  }, 5 * 60 * 1000)

  // Reset de contadores diários à meia-noite
  agendarResetDiario()

  // Health check inicial
  verificarSaudeInstancias().catch(() => {})
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
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
    healthCheckInterval = null
  }
  console.log('[Worker] Processador de fila parado')
}

// Agenda reset dos contadores para meia-noite
function agendarResetDiario(): void {
  const agora = new Date()
  const meiaNoite = new Date(agora)
  meiaNoite.setHours(24, 0, 0, 0)
  const msAteMeiaNoite = meiaNoite.getTime() - agora.getTime()

  setTimeout(async () => {
    try {
      await resetarContadoresDiarios()
      console.log('[Worker] Contadores diários de instâncias resetados')
    } catch (error) {
      console.error('[Worker] Erro ao resetar contadores:', error)
    }
    // Reagendar para próxima meia-noite (24h)
    setInterval(async () => {
      try {
        await resetarContadoresDiarios()
        console.log('[Worker] Contadores diários de instâncias resetados')
      } catch (error) {
        console.error('[Worker] Erro ao resetar contadores:', error)
      }
    }, 24 * 60 * 60 * 1000)
  }, msAteMeiaNoite)
}
