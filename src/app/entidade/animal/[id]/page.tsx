'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, PawPrint, Phone, MapPin, Calendar, Clock, Loader2, Dog, Cat, Save, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  agendado: { label: 'Agendado', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  realizado: { label: 'Realizado', className: 'bg-green-50 text-green-700 border-green-200' },
  cancelado: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
  lista_espera: { label: 'Lista de Espera', className: 'bg-orange-50 text-orange-700 border-orange-200' },
}

interface AnimalDetalhe {
  id: string
  nome: string
  especie: string
  raca: string
  sexo: string
  peso: number | null
  idadeAnos: number | null
  idadeMeses: number | null
  registroSinpatinhas: string | null
  status: string
  observacoes: string | null
  dataAgendamento: string | null
  horarioAgendamento: string | null
  localAgendamento: string | null
  enderecoAgendamento: string | null
  dataRealizacao: string | null
  createdAt: string
  tutor: {
    id: string
    nome: string
    cpf: string
    telefone: string
    email: string | null
    endereco: string
    cidade: string
    bairro: string
  }
  campanha: { id: string; nome: string; cidade: string } | null
  entidade: { nome: string; endereco: string; cidade: string; bairro: string }
}

export default function EntidadeAnimalDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [animal, setAnimal] = useState<AnimalDetalhe | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [editForm, setEditForm] = useState({
    nome: '', raca: '', peso: '', observacoes: '',
  })

  const [agendamento, setAgendamento] = useState({
    dataAgendamento: '',
    horarioAgendamento: '',
    localAgendamento: '',
    enderecoAgendamento: '',
  })
  const [querAgendar, setQuerAgendar] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('entidade_token')
    if (!token) {
      router.push('/entidade/login')
      return
    }
    fetchAnimal(token)
  }, [id, router])

  async function fetchAnimal(token: string) {
    try {
      const res = await fetch(`/api/entidade/animais/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem('entidade_token')
        router.push('/entidade/login')
        return
      }
      if (!res.ok) {
        setError('Animal não encontrado')
        return
      }
      const data: AnimalDetalhe = await res.json()
      setAnimal(data)
      setEditForm({
        nome: data.nome,
        raca: data.raca || '',
        peso: data.peso ? String(data.peso) : '',
        observacoes: data.observacoes || '',
      })
      if (data.status === 'agendado') {
        setAgendamento({
          dataAgendamento: data.dataAgendamento ? data.dataAgendamento.split('T')[0] : '',
          horarioAgendamento: data.horarioAgendamento || '',
          localAgendamento: data.localAgendamento || '',
          enderecoAgendamento: data.enderecoAgendamento || '',
        })
      } else {
        setAgendamento({
          dataAgendamento: '',
          horarioAgendamento: '',
          localAgendamento: data.entidade.nome || '',
          enderecoAgendamento: data.entidade.endereco || `${data.entidade.bairro} - ${data.entidade.cidade}`,
        })
      }
    } catch {
      setError('Erro ao carregar dados do animal')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    const token = localStorage.getItem('entidade_token')
    if (!token || !animal) return

    setSaving(true)
    setError('')
    setSuccess('')

    const payload: Record<string, string | number | null> = {
      nome: editForm.nome,
      raca: editForm.raca,
      peso: editForm.peso ? parseFloat(editForm.peso) : null,
      observacoes: editForm.observacoes || null,
    }

    if (querAgendar && animal.status === 'pendente') {
      if (!agendamento.dataAgendamento || !agendamento.horarioAgendamento) {
        setError('Data e horário são obrigatórios para agendar.')
        setSaving(false)
        return
      }
      payload.status = 'agendado'
      payload.dataAgendamento = agendamento.dataAgendamento
      payload.horarioAgendamento = agendamento.horarioAgendamento
      payload.localAgendamento = agendamento.localAgendamento || null
      payload.enderecoAgendamento = agendamento.enderecoAgendamento || null
    }

    try {
      const res = await fetch(`/api/entidade/animais/${animal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao salvar')
        return
      }

      const updated = await res.json()
      setAnimal({ ...animal, ...updated })
      setQuerAgendar(false)
      setSuccess(payload.status === 'agendado' ? 'Castração agendada com sucesso!' : 'Dados salvos com sucesso!')

      if (payload.status === 'agendado') {
        setAgendamento({
          dataAgendamento: updated.dataAgendamento?.split('T')[0] || '',
          horarioAgendamento: updated.horarioAgendamento || '',
          localAgendamento: updated.localAgendamento || '',
          enderecoAgendamento: updated.enderecoAgendamento || '',
        })

        // Abre WhatsApp Web com a mensagem para o tutor
        if (updated.whatsappData) {
          const { telefone, mensagem } = updated.whatsappData
          const phone = telefone.replace(/\D/g, '')
          const url = `https://wa.me/55${phone}?text=${encodeURIComponent(mensagem)}`
          window.open(url, '_blank')
        }
      }
    } catch {
      setError('Erro ao salvar alterações')
    } finally {
      setSaving(false)
    }
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    return phone
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!animal) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error || 'Animal não encontrado'}</p>
        <Button onClick={() => router.push('/entidade/dashboard')}>Voltar ao Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/entidade/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            {animal.especie === 'cachorro' ? <Dog className="w-5 h-5 text-primary" /> : <Cat className="w-5 h-5 text-primary" />}
            <h1 className="text-lg font-semibold text-gray-900">{animal.nome}</h1>
            <Badge className={statusConfig[animal.status]?.className}>
              {statusConfig[animal.status]?.label}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Mensagens */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info do Animal (read-only) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <PawPrint className="w-4 h-4" /> Dados do Animal
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Espécie</p>
                  <p className="font-medium">{animal.especie === 'cachorro' ? 'Cachorro' : 'Gato'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sexo</p>
                  <p className="font-medium">{animal.sexo === 'macho' ? 'Macho' : 'Fêmea'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Raça</p>
                  <p className="font-medium">{animal.raca || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Peso</p>
                  <p className="font-medium">{animal.peso ? `${animal.peso} kg` : '-'}</p>
                </div>
                {(animal.idadeAnos || animal.idadeMeses) && (
                  <div>
                    <p className="text-xs text-gray-500">Idade</p>
                    <p className="font-medium">
                      {animal.idadeAnos ? `${animal.idadeAnos} ano(s)` : ''}
                      {animal.idadeAnos && animal.idadeMeses ? ' e ' : ''}
                      {animal.idadeMeses ? `${animal.idadeMeses} mês(es)` : ''}
                    </p>
                  </div>
                )}
                {animal.registroSinpatinhas && (
                  <div>
                    <p className="text-xs text-gray-500">RG Animal (SinPatinhas)</p>
                    <p className="font-mono font-medium">{animal.registroSinpatinhas}</p>
                  </div>
                )}
              </div>
              {animal.campanha && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">Campanha</p>
                  <p className="font-medium">{animal.campanha.nome}</p>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">Cadastrado em</p>
                <p className="font-medium">{formatDate(animal.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Info do Tutor (read-only) */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Tutor
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Nome</p>
                <p className="font-medium">{animal.tutor.nome}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Telefone</p>
                <a
                  href={`https://wa.me/55${animal.tutor.telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {formatPhone(animal.tutor.telefone)}
                </a>
              </div>
              {animal.tutor.email && (
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{animal.tutor.email}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Bairro</p>
                <p className="font-medium">{animal.tutor.bairro}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cidade</p>
                <p className="font-medium">{animal.tutor.cidade}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Edição de dados básicos */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Editar Dados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <Input
                value={editForm.nome}
                onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raça</label>
              <Input
                value={editForm.raca}
                onChange={e => setEditForm({ ...editForm, raca: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <Input
                type="number"
                step="0.1"
                value={editForm.peso}
                onChange={e => setEditForm({ ...editForm, peso: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                rows={3}
                value={editForm.observacoes}
                onChange={e => setEditForm({ ...editForm, observacoes: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Agendamento */}
        {animal.status === 'agendado' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" /> Agendamento Realizado
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-blue-600">Data</p>
                <p className="font-medium text-blue-900 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {agendamento.dataAgendamento ? formatDate(agendamento.dataAgendamento) : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Horário</p>
                <p className="font-medium text-blue-900 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {agendamento.horarioAgendamento || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Local</p>
                <p className="font-medium text-blue-900">{agendamento.localAgendamento || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600">Endereço</p>
                <p className="font-medium text-blue-900">{agendamento.enderecoAgendamento || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {animal.status === 'realizado' && animal.dataRealizacao && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" /> Castração Realizada
            </h2>
            <p className="text-green-800 font-medium">
              Data: {formatDate(animal.dataRealizacao)}
            </p>
          </div>
        )}

        {animal.status === 'pendente' && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            {!querAgendar ? (
              <div className="text-center">
                <Button
                  onClick={() => setQuerAgendar(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Agendar Castração
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4" /> Agendar Castração
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                    <Input
                      type="date"
                      value={agendamento.dataAgendamento}
                      onChange={e => setAgendamento({ ...agendamento, dataAgendamento: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horário *</label>
                    <Input
                      type="time"
                      value={agendamento.horarioAgendamento}
                      onChange={e => setAgendamento({ ...agendamento, horarioAgendamento: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                    <Input
                      value={agendamento.localAgendamento}
                      onChange={e => setAgendamento({ ...agendamento, localAgendamento: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <Input
                      value={agendamento.enderecoAgendamento}
                      onChange={e => setAgendamento({ ...agendamento, enderecoAgendamento: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuerAgendar(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Botão Salvar */}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => router.push('/entidade/dashboard')}>
            Voltar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> {querAgendar ? 'Salvar e Agendar' : 'Salvar Alterações'}</>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
