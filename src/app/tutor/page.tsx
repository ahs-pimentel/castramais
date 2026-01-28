'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PawPrint, ArrowRight, Loader2, Smartphone } from 'lucide-react'
import { formatCPF, validateCPF } from '@/lib/utils'

export default function TutorLoginPage() {
  const router = useRouter()
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11)
    setCpf(value)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateCPF(cpf)) {
      setError('CPF inválido')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/tutor/enviar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf }),
      })

      const data = await res.json()

      if (res.ok) {
        // Salvar CPF temporariamente e ir para verificação
        sessionStorage.setItem('tutor_cpf', cpf)
        sessionStorage.setItem('tutor_telefone', data.telefone || '')
        router.push('/tutor/verificar')
      } else {
        setError(data.error || 'CPF não encontrado no sistema')
      }
    } catch {
      setError('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
          <PawPrint className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Castra<span className="text-primary">+</span>
        </h1>
        <p className="text-gray-500 mt-2">Acompanhe a castração do seu pet</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-6 max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Entrar com CPF</h2>
            <p className="text-sm text-gray-500 mt-1">
              Vamos enviar um código para seu WhatsApp
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">
                Seu CPF
              </label>
              <input
                id="cpf"
                type="tel"
                inputMode="numeric"
                value={formatCPF(cpf)}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                className="w-full text-center text-2xl font-mono tracking-wider px-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cpf.length !== 11 || loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-4 px-6 rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando código...
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <p className="text-xs text-gray-400">
          Só consegue acessar quem tem animal cadastrado
        </p>
      </div>
    </div>
  )
}
