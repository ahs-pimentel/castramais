'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, ListFilter, Loader2, FileDown, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatsCards } from '@/components/stats-cards'
import { VagasCidadeIndicator } from '@/components/vagas-cidade-indicator'
import { SearchFilter } from '@/components/search-filter'
import { AnimalCard } from '@/components/animal-card'
import { AnimalWithTutor, Stats } from '@/lib/types'
import { gerarPDFAnimais, gerarPDFAgendamentos } from '@/lib/pdf-generator'

export default function DashboardPage() {
  const [animais, setAnimais] = useState<AnimalWithTutor[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pendentes: 0, agendados: 0, realizados: 0, listaEspera: 0, cachorros: 0, gatos: 0 })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [campanha, setCampanha] = useState('')
  const [animaisType, setAnimaisType] = useState('')
  const [campanhas, setCampanhas] = useState<{ id: string; nome: string; cidade: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'lista' | 'novo'>('lista')

  useEffect(() => {
    fetch('/api/campanhas')
      .then(res => res.ok ? res.json() : [])
      .then(data => setCampanhas(data))
      .catch(() => setCampanhas([]))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (campanha) params.set('campanhaId', campanha)
      if (animaisType) params.set('especie', animaisType)

      const [animaisRes, statsRes] = await Promise.all([
        fetch(`/api/animais?${params}`),
        fetch('/api/stats'),
      ])

      if (animaisRes.ok) {
        const data = await animaisRes.json()
        setAnimais(data)
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }, [search, status, campanha, animaisType])

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchData()
    }, 300)

    return () => clearTimeout(debounce)
  }, [fetchData])

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />

      <VagasCidadeIndicator />

      <div className="flex rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setActiveTab('lista')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'lista'
              ? 'bg-primary text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          Lista
        </button>
        <Link href="/dashboard/novo" className="flex-1">
          <button
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-900`}
          >
            <Plus className="w-4 h-4" />
            Novo
          </button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SearchFilter
            search={search}
            status={status}
            campanha={campanha}
            animaisType={animaisType}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            onCampanhaChange={setCampanha}
            onAnimaisTypeChange={setAnimaisType}
            campanhas={campanhas}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const campanhaObj = campanhas.find(c => c.id === campanha)
            const filtros = [
              search && `Busca: "${search}"`,
              status && `Status: ${status}`,
              campanhaObj && `Campanha: ${campanhaObj.nome}`,
            ].filter(Boolean).join(', ')
            gerarPDFAnimais(animais, filtros || undefined)
          }}
          disabled={animais.length === 0}
          className="shrink-0"
        >
          <FileDown className="w-4 h-4 mr-2" />
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const campanhaObj = campanhas.find(c => c.id === campanha)
            const filtros = [
              search && `Busca: "${search}"`,
              status && `Status: ${status}`,
              campanhaObj && `Campanha: ${campanhaObj.nome}`,
            ].filter(Boolean).join(', ')
            gerarPDFAgendamentos(animais, filtros || undefined)
          }}
          disabled={animais.length === 0}
          className="shrink-0"
        >
          <CalendarClock className="w-4 h-4 mr-2" />
          Agendamentos
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : animais.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum animal encontrado</p>
          <Link href="/dashboard/novo">
            <Button className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Animal
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {animais.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      )}
    </div>
  )
}
