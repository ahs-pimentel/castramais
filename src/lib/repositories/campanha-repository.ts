import { pool } from '../pool'

export async function verificarEntidadeVinculada(campanhaId: string, entidadeId: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT c.id FROM campanhas c
     INNER JOIN campanhas_entidades ce ON c.id = ce."campanhaId"
     WHERE c.id = $1 AND ce."entidadeId" = $2 AND c.ativa = true`,
    [campanhaId, entidadeId]
  )
  return result.rows.length > 0
}
