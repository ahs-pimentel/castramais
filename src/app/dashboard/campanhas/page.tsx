'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  Check,
  X,
  Loader2,
  Building2,
  ChevronDown,
  ChevronUp,
  Link2,
  Unlink,
  Pencil,
  Save,
  Trash2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Campanha, Entidade } from '@/lib/types'

interface EntidadeVinculada {
  id: string
  nome: string
  cidade: string
  bairro: string | null
}

export default function CampanhasPage() {
  const { data: session } = useSession()
  const role = session?.user?.role || 'admin'
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [expandedCampanha, setExpandedCampanha] = useState<string | null>(null)
  const [entidadesVinculadas, setEntidadesVinculadas] = useState<Record<string, EntidadeVinculada[]>>({})
  const [todasEntidades, setTodasEntidades] = useState<Entidade[]>([])
  const [loadingEntidades, setLoadingEntidades] = useState<string | null>(null)
  const [linkingEntidade, setLinkingEntidade] = useState<string | null>(null)
  const [editingCampanha, setEditingCampanha] = useState<Campanha | null>(null)
  const [modalTab, setModalTab] = useState<'dados' | 'entidades'>('dados')
  const [editForm, setEditForm] = useState({
    nome: '',
    cidade: '',
    uf: '',
    endereco: '',
    bairro: '',
    dataInicio: '',
    dataFim: '',
    dataDescricao: '',
    limite: '',
  })
  const [saving, setSaving] = useState(false)

  const [novaForm, setNovaForm] = useState({
    nome: '',
    cidade: '',
    uf: 'MG',
    endereco: '',
    bairro: '',
    dataInicio: '',
    dataFim: '',
    dataDescricao: '',
    limite: '200',
  })

  useEffect(() => {
    fetchCampanhas()
    fetchTodasEntidades()
  }, [])

  async function fetchCampanhas() {
    try {
      const res = await fetch('/api/campanhas?all=true')
      const data = await res.json()
      setCampanhas(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTodasEntidades() {
    try {
      const res = await fetch('/api/admin/entidades')
      const data = await res.json()
      setTodasEntidades(Array.isArray(data) ? data.filter((e: Entidade) => e.ativo) : [])
    } catch {
      setTodasEntidades([])
    }
  }

  async function fetchEntidadesCampanha(campanhaId: string) {
    setLoadingEntidades(campanhaId)
    try {
      const res = await fetch(`/api/campanhas/${campanhaId}/entidades`)
      if (res.ok) {
        const data = await res.json()
        setEntidadesVinculadas(prev => ({ ...prev, [campanhaId]: data }))
      }
    } catch (error) {
      console.error('Erro ao buscar entidades da campanha:', error)
    } finally {
      setLoadingEntidades(null)
    }
  }

  async function toggleAtiva(id: string, ativa: boolean) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/campanhas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativa }),
      })

      if (res.ok) {
        setCampanhas(campanhas.map(c => (c.id === id ? { ...c, ativa } : c)))
      }
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error)
    } finally {
      setUpdating(null)
    }
  }

  async function criarCampanha(e: React.FormEvent) {
    e.preventDefault()
    if (!novaForm.nome.trim() || !novaForm.cidade.trim()) return

    setCreating(true)
    try {
      const res = await fetch('/api/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novaForm.nome,
          cidade: novaForm.cidade,
          uf: novaForm.uf || 'MG',
          dataInicio: novaForm.dataInicio || null,
          dataFim: novaForm.dataFim || null,
          dataDescricao: novaForm.dataDescricao || null,
          limite: parseInt(novaForm.limite) || 200,
        }),
      })

      if (res.ok) {
        const novaCampanha = await res.json()
        setCampanhas([novaCampanha, ...campanhas])
        setNovaForm({
          nome: '',
          cidade: '',
          uf: 'MG',
          endereco: '',
          bairro: '',
          dataInicio: '',
          dataFim: '',
          dataDescricao: '',
          limite: '200',
        })
        setShowForm(false)
      }
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
    } finally {
      setCreating(false)
    }
  }

  async function vincularEntidade(campanhaId: string, entidadeId: string) {
    setLinkingEntidade(entidadeId)
    try {
      const res = await fetch(`/api/campanhas/${campanhaId}/entidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entidadeId }),
      })

      if (res.ok) {
        await fetchEntidadesCampanha(campanhaId)
      }
    } catch (error) {
      console.error('Erro ao vincular entidade:', error)
    } finally {
      setLinkingEntidade(null)
    }
  }

  async function desvincularEntidade(campanhaId: string, entidadeId: string) {
    setLinkingEntidade(entidadeId)
    try {
      const res = await fetch(`/api/campanhas/${campanhaId}/entidades`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entidadeId }),
      })

      if (res.ok) {
        await fetchEntidadesCampanha(campanhaId)
      }
    } catch (error) {
      console.error('Erro ao desvincular entidade:', error)
    } finally {
      setLinkingEntidade(null)
    }
  }

  function openEditModal(campanha: Campanha) {
    setEditingCampanha(campanha)
    setModalTab('dados')
    setEditForm({
      nome: campanha.nome,
      cidade: campanha.cidade,
      uf: campanha.uf,
      endereco: campanha.endereco || '',
      bairro: campanha.bairro || '',
      dataInicio: campanha.dataInicio?.split('T')[0] || '',
      dataFim: campanha.dataFim?.split('T')[0] || '',
      dataDescricao: campanha.dataDescricao || '',
      limite: String(campanha.limite),
    })
    if (!entidadesVinculadas[campanha.id]) {
      fetchEntidadesCampanha(campanha.id)
    }
  }

  function closeEditModal() {
    setEditingCampanha(null)
  }

  async function salvarEdicao() {
    if (!editingCampanha || !editForm.nome.trim() || !editForm.cidade.trim()) return

    setSaving(true)
    try {
      const res = await fetch(`/api/campanhas/${editingCampanha.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editForm.nome,
          cidade: editForm.cidade,
          uf: editForm.uf || 'MG',
          dataInicio: editForm.dataInicio || null,
          dataFim: editForm.dataFim || null,
          dataDescricao: editForm.dataDescricao || null,
          limite: parseInt(editForm.limite) || 200,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setCampanhas(campanhas.map(c => (c.id === editingCampanha.id ? updated : c)))
        setEditingCampanha(null)
      }
    } catch (error) {
      console.error('Erro ao salvar campanha:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/campanhas/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCampanhas(campanhas.filter(c => c.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir')
      }
    } catch (error) {
      console.error('Erro ao excluir campanha:', error)
      alert('Erro ao excluir')
    } finally {
      setDeleting(null)
    }
  }

  function toggleExpand(campanhaId: string) {
    if (expandedCampanha === campanhaId) {
      setExpandedCampanha(null)
    } else {
      setExpandedCampanha(campanhaId)
      if (!entidadesVinculadas[campanhaId]) {
        fetchEntidadesCampanha(campanhaId)
      }
    }
  }

  const campanhasFiltradas = campanhas.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.cidade.toLowerCase().includes(busca.toLowerCase())
  )

  const formatDate = (date: string) => {
    const datePart = date.split('T')[0]
    const [year, month, day] = datePart.split('-')
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return d.toLocaleDateString('pt-BR')
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
          <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-gray-500 mt-1">
            {campanhas.length} campanhas cadastradas
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Formulário de nova campanha */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nova Campanha</h2>
          <form onSubmit={criarCampanha} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="nome"
                label="Nome da Campanha *"
                value={novaForm.nome}
                onChange={(e) => setNovaForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Campanha Fevereiro 2026"
              />
              <Input
                id="cidade"
                label="Cidade *"
                value={novaForm.cidade}
                onChange={(e) => setNovaForm(prev => ({ ...prev, cidade: e.target.value }))}
                placeholder="Ex: Barbacena"
              />
              <Input
                id="uf"
                label="UF"
                value={novaForm.uf}
                onChange={(e) => setNovaForm(prev => ({ ...prev, uf: e.target.value }))}
                placeholder="MG"
              />
              <Input
                id="limite"
                label="Limite de vagas"
                type="number"
                value={novaForm.limite}
                onChange={(e) => setNovaForm(prev => ({ ...prev, limite: e.target.value }))}
                placeholder="200"
              />
              <div className="md:col-span-2">
                <Input
                  id="endereco"
                  label="Endereço do local de castração"
                  value={novaForm.endereco}
                  onChange={(e) => setNovaForm(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Ex: Rua das Flores, 123"
                />
              </div>
              <Input
                id="bairro"
                label="Bairro"
                value={novaForm.bairro}
                onChange={(e) => setNovaForm(prev => ({ ...prev, bairro: e.target.value }))}
                placeholder="Ex: Centro"
              />
              <Input
                id="dataInicio"
                label="Data de Inicio"
                type="date"
                value={novaForm.dataInicio}
                onChange={(e) => setNovaForm(prev => ({ ...prev, dataInicio: e.target.value }))}
              />
              <Input
                id="dataFim"
                label="Data de Fim"
                type="date"
                value={novaForm.dataFim}
                onChange={(e) => setNovaForm(prev => ({ ...prev, dataFim: e.target.value }))}
              />
              <div className="md:col-span-2">
                <Input
                  id="dataDescricao"
                  label="Descricao da Data (exibida no site)"
                  value={novaForm.dataDescricao}
                  onChange={(e) => setNovaForm(prev => ({ ...prev, dataDescricao: e.target.value }))}
                  placeholder="Ex: 20 e 21 de Fevereiro"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Campanha
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou cidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de campanhas */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {campanhasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {busca ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha cadastrada'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {campanhasFiltradas.map((campanha) => {
              const isExpanded = expandedCampanha === campanha.id
              const vinculadas = entidadesVinculadas[campanha.id] || []

              return (
                <div key={campanha.id}>
                  <div className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            campanha.ativa ? 'bg-green-100' : 'bg-gray-100'
                          }`}
                        >
                          <Calendar
                            className={`w-6 h-6 ${
                              campanha.ativa ? 'text-green-600' : 'text-gray-400'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{campanha.nome}</h3>
                            <Badge
                              className={
                                campanha.ativa
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-gray-50 text-gray-500 border-gray-200'
                              }
                            >
                              {campanha.ativa ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {campanha.endereco ? `${campanha.endereco}, ` : ''}{campanha.bairro ? `${campanha.bairro} - ` : ''}{campanha.cidade}/{campanha.uf}
                            </span>
                            {campanha.dataDescricao && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {campanha.dataDescricao}
                              </span>
                            )}
                            <span>Limite: {campanha.limite} vagas</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {formatDate(campanha.createdAt)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(campanha)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Editar campanha"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(campanha.id)}
                          className="text-gray-500"
                          title="Entidades vinculadas"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                        {campanha.ativa ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAtiva(campanha.id, false)}
                            disabled={updating === campanha.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {updating === campanha.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Desativar
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAtiva(campanha.id, true)}
                            disabled={updating === campanha.id}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            {updating === campanha.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Ativar
                              </>
                            )}
                          </Button>
                        )}
                        {role === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(campanha.id)}
                            disabled={deleting === campanha.id}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            {deleting === campanha.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Entidades vinculadas (expandido - somente leitura) */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                      <div className="pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="w-4 h-4 text-gray-600" />
                          <h4 className="font-medium text-gray-700 text-sm">Entidades Vinculadas</h4>
                        </div>

                        {loadingEntidades === campanha.id ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          </div>
                        ) : vinculadas.length === 0 ? (
                          <p className="text-sm text-gray-400">
                            Nenhuma entidade vinculada
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {vinculadas.map(ent => (
                              <div
                                key={ent.id}
                                className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200"
                              >
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{ent.nome}</span>
                                <span className="text-xs text-gray-400">
                                  {ent.bairro ? `${ent.bairro}, ` : ''}{ent.cidade}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de edição */}
      {editingCampanha && (() => {
        const vinculadas = entidadesVinculadas[editingCampanha.id] || []
        const vinculadasIds = vinculadas.map(e => e.id)
        const disponiveis = todasEntidades.filter(e => !vinculadasIds.includes(e.id))

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={closeEditModal}
            />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] min-h-0 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-0 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingCampanha.nome}
                </h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 px-6 mt-4 flex-shrink-0">
                <button
                  onClick={() => setModalTab('dados')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    modalTab === 'dados'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    Dados
                  </span>
                </button>
                <button
                  onClick={() => setModalTab('entidades')}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    modalTab === 'entidades'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Entidades
                    {vinculadas.length > 0 && (
                      <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5">
                        {vinculadas.length}
                      </span>
                    )}
                  </span>
                </button>
              </div>

              {/* Conteúdo com scroll */}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                {/* Aba Dados */}
                {modalTab === 'dados' && (
                  <div className="space-y-4">
                    <Input
                      id="edit-nome"
                      label="Nome da Campanha *"
                      value={editForm.nome}
                      onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Input
                          id="edit-cidade"
                          label="Cidade *"
                          value={editForm.cidade}
                          onChange={(e) => setEditForm(prev => ({ ...prev, cidade: e.target.value }))}
                        />
                      </div>
                      <Input
                        id="edit-uf"
                        label="UF"
                        value={editForm.uf}
                        onChange={(e) => setEditForm(prev => ({ ...prev, uf: e.target.value }))}
                      />
                    </div>
                    <Input
                      id="edit-endereco"
                      label="Endereço do local de castração"
                      value={editForm.endereco}
                      onChange={(e) => setEditForm(prev => ({ ...prev, endereco: e.target.value }))}
                      placeholder="Ex: Rua das Flores, 123"
                    />
                    <Input
                      id="edit-bairro"
                      label="Bairro"
                      value={editForm.bairro}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bairro: e.target.value }))}
                      placeholder="Ex: Centro"
                    />
                    <Input
                      id="edit-limite"
                      label="Limite de vagas"
                      type="number"
                      value={editForm.limite}
                      onChange={(e) => setEditForm(prev => ({ ...prev, limite: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        id="edit-dataInicio"
                        label="Data de Inicio"
                        type="date"
                        value={editForm.dataInicio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, dataInicio: e.target.value }))}
                      />
                      <Input
                        id="edit-dataFim"
                        label="Data de Fim"
                        type="date"
                        value={editForm.dataFim}
                        onChange={(e) => setEditForm(prev => ({ ...prev, dataFim: e.target.value }))}
                      />
                    </div>
                    <Input
                      id="edit-dataDescricao"
                      label="Descricao da Data (exibida no site)"
                      value={editForm.dataDescricao}
                      onChange={(e) => setEditForm(prev => ({ ...prev, dataDescricao: e.target.value }))}
                      placeholder="Ex: 20 e 21 de Fevereiro"
                    />
                  </div>
                )}

                {/* Aba Entidades */}
                {modalTab === 'entidades' && (
                  <div>
                    {loadingEntidades === editingCampanha.id ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      </div>
                    ) : (
                      <>
                        {/* Entidades vinculadas */}
                        {vinculadas.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-6">
                            Nenhuma entidade vinculada a esta campanha
                          </p>
                        ) : (
                          <div className="space-y-2 mb-4">
                            {vinculadas.map(ent => (
                              <div
                                key={ent.id}
                                className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-sm text-gray-700 block truncate">{ent.nome}</span>
                                    <span className="text-xs text-gray-400">
                                      {ent.bairro ? `${ent.bairro}, ` : ''}{ent.cidade}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => desvincularEntidade(editingCampanha.id, ent.id)}
                                  disabled={linkingEntidade === ent.id}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                                >
                                  {linkingEntidade === ent.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Unlink className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Adicionar entidade */}
                        {disponiveis.length > 0 && (
                          <div className="pt-4 border-t border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Vincular nova entidade
                            </label>
                            <div className="flex items-center gap-2">
                              <select
                                id="modal-add-entidade"
                                className="flex-1 text-sm rounded-lg border border-gray-300 px-3 py-2.5 bg-white focus:border-primary focus:outline-none"
                                defaultValue=""
                              >
                                <option value="" disabled>Selecione...</option>
                                {disponiveis.map(ent => (
                                  <option key={ent.id} value={ent.id}>
                                    {ent.nome} — {ent.cidade}
                                  </option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                onClick={() => {
                                  const select = document.getElementById('modal-add-entidade') as HTMLSelectElement
                                  if (select?.value) {
                                    vincularEntidade(editingCampanha.id, select.value)
                                    select.value = ''
                                  }
                                }}
                              >
                                <Link2 className="w-4 h-4 mr-1" />
                                Vincular
                              </Button>
                            </div>
                          </div>
                        )}

                        {disponiveis.length === 0 && vinculadas.length > 0 && (
                          <p className="text-xs text-gray-400 text-center pt-4 border-t border-gray-200">
                            Todas as entidades ativas já estão vinculadas
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {modalTab === 'dados' && (
                <div className="flex justify-end gap-3 p-6 border-t border-gray-100 flex-shrink-0">
                  <Button variant="outline" onClick={closeEditModal}>
                    Cancelar
                  </Button>
                  <Button onClick={salvarEdicao} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              )}
              {modalTab === 'entidades' && (
                <div className="flex justify-end p-6 border-t border-gray-100 flex-shrink-0">
                  <Button variant="outline" onClick={closeEditModal}>
                    Fechar
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
