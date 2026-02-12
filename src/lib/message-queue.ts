// Fila de mensagens DB-backed para evitar bloqueio do WhatsApp
// Controla velocidade de envio com delay entre mensagens e retry com backoff

import { pool } from './pool'
import { QUEUE_CONFIG } from './constants'
import { enviarWhatsApp, enviarEmail } from './senders'

export type TipoMensagem = 'whatsapp' | 'email'
export type StatusMensagem = 'pendente' | 'enviando' | 'enviado' | 'falhou'

// Verifica se já existe mensagem pendente/enviando para o mesmo destino (evita duplicatas)
async function jaEnfileirado(tipo: string, destino: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM fila_mensagens
     WHERE tipo = $1 AND destino = $2 AND status IN ('pendente', 'enviando')
     AND "criadoEm" > NOW() - INTERVAL '5 minutes'
     LIMIT 1`,
    [tipo, destino]
  )
  return result.rows.length > 0
}

export async function enfileirarWhatsApp(
  telefone: string,
  mensagem: string,
  prioridade: number = 0
): Promise<void> {
  if (await jaEnfileirado('whatsapp', telefone)) {
    console.log(`[Fila] WhatsApp para ${telefone} já está na fila, ignorando duplicata`)
    return
  }
  await pool.query(
    `INSERT INTO fila_mensagens (tipo, destino, mensagem, prioridade)
     VALUES ('whatsapp', $1, $2, $3)`,
    [telefone, mensagem, prioridade]
  )
}

export async function enfileirarEmail(
  email: string,
  assunto: string,
  mensagem: string,
  prioridade: number = 0
): Promise<void> {
  if (await jaEnfileirado('email', email)) {
    console.log(`[Fila] Email para ${email} já está na fila, ignorando duplicata`)
    return
  }
  await pool.query(
    `INSERT INTO fila_mensagens (tipo, destino, assunto, mensagem, prioridade)
     VALUES ('email', $1, $2, $3, $4)`,
    [email, assunto, mensagem, prioridade]
  )
}

export async function processarProximaMensagem(): Promise<boolean> {
  // Buscar próxima mensagem pendente (prioridade alta primeiro, depois mais antiga)
  const result = await pool.query(
    `UPDATE fila_mensagens
     SET status = 'enviando'
     WHERE id = (
       SELECT id FROM fila_mensagens
       WHERE status = 'pendente' AND "proximaTentativa" <= NOW()
       ORDER BY prioridade DESC, "criadoEm" ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`
  )

  if (result.rows.length === 0) {
    return false // nada para processar
  }

  const msg = result.rows[0]

  try {
    let sucesso = false

    if (msg.tipo === 'whatsapp') {
      const res = await enviarWhatsApp(msg.destino, msg.mensagem)
      sucesso = res.success
    } else if (msg.tipo === 'email') {
      const res = await enviarEmail(msg.destino, msg.assunto || '', msg.mensagem)
      sucesso = res.success
    }

    if (sucesso) {
      await pool.query(
        `UPDATE fila_mensagens SET status = 'enviado', "enviadoEm" = NOW() WHERE id = $1`,
        [msg.id]
      )
    } else {
      await marcarFalha(msg)
    }
  } catch (error) {
    console.error('[Fila] Erro ao processar mensagem:', error)
    await marcarFalha(msg)
  }

  return true
}

async function marcarFalha(msg: {
  id: string
  tentativas: number
  max_tentativas: number
}): Promise<void> {
  const novaTentativa = msg.tentativas + 1

  if (novaTentativa >= msg.max_tentativas) {
    // Esgotou tentativas
    await pool.query(
      `UPDATE fila_mensagens SET status = 'falhou', tentativas = $2, erro = 'Máximo de tentativas atingido' WHERE id = $1`,
      [msg.id, novaTentativa]
    )
  } else {
    // Agendar retry com backoff
    const delayMs = QUEUE_CONFIG.RETRY_DELAYS[novaTentativa - 1] || QUEUE_CONFIG.RETRY_DELAYS[QUEUE_CONFIG.RETRY_DELAYS.length - 1]
    await pool.query(
      `UPDATE fila_mensagens SET status = 'pendente', tentativas = $2, "proximaTentativa" = NOW() + INTERVAL '1 millisecond' * $3 WHERE id = $1`,
      [msg.id, novaTentativa, delayMs]
    )
  }
}

export async function limparFilaAntiga(): Promise<number> {
  const result = await pool.query(
    `DELETE FROM fila_mensagens
     WHERE status IN ('enviado', 'falhou')
     AND "criadoEm" < NOW() - INTERVAL '1 day' * $1
     RETURNING id`,
    [QUEUE_CONFIG.CLEANUP_DAYS]
  )
  return result.rowCount || 0
}
