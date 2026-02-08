'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, UserCog, Plus, Pencil, Trash2, Loader2, X, Eye, EyeOff, KeyRound } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Usuario } from '@/lib/types'

export default function UsuariosPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Reset password state
  const [resetUser, setResetUser] = useState<Usuario | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetSaving, setResetSaving] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  // Form state
  const [form, setForm] = useState({ nome: '', email: '', password: '', role: 'assistente' })
  const [formError, setFormError] = useState('')

  const role = session?.user?.role || 'admin'

  useEffect(() => {
    if (role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchUsuarios()
  }, [role, router])

  async function fetchUsuarios() {
    try {
      const res = await fetch('/api/admin/usuarios')
      if (res.ok) {
        const data = await res.json()
        setUsuarios(data)
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditando(null)
    setForm({ nome: '', email: '', password: '', role: 'assistente' })
    setFormError('')
    setShowPassword(false)
    setShowModal(true)
  }

  function openEdit(user: Usuario) {
    setEditando(user)
    setForm({ nome: user.nome, email: user.email, password: '', role: user.role })
    setFormError('')
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    try {
      if (editando) {
        const res = await fetch(`/api/admin/usuarios/${editando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: form.nome, role: form.role }),
        })
        if (!res.ok) {
          const data = await res.json()
          setFormError(data.error || 'Erro ao atualizar')
          return
        }
        const updated = await res.json()
        setUsuarios(usuarios.map(u => u.id === updated.id ? updated : u))
      } else {
        if (!form.password) {
          setFormError('Senha é obrigatória')
          return
        }
        const res = await fetch('/api/admin/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const data = await res.json()
          setFormError(data.error || 'Erro ao criar')
          return
        }
        const created = await res.json()
        setUsuarios([...usuarios, created])
      }
      setShowModal(false)
    } catch {
      setFormError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  function openResetPassword(user: Usuario) {
    setResetUser(user)
    setResetPassword('')
    setShowResetPassword(false)
    setResetError('')
    setResetSuccess(false)
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetUser) return
    setResetSaving(true)
    setResetError('')
    setResetSuccess(false)

    try {
      const res = await fetch(`/api/admin/usuarios/${resetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      })
      if (!res.ok) {
        const data = await res.json()
        setResetError(data.error || 'Erro ao resetar senha')
        return
      }
      setResetSuccess(true)
      setTimeout(() => setResetUser(null), 1500)
    } catch {
      setResetError('Erro de conexão')
    } finally {
      setResetSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsuarios(usuarios.filter(u => u.id !== id))
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir')
      }
    } catch {
      alert('Erro de conexão')
    } finally {
      setDeleting(null)
    }
  }

  const filtrados = usuarios.filter(
    u => u.nome.toLowerCase().includes(busca.toLowerCase()) ||
         u.email.toLowerCase().includes(busca.toLowerCase())
  )

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (role !== 'admin') return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 mt-1">{usuarios.length} usuários cadastrados</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {busca ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtrados.map(user => {
              const isMe = session?.user?.id === user.id
              return (
                <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        user.role === 'admin' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <UserCog className={`w-5 h-5 ${
                          user.role === 'admin' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {user.nome}
                            {isMe && <span className="text-xs text-gray-400 ml-1">(você)</span>}
                          </h3>
                          <Badge className={
                            user.role === 'admin'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }>
                            {user.role === 'admin' ? 'Admin' : 'Assistente'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatDate(user.createdAt)}</span>
                      {!isMe && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openResetPassword(user)}
                            className="text-gray-600 hover:text-orange-600"
                            title="Resetar senha"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(user)}
                            className="text-gray-600 hover:text-blue-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            disabled={deleting === user.id}
                            className="text-gray-600 hover:text-red-600"
                          >
                            {deleting === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editando ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <Input
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  required
                />
              </div>
              {!editando && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Papel</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="admin">Admin — Acesso total</option>
                  <option value="assistente">Assistente — Sem excluir</option>
                </select>
              </div>
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editando ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Senha */}
      {resetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Resetar Senha</h2>
              <button onClick={() => setResetUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-4 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  Definir nova senha para <strong>{resetUser.nome}</strong> ({resetUser.email})
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                <div className="relative">
                  <Input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {resetError && (
                <p className="text-sm text-red-600">{resetError}</p>
              )}
              {resetSuccess && (
                <p className="text-sm text-green-600">Senha atualizada com sucesso!</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setResetUser(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={resetSaving || resetSuccess}>
                  {resetSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                  Resetar Senha
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
