'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PawPrint, ArrowRight, ArrowLeft, Loader2, User, Phone, Mail, MapPin } from 'lucide-react'
import { formatCPF, validateCPF, formatPhone } from '@/lib/utils'

export default function TutorCadastroPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    endereco: '',
    cidade: '',
    bairro: '',
  })

  useEffect(() => {
    // Recuperar CPF da sessão se veio do login
    const cpfSalvo = sessionStorage.getItem('cadastro_cpf')
    if (cpfSalvo) {
      setFormData(prev => ({ ...prev, cpf: cpfSalvo }))
      sessionStorage.removeItem('cadastro_cpf')
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!formData.endereco.trim()) {
      setError('Endereço é obrigatório')
      return false
    }
    if (!formData.cidade.trim()) {
      setError('Cidade é obrigatória')
      return false
    }
    if (!formData.bairro.trim()) {
      setError('Bairro é obrigatório')
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

    try {
      const res = await fetch('/api/tutor/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        // Salvar dados e ir para verificação
        sessionStorage.setItem('tutor_cpf', formData.cpf)
        sessionStorage.setItem('tutor_telefone', data.telefone || '')
        sessionStorage.setItem('tutor_metodo', data.metodoEnvio || 'whatsapp')
        router.push('/tutor/verificar')
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
                    <h2 className="font-semibold text-gray-900">Endereço</h2>
                    <p className="text-xs text-gray-500">Onde você mora</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço completo *
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    placeholder="Rua, número, complemento"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                  />
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    placeholder="Nome da cidade"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
                  />
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
