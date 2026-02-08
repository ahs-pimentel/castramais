// Serviço de notificações - WhatsApp (Evolution API) e Email

import { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE } from './constants'

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

// ============================================
// NOTIFICAÇÕES DO PROGRAMA CASTRA+
// ============================================

interface NotificacaoResult {
  success: boolean
  metodo?: 'whatsapp' | 'email'
  error?: string
}

// Notificação: Cadastro de Pet realizado
export async function notificarCadastroPet(
  telefone: string,
  email: string | null,
  nomeTutor: string,
  nomePet: string,
  especie: string
): Promise<NotificacaoResult> {
  const emoji = especie.toLowerCase() === 'canino' ? '🐕' : '🐱'
  const mensagem = `*Castra+MG* ${emoji}

Olá, *${nomeTutor}*!

O cadastro do seu pet *${nomePet}* foi realizado com sucesso!

📋 *Status:* Aguardando agendamento

Você será notificado assim que houver uma campanha de castração disponível na sua região.

Enquanto isso, mantenha seus dados atualizados no app.

🐾 Castra+MG - Castração é um gesto de amor!`

  const result = await enviarWhatsApp(telefone, mensagem)
  if (result.success) {
    return { success: true, metodo: 'whatsapp' }
  }

  // Fallback para email
  if (email) {
    const emailResult = await enviarEmail(
      email,
      `Cadastro de ${nomePet} realizado - Castra+MG`,
      mensagem.replace(/\*/g, '')
    )
    if (emailResult.success) {
      return { success: true, metodo: 'email' }
    }
  }

  return { success: false, error: 'Não foi possível enviar notificação' }
}

// Notificação: Pet cadastrado em Lista de Espera (vagas esgotadas)
export async function notificarListaEspera(
  telefone: string,
  email: string | null,
  nomeTutor: string,
  nomePet: string,
  especie: string,
  posicaoFila: number
): Promise<NotificacaoResult> {
  const emoji = especie.toLowerCase() === 'canino' ? '🐕' : '🐱'

  const mensagem = `*Castra+MG* ${emoji}

Olá, *${nomeTutor}*!

O cadastro do seu pet *${nomePet}* foi realizado com sucesso!

⚠️ *Status:* Lista de Espera
📍 *Posição na fila:* ${posicaoFila}º

Infelizmente, as vagas para castração na sua cidade já foram preenchidas nesta campanha. Mas não se preocupe!

✅ Seu cadastro está salvo e você será notificado assim que surgirem novas vagas ou uma nova campanha for aberta em sua região.

Fique atento ao seu WhatsApp!

🐾 Castra+MG - Castração é um gesto de amor!`

  const result = await enviarWhatsApp(telefone, mensagem)
  if (result.success) {
    return { success: true, metodo: 'whatsapp' }
  }

  if (email) {
    const emailResult = await enviarEmail(
      email,
      `${nomePet} na Lista de Espera - Castra+MG`,
      mensagem.replace(/\*/g, '')
    )
    if (emailResult.success) {
      return { success: true, metodo: 'email' }
    }
  }

  return { success: false, error: 'Não foi possível enviar notificação' }
}

// Notificação: Animal agendado para castração
export async function notificarAgendamento(
  telefone: string,
  email: string | null,
  nomeTutor: string,
  nomePet: string,
  especie: string,
  dataAgendamento: string,
  horario: string,
  local: string,
  endereco: string
): Promise<NotificacaoResult> {
  const emoji = especie.toLowerCase() === 'canino' ? '🐕' : '🐱'
  const jejum = especie.toLowerCase() === 'canino' ? '6 horas' : '4 horas'
  const transporte = especie.toLowerCase() === 'canino'
    ? 'coleira/peitoral com guia + toalha ou cobertor'
    : 'caixa de transporte (OBRIGATÓRIO)'

  const mensagem = `*Castra+MG* - AGENDAMENTO CONFIRMADO! ✅

Olá, *${nomeTutor}*!

Seu pet *${nomePet}* ${emoji} foi agendado para castração!

📅 *Data:* ${dataAgendamento}
⏰ *Horário:* ${horario}
📍 *Local:* ${local}
🗺️ *Endereço:* ${endereco}

⚠️ *ORIENTAÇÕES IMPORTANTES:*

🍽️ *Jejum alimentar:* ${jejum} antes do procedimento
💧 *Jejum de água:* ${jejum} antes do procedimento
🎒 *Transporte:* ${transporte}

📝 *No dia, leve:*
- Documento de identificação com foto
- Este comprovante de agendamento

O responsável deve ser maior de idade e permanecer no local até a liberação do animal.

❌ *Não poderá comparecer?*
Avise com pelo menos 24h de antecedência pelo WhatsApp.

🐾 Castra+MG - Castração é um gesto de amor!`

  const result = await enviarWhatsApp(telefone, mensagem)
  if (result.success) {
    return { success: true, metodo: 'whatsapp' }
  }

  if (email) {
    const emailResult = await enviarEmail(
      email,
      `Agendamento Confirmado: ${nomePet} - Castra+MG`,
      mensagem.replace(/\*/g, '')
    )
    if (emailResult.success) {
      return { success: true, metodo: 'email' }
    }
  }

  return { success: false, error: 'Não foi possível enviar notificação' }
}

// Notificação: Lembrete 24h antes
export async function notificarLembrete24h(
  telefone: string,
  email: string | null,
  nomeTutor: string,
  nomePet: string,
  especie: string,
  horario: string,
  local: string
): Promise<NotificacaoResult> {
  const emoji = especie.toLowerCase() === 'canino' ? '🐕' : '🐱'
  const jejum = especie.toLowerCase() === 'canino' ? '6 horas' : '4 horas'

  const mensagem = `*Castra+MG* - LEMBRETE! ⏰

Olá, *${nomeTutor}*!

A castração de *${nomePet}* ${emoji} é *AMANHÃ*!

⏰ *Horário:* ${horario}
📍 *Local:* ${local}

⚠️ *NÃO ESQUEÇA:*
- Jejum alimentar e de água de ${jejum}
- Documento de identificação
- Manter o animal calmo na noite anterior

Contamos com você! 🐾`

  const result = await enviarWhatsApp(telefone, mensagem)
  if (result.success) {
    return { success: true, metodo: 'whatsapp' }
  }

  if (email) {
    const emailResult = await enviarEmail(
      email,
      `LEMBRETE: Castração de ${nomePet} é amanhã! - Castra+MG`,
      mensagem.replace(/\*/g, '')
    )
    if (emailResult.success) {
      return { success: true, metodo: 'email' }
    }
  }

  return { success: false, error: 'Não foi possível enviar notificação' }
}

// Notificação: Castração realizada com sucesso
export async function notificarCastracaoRealizada(
  telefone: string,
  email: string | null,
  nomeTutor: string,
  nomePet: string,
  especie: string
): Promise<NotificacaoResult> {
  const emoji = especie.toLowerCase() === 'canino' ? '🐕' : '🐱'

  const mensagem = `*Castra+MG* - CASTRAÇÃO REALIZADA! ✅

Olá, *${nomeTutor}*!

A castração de *${nomePet}* ${emoji} foi realizada com sucesso!

💊 *CUIDADOS PÓS-OPERATÓRIOS:*

1️⃣ Mantenha o animal em local tranquilo e aquecido
2️⃣ Ofereça água após 4 horas e alimento leve após 8 horas
3️⃣ Não deixe lamber ou morder a ferida
4️⃣ Mantenha a roupa cirúrgica ou colar por 10 dias
5️⃣ Evite subir escadas e pular nos primeiros dias
6️⃣ Observe se há inchaço excessivo, sangramento ou secreção

⚠️ Em caso de emergência, procure um veterinário.

📅 *Retorno para retirada dos pontos:* 10 dias

Obrigado por participar do programa Castra+MG!

🐾 Castração é um gesto de amor!`

  const result = await enviarWhatsApp(telefone, mensagem)
  if (result.success) {
    return { success: true, metodo: 'whatsapp' }
  }

  if (email) {
    const emailResult = await enviarEmail(
      email,
      `Castração de ${nomePet} realizada! - Castra+MG`,
      mensagem.replace(/\*/g, '')
    )
    if (emailResult.success) {
      return { success: true, metodo: 'email' }
    }
  }

  return { success: false, error: 'Não foi possível enviar notificação' }
}

// Notificação: Agendamento cancelado
export async function notificarCancelamento(
  telefone: string,
  email: string | null,
  nomeTutor: string,
  nomePet: string,
  motivo?: string
): Promise<NotificacaoResult> {
  const mensagem = `*Castra+MG* - Agendamento Cancelado

Olá, *${nomeTutor}*!

O agendamento de castração de *${nomePet}* foi cancelado.

${motivo ? `📝 *Motivo:* ${motivo}\n` : ''}
Você pode realizar um novo cadastro quando houver disponibilidade de vagas.

Em caso de dúvidas, entre em contato pelo WhatsApp.

🐾 Castra+MG`

  const result = await enviarWhatsApp(telefone, mensagem)
  if (result.success) {
    return { success: true, metodo: 'whatsapp' }
  }

  if (email) {
    const emailResult = await enviarEmail(
      email,
      `Agendamento cancelado: ${nomePet} - Castra+MG`,
      mensagem.replace(/\*/g, '')
    )
    if (emailResult.success) {
      return { success: true, metodo: 'email' }
    }
  }

  return { success: false, error: 'Não foi possível enviar notificação' }
}

// Notificação: Cadastro feito pelo admin (orientar tutor a acessar /tutor)
export async function notificarCadastroAdmin(
  telefone: string,
  email: string | null,
  nomeTutor: string,
  nomePet: string
): Promise<NotificacaoResult> {
  const mensagem = `*Castra+MG* 🐾

Olá, *${nomeTutor}*!

Informamos que seu pet *${nomePet}* foi cadastrado no programa *Castra+MG* de castração gratuita!

📋 *Próximos passos:*
Acesse o sistema para acompanhar o status do seu pet:

👉 *castramaismg.org/tutor*

Basta informar seu CPF e confirmar pelo código enviado por WhatsApp.

Você receberá notificações sobre o agendamento pelo WhatsApp.

Em caso de dúvidas, responda esta mensagem.

🐾 Castra+MG - Castração é um gesto de amor!`

  const result = await enviarWhatsApp(telefone, mensagem)
  if (result.success) {
    return { success: true, metodo: 'whatsapp' }
  }

  if (email) {
    const emailResult = await enviarEmail(
      email,
      `Seu pet ${nomePet} foi cadastrado - Castra+MG`,
      mensagem.replace(/\*/g, '')
    )
    if (emailResult.success) {
      return { success: true, metodo: 'email' }
    }
  }

  return { success: false, error: 'Não foi possível enviar notificação' }
}

// ============================================
// CÓDIGO DE VERIFICAÇÃO (OTP)
// ============================================

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
