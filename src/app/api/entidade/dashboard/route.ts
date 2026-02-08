import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import jwt from 'jsonwebtoken'
import { getEntidadeJwtSecret } from '@/lib/jwt-secrets'

export async function GET(request: NextRequest) {
  try {
    // Verificar token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    let payload: { id: string; nome: string; cidade: string; bairro: string | null }
    try {
      payload = jwt.verify(token, getEntidadeJwtSecret()) as typeof payload
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar entidade atualizada
    const entidadeResult = await pool.query(
      'SELECT id, nome, cidade, bairro, ativo FROM entidades WHERE id = $1',
      [payload.id]
    )

    if (entidadeResult.rows.length === 0 || !entidadeResult.rows[0].ativo) {
      return NextResponse.json({ error: 'Entidade não encontrada ou inativa' }, { status: 403 })
    }

    const entidade = entidadeResult.rows[0]

    // Buscar animais das campanhas vinculadas à entidade
    const animaisResult = await pool.query(
      `SELECT
        a.id,
        a.nome,
        a.especie,
        a.raca,
        a.sexo,
        a.peso,
        a."idadeAnos",
        a."idadeMeses",
        a.status,
        a."dataAgendamento",
        a."createdAt",
        json_build_object(
          'nome', t.nome,
          'telefone', t.telefone,
          'cidade', t.cidade,
          'bairro', t.bairro
        ) as tutor
      FROM animais a
      JOIN tutores t ON a."tutorId" = t.id
      JOIN campanhas_entidades ce ON a."campanhaId" = ce."campanhaId"
      WHERE ce."entidadeId" = $1
      ORDER BY a."createdAt" DESC`,
      [entidade.id]
    )

    return NextResponse.json({
      entidade: {
        id: entidade.id,
        nome: entidade.nome,
        cidade: entidade.cidade,
        bairro: entidade.bairro,
      },
      animais: animaisResult.rows,
    })
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
