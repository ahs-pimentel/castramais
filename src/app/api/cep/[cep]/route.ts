import { NextRequest, NextResponse } from 'next/server'
import { buscarCEP } from '@/lib/cep'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cep: string }> }
) {
  try {
    const { cep } = await params

    const endereco = await buscarCEP(cep)

    if (!endereco) {
      return NextResponse.json(
        { error: 'CEP não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(endereco)
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar CEP' },
      { status: 500 }
    )
  }
}
