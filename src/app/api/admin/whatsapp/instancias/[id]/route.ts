import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/permissions'
import { atualizarInstancia, removerInstancia } from '@/lib/whatsapp-instances'
import { sanitizeInput } from '@/lib/sanitize'

// PATCH - Atualizar instância (descrição, ativo)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole('admin')
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const dados: { descricao?: string; ativo?: boolean } = {}
  if (body.descricao !== undefined) {
    dados.descricao = sanitizeInput(body.descricao.trim())
  }
  if (typeof body.ativo === 'boolean') {
    dados.ativo = body.ativo
  }

  const instancia = await atualizarInstancia(id, dados)
  if (!instancia) {
    return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 })
  }

  return NextResponse.json(instancia)
}

// DELETE - Remover instância
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole('admin')
  if (error) return error

  const { id } = await params
  const removida = await removerInstancia(id)

  if (!removida) {
    return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
