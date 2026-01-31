'use client'

import { useState, useEffect } from 'react'
import { Search, Phone, Mail, MapPin, ChevronRight, PawPrint, FileDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { gerarPDFTutores } from '@/lib/pdf-generator'

interface Tutor {
  id: string
  nome: string
  cpf: string
  telefone: string
  email: string | null
  endereco: string
  cidade: string
  bairro: string
  createdAt: string
  totalAnimais: number
}

export default function TutoresPage() {
  const [tutores, setTutores] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    fetchTutores()
  }, [])

  async function fetchTutores() {
    try {
      const res = await fetch('/api/admin/tutores')
      const data = await res.json()
      setTutores(data)
    } catch (error) {
      console.error('Erro ao buscar tutores:', error)
    } finally {
      setLoading(false)
    }
  }

  const tutoresFiltrados = tutores.filter(
    (tutor) =>
      tutor.nome.toLowerCase().includes(busca.toLowerCase()) ||
      tutor.cpf.includes(busca) ||
      tutor.telefone.includes(busca) ||
      tutor.cidade.toLowerCase().includes(busca.toLowerCase()) ||
      tutor.bairro.toLowerCase().includes(busca.toLowerCase())
  )

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tutores</h1>
          <p className="text-gray-500 mt-1">{tutores.length} tutores cadastrados</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => gerarPDFTutores(tutoresFiltrados)}
          disabled={tutoresFiltrados.length === 0}
        >
          <FileDown className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar por nome, CPF, telefone, cidade ou bairro..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {tutoresFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {busca ? 'Nenhum tutor encontrado' : 'Nenhum tutor cadastrado'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tutoresFiltrados.map((tutor) => (
              <Link
                key={tutor.id}
                href={`/dashboard/tutores/${tutor.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900 truncate">
                      {tutor.nome}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      <PawPrint className="w-3 h-3" />
                      {tutor.totalAnimais} {tutor.totalAnimais === 1 ? 'pet' : 'pets'}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span>{formatCPF(tutor.cpf)}</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {formatPhone(tutor.telefone)}
                    </span>
                    {tutor.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {tutor.email}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-sm text-gray-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {tutor.bairro}, {tutor.cidade}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
