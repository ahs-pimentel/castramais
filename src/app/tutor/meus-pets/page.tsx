'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  PawPrint,
  Cat,
  Dog,
  ChevronRight,
  LogOut,
  RefreshCw,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Bell,
  Loader2,
  Plus
} from 'lucide-react'
import { Animal } from '@/lib/types'

const statusConfig = {
  pendente: {
    label: 'Aguardando',
    icon: Clock,
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  agendado: {
    label: 'Agendado',
    icon: Calendar,
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  realizado: {
    label: 'Realizado',
    icon: CheckCircle2,
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  cancelado: {
    label: 'Cancelado',
    icon: XCircle,
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  lista_espera: {
    label: 'Lista de Espera',
    icon: Clock,
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
}

export default function MeusPetsPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [animais, setAnimais] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('tutor_token')
    const storedNome = localStorage.getItem('tutor_nome')

    if (!token) {
      router.push('/tutor')
      return
    }

    setNome(storedNome || 'Tutor')
    fetchAnimais(token)
  }, [router])

  const fetchAnimais = async (token: string) => {
    try {
      const res = await fetch('/api/tutor/meus-animais', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setAnimais(data)
      } else if (res.status === 401) {
        localStorage.removeItem('tutor_token')
        router.push('/tutor')
      }
    } catch (error) {
      console.error('Erro ao buscar animais:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    const token = localStorage.getItem('tutor_token')
    if (token) {
      setRefreshing(true)
      fetchAnimais(token)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('tutor_token')
    localStorage.removeItem('tutor_nome')
    sessionStorage.removeItem('tutor_cpf')
    sessionStorage.removeItem('tutor_telefone')
    router.push('/tutor')
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const datePart = dateStr.split('T')[0]
    const [year, month, day] = datePart.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-primary text-white px-6 pt-12 pb-20 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/80 text-sm">Olá,</p>
            <h1 className="text-xl font-bold">{nome.split(' ')[0]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium">Acompanhe seus pets</p>
              <p className="text-sm text-white/80">
                {animais.length} {animais.length === 1 ? 'animal cadastrado' : 'animais cadastrados'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Pets */}
      <div className="px-6 -mt-10">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {animais.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PawPrint className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhum animal cadastrado</p>
              <p className="text-sm text-gray-400 mt-1">
                Cadastre seu pet em uma unidade Castra+
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {animais.map((animal) => {
                const status = statusConfig[animal.status]
                const Icon = animal.especie === 'gato' ? Cat : Dog
                const StatusIcon = status.icon

                return (
                  <Link
                    key={animal.id}
                    href={`/tutor/pet/${animal.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-7 h-7 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{animal.nome}</h3>
                      <p className="text-sm text-gray-500">{animal.raca}</p>
                      <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                        {animal.dataAgendamento && animal.status === 'agendado' && (
                          <span className="ml-1">• {formatDate(animal.dataAgendamento)}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Botão Adicionar Pet */}
      <div className="px-6 mt-6">
        <Link
          href="/tutor/novo-pet"
          className="flex items-center justify-center gap-3 w-full p-4 bg-primary text-white rounded-2xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
        >
          <Plus className="w-5 h-5" />
          Cadastrar Novo Pet
        </Link>
      </div>

      {/* Info Card */}
      <div className="px-6 mt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <h3 className="font-medium text-blue-900 mb-1">Como funciona?</h3>
          <p className="text-sm text-blue-700">
            Cadastre seus pets com o RG Animal (SinPatinhas) e acompanhe
            todo o processo de castração, desde o agendamento até a realização.
          </p>
        </div>
      </div>
    </div>
  )
}
