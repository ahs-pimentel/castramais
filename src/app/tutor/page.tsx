'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, Smartphone, UserPlus, Lock, Eye, EyeOff, KeyRound } from 'lucide-react'
import { formatCPF, validateCPF } from '@/lib/utils'
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth'

type Etapa = 'cpf' | 'senha' | 'otp-enviando'

export default function TutorLoginPage() {
  const router = useRouter()
  const { sendOTP, loading: firebaseLoading, error: firebaseError } = useFirebasePhoneAuth()
  const [cpf, setCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [etapa, setEtapa] = useState<Etapa>('cpf')

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11)
    setCpf(value)
    setError('')
    // Se mudar o CPF, volta pra etapa inicial
    if (etapa !== 'cpf') {
      setEtapa('cpf')
      setSenha('')
    }
  }

  // Etapa 1: Verificar CPF
  const handleCheckCPF = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateCPF(cpf)) {
      setError('CPF inválido')
      return
    }

    setLoading(true)
    try {
      // Buscar dados do tutor (telefone, status de senha)
      const res = await fetch('/api/tutor/enviar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf }),
      })

      const data = await res.json()

      if (data.cadastroNecessario) {
        sessionStorage.setItem('cadastro_cpf', cpf)
        router.push('/tutor/cadastro')
        return
      }

      if (data.temSenha) {
        // Tutor tem senha → mostrar campo de senha
        setEtapa('senha')
        setLoading(false)
      } else if (res.ok) {
        // Tutor sem senha → Enviar OTP via Firebase SMS
        const telefone = data.telefone?.replace(/\D/g, '') || ''
        
        if (!telefone) {
          setError('Telefone não encontrado. Entre em contato com o suporte.')
          setLoading(false)
          return
        }

        try {
          // Enviar OTP via Firebase
          await sendOTP(telefone)
          
          // Salvar dados na sessão e redirecionar
          sessionStorage.setItem('tutor_cpf', cpf)
          sessionStorage.setItem('tutor_telefone', telefone)
          sessionStorage.setItem('tutor_metodo', 'sms')
          router.push('/tutor/verificar')
        } catch (firebaseErr) {
          setError(firebaseError || 'Erro ao enviar código SMS')
        }
        setLoading(false)
      } else {
        setError(data.error || 'Erro ao verificar CPF')
        setLoading(false)
      }
    } catch {
      setError('Erro ao conectar. Tente novamente.')
      setLoading(false)
    }
  }

  // Etapa 2: Login com senha
  const handleLoginSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!senha) {
      setError('Digite sua senha')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/tutor/login-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, senha }),
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('tutor_token', data.token)
        localStorage.setItem('tutor_nome', data.nome)
        router.push('/tutor/meus-pets')
      } else {
        setError(data.error || 'CPF ou senha incorretos')
      }
    } catch {
      setError('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Esqueci minha senha → envia OTP via Firebase SMS
  const handleEsqueceuSenha = async () => {
    setError('')
    setLoading(true)
    try {
      // Buscar telefone do tutor
      const res = await fetch('/api/tutor/enviar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, esqueceuSenha: true }),
      })

      const data = await res.json()

      if (res.ok) {
        const telefone = data.telefone?.replace(/\D/g, '') || ''
        
        if (!telefone) {
          setError('Telefone não encontrado. Entre em contato com o suporte.')
          setLoading(false)
          return
        }

        try {
          // Enviar OTP via Firebase
          await sendOTP(telefone)
          
          sessionStorage.setItem('tutor_cpf', cpf)
          sessionStorage.setItem('tutor_telefone', telefone)
          sessionStorage.setItem('tutor_metodo', 'sms')
          sessionStorage.setItem('tutor_esqueceu_senha', 'true')
          router.push('/tutor/verificar')
        } catch (firebaseErr) {
          setError(firebaseError || 'Erro ao enviar código SMS')
        }
      } else {
        setError(data.error || 'Erro ao enviar código')
      }
    } catch {
      setError('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* reCAPTCHA container (invisível) */}
      <div id="recaptcha-container"></div>
      
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
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              etapa === 'senha' ? 'bg-orange-100' : 'bg-blue-100'
            }`}>
              {etapa === 'senha' ? (
                <Lock className="w-6 h-6 text-orange-600" />
              ) : (
                <Smartphone className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {etapa === 'senha' ? 'Digite sua senha' : 'Entrar com CPF'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {etapa === 'senha'
                ? `CPF: ${formatCPF(cpf)}`
                : 'Informe seu CPF para continuar'}
            </p>
          </div>

          {etapa === 'cpf' && (
            <form onSubmit={handleCheckCPF} className="space-y-4">
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
                    Verificando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {etapa === 'senha' && (
            <form onSubmit={handleLoginSenha} className="space-y-4">
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
                  Sua senha
                </label>
                <div className="relative">
                  <input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => { setSenha(e.target.value); setError('') }}
                    placeholder="Digite sua senha"
                    className="w-full text-center text-xl px-4 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
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
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!senha || loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-4 px-6 rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Entrar
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => { setEtapa('cpf'); setSenha(''); setError('') }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Trocar CPF
                </button>
                <button
                  type="button"
                  onClick={handleEsqueceuSenha}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Esqueci minha senha
                </button>
              </div>
            </form>
          )}
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
