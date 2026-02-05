'use client'

import { useState, useEffect } from 'react'
import { MapPin, Users, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'

interface VagasCidade {
  cidade: string
  cidadeKey: string
  limite: number
  ocupadas: number
  disponiveis: number
  listaEspera: number
  esgotadas: boolean
}

interface VagasStatusProps {
  cidadeSelecionada?: string
  compact?: boolean
}

export function VagasStatus({ cidadeSelecionada, compact = false }: VagasStatusProps) {
  const [vagas, setVagas] = useState<VagasCidade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/vagas')
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar vagas')
        return res.json()
      })
      .then(data => {
        setVagas(data.vagas)
        setLoading(false)
      })
      .catch(err => {
        console.error('Erro ao buscar vagas:', err)
        setError('Erro ao carregar vagas')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    )
  }

  if (error) {
    return null
  }

  // Se uma cidade foi selecionada, mostrar só essa
  const vagasFiltradas = cidadeSelecionada
    ? vagas.filter(v => v.cidade.toLowerCase().includes(cidadeSelecionada.toLowerCase()))
    : vagas

  if (compact && cidadeSelecionada) {
    const vagaCidade = vagasFiltradas[0]
    if (!vagaCidade) return null

    return (
      <div className={`p-3 rounded-lg text-sm ${
        vagaCidade.esgotadas
          ? 'bg-amber-50 border border-amber-200'
          : 'bg-green-50 border border-green-200'
      }`}>
        {vagaCidade.esgotadas ? (
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            <span>Vagas esgotadas em {vagaCidade.cidade}. Seu cadastro entrará na lista de espera.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>{vagaCidade.disponiveis} vagas disponíveis em {vagaCidade.cidade}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-blue-900">Vagas por Cidade</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {vagasFiltradas.map(v => (
          <div
            key={v.cidadeKey}
            className={`p-3 rounded-lg text-sm ${
              v.esgotadas
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            <div className="flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3" />
              <span>{v.cidade}</span>
            </div>
            <div className="text-xs mt-1 space-y-0.5">
              {v.esgotadas ? (
                <>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Vagas esgotadas</span>
                  </div>
                  {v.listaEspera > 0 && (
                    <div className="text-red-600">
                      {v.listaEspera} na lista de espera
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>{v.disponiveis} de {v.limite} disponíveis</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
