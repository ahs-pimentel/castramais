// Next.js instrumentation - roda uma vez no startup do servidor
// Usado para iniciar o worker da fila de mensagens

export async function register() {
  // Só rodar no servidor Node.js (não no edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { iniciarWorker } = await import('./lib/queue-worker')
    iniciarWorker()
  }
}
