'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2, MessageCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth'

export default function VerificarCodigoPage() {
  const router = useRouter()
  const { verifyOTP, sendOTP, loading: firebaseLoading } = useFirebasePhoneAuth()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [metodoAtual, setMetodoAtual] = useState<'sms' | 'whatsapp' | 'email'>('sms')
  const [temEmail, setTemEmail] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const storedCpf = sessionStorage.getItem('tutor_cpf')
    const storedTelefone = sessionStorage.getItem('tutor_telefone')
    const storedMetodo = sessionStorage.getItem('tutor_metodo')
    const storedTemEmail = sessionStorage.getItem('tutor_tem_email')

    if (!storedCpf) {
      router.push('/tutor')
      return
    }

    setCpf(storedCpf)
    setTelefone(storedTelefone || '')
    setMetodoAtual((storedMetodo as 'sms' | 'whatsapp' | 'email') || 'sms')
    setTemEmail(storedTemEmail === 'true')
    inputRefs.current[0]?.focus()
  }, [router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (newCode.every((c) => c) && newCode.join('').length === 6) {
      handleSubmit(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newCode[i] = char
    })
    setCode(newCode)

    if (newCode.every((c) => c)) {
      handleSubmit(newCode.join(''))
    }
  }

  const handleSubmit = async (codeStr: string) => {
    setLoading(true)
    setError('')

    try {
      // Verificar código OTP com Firebase
      const firebaseToken = await verifyOTP(codeStr)
      
      // Autenticar no backend com token Firebase
      const res = await fetch('/api/tutor/login-firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, firebaseToken }),
      })

      const data = await res.json()

      if (res.ok) {
        // Salvar token da aplicação
        localStorage.setItem('tutor_token', data.token)
        localStorage.setItem('tutor_nome', data.nome)

        const esqueceuSenha = sessionStorage.getItem('tutor_esqueceu_senha')
        sessionStorage.removeItem('tutor_esqueceu_senha')

        // Verificar se precisa criar senha
        // Como agora usamos Firebase, vamos buscar essa info do backend
        // Por enquanto, sempre redireciona para criar senha se esqueceu ou não tem
        if (esqueceuSenha) {
          router.push('/tutor/criar-senha')
        } else {
          router.push('/tutor/meus-pets')
        }
      } else {
        setError(data.error || 'Erro ao fazer login')
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err: any) {
      setError(err.message || 'Código inválido ou expirado')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async (preferencia: 'sms' | 'whatsapp' | 'email' = 'sms') => {
    setResending(true)
    setError('')
    
    try {
      if (preferencia === 'sms') {
        // Reenviar via Firebase SMS
        if (!telefone) {
          setError('Telefone não encontrado')
          setResending(false)
          return
        }
        
        await sendOTP(telefone)
        setMetodoAtual('sms')
        setCountdown(60)
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        // Fallback: reenviar via WhatsApp ou Email (usando API antiga)
        const res = await fetch('/api/tutor/enviar-codigo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cpf, preferencia }),
        })

        const data = await res.json()

        if (res.ok) {
          setMetodoAtual(data.metodoEnvio || preferencia)
          setTemEmail(data.temEmail || false)
          setCountdown(60)
          setCode(['', '', '', '', '', ''])
          inputRefs.current[0]?.focus()
        } else {
          setError(data.error || 'Erro ao reenviar código')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar código')
    } finally {
      setResending(false)
    }
  }

  const maskedPhone = telefone
    ? `(**) *****-${telefone.slice(-4)}`
    : 'seu WhatsApp'

  return (
    <div className="min-h-screen flex flex-col">
      {/* reCAPTCHA container (invisível) */}
      <div id="recaptcha-container"></div>
      
      {/* Header */}
      <div className="p-4">
        <Link
          href="/tutor"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-8">
        <div className="max-w-md mx-auto text-center">
          <div className={`w-16 h-16 ${metodoAtual === 'sms' || metodoAtual === 'whatsapp' ? 'bg-green-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {metodoAtual === 'sms' || metodoAtual === 'whatsapp' ? (
              <MessageCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Mail className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Código enviado!
          </h1>
          <p className="text-gray-500 mb-8">
            {metodoAtual === 'sms' ? (
              <>Digite o código de 6 dígitos enviado por SMS para {maskedPhone}</>
            ) : metodoAtual === 'whatsapp' ? (
              <>Digite o código de 6 dígitos enviado para {maskedPhone}</>
            ) : (
              <>Digite o código de 6 dígitos enviado para seu email</>
            )}
          </p>

          {/* Code inputs */}
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              Verificando...
            </div>
          )}

          {/* Resend */}
          <div className="text-center space-y-3">
            {countdown > 0 ? (
              <p className="text-sm text-gray-500">
                Reenviar código em <span className="font-semibold">{countdown}s</span>
              </p>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleResend('sms')}
                  disabled={resending}
                  className="inline-flex items-center gap-2 text-green-600 font-medium hover:underline disabled:opacity-50"
                >
                  {resending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  Reenviar por SMS
                </button>

                {temEmail && (
                  <div>
                    <button
                      onClick={() => handleResend('email')}
                      disabled={resending}
                      className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline disabled:opacity-50"
                    >
                      {resending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      Enviar por Email
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <p className="text-xs text-gray-400">
          {metodoAtual === 'sms'
            ? 'Não recebeu? Verifique se o número de telefone está correto'
            : metodoAtual === 'whatsapp'
            ? 'Não recebeu? Verifique se o WhatsApp está correto'
            : 'Não recebeu? Verifique sua caixa de spam'}
        </p>
      </div>
    </div>
  )
}
