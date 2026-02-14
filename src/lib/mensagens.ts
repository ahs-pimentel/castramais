// Funções de geração de mensagens WhatsApp (client-safe, sem dependências de servidor)

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
