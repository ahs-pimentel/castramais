import { NextResponse } from 'next/server'
import { obterVagasTodasCidades } from '@/lib/services/vagas'

// Endpoint público para verificar vagas (usado no formulário)
export async function GET() {
  try {
    const vagas = await obterVagasTodasCidades()

    return NextResponse.json({
      vagas,
      atualizadoEm: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao buscar vagas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
