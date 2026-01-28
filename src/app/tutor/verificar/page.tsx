'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function VerificarCodigoPage() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const storedCpf = sessionStorage.getItem('tutor_cpf')
    const storedTelefone = sessionStorage.getItem('tutor_telefone')

    if (!storedCpf) {
      router.push('/tutor')
      return
    }

    setCpf(storedCpf)
    setTelefone(storedTelefone || '')
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
      const res = await fetch('/api/tutor/verificar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, codigo: codeStr }),
      })

      const data = await res.json()

      if (res.ok) {
        // Salvar token e ir para o app
        localStorage.setItem('tutor_token', data.token)
        localStorage.setItem('tutor_nome', data.nome)
        router.push('/tutor/meus-pets')
      } else {
        setError(data.error || 'Código inválido')
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch {
      setError('Erro ao verificar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await fetch('/api/tutor/enviar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf }),
      })
      setCountdown(60)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch {
      setError('Erro ao reenviar código')
    } finally {
      setResending(false)
    }
  }

  const maskedPhone = telefone
    ? `(**) *****-${telefone.slice(-4)}`
    : 'seu WhatsApp'

  return (
    <div className="min-h-screen flex flex-col">
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
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Código enviado!
          </h1>
          <p className="text-gray-500 mb-8">
            Digite o código de 6 dígitos enviado para {maskedPhone}
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
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-gray-500">
                Reenviar código em <span className="font-semibold">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-2 text-primary font-medium hover:underline disabled:opacity-50"
              >
                {resending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Reenviar código
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <p className="text-xs text-gray-400">
          Não recebeu? Verifique se o WhatsApp está correto
        </p>
      </div>
    </div>
  )
}
