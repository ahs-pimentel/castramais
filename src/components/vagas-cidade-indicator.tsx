'use client'

import { useState, useEffect } from 'react'
import { MapPin, Users, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

interface VagasCidade {
  cidade: string
  cidadeKey: string
  limite: number
  ocupadas: number
  disponiveis: number
  listaEspera: number
  esgotadas: boolean
}

export function VagasCidadeIndicator() {
  const [vagas, setVagas] = useState<VagasCidade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVagas() {
      try {
        const res = await fetch('/api/vagas')
        if (res.ok) {
          const data = await res.json()
          setVagas(data.vagas || [])
        }
      } catch (error) {
        console.error('Erro ao buscar vagas:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchVagas()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-gray-900">Vagas por Cidade</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {vagas.map((vaga) => {
          const porcentagemOcupada = (vaga.ocupadas / vaga.limite) * 100
          const isAlerta = porcentagemOcupada >= 80
          const isEsgotada = vaga.esgotadas

          return (
            <div
              key={vaga.cidadeKey}
              className={`p-3 rounded-lg border-2 ${
                isEsgotada
                  ? 'border-red-200 bg-red-50'
                  : isAlerta
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-green-200 bg-green-50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                {isEsgotada ? (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                ) : isAlerta ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm font-medium text-gray-900 truncate">
                  {vaga.cidade}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className={`text-2xl font-bold ${
                    isEsgotada ? 'text-red-600' : isAlerta ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {vaga.disponiveis}
                  </span>
                  <span className="text-xs text-gray-500">
                    /{vaga.limite}
                  </span>
                </div>

                {/* Barra de progresso */}
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      isEsgotada ? 'bg-red-500' : isAlerta ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(porcentagemOcupada, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{vaga.ocupadas} ocupadas</span>
                  {vaga.listaEspera > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Users className="w-3 h-3" />
                      {vaga.listaEspera}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
