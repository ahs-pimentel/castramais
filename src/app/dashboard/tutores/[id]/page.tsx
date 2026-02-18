'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Trash2, Loader2, Phone, Mail, MapPin, Calendar, PawPrint, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type PageParams = { id: string }

interface Animal {
  id: string
  nome: string
  especie: string
  raca: string
  sexo: string
  status: string
  createdAt: string
}

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
  animais: Animal[]
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  agendado: { label: 'Agendado', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  realizado: { label: 'Realizado', className: 'bg-green-50 text-green-700 border-green-200' },
  cancelado: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
}

export default function TutorDetailPage({ params }: { params: Promise<PageParams> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role || 'admin'
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchTutor = async () => {
      try {
        const res = await fetch(`/api/admin/tutores/${id}`)
        if (res.ok) {
          const data = await res.json()
          setTutor(data)
        } else {
          router.push('/dashboard/tutores')
        }
      } catch (error) {
        console.error('Erro ao buscar tutor:', error)
        router.push('/dashboard/tutores')
      } finally {
        setLoading(false)
      }
    }

    fetchTutor()
  }, [id, router])

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este tutor e todos os seus animais?')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/tutores/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/dashboard/tutores')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

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

  const formatDate = (date: string) => {
    const datePart = date.split('T')[0]
    const [year, month, day] = datePart.split('-')
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return d.toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!tutor) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/tutores"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">{tutor.nome}</h1>
        </div>
        {role === 'admin' && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Dados do Tutor</h2>

          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">CPF</span>
              <p className="font-medium">{formatCPF(tutor.cpf)}</p>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <a
                href={`https://wa.me/55${tutor.telefone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {formatPhone(tutor.telefone)}
              </a>
            </div>

            {tutor.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${tutor.email}`} className="text-primary hover:underline">
                  {tutor.email}
                </a>
              </div>
            )}

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p>{tutor.endereco}</p>
                <p className="text-sm text-gray-500">{tutor.bairro}, {tutor.cidade}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Cadastrado em {formatDate(tutor.createdAt)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Animais</h2>
            <span className="text-sm text-gray-500">{tutor.animais.length} cadastrados</span>
          </div>

          {tutor.animais.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">Nenhum animal cadastrado</p>
          ) : (
            <div className="space-y-3">
              {tutor.animais.map((animal) => (
                <Link
                  key={animal.id}
                  href={`/dashboard/${animal.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <PawPrint className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{animal.nome}</p>
                      <p className="text-sm text-gray-500">
                        {animal.especie === 'cachorro' ? 'Cachorro' : 'Gato'} - {animal.raca}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusConfig[animal.status]?.className}>
                      {statusConfig[animal.status]?.label}
                    </Badge>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
