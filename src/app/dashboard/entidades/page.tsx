'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Search, Phone, Mail, MapPin, Building2, Check, X, Loader2, FileDown, Trash2, KeyRound, Plus, Pencil, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { gerarPDFEntidades } from '@/lib/pdf-generator'
import { Entidade } from '@/lib/types'

export default function EntidadesPage() {
  const { data: session } = useSession()
  const role = session?.user?.role || 'admin'
  const [entidades, setEntidades] = useState<Entidade[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [resettingPassword, setResettingPassword] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [novaForm, setNovaForm] = useState({
    nome: '',
    cnpj: '',
    responsavel: '',
    telefone: '',
    email: '',
    cidade: '',
    bairro: '',
    endereco: '',
  })
  const [editingEntidade, setEditingEntidade] = useState<Entidade | null>(null)
  const [editForm, setEditForm] = useState({
    nome: '',
    cnpj: '',
    responsavel: '',
    telefone: '',
    email: '',
    cidade: '',
    bairro: '',
    endereco: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEntidades()
  }, [])

  async function fetchEntidades() {
    try {
      const res = await fetch('/api/admin/entidades')
      const data = await res.json()
      setEntidades(data)
    } catch (error) {
      console.error('Erro ao buscar entidades:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/entidades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo }),
      })

      if (res.ok) {
        setEntidades(
          entidades.map((e) => (e.id === id ? { ...e, ativo } : e))
        )
      }
    } catch (error) {
      console.error('Erro ao atualizar entidade:', error)
    } finally {
      setUpdating(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta entidade? Esta acao nao pode ser desfeita.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/entidades/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEntidades(entidades.filter(e => e.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir')
      }
    } catch (error) {
      console.error('Erro ao excluir entidade:', error)
      alert('Erro ao excluir')
    } finally {
      setDeleting(null)
    }
  }

  async function handleResetPassword(id: string, nome: string) {
    if (!confirm(`Resetar a senha da entidade "${nome}"? Uma nova senha sera gerada.`)) return
    setResettingPassword(id)
    try {
      const res = await fetch(`/api/admin/entidades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetPassword: true }),
      })
      if (res.ok) {
        const data = await res.json()
        alert(`Nova senha para ${data.nome}:\n\n${data.novaSenha}\n\nAnote esta senha, ela nao sera exibida novamente.`)
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao resetar senha')
      }
    } catch (error) {
      console.error('Erro ao resetar senha:', error)
      alert('Erro ao resetar senha')
    } finally {
      setResettingPassword(null)
    }
  }

  async function criarEntidade(e: React.FormEvent) {
    e.preventDefault()
    if (!novaForm.nome.trim() || !novaForm.responsavel.trim() || !novaForm.telefone.trim() || !novaForm.email.trim() || !novaForm.cidade.trim()) return

    setCreating(true)
    try {
      const res = await fetch('/api/admin/entidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novaForm.nome,
          cnpj: novaForm.cnpj || null,
          responsavel: novaForm.responsavel,
          telefone: novaForm.telefone,
          email: novaForm.email,
          cidade: novaForm.cidade,
          bairro: novaForm.bairro || null,
          endereco: novaForm.endereco || null,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        const { senhaGerada, ...entidade } = data
        setEntidades([entidade, ...entidades])
        setNovaForm({ nome: '', cnpj: '', responsavel: '', telefone: '', email: '', cidade: '', bairro: '', endereco: '' })
        setShowForm(false)
        alert(`Entidade criada com sucesso!\n\nEmail: ${entidade.email}\nSenha: ${senhaGerada}\n\nAnote esta senha, ela nao sera exibida novamente.`)
      } else {
        alert(data.error || 'Erro ao criar entidade')
      }
    } catch (error) {
      console.error('Erro ao criar entidade:', error)
      alert('Erro ao criar entidade')
    } finally {
      setCreating(false)
    }
  }

  function openEditModal(entidade: Entidade) {
    setEditingEntidade(entidade)
    setEditForm({
      nome: entidade.nome,
      cnpj: entidade.cnpj || '',
      responsavel: entidade.responsavel,
      telefone: entidade.telefone,
      email: entidade.email,
      cidade: entidade.cidade,
      bairro: entidade.bairro || '',
      endereco: entidade.endereco || '',
    })
  }

  async function salvarEdicao() {
    if (!editingEntidade || !editForm.nome.trim() || !editForm.responsavel.trim() || !editForm.cidade.trim()) return

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/entidades/${editingEntidade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editForm.nome,
          cnpj: editForm.cnpj || null,
          responsavel: editForm.responsavel,
          telefone: editForm.telefone,
          email: editForm.email,
          cidade: editForm.cidade,
          bairro: editForm.bairro || null,
          endereco: editForm.endereco || null,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setEntidades(entidades.map(e => (e.id === editingEntidade.id ? updated : e)))
        setEditingEntidade(null)
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao salvar')
      }
    } catch (error) {
      console.error('Erro ao salvar entidade:', error)
      alert('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const entidadesFiltradas = entidades.filter(
    (e) =>
      e.nome.toLowerCase().includes(busca.toLowerCase()) ||
      e.responsavel.toLowerCase().includes(busca.toLowerCase()) ||
      e.cidade.toLowerCase().includes(busca.toLowerCase()) ||
      e.email.toLowerCase().includes(busca.toLowerCase())
  )

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const pendentes = entidades.filter((e) => !e.ativo).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entidades</h1>
          <p className="text-gray-500 mt-1">
            {entidades.length} entidades cadastradas
            {pendentes > 0 && (
              <span className="text-yellow-600 ml-2">
                ({pendentes} aguardando aprovacao)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {role === 'admin' && (
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Entidade
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => gerarPDFEntidades(entidadesFiltradas)}
            disabled={entidadesFiltradas.length === 0}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nova Entidade</h2>
          <form onSubmit={criarEntidade} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input id="nome" label="Nome da Entidade *" value={novaForm.nome} onChange={(e) => setNovaForm(prev => ({ ...prev, nome: e.target.value }))} placeholder="Ex: ONG Amigos dos Animais" />
              <Input id="cnpj" label="CNPJ" value={novaForm.cnpj} onChange={(e) => setNovaForm(prev => ({ ...prev, cnpj: e.target.value }))} placeholder="Opcional" />
              <Input id="responsavel" label="Responsavel *" value={novaForm.responsavel} onChange={(e) => setNovaForm(prev => ({ ...prev, responsavel: e.target.value }))} placeholder="Nome do responsavel" />
              <Input id="telefone" label="Telefone *" value={novaForm.telefone} onChange={(e) => setNovaForm(prev => ({ ...prev, telefone: e.target.value }))} placeholder="(31) 99999-9999" />
              <Input id="email" label="Email *" value={novaForm.email} onChange={(e) => setNovaForm(prev => ({ ...prev, email: e.target.value }))} placeholder="email@entidade.org" />
              <Input id="cidade" label="Cidade *" value={novaForm.cidade} onChange={(e) => setNovaForm(prev => ({ ...prev, cidade: e.target.value }))} placeholder="Ex: Barbacena" />
              <Input id="bairro" label="Bairro" value={novaForm.bairro} onChange={(e) => setNovaForm(prev => ({ ...prev, bairro: e.target.value }))} placeholder="Opcional" />
              <Input id="endereco" label="Endereco completo" value={novaForm.endereco} onChange={(e) => setNovaForm(prev => ({ ...prev, endereco: e.target.value }))} placeholder="Rua, numero, complemento" />
            </div>
            <p className="text-sm text-gray-500">A senha sera gerada automaticamente e exibida apos o cadastro.</p>
            <div className="flex gap-3">
              <Button type="submit" disabled={creating}>
                {creating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</>) : (<><Plus className="w-4 h-4 mr-2" />Criar Entidade</>)}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input placeholder="Buscar por nome, responsavel, cidade ou email..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {entidadesFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {busca ? 'Nenhuma entidade encontrada' : 'Nenhuma entidade cadastrada'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {entidadesFiltradas.map((entidade) => (
              <div key={entidade.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${entidade.ativo ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      <Building2 className={`w-6 h-6 ${entidade.ativo ? 'text-green-600' : 'text-yellow-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{entidade.nome}</h3>
                        <Badge className={entidade.ativo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}>
                          {entidade.ativo ? 'Ativa' : 'Pendente'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">Responsavel: {entidade.responsavel}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{formatPhone(entidade.telefone)}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{entidade.email}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{entidade.bairro ? `${entidade.bairro}, ` : ''}{entidade.cidade}</span>
                      </div>
                      {entidade.endereco && (
                        <p className="text-xs text-gray-400 mt-1">{entidade.endereco}</p>
                      )}
                      {entidade.cnpj && (
                        <p className="text-xs text-gray-400 mt-1">CNPJ: {entidade.cnpj}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDate(entidade.createdAt)}</span>
                    {role === 'admin' && (
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(entidade)} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Editar entidade">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {entidade.ativo ? (
                      <Button variant="ghost" size="sm" onClick={() => toggleAtivo(entidade.id, false)} disabled={updating === entidade.id} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        {updating === entidade.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-1" />Desativar</>}
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => toggleAtivo(entidade.id, true)} disabled={updating === entidade.id} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                        {updating === entidade.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />Aprovar</>}
                      </Button>
                    )}
                    {role === 'admin' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleResetPassword(entidade.id, entidade.nome)} disabled={resettingPassword === entidade.id} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Resetar senha">
                          {resettingPassword === entidade.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(entidade.id)} disabled={deleting === entidade.id} className="text-gray-400 hover:text-red-600 hover:bg-red-50" title="Excluir entidade">
                          {deleting === entidade.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de edicao */}
      {editingEntidade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setEditingEntidade(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] min-h-0 flex flex-col">
            <div className="flex items-center justify-between p-6 pb-0 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Editar: {editingEntidade.nome}</h2>
              <button onClick={() => setEditingEntidade(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <Input id="edit-nome" label="Nome da Entidade *" value={editForm.nome} onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))} />
              <Input id="edit-cnpj" label="CNPJ" value={editForm.cnpj} onChange={(e) => setEditForm(prev => ({ ...prev, cnpj: e.target.value }))} />
              <Input id="edit-responsavel" label="Responsavel *" value={editForm.responsavel} onChange={(e) => setEditForm(prev => ({ ...prev, responsavel: e.target.value }))} />
              <div className="grid grid-cols-2 gap-4">
                <Input id="edit-telefone" label="Telefone *" value={editForm.telefone} onChange={(e) => setEditForm(prev => ({ ...prev, telefone: e.target.value }))} />
                <Input id="edit-email" label="Email *" value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input id="edit-cidade" label="Cidade *" value={editForm.cidade} onChange={(e) => setEditForm(prev => ({ ...prev, cidade: e.target.value }))} />
                <Input id="edit-bairro" label="Bairro" value={editForm.bairro} onChange={(e) => setEditForm(prev => ({ ...prev, bairro: e.target.value }))} />
              </div>
              <Input id="edit-endereco" label="Endereco completo" value={editForm.endereco} onChange={(e) => setEditForm(prev => ({ ...prev, endereco: e.target.value }))} placeholder="Rua, numero, complemento" />
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 flex-shrink-0">
              <Button variant="outline" onClick={() => setEditingEntidade(null)}>Cancelar</Button>
              <Button onClick={salvarEdicao} disabled={saving}>
                {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>) : (<><Save className="w-4 h-4 mr-2" />Salvar</>)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
