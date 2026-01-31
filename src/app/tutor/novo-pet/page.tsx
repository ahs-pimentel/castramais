'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  PawPrint,
  QrCode,
  Cat,
  Dog,
  Loader2,
  CheckCircle2,
  HelpCircle,
  ExternalLink
} from 'lucide-react'
import { validarSinpatinhas, getMensagemErroSinpatinhas } from '@/lib/validators'

export default function NovoPetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    registroSinpatinhas: '',
    nome: '',
    especie: 'cachorro',
    raca: '',
    sexo: 'macho',
    peso: '',
    idadeAnos: '',
    idadeMeses: '',
    observacoes: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('tutor_token')
    if (!token) {
      router.push('/tutor')
    }
  }, [router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setError('')
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    // Validação do RG Animal (SinPatinhas)
    if (!formData.registroSinpatinhas.trim()) {
      newErrors.registroSinpatinhas = 'RG Animal é obrigatório'
    } else if (!validarSinpatinhas(formData.registroSinpatinhas)) {
      const msg = getMensagemErroSinpatinhas(formData.registroSinpatinhas)
      newErrors.registroSinpatinhas = msg || 'Formato de RG Animal inválido'
    }

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome do pet é obrigatório'
    }
    if (!formData.raca.trim()) {
      newErrors.raca = 'Raça é obrigatória'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('tutor_token')
      const res = await fetch('/api/tutor/cadastrar-animal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          peso: formData.peso || undefined,
          idadeAnos: formData.idadeAnos || undefined,
          idadeMeses: formData.idadeMeses || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/tutor/meus-pets')
        }, 2000)
      } else {
        setError(data.error || 'Erro ao cadastrar pet')
      }
    } catch {
      setError('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pet cadastrado!</h1>
          <p className="text-gray-500">Redirecionando para seus pets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-primary text-white px-6 pt-12 pb-8 rounded-b-[2rem]">
        <Link
          href="/tutor/meus-pets"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <PawPrint className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Cadastrar Novo Pet</h1>
            <p className="text-white/80 text-sm">Adicione mais um pet à sua conta</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 mt-6 space-y-6">
        {/* RG Animal */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">RG Animal</h2>
              <p className="text-xs text-gray-500">Número do SinPatinhas</p>
            </div>
          </div>

          <div>
            <input
              type="text"
              name="registroSinpatinhas"
              value={formData.registroSinpatinhas}
              onChange={handleChange}
              placeholder="BR-000000000000"
              className={`w-full text-center text-lg font-mono px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.registroSinpatinhas
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-200 focus:border-primary'
              }`}
            />
            {errors.registroSinpatinhas && (
              <p className="text-red-500 text-sm mt-1">{errors.registroSinpatinhas}</p>
            )}
          </div>

          <a
            href="https://sinpatinhas.mma.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
          >
            <HelpCircle className="w-4 h-4" />
            Não tem? Cadastre grátis no SinPatinhas
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Dados do Pet */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Dados do Pet</h2>
              <p className="text-xs text-gray-500">Informações do animal</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Pet *
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Ex: Rex, Mel, Thor..."
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.nome
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-200 focus:border-primary'
              }`}
            />
            {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Espécie</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, especie: 'cachorro' }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${
                    formData.especie === 'cachorro'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <Dog className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, especie: 'gato' }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${
                    formData.especie === 'gato'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <Cat className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, sexo: 'macho' }))}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    formData.sexo === 'macho'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  Macho
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, sexo: 'femea' }))}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    formData.sexo === 'femea'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  Fêmea
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raça *</label>
            <input
              type="text"
              name="raca"
              value={formData.raca}
              onChange={handleChange}
              placeholder="Ex: Vira-lata, Siamês, Labrador..."
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                errors.raca
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-200 focus:border-primary'
              }`}
            />
            {errors.raca && <p className="text-red-500 text-sm mt-1">{errors.raca}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input
                type="number"
                name="peso"
                value={formData.peso}
                onChange={handleChange}
                placeholder="0.0"
                step="0.1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anos</label>
              <input
                type="number"
                name="idadeAnos"
                value={formData.idadeAnos}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meses</label>
              <input
                type="number"
                name="idadeMeses"
                value={formData.idadeMeses}
                onChange={handleChange}
                placeholder="0"
                min="0"
                max="11"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações médicas (opcional)
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Alergias, medicamentos em uso..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-4 px-6 rounded-2xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Cadastrando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Cadastrar Pet
            </>
          )}
        </button>
      </form>
    </div>
  )
}
