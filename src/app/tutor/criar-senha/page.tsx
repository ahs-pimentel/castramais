'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function CriarSenhaPage() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    const storedToken = localStorage.getItem('tutor_token')
    if (!storedToken) {
      router.push('/tutor')
      return
    }
    setToken(storedToken)
  }, [router])

  const senhaValida = senha.length >= 6
  const senhasIguais = senha === confirmar && confirmar.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!senhaValida) {
      setError('Senha deve ter no mínimo 6 caracteres')
      return
    }

    if (!senhasIguais) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/tutor/criar-senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senha }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/tutor/meus-pets')
      } else {
        setError(data.error || 'Erro ao criar senha')
      }
    } catch {
      setError('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handlePular = () => {
    router.push('/tutor/meus-pets')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <img
          src="/LOGO.svg"
          alt="Castra+ MG"
          className="h-20 w-auto mx-auto mb-4"
        />
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-6 max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Crie sua senha</h2>
            <p className="text-sm text-gray-500 mt-1">
              Com uma senha, você entra sem precisar de código por WhatsApp
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
                Nova senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setError('') }}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {senha.length > 0 && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${senhaValida ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mínimo 6 caracteres
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmar" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar senha
              </label>
              <input
                id="confirmar"
                type={mostrarSenha ? 'text' : 'password'}
                value={confirmar}
                onChange={(e) => { setConfirmar(e.target.value); setError('') }}
                placeholder="Digite novamente"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
              />
              {confirmar.length > 0 && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${senhasIguais ? 'text-green-600' : 'text-red-500'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {senhasIguais ? 'Senhas coincidem' : 'Senhas não coincidem'}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!senhaValida || !senhasIguais || loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-4 px-6 rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Salvar senha
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePular}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              Pular por agora
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <p className="text-xs text-gray-400 px-6">
          Sua senha é armazenada de forma segura e criptografada
        </p>
      </div>
    </div>
  )
}
