import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/pool'
import { extrairToken, verificarToken, hashSenha } from '@/lib/tutor-auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar JWT
    const token = extrairToken(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const payload = verificarToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }

    const body = await request.json()
    const { senha } = body

    if (!senha || typeof senha !== 'string' || senha.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 })
    }

    if (senha.length > 100) {
      return NextResponse.json({ error: 'Senha muito longa' }, { status: 400 })
    }

    // Hash e salvar
    const hash = await hashSenha(senha)
    await pool.query(
      'UPDATE tutores SET senha_hash = $1 WHERE id = $2',
      [hash, payload.tutorId]
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao criar senha:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
