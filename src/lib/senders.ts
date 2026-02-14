// Funções de envio direto - WhatsApp (Evolution API) e Email (SMTP)
// Usado pelo processador da fila (message-queue.ts) e pelo OTP (notifications.ts)

import { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE } from './constants'

const SMTP_HOST = process.env.SMTP_HOST || ''
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@castramais.com.br'

export interface SendResult {
  success: boolean
  error?: string
}

export async function enviarWhatsApp(
  telefone: string,
  mensagem: string,
  instancia?: string
): Promise<SendResult> {
  const inst = instancia || EVOLUTION_INSTANCE
  try {
    let numero = telefone.replace(/\D/g, '')
    if (!numero.startsWith('55')) {
      numero = '55' + numero
    }

    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${inst}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: numero,
          text: mensagem,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error(`[WhatsApp] Erro ao enviar via ${inst}:`, error)
      return { success: false, error: 'Falha ao enviar WhatsApp' }
    }

    console.log(`[WhatsApp] Mensagem enviada para ${numero} via ${inst}`)
    return { success: true }
  } catch (error) {
    console.error(`[WhatsApp] Erro via ${inst}:`, error)
    return { success: false, error: 'Erro de conexão com WhatsApp' }
  }
}

export async function enviarEmail(
  email: string,
  assunto: string,
  mensagem: string
): Promise<SendResult> {
  try {
    const nodemailer = await import('nodemailer')

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: assunto,
      text: mensagem,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #F97316; margin: 0;">Castra<span style="color: #333;">+</span></h1>
          </div>
          <div style="background: #f9f9f9; border-radius: 10px; padding: 20px;">
            ${mensagem.replace(/[&<>"']/g, (c: string) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c] || c)).replace(/\n/g, '<br>')}
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            Este é um email automático do sistema Castra+
          </div>
        </div>
      `,
    })

    console.log(`[Email] Mensagem enviada para ${email}`)
    return { success: true }
  } catch (error) {
    console.error('[Email] Erro:', error)
    return { success: false, error: 'Erro ao enviar email' }
  }
}
