// Módulo de rotação de instâncias WhatsApp (multi-número)
// Seleciona a instância com menos uso no dia para distribuir carga

import { pool } from './pool'
import { EVOLUTION_API_URL, EVOLUTION_API_KEY } from './constants'

export interface InstanciaWhatsApp {
  id: string
  nome: string
  descricao: string | null
  ativo: boolean
  status: string
  mensagens_enviadas: number
  mensagens_hoje: number
  ultimo_envio: Date | null
  ultimo_erro: string | null
  ultimo_check: Date | null
}

// Seleciona a instância ativa e conectada com menos mensagens hoje
export async function selecionarInstancia(): Promise<InstanciaWhatsApp | null> {
  // Primeiro tenta instâncias com status 'open' (confirmadas conectadas)
  let result = await pool.query(
    `SELECT * FROM instancias_whatsapp
     WHERE ativo = true AND status = 'open'
     ORDER BY mensagens_hoje ASC, ultimo_envio ASC NULLS FIRST
     LIMIT 1`
  )

  if (result.rows.length > 0) return result.rows[0]

  // Fallback: instâncias com status 'desconhecido' (ainda não checadas)
  result = await pool.query(
    `SELECT * FROM instancias_whatsapp
     WHERE ativo = true AND status = 'desconhecido'
     ORDER BY mensagens_hoje ASC, ultimo_envio ASC NULLS FIRST
     LIMIT 1`
  )

  return result.rows[0] || null
}

// Registra envio com sucesso
export async function registrarEnvio(instanciaId: string): Promise<void> {
  await pool.query(
    `UPDATE instancias_whatsapp
     SET mensagens_enviadas = mensagens_enviadas + 1,
         mensagens_hoje = mensagens_hoje + 1,
         ultimo_envio = NOW()
     WHERE id = $1`,
    [instanciaId]
  )
}

// Registra falha de envio
export async function registrarFalha(instanciaId: string, erro: string): Promise<void> {
  await pool.query(
    `UPDATE instancias_whatsapp SET ultimo_erro = $2 WHERE id = $1`,
    [instanciaId, erro]
  )
}

// Health check: verifica conexão de todas as instâncias ativas
export async function verificarSaudeInstancias(): Promise<void> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) return

  const result = await pool.query(
    `SELECT id, nome FROM instancias_whatsapp WHERE ativo = true`
  )

  for (const inst of result.rows) {
    try {
      const res = await fetch(
        `${EVOLUTION_API_URL}/instance/connectionState/${inst.nome}`,
        { headers: { apikey: EVOLUTION_API_KEY } }
      )

      let status = 'desconhecido'
      if (res.ok) {
        const data = await res.json()
        status = data.instance?.state || data.state || 'desconhecido'
      } else {
        status = 'erro'
      }

      await pool.query(
        `UPDATE instancias_whatsapp SET status = $2, ultimo_check = NOW() WHERE id = $1`,
        [inst.id, status]
      )
    } catch {
      await pool.query(
        `UPDATE instancias_whatsapp SET status = 'erro', ultimo_check = NOW() WHERE id = $1`,
        [inst.id]
      )
    }
  }
}

// Reset contadores diários (chamado pela job de limpeza)
export async function resetarContadoresDiarios(): Promise<void> {
  await pool.query(`UPDATE instancias_whatsapp SET mensagens_hoje = 0`)
}

// CRUD para API admin
export async function listarInstancias(): Promise<InstanciaWhatsApp[]> {
  const result = await pool.query(
    `SELECT * FROM instancias_whatsapp ORDER BY "criadoEm" ASC`
  )
  return result.rows
}

export async function criarInstancia(nome: string, descricao?: string): Promise<InstanciaWhatsApp> {
  const result = await pool.query(
    `INSERT INTO instancias_whatsapp (nome, descricao) VALUES ($1, $2) RETURNING *`,
    [nome, descricao || null]
  )
  return result.rows[0]
}

export async function atualizarInstancia(
  id: string,
  dados: { descricao?: string; ativo?: boolean }
): Promise<InstanciaWhatsApp | null> {
  const fields: string[] = []
  const values: (string | boolean)[] = []
  let idx = 1

  if (dados.descricao !== undefined) {
    fields.push(`descricao = $${idx++}`)
    values.push(dados.descricao)
  }
  if (dados.ativo !== undefined) {
    fields.push(`ativo = $${idx++}`)
    values.push(dados.ativo)
  }

  if (fields.length === 0) return null

  values.push(id)
  const result = await pool.query(
    `UPDATE instancias_whatsapp SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  )
  return result.rows[0] || null
}

export async function removerInstancia(id: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM instancias_whatsapp WHERE id = $1 RETURNING id`,
    [id]
  )
  return (result.rowCount || 0) > 0
}
