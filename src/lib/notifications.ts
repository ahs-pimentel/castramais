// Serviço de notificações - WhatsApp (Evolution API) e Email
// Notificações são enfileiradas para evitar bloqueio do WhatsApp.

import { enfileirarWhatsApp, enfileirarEmail } from './message-queue'
import { enviarWhatsApp, enviarEmail } from './senders'

// Re-exportar para manter compatibilidade com imports existentes
export { enviarWhatsApp, enviarEmail }

// ============================================
// NOTIFICAÇÕES DO PROGRAMA CASTRA+ (via fila)
// ============================================

// Humanização: variações de texto para evitar mensagens idênticas (anti-spam)
const SAUDACOES = ['Olá', 'Oi', 'E aí', 'Oie']
const FECHAMENTOS = [
  '🐾 Castra+MG - Castração é um gesto de amor!',
  '🐾 Castra+MG - Cuide de quem te ama!',
  '🐾 Castra+MG - Seu pet agradece!',
  '🐾 Castra+MG - Juntos pelo bem-estar animal!',
]

function saudacao(): string {
  return SAUDACOES[Math.floor(Math.random() * SAUDACOES.length)]
}

function fechamento(): string {
  return FECHAMENTOS[Math.floor(Math.random() * FECHAMENTOS.length)]
}

// Helper: enfileira WhatsApp + email (se disponível)
async function enfileirarNotificacao(
  telefone: string,
  email: string | null,
  mensagem: string,
  assuntoEmail: string,
  prioridade: number = 0
): Promise<void> {
  await enfileirarWhatsApp(telefone, mensagem, prioridade)
  if (email) {
    await enfileirarEmail(email, assuntoEmail, mensagem.replace(/\*/g, ''), prioridade)
  }
}

// Notificação: Cadastro de Pet realizado
export async function notificarCadastroPet(
  telefone: string,
  email: string | null,
  nomeTutor: string,
  nomePet: string,
  especie: string
): Promise<void> {
  const emoji = especie.toLowerCase() === 'canino' ? '🐕' : '🐱'
  const mensagem = `*Castra+MG* ${emoji}

${saudacao()}, *${nomeTutor}*!

O cadastro do seu pet *${nomePet}* foi realizado com sucesso!

📋 *Status:* Aguardando agendamento

⚠️ *IMPORTANTE:* Para realizar o agendamento da castração, você precisará do *RG Animal (SinPatinhas)* do seu pet. É um cadastro gratuito do Governo Federal.

📝 *Cadastre no SinPatinhas:*
👉 sinpatinhas.mma.gov.br

Você será notificado assim que houver uma campanha de castração disponível na sua região.

Enquanto isso, mantenha seus dados atualizados e providencie o RG Animal.

${fechamento()}`

  await enfileirarNotificacao(telefone, email, mensagem, `Cadastro de ${nomePet} realizado - Castra+MG`)
}

// Notificação: Pet cadastrado em Lista de Espera (vagas esgotadas)
export async function notificarListaEspera(
  telefone: string,
  email: string | null,
  nomeTutor: string,
  nomePet: string,
  especie: string,
  posicaoFila: number
): Promise<void> {
  const emoji = especie.toLowerCase() === 'canino' ? '🐕' : '🐱'

  const mensagem = `*Castra+MG* ${emoji}

${saudacao()}, *${nomeTutor}*!

O cadastro do seu pet *${nomePet}* foi realizado com sucesso!

⚠️ *Status:* Lista de Espera
📍 *Posição na fila:* ${posicaoFila}º

Infelizmente, as vagas para castração na sua cidade já foram preenchidas nesta campanha. Mas não se preocupe!

✅ Seu cadastro está salvo e você será notificado assim que surgirem novas vagas ou uma nova campanha for aberta em sua região.

📝 *ATENÇÃO:* Para o agendamento, você precisará do *RG Animal (SinPatinhas)* do seu pet. Aproveite este período de espera para cadastrá-lo gratuitamente:
👉 sinpatinhas.mma.gov.br

Fique atento ao seu WhatsApp!

${fechamento()}`

  await enfileirarNotificacao(telefone, email, mensagem, `${nomePet} na Lista de Espera - Castra+MG`)
}

// Gera a mensagem de agendamento (sem enviar)
export function gerarMensagemAgendamento(
  nomeTutor: string,
  nomePet: string,
  especie: string,
  dataAgendamento: string,
  horario: string,
  local: string,
  endereco: string
): string {
  const emoji = especie.toLowerCase() === 'canino' ? '🐕' : '🐱'
  const jejum = especie.toLowerCase() === 'canino' ? '6 horas' : '4 horas'
  const transporte = especie.toLowerCase() === 'canino'
    ? 'coleira/peitoral com guia + toalha ou cobertor'
    : 'caixa de transporte (OBRIGATÓRIO)'

  return `*Castra+MG* - AGENDAMENTO CONFIRMADO! ✅

${saudacao()}, *${nomeTutor}*!

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

💬 *Dúvidas?* Fale conosco:
👉 wa.me/553121812062

${fechamento()}`
}

// Notificação: Animal agendado para castração (envia apenas email, WhatsApp é manual via WhatsApp Web)
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
): Promise<void> {
  const mensagem = gerarMensagemAgendamento(nomeTutor, nomePet, especie, dataAgendamento, horario, local, endereco)

  // Apenas email automático - WhatsApp será enviado manualmente via WhatsApp Web
  if (email) {
    await enfileirarEmail(email, `Agendamento Confirmado: ${nomePet} - Castra+MG`, mensagem.replace(/\*/g, ''))
  }
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
): Promise<void> {
  const emoji = especie.toLowerCase() === 'canino' ? '🐕' : '🐱'
  const jejum = especie.toLowerCase() === 'canino' ? '6 horas' : '4 horas'

  const mensagem = `*Castra+MG* - LEMBRETE! ⏰

${saudacao()}, *${nomeTutor}*!

A castração de *${nomePet}* ${emoji} é *AMANHÃ*!

⏰ *Horário:* ${horario}
📍 *Local:* ${local}

⚠️ *NÃO ESQUEÇA:*
- Jejum alimentar e de água de ${jejum}
- Documento de identificação
- Manter o animal calmo na noite anterior

Contamos com você! 🐾
${fechamento()}`

  await enfileirarNotificacao(telefone, email, mensagem, `LEMBRETE: Castração de ${nomePet} é amanhã! - Castra+MG`)
}

// Notificação: Castração realizada com sucesso
export async function notificarCastracaoRealizada(
  telefone: string,
  email: string | null,
  nomeTutor: string,
  nomePet: string,
  especie: string
): Promise<void> {
  const emoji = especie.toLowerCase() === 'canino' ? '🐕' : '🐱'

  const mensagem = `*Castra+MG* - CASTRAÇÃO REALIZADA! ✅

${saudacao()}, *${nomeTutor}*!

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

${fechamento()}`

  await enfileirarNotificacao(telefone, email, mensagem, `Castração de ${nomePet} realizada! - Castra+MG`)
}

// Gera mensagem de cancelamento por falta de informação de idade (sem enviar)
export function gerarMensagemCancelamentoIdade(
  nomeTutor: string,
  nomePet: string
): string {
  return `*Castra+MG* 🐾

${saudacao()}, *${nomeTutor}*!

Entramos em contato para informar que o cadastro do seu pet *${nomePet}* no programa *Castra+MG* foi *cancelado* por falta de informação sobre a idade.

📋 *Motivo:* O programa atende apenas pets com idade entre *6 meses e 10 anos*. Como a idade do seu pet não foi informada ou está fora dessa faixa, o cadastro foi cancelado automaticamente.

✅ *O que fazer para regularizar:*
1. Acesse *castramaismg.org/tutor* com seu CPF
2. Cadastre seu pet novamente informando a idade correta
3. A idade deve estar entre *6 meses e 10 anos*

⚠️ Caso seu pet esteja dentro da faixa de idade permitida, basta refazer o cadastro com a informação correta.

Em caso de dúvidas, responda esta mensagem.

${fechamento()}`
}

// Notificação: Agendamento cancelado
export async function notificarCancelamento(
  telefone: string,
  email: string | null,
  nomeTutor: string,
  nomePet: string,
  motivo?: string
): Promise<void> {
  const mensagem = `*Castra+MG* - Agendamento Cancelado

${saudacao()}, *${nomeTutor}*!

O agendamento de castração de *${nomePet}* foi cancelado.

${motivo ? `📝 *Motivo:* ${motivo}\n` : ''}
Você pode realizar um novo cadastro quando houver disponibilidade de vagas.

Em caso de dúvidas, entre em contato pelo WhatsApp.

${fechamento()}`

  await enfileirarNotificacao(telefone, email, mensagem, `Agendamento cancelado: ${nomePet} - Castra+MG`)
}

// Notificação: Cadastro feito pelo admin (orientar tutor a acessar /tutor)
export async function notificarCadastroAdmin(
  telefone: string,
  email: string | null,
  nomeTutor: string,
  nomePet: string
): Promise<void> {
  const mensagem = `*Castra+MG* 🐾

${saudacao()}, *${nomeTutor}*!

Informamos que seu pet *${nomePet}* foi cadastrado no programa *Castra+MG* de castração gratuita!

📋 *Próximos passos:*
Acesse o sistema para acompanhar o status do seu pet:

👉 *castramaismg.org/tutor*

Basta informar seu CPF para acessar.

Você receberá notificações sobre o agendamento pelo WhatsApp.

Em caso de dúvidas, responda esta mensagem.

${fechamento()}`

  await enfileirarNotificacao(telefone, email, mensagem, `Seu pet ${nomePet} foi cadastrado - Castra+MG`)
}

