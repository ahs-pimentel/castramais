'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, Smartphone, UserPlus } from 'lucide-react'
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
        sessionStorage.setItem('tutor_metodo', data.metodoEnvio || 'whatsapp')
        sessionStorage.setItem('tutor_tem_email', data.temEmail ? 'true' : 'false')
        router.push('/tutor/verificar')
      } else if (data.cadastroNecessario) {
        // CPF não encontrado - redirecionar para cadastro
        sessionStorage.setItem('cadastro_cpf', cpf)
        router.push('/tutor/cadastro')
      } else {
        setError(data.error || 'Erro ao verificar CPF')
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
        <img
          src="/LOGO.svg"
          alt="Castra+ MG"
          className="h-20 w-auto mx-auto mb-4"
        />
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
      <div className="py-6 px-6">
        <div className="max-w-md mx-auto">
          <div className="border-t border-gray-200 pt-6">
            <p className="text-center text-sm text-gray-500 mb-3">
              Ainda não tem cadastro?
            </p>
            <Link
              href="/tutor/cadastro"
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-2xl hover:bg-gray-200 transition-all"
            >
              <UserPlus className="w-5 h-5" />
              Criar minha conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
