'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Cat, LogOut, Search, Phone, MapPin, Calendar, PawPrint, Filter, Plus, Pencil, X, Loader2, Dog, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Animal, Entidade, Campanha } from '@/lib/types'

type AnimalComTutor = Animal & { tutor: { id: string; nome: string; cpf: string; telefone: string; email: string | null; bairro: string } }

interface TutorExistente {
  id: string
  nome: string
  cpf: string
  telefone: string
  email: string | null
  endereco: string
  cidade: string
  bairro: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  agendado: { label: 'Agendado', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  realizado: { label: 'Realizado', className: 'bg-green-50 text-green-700 border-green-200' },
  cancelado: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
  lista_espera: { label: 'Lista de Espera', className: 'bg-orange-50 text-orange-700 border-orange-200' },
}

export default function EntidadeDashboardPage() {
  const router = useRouter()
  const [entidade, setEntidade] = useState<Entidade | null>(null)
  const [animais, setAnimais] = useState<AnimalComTutor[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Cadastro state
  const [showCadastro, setShowCadastro] = useState(false)
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [cadastroStep, setCadastroStep] = useState<'tutor' | 'pet'>('tutor')
  const [tutorExistente, setTutorExistente] = useState<TutorExistente | null>(null)
  const [buscandoCpf, setBuscandoCpf] = useState(false)
  const [cpfBusca, setCpfBusca] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [cadastroError, setCadastroError] = useState('')
  const [cadastroSuccess, setCadastroSuccess] = useState(false)

  const [tutorForm, setTutorForm] = useState({
    nome: '', cpf: '', telefone: '', email: '', endereco: '', cidade: '', bairro: ''
  })
  const [petForm, setPetForm] = useState({
    nome: '', especie: 'cachorro', raca: '', sexo: 'macho', peso: '',
    idadeAnos: '', idadeMeses: '', registroSinpatinhas: '', observacoes: '', campanhaId: ''
  })

  // Edit state
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', especie: '', raca: '', peso: '', observacoes: '' })
  const [editSaving, setEditSaving] = useState(false)

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

  async function fetchCampanhas() {
    const token = localStorage.getItem('entidade_token')
    if (!token) return
    try {
      const res = await fetch('/api/entidade/campanhas', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCampanhas(data)
      }
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('entidade_token')
    localStorage.removeItem('entidade_id')
    localStorage.removeItem('entidade_nome')
    router.push('/entidade/login')
  }

  function openCadastro() {
    setShowCadastro(true)
    setCadastroStep('tutor')
    setTutorExistente(null)
    setCpfBusca('')
    setTutorForm({ nome: '', cpf: '', telefone: '', email: '', endereco: '', cidade: '', bairro: '' })
    setPetForm({ nome: '', especie: 'cachorro', raca: '', sexo: 'macho', peso: '', idadeAnos: '', idadeMeses: '', registroSinpatinhas: '', observacoes: '', campanhaId: '' })
    setCadastroError('')
    setCadastroSuccess(false)
    fetchCampanhas()
  }

  async function buscarCpf() {
    const cpf = cpfBusca.replace(/\D/g, '')
    if (cpf.length !== 11) {
      setCadastroError('CPF deve ter 11 dígitos')
      return
    }
    setBuscandoCpf(true)
    setCadastroError('')
    const token = localStorage.getItem('entidade_token')
    try {
      const res = await fetch(`/api/tutores/cpf/${cpf}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTutorExistente(data)
        setTutorForm({
          nome: data.nome, cpf: data.cpf, telefone: data.telefone,
          email: data.email || '', endereco: data.endereco, cidade: data.cidade, bairro: data.bairro
        })
      } else {
        setTutorExistente(null)
        setTutorForm(prev => ({ ...prev, cpf }))
      }
    } catch {
      setCadastroError('Erro ao buscar CPF')
    } finally {
      setBuscandoCpf(false)
    }
  }

  function avancarParaPet() {
    if (!tutorExistente && (!tutorForm.nome || !tutorForm.cpf || !tutorForm.telefone || !tutorForm.endereco || !tutorForm.cidade || !tutorForm.bairro)) {
      setCadastroError('Preencha todos os campos obrigatórios do tutor')
      return
    }
    setCadastroError('')
    setCadastroStep('pet')
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault()
    if (!petForm.nome || !petForm.raca || !petForm.campanhaId) {
      setCadastroError('Preencha nome, raça e selecione uma campanha')
      return
    }
    setSalvando(true)
    setCadastroError('')
    const token = localStorage.getItem('entidade_token')
    try {
      const res = await fetch('/api/entidade/cadastrar-animal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...petForm,
          tutorCpf: tutorForm.cpf,
          tutor: tutorExistente ? undefined : tutorForm,
        }),
      })
      if (res.ok) {
        setCadastroSuccess(true)
        setTimeout(() => {
          setShowCadastro(false)
          fetchData(token!)
        }, 2000)
      } else {
        const data = await res.json()
        setCadastroError(data.error || 'Erro ao cadastrar')
      }
    } catch {
      setCadastroError('Erro de conexão')
    } finally {
      setSalvando(false)
    }
  }

  function openEdit(animal: Animal) {
    setEditAnimal(animal)
    setEditForm({
      nome: animal.nome,
      especie: animal.especie,
      raca: animal.raca,
      peso: animal.peso?.toString() || '',
      observacoes: '',
    })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editAnimal) return
    setEditSaving(true)
    const token = localStorage.getItem('entidade_token')
    try {
      const res = await fetch(`/api/entidade/animais/${editAnimal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nome: editForm.nome,
          especie: editForm.especie,
          raca: editForm.raca,
          peso: editForm.peso ? parseFloat(editForm.peso) : null,
          observacoes: editForm.observacoes || null,
        }),
      })
      if (res.ok) {
        setEditAnimal(null)
        fetchData(token!)
      }
    } catch (error) {
      console.error('Erro ao editar:', error)
    } finally {
      setEditSaving(false)
    }
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

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR')

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
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={openCadastro}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cadastro
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
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
              <option value="lista_espera">Lista de Espera</option>
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
                    <div className="flex items-center gap-2">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(animal)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Cadastro */}
      {showCadastro && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-lg font-semibold">
                {cadastroSuccess ? 'Cadastro Realizado!' : cadastroStep === 'tutor' ? 'Dados do Tutor' : 'Dados do Pet'}
              </h2>
              <button onClick={() => setShowCadastro(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {cadastroSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PawPrint className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-600">Animal cadastrado com sucesso!</p>
              </div>
            ) : cadastroStep === 'tutor' ? (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF do Tutor *</label>
                  <div className="flex gap-2">
                    <Input
                      value={cpfBusca}
                      onChange={e => setCpfBusca(e.target.value)}
                      placeholder="000.000.000-00"
                      className="flex-1"
                    />
                    <Button onClick={buscarCpf} disabled={buscandoCpf} size="sm">
                      {buscandoCpf ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                    </Button>
                  </div>
                </div>

                {tutorExistente && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-800">Tutor encontrado!</p>
                    <p className="text-sm text-green-700">{tutorExistente.nome} — {tutorExistente.cidade}</p>
                  </div>
                )}

                {!tutorExistente && tutorForm.cpf && (
                  <div className="space-y-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-700">Tutor não encontrado. Preencha os dados abaixo.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                      <Input value={tutorForm.nome} onChange={e => setTutorForm({ ...tutorForm, nome: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                      <Input value={tutorForm.telefone} onChange={e => setTutorForm({ ...tutorForm, telefone: e.target.value })} placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input type="email" value={tutorForm.email} onChange={e => setTutorForm({ ...tutorForm, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endereço *</label>
                      <Input value={tutorForm.endereco} onChange={e => setTutorForm({ ...tutorForm, endereco: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                        <Input value={tutorForm.cidade} onChange={e => setTutorForm({ ...tutorForm, cidade: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                        <Input value={tutorForm.bairro} onChange={e => setTutorForm({ ...tutorForm, bairro: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                {cadastroError && <p className="text-sm text-red-600">{cadastroError}</p>}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowCadastro(false)}>Cancelar</Button>
                  <Button onClick={avancarParaPet} disabled={!tutorExistente && !tutorForm.cpf}>
                    Próximo
                    <ChevronDown className="w-4 h-4 ml-1 -rotate-90" />
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCadastrar} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campanha *</label>
                  <select
                    value={petForm.campanhaId}
                    onChange={e => setPetForm({ ...petForm, campanhaId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Selecione</option>
                    {campanhas.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} — {c.cidade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Pet *</label>
                  <Input value={petForm.nome} onChange={e => setPetForm({ ...petForm, nome: e.target.value })} required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Espécie</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPetForm({ ...petForm, especie: 'cachorro' })}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border-2 text-sm ${petForm.especie === 'cachorro' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200'}`}>
                        <Dog className="w-4 h-4" /> Cão
                      </button>
                      <button type="button" onClick={() => setPetForm({ ...petForm, especie: 'gato' })}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border-2 text-sm ${petForm.especie === 'gato' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200'}`}>
                        <Cat className="w-4 h-4" /> Gato
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPetForm({ ...petForm, sexo: 'macho' })}
                        className={`flex-1 py-2 rounded-lg border-2 text-sm ${petForm.sexo === 'macho' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200'}`}>
                        Macho
                      </button>
                      <button type="button" onClick={() => setPetForm({ ...petForm, sexo: 'femea' })}
                        className={`flex-1 py-2 rounded-lg border-2 text-sm ${petForm.sexo === 'femea' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200'}`}>
                        Fêmea
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raça *</label>
                  <Input value={petForm.raca} onChange={e => setPetForm({ ...petForm, raca: e.target.value })} required />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                    <Input type="number" step="0.1" value={petForm.peso} onChange={e => setPetForm({ ...petForm, peso: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Anos</label>
                    <Input type="number" min="0" value={petForm.idadeAnos} onChange={e => setPetForm({ ...petForm, idadeAnos: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meses</label>
                    <Input type="number" min="0" max="11" value={petForm.idadeMeses} onChange={e => setPetForm({ ...petForm, idadeMeses: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RG Animal - SinPatinhas (opcional)</label>
                  <Input value={petForm.registroSinpatinhas} onChange={e => setPetForm({ ...petForm, registroSinpatinhas: e.target.value })} placeholder="BR-000000000000" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea
                    value={petForm.observacoes}
                    onChange={e => setPetForm({ ...petForm, observacoes: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  />
                </div>

                {cadastroError && <p className="text-sm text-red-600">{cadastroError}</p>}

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setCadastroStep('tutor')}>
                    <ChevronDown className="w-4 h-4 mr-1 rotate-90" />
                    Voltar
                  </Button>
                  <Button type="submit" disabled={salvando}>
                    {salvando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PawPrint className="w-4 h-4 mr-2" />}
                    Cadastrar
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Edição */}
      {editAnimal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Editar Animal</h2>
              <button onClick={() => setEditAnimal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <Input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raça</label>
                <Input value={editForm.raca} onChange={e => setEditForm({ ...editForm, raca: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                <Input type="number" step="0.1" value={editForm.peso} onChange={e => setEditForm({ ...editForm, peso: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={editForm.observacoes}
                  onChange={e => setEditForm({ ...editForm, observacoes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditAnimal(null)}>Cancelar</Button>
                <Button type="submit" disabled={editSaving}>
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Salvar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
