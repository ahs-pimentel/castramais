import { pool } from '../pool'

export async function buscarAnimalPorRG(registroSinpatinhas: string) {
  const result = await pool.query(
    'SELECT id FROM animais WHERE "registroSinpatinhas" = $1',
    [registroSinpatinhas]
  )
  return result.rows[0] || null
}

export async function buscarTutorNotificacao(tutorId: string) {
  const result = await pool.query(
    'SELECT nome, telefone, email FROM tutores WHERE id = $1',
    [tutorId]
  )
  return result.rows[0] || null
}
