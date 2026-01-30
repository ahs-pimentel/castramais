import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'entidade-secret-key'

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
      payload = jwt.verify(token, JWT_SECRET) as typeof payload
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

    // Buscar animais da região (cidade e opcionalmente bairro)
    let animaisQuery = `
      SELECT
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
      WHERE LOWER(t.cidade) = LOWER($1)
    `

    const params: (string | null)[] = [entidade.cidade]

    // Se a entidade tem bairro específico, filtrar por bairro também
    if (entidade.bairro) {
      animaisQuery += ` AND LOWER(t.bairro) = LOWER($2)`
      params.push(entidade.bairro)
    }

    animaisQuery += ` ORDER BY a."createdAt" DESC`

    const animaisResult = await pool.query(animaisQuery, params)

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
