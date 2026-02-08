import { pool } from '../pool'
import { ANIMAL_LIMITS } from '../constants'

export async function buscarTutorPorCPF(cpf: string) {
  const result = await pool.query(
    'SELECT id, nome, cpf, telefone, email, endereco, cidade, bairro FROM tutores WHERE cpf = $1',
    [cpf]
  )
  return result.rows[0] || null
}

export async function buscarTutorPorId(id: string) {
  const result = await pool.query(
    'SELECT id, nome, cpf, telefone, email, endereco, cidade, bairro FROM tutores WHERE id = $1',
    [id]
  )
  return result.rows[0] || null
}

export async function contarAnimaisTutor(tutorId: string): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*)::int as total FROM animais WHERE "tutorId" = $1',
    [tutorId]
  )
  return result.rows[0].total
}

export async function contarAnimaisTutorCampanha(tutorId: string, campanhaId: string): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*)::int as total FROM animais WHERE "tutorId" = $1 AND "campanhaId" = $2',
    [tutorId, campanhaId]
  )
  return result.rows[0].total
}

export async function verificarLimitesAnimais(tutorId: string, campanhaId?: string | null): Promise<{ ok: boolean; erro?: string }> {
  const total = await contarAnimaisTutor(tutorId)
  if (total >= ANIMAL_LIMITS.PER_TUTOR_TOTAL) {
    return { ok: false, erro: 'Limite máximo de 10 animais por tutor atingido' }
  }
  if (campanhaId) {
    const totalCampanha = await contarAnimaisTutorCampanha(tutorId, campanhaId)
    if (totalCampanha >= ANIMAL_LIMITS.PER_TUTOR_PER_CAMPAIGN) {
      return { ok: false, erro: 'Limite máximo de 5 animais por tutor nesta campanha atingido' }
    }
  }
  return { ok: true }
}
