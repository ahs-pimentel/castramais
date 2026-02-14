'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PawPrint, ArrowRight, ArrowLeft, Loader2, User, Phone, Mail, MapPin } from 'lucide-react'
import { formatCPF, validateCPF, formatPhone } from '@/lib/utils'
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth'

interface Campanha {
  id: string
  nome: string
  cidade: string
  uf: string
}

export default function TutorCadastroPage() {
  const router = useRouter()
  const { sendOTP, loading: firebaseLoading, error: firebaseError } = useFirebasePhoneAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [campanhas, setCampanhas] = useState<Campanha[]>([])

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    campanhaId: '',
    aceitaTermos: false,
  })

  useEffect(() => {
    // Recuperar CPF da sessao se veio do login
    const cpfSalvo = sessionStorage.getItem('cadastro_cpf')
    if (cpfSalvo) {
      setFormData(prev => ({ ...prev, cpf: cpfSalvo }))
      sessionStorage.removeItem('cadastro_cpf')
    }

    // Buscar campanhas ativas
    fetch('/api/campanhas')
      .then(res => res.ok ? res.json() : [])
      .then((data: Campanha[]) => setCampanhas(data))
      .catch(() => setCampanhas([]))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === 'cpf') {
      formattedValue = value.replace(/\D/g, '').slice(0, 11)
    } else if (name === 'telefone') {
      formattedValue = value.replace(/\D/g, '').slice(0, 11)
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }))
    setError('')
  }

  const validateStep1 = () => {
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório')
      return false
    }
    if (!validateCPF(formData.cpf)) {
      setError('CPF inválido')
      return false
    }
    if (formData.telefone.length < 10) {
      setError('Telefone inválido')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!formData.campanhaId) {
      setError('Selecione uma campanha')
      return false
    }
    if (!formData.cidade.trim()) {
      setError('Cidade é obrigatória')
      return false
    }
    if (!formData.endereco.trim()) {
      setError('Endereço é obrigatório')
      return false
    }
    if (!formData.numero.trim()) {
      setError('Número é obrigatório')
      return false
    }
    if (!formData.bairro.trim()) {
      setError('Bairro é obrigatório')
      return false
    }
    if (!formData.aceitaTermos) {
      setError('Você deve aceitar os Termos de Uso e Política de Privacidade')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    } else {
      router.push('/tutor')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep2()) return

    setLoading(true)
    setError('')

    // Montar endereco completo
    const enderecoCompleto = formData.complemento
      ? `${formData.endereco}, ${formData.numero} - ${formData.complemento}`
      : `${formData.endereco}, ${formData.numero}`

    try {
      // Salvar campanhaId na sessao para uso ao cadastrar pet
      if (formData.campanhaId) {
        sessionStorage.setItem('campanhaId', formData.campanhaId)
      }

      // 1. Cadastrar tutor no backend
      const res = await fetch('/api/tutor/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome,
          cpf: formData.cpf,
          telefone: formData.telefone,
          email: formData.email,
          endereco: enderecoCompleto,
          bairro: formData.bairro,
          cidade: formData.cidade,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // 2. Enviar OTP via Firebase SMS
        const telefoneLimpo = formData.telefone.replace(/\D/g, '')
        
        try {
          await sendOTP(telefoneLimpo)
          
          // Salvar dados na sessão e ir para verificação
          sessionStorage.setItem('tutor_cpf', formData.cpf)
          sessionStorage.setItem('tutor_telefone', telefoneLimpo)
          sessionStorage.setItem('tutor_metodo', 'sms')
          router.push('/tutor/verificar')
        } catch (firebaseErr: any) {
          // Se billing não habilitado, ainda permite continuar (mostra mensagem mas redireciona)
          if (firebaseErr?.code === 'auth/billing-not-enabled') {
            alert('SMS indisponível no momento. Por favor, faça login usando WhatsApp.');
            router.push('/tutor');
          } else {
            setError(firebaseError || 'Erro ao enviar código SMS. Cadastro realizado, tente fazer login.');
          }
        }
      } else {
        setError(data.error || 'Erro ao realizar cadastro')
      }
    } catch {
      setError('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* reCAPTCHA container (invisível) */}
      <div id="recaptcha-container"></div>
      
      {/* Header */}
      <div className="pt-8 pb-4 px-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
      </div>

      <div className="px-6 pb-4 text-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30">
          <PawPrint className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Cadastro</h1>
        <p className="text-gray-500 mt-1 text-sm">Preencha seus dados para continuar</p>
      </div>

      {/* Progress */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
        </div>
        <p className="text-center text-sm text-gray-500 mt-2">
          Etapa {step} de 2 - {step === 1 ? 'Dados Pessoais' : 'Endereço'}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-6 max-w-md mx-auto">
          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Dados Pessoais</h2>
                    <p className="text-xs text-gray-500">Informações básicas</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF *
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    name="cpf"
                    value={formatCPF(formData.cpf)}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    WhatsApp *
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    name="telefone"
                    value={formatPhone(formData.telefone)}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Usado como alternativa caso não tenha WhatsApp
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Endereço e Campanha</h2>
                    <p className="text-xs text-gray-500">Selecione a campanha e preencha o endereço</p>
                  </div>
                </div>

                {/* Campanha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campanha *
                  </label>
                  <select
                    name="campanhaId"
                    value={formData.campanhaId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors bg-white"
                  >
                    <option value="">Selecione a campanha</option>
                    {campanhas.map(campanha => (
                      <option key={campanha.id} value={campanha.id}>
                        {campanha.nome} — {campanha.cidade}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cidade - Campo de texto livre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    placeholder="Digite sua cidade"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UF
                  </label>
                  <input
                    type="text"
                    name="uf"
                    value={formData.uf}
                    onChange={handleChange}
                    placeholder="MG"
                    maxLength={2}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rua/Avenida *
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    placeholder="Nome da rua"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      name="numero"
                      value={formData.numero}
                      onChange={handleChange}
                      placeholder="123"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleChange}
                      placeholder="Apto, Bloco..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleChange}
                    placeholder="Nome do bairro"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                  />
                </div>

                {/* Aceite de Termos */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.aceitaTermos}
                      onChange={(e) => setFormData(prev => ({ ...prev, aceitaTermos: e.target.checked }))}
                      className="mt-1 w-5 h-5 text-primary border-2 border-gray-300 rounded focus:ring-primary focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-600">
                      Li e aceito os{' '}
                      <a
                        href="/termos-de-uso.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        Termos de Uso
                      </a>{' '}
                      e a{' '}
                      <a
                        href="/politica-privacidade.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium"
                      >
                        Política de Privacidade
                      </a>
                    </span>
                  </label>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-primary text-white font-semibold py-4 px-6 rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cadastrando...
                </>
              ) : step === 1 ? (
                <>
                  Continuar
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Finalizar Cadastro
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
          Seus dados estão protegidos e serão usados apenas para o acompanhamento do seu pet
        </p>
      </div>
    </div>
  )
}
