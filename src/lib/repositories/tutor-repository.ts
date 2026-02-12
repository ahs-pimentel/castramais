import { pool } from '../pool'

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
