import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/permissions'
import { listarInstancias, criarInstancia } from '@/lib/whatsapp-instances'
import { sanitizeInput } from '@/lib/sanitize'

// GET - Listar todas as instâncias
export async function GET() {
  const { error } = await requireRole('admin')
  if (error) return error

  const instancias = await listarInstancias()
  return NextResponse.json(instancias)
}

// POST - Criar nova instância
export async function POST(request: NextRequest) {
  const { error } = await requireRole('admin')
  if (error) return error

  const body = await request.json()
  const nome = sanitizeInput(body.nome?.trim() || '')
  const descricao = body.descricao ? sanitizeInput(body.descricao.trim()) : undefined

  if (!nome || nome.length < 2 || nome.length > 100) {
    return NextResponse.json(
      { error: 'Nome da instância é obrigatório (2-100 caracteres)' },
      { status: 400 }
    )
  }

  // Validar formato: apenas letras, números, hífens e underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(nome)) {
    return NextResponse.json(
      { error: 'Nome deve conter apenas letras, números, hífens e underscores' },
      { status: 400 }
    )
  }

  try {
    const instancia = await criarInstancia(nome, descricao)
    return NextResponse.json(instancia, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'Já existe uma instância com esse nome' }, { status: 409 })
    }
    throw err
  }
}
