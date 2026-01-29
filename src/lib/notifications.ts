// Serviço de notificações - WhatsApp (Evolution API) e Email

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evo.odois.com.br'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'castramais'

const SMTP_HOST = process.env.SMTP_HOST || ''
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@castramais.com.br'

interface SendWhatsAppResult {
  success: boolean
  error?: string
}

interface SendEmailResult {
  success: boolean
  error?: string
}

export async function enviarWhatsApp(
  telefone: string,
  mensagem: string
): Promise<SendWhatsAppResult> {
  try {
    // Formatar telefone para o padrão do WhatsApp (55 + DDD + número)
    let numero = telefone.replace(/\D/g, '')
    if (!numero.startsWith('55')) {
      numero = '55' + numero
    }

    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
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
      console.error('[WhatsApp] Erro ao enviar:', error)
      return { success: false, error: 'Falha ao enviar WhatsApp' }
    }

    console.log(`[WhatsApp] Mensagem enviada para ${numero}`)
    return { success: true }
  } catch (error) {
    console.error('[WhatsApp] Erro:', error)
    return { success: false, error: 'Erro de conexão com WhatsApp' }
  }
}

export async function enviarEmail(
  email: string,
  assunto: string,
  mensagem: string
): Promise<SendEmailResult> {
  try {
    // Usar nodemailer dinamicamente para não quebrar se não estiver instalado
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
            ${mensagem.replace(/\n/g, '<br>')}
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

export async function enviarCodigoVerificacao(
  telefone: string,
  email: string | null,
  codigo: string,
  preferencia: 'whatsapp' | 'email' = 'whatsapp'
): Promise<{ success: boolean; metodo: 'whatsapp' | 'email'; error?: string }> {
  const mensagem = `*Castra+* - Seu código de verificação é:\n\n*${codigo}*\n\nEste código expira em 5 minutos.`

  // Tentar WhatsApp primeiro (se for a preferência)
  if (preferencia === 'whatsapp') {
    const whatsappResult = await enviarWhatsApp(telefone, mensagem)
    if (whatsappResult.success) {
      return { success: true, metodo: 'whatsapp' }
    }

    // Se WhatsApp falhar e tiver email, tentar email
    if (email) {
      const emailResult = await enviarEmail(
        email,
        'Seu código de verificação - Castra+',
        `Seu código de verificação é: ${codigo}\n\nEste código expira em 5 minutos.`
      )
      if (emailResult.success) {
        return { success: true, metodo: 'email' }
      }
    }

    return { success: false, metodo: 'whatsapp', error: 'Não foi possível enviar o código' }
  }

  // Se preferência for email
  if (email) {
    const emailResult = await enviarEmail(
      email,
      'Seu código de verificação - Castra+',
      `Seu código de verificação é: ${codigo}\n\nEste código expira em 5 minutos.`
    )
    if (emailResult.success) {
      return { success: true, metodo: 'email' }
    }
  }

  // Se email falhar, tentar WhatsApp
  const whatsappResult = await enviarWhatsApp(telefone, mensagem)
  if (whatsappResult.success) {
    return { success: true, metodo: 'whatsapp' }
  }

  return { success: false, metodo: 'email', error: 'Não foi possível enviar o código' }
}
