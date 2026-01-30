'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Cat, LogOut, Search, Phone, MapPin, Calendar, PawPrint, Filter, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Animal {
  id: string
  nome: string
  especie: string
  raca: string
  sexo: string
  peso: number | null
  idadeAnos: number | null
  idadeMeses: number | null
  status: string
  dataAgendamento: string | null
  createdAt: string
  tutor: {
    nome: string
    telefone: string
    cidade: string
    bairro: string
  }
}

interface Entidade {
  id: string
  nome: string
  cidade: string
  bairro: string | null
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  agendado: { label: 'Agendado', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  realizado: { label: 'Realizado', className: 'bg-green-50 text-green-700 border-green-200' },
  cancelado: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
}

export default function EntidadeDashboardPage() {
  const router = useRouter()
  const [entidade, setEntidade] = useState<Entidade | null>(null)
  const [animais, setAnimais] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('entidade_token')
    if (!token) {
      router.push('/entidade/login')
      return
    }

    fetchData(token)
  }, [router])

  async function fetchData(token: string) {
    try {
      const res = await fetch('/api/entidade/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        localStorage.removeItem('entidade_token')
        router.push('/entidade/login')
        return
      }

      const data = await res.json()
      setEntidade(data.entidade)
      setAnimais(data.animais)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('entidade_token')
    localStorage.removeItem('entidade_id')
    localStorage.removeItem('entidade_nome')
    router.push('/entidade/login')
  }

  const animaisFiltrados = animais.filter((animal) => {
    const matchBusca =
      animal.nome.toLowerCase().includes(busca.toLowerCase()) ||
      animal.tutor.nome.toLowerCase().includes(busca.toLowerCase()) ||
      animal.tutor.bairro.toLowerCase().includes(busca.toLowerCase())

    const matchStatus = !statusFilter || animal.status === statusFilter

    return matchBusca && matchStatus
  })

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const stats = {
    total: animais.length,
    pendentes: animais.filter((a) => a.status === 'pendente').length,
    agendados: animais.filter((a) => a.status === 'agendado').length,
    realizados: animais.filter((a) => a.status === 'realizado').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Cat className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-semibold text-gray-900">Castra<span className="text-primary">+</span></span>
                <p className="text-xs text-gray-500">{entidade?.nome}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            Animais cadastrados em {entidade?.cidade}
            {entidade?.bairro && ` - ${entidade.bairro}`}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4">
            <p className="text-sm text-yellow-700">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.pendentes}</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <p className="text-sm text-blue-700">Agendados</p>
            <p className="text-2xl font-bold text-blue-900">{stats.agendados}</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-100 p-4">
            <p className="text-sm text-green-700">Realizados</p>
            <p className="text-2xl font-bold text-green-900">{stats.realizados}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por animal, tutor ou bairro..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="agendado">Agendado</option>
              <option value="realizado">Realizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {animaisFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {busca || statusFilter ? 'Nenhum animal encontrado' : 'Nenhum animal cadastrado na sua região'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {animaisFiltrados.map((animal) => (
                <div key={animal.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <PawPrint className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{animal.nome}</h3>
                          <Badge className={statusConfig[animal.status]?.className}>
                            {statusConfig[animal.status]?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {animal.especie === 'cachorro' ? 'Cachorro' : 'Gato'} - {animal.raca} - {animal.sexo === 'macho' ? 'Macho' : 'Fêmea'}
                          {animal.peso && ` - ${animal.peso}kg`}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                          <span className="text-gray-700 font-medium">{animal.tutor.nome}</span>
                          <a
                            href={`https://wa.me/55${animal.tutor.telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {formatPhone(animal.tutor.telefone)}
                          </a>
                          <span className="flex items-center gap-1 text-gray-500">
                            <MapPin className="w-3.5 h-3.5" />
                            {animal.tutor.bairro}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(animal.createdAt)}
                      </div>
                      {animal.dataAgendamento && (
                        <p className="text-blue-600 mt-1">
                          Agendado: {formatDate(animal.dataAgendamento)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
