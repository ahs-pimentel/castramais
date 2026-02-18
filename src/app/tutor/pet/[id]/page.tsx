'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Cat,
  Dog,
  QrCode,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface AnimalDetalhes {
  id: string
  nome: string
  especie: 'cachorro' | 'gato'
  raca: string
  sexo: 'macho' | 'femea'
  peso: number | null
  idadeAnos: number | null
  idadeMeses: number | null
  registroSinpatinhas: string
  status: 'pendente' | 'agendado' | 'realizado' | 'cancelado'
  dataAgendamento: string | null
  dataRealizacao: string | null
  observacoes: string | null
  createdAt: string
}

const statusConfig = {
  pendente: {
    label: 'Aguardando Agendamento',
    description: 'Seu pet está na fila de espera para agendamento da castração.',
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
  },
  agendado: {
    label: 'Castração Agendada',
    description: 'A castração do seu pet está marcada. Fique atento à data!',
    icon: Calendar,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  realizado: {
    label: 'Castração Realizada',
    description: 'A castração foi realizada com sucesso!',
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  cancelado: {
    label: 'Cancelado',
    description: 'O procedimento foi cancelado. Entre em contato para mais informações.',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
  },
}

type PageParams = { id: string }

export default function PetDetalhesPage({ params }: { params: Promise<PageParams> }) {
  const { id } = use(params)
  const router = useRouter()
  const [animal, setAnimal] = useState<AnimalDetalhes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('tutor_token')
    if (!token) {
      router.push('/tutor')
      return
    }

    fetchAnimal(token)
  }, [id, router])

  const fetchAnimal = async (token: string) => {
    try {
      const res = await fetch(`/api/tutor/animal/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setAnimal(data)
      } else if (res.status === 401) {
        localStorage.removeItem('tutor_token')
        router.push('/tutor')
      } else {
        router.push('/tutor/meus-pets')
      }
    } catch {
      router.push('/tutor/meus-pets')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    // Formatar data corretamente interpretando como timezone local, não UTC
    const datePart = dateStr.split('T')[0]
    const [year, month, day] = datePart.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateShort = (dateStr: string | null) => {
    if (!dateStr) return null
    const datePart = dateStr.split('T')[0]
    const [year, month, day] = datePart.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('pt-BR')
  }

  const formatAge = () => {
    if (!animal) return null
    const parts = []
    if (animal.idadeAnos) parts.push(`${animal.idadeAnos} ano${animal.idadeAnos > 1 ? 's' : ''}`)
    if (animal.idadeMeses) parts.push(`${animal.idadeMeses} ${animal.idadeMeses > 1 ? 'meses' : 'mês'}`)
    return parts.length > 0 ? parts.join(' e ') : null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!animal) return null

  const status = statusConfig[animal.status]
  const StatusIcon = status.icon
  const AnimalIcon = animal.especie === 'gato' ? Cat : Dog

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-primary text-white px-6 pt-12 pb-24 rounded-b-[2rem]">
        <Link
          href="/tutor/meus-pets"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center">
            <AnimalIcon className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{animal.nome}</h1>
            <p className="text-white/80">{animal.raca}</p>
            <p className="text-sm text-white/60 mt-1">
              {animal.sexo === 'macho' ? 'Macho' : 'Fêmea'}
              {animal.peso && ` • ${animal.peso}kg`}
              {formatAge() && ` • ${formatAge()}`}
            </p>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="px-6 -mt-12">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 ${status.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
              <StatusIcon className={`w-6 h-6 ${status.color}`} />
            </div>
            <div className="flex-1">
              <h2 className={`font-semibold ${status.color}`}>{status.label}</h2>
              <p className="text-sm text-gray-500 mt-1">{status.description}</p>

              {animal.status === 'agendado' && animal.dataAgendamento && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                  <p className="text-sm font-medium text-blue-900">Data marcada:</p>
                  <p className="text-blue-700">{formatDate(animal.dataAgendamento)}</p>
                </div>
              )}

              {animal.status === 'realizado' && animal.dataRealizacao && (
                <div className="mt-3 p-3 bg-green-50 rounded-xl">
                  <p className="text-sm font-medium text-green-900">Realizado em:</p>
                  <p className="text-green-700">{formatDate(animal.dataRealizacao)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Histórico</h3>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="space-y-4">
            {/* Cadastro */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="w-0.5 h-full bg-gray-200 mt-2" />
              </div>
              <div className="pb-4">
                <p className="font-medium text-gray-900">Cadastrado no sistema</p>
                <p className="text-sm text-gray-500">
                  {formatDateShort(animal.createdAt)}
                </p>
              </div>
            </div>

            {/* Agendamento */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  animal.dataAgendamento ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Calendar className={`w-4 h-4 ${
                    animal.dataAgendamento ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                <div className="w-0.5 h-full bg-gray-200 mt-2" />
              </div>
              <div className="pb-4">
                <p className={`font-medium ${animal.dataAgendamento ? 'text-gray-900' : 'text-gray-400'}`}>
                  Agendamento
                </p>
                <p className="text-sm text-gray-500">
                  {animal.dataAgendamento
                    ? formatDateShort(animal.dataAgendamento)
                    : 'Aguardando'}
                </p>
              </div>
            </div>

            {/* Realização */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  animal.status === 'realizado' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${
                    animal.status === 'realizado' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
              </div>
              <div>
                <p className={`font-medium ${animal.status === 'realizado' ? 'text-gray-900' : 'text-gray-400'}`}>
                  Castração realizada
                </p>
                <p className="text-sm text-gray-500">
                  {animal.dataRealizacao
                    ? formatDateShort(animal.dataRealizacao)
                    : 'Pendente'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RG Animal */}
      <div className="px-6 mt-6">
        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <QrCode className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">RG Animal (SinPatinhas)</p>
            <p className="font-mono font-medium text-gray-900">{animal.registroSinpatinhas}</p>
          </div>
        </div>
      </div>

      {/* Observações */}
      {animal.observacoes && (
        <div className="px-6 mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Observações médicas</p>
                <p className="text-sm text-yellow-800 mt-1">{animal.observacoes}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
