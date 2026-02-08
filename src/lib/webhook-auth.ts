import crypto from 'crypto'

export function verificarWebhookEvolution(request: Request): boolean {
  const secret = process.env.EVOLUTION_WEBHOOK_SECRET
  if (!secret) return true // Skip if not configured

  const headerKey = request.headers.get('apikey') || request.headers.get('x-api-key') || ''
  if (!headerKey) return false

  try {
    return crypto.timingSafeEqual(
      Buffer.from(headerKey),
      Buffer.from(secret)
    )
  } catch {
    return false
  }
}

export function verificarWebhookChatwoot(request: Request): boolean {
  const secret = process.env.CHATWOOT_WEBHOOK_SECRET
  if (!secret) return true // Skip if not configured

  const headerToken = request.headers.get('x-chatwoot-signature') || request.headers.get('authorization') || ''
  if (!headerToken) return false

  try {
    return crypto.timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(secret)
    )
  } catch {
    return false
  }
}
