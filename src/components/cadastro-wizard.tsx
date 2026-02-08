'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  QrCode,
  User,
  PawPrint,
} from 'lucide-react'
import { Button } from './ui/button'
import { OnboardingSinpatinhas } from './onboarding-sinpatinhas'
import { StepRegistro } from './cadastro/step-registro'
import { StepTutor } from './cadastro/step-tutor'
import { StepAnimal } from './cadastro/step-animal'
import { CreateAnimalDTO, Campanha } from '@/lib/types'
import { cleanCPF, validateCPF } from '@/lib/utils'
import { validarSinpatinhas, getMensagemErroSinpatinhas } from '@/lib/sanitize'

const STEPS = [
  { id: 'registro', title: 'RG Animal', icon: QrCode },
  { id: 'tutor', title: 'Tutor', icon: User },
  { id: 'animal', title: 'Pet', icon: PawPrint },
]

export function CadastroWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [loading, setLoading] = useState(false)
  const [searchingTutor, setSearchingTutor] = useState(false)
  const [tutorFound, setTutorFound] = useState<boolean | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [campanhas, setCampanhas] = useState<Campanha[]>([])

  useEffect(() => {
    fetch('/api/campanhas')
      .then(res => res.ok ? res.json() : [])
      .then(data => setCampanhas(data))
      .catch(() => setCampanhas([]))
  }, [])

  const [formData, setFormData] = useState({
    registroSinpatinhas: '',
    tutorId: '',
    tutorCpf: '',
    tutorNome: '',
    tutorTelefone: '',
    tutorEmail: '',
    tutorEndereco: '',
    tutorNumero: '',
    tutorComplemento: '',
    tutorBairro: '',
    tutorCidade: '',
    nome: '',
    especie: 'cachorro',
    raca: '',
    sexo: 'macho',
    peso: '',
    idadeAnos: '',
    idadeMeses: '',
    observacoes: '',
    campanhaId: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11)
    setFormData((prev) => ({ ...prev, tutorCpf: value }))
    setErrors((prev) => ({ ...prev, tutorCpf: '' }))
    if (value.length === 11) {
      searchTutor(value)
    } else {
      setTutorFound(null)
    }
  }

  const searchTutor = async (cpf: string) => {
    setSearchingTutor(true)
    try {
      const res = await fetch(`/api/tutores/cpf/${cpf}`)
      if (res.ok) {
        const tutor = await res.json()
        setFormData((prev) => ({
          ...prev,
          tutorId: tutor.id,
          tutorNome: tutor.nome,
          tutorTelefone: tutor.telefone,
          tutorEmail: tutor.email || '',
          tutorEndereco: tutor.endereco,
          tutorCidade: tutor.cidade,
          tutorBairro: tutor.bairro,
        }))
        setTutorFound(true)
      } else {
        setFormData((prev) => ({
          ...prev,
          tutorId: '',
          tutorNome: '',
          tutorTelefone: '',
          tutorEmail: '',
          tutorEndereco: '',
          tutorNumero: '',
          tutorComplemento: '',
          tutorBairro: '',
          tutorCidade: '',
        }))
        setTutorFound(false)
      }
    } catch {
      setTutorFound(false)
    } finally {
      setSearchingTutor(false)
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 0) {
      if (!formData.registroSinpatinhas.trim()) {
        newErrors.registroSinpatinhas = 'O número do RG Animal é obrigatório'
      } else if (!validarSinpatinhas(formData.registroSinpatinhas)) {
        const msg = getMensagemErroSinpatinhas(formData.registroSinpatinhas)
        newErrors.registroSinpatinhas = msg || 'Formato inválido. Use: BR-000000000000'
      }
    }

    if (step === 1) {
      if (!formData.tutorCpf.trim()) {
        newErrors.tutorCpf = 'CPF é obrigatório'
      } else if (!validateCPF(formData.tutorCpf)) {
        newErrors.tutorCpf = 'CPF inválido'
      }

      if (tutorFound === false) {
        if (!formData.tutorNome.trim()) newErrors.tutorNome = 'Nome é obrigatório'
        if (!formData.tutorTelefone.trim()) newErrors.tutorTelefone = 'Telefone é obrigatório'
        if (!formData.tutorCidade.trim()) newErrors.tutorCidade = 'Cidade é obrigatória'
        if (!formData.tutorEndereco.trim()) newErrors.tutorEndereco = 'Endereço é obrigatório'
        if (!formData.tutorNumero.trim()) newErrors.tutorNumero = 'Número é obrigatório'
        if (!formData.tutorBairro.trim()) newErrors.tutorBairro = 'Bairro é obrigatório'
      }

      if (tutorFound === null) {
        newErrors.tutorCpf = 'Digite o CPF completo'
      }
    }

    if (step === 2) {
      if (!formData.nome.trim()) newErrors.nome = 'Nome do pet é obrigatório'
      if (!formData.raca.trim()) newErrors.raca = 'Raça é obrigatória'
      if (!formData.campanhaId) newErrors.campanhaId = 'Selecione uma campanha'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setLoading(true)
    try {
      const enderecoCompleto = formData.tutorComplemento
        ? `${formData.tutorEndereco}, ${formData.tutorNumero} - ${formData.tutorComplemento}`
        : `${formData.tutorEndereco}, ${formData.tutorNumero}`

      const payload: CreateAnimalDTO = {
        nome: formData.nome,
        especie: formData.especie as 'cachorro' | 'gato',
        raca: formData.raca,
        sexo: formData.sexo as 'macho' | 'femea',
        peso: formData.peso ? parseFloat(formData.peso) : undefined,
        idadeAnos: formData.idadeAnos ? parseInt(formData.idadeAnos) : undefined,
        idadeMeses: formData.idadeMeses ? parseInt(formData.idadeMeses) : undefined,
        registroSinpatinhas: formData.registroSinpatinhas,
        observacoes: formData.observacoes || undefined,
        campanhaId: formData.campanhaId,
      }

      if (formData.tutorId) {
        payload.tutorId = formData.tutorId
      } else {
        payload.tutor = {
          nome: formData.tutorNome,
          cpf: cleanCPF(formData.tutorCpf),
          telefone: formData.tutorTelefone,
          email: formData.tutorEmail || undefined,
          endereco: enderecoCompleto,
          cidade: formData.tutorCidade,
          bairro: formData.tutorBairro,
        }
      }

      const res = await fetch('/api/animais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao cadastrar')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (showOnboarding) {
    return (
      <OnboardingSinpatinhas
        onComplete={() => setShowOnboarding(false)}
        onSkip={() => setShowOnboarding(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Indicador de progresso */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          const isActive = idx === currentStep
          const isCompleted = idx < currentStep

          return (
            <div key={step.id} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    isActive ? 'text-primary' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-1 w-full max-w-[60px] mx-2 rounded ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step 1: Registro SinPatinhas */}
      {currentStep === 0 && (
        <StepRegistro
          registroSinpatinhas={formData.registroSinpatinhas}
          error={errors.registroSinpatinhas}
          onChange={handleChange}
        />
      )}

      {/* Step 2: Tutor */}
      {currentStep === 1 && (
        <StepTutor
          formData={formData}
          errors={errors}
          tutorFound={tutorFound}
          searchingTutor={searchingTutor}
          onCPFChange={handleCPFChange}
          onChange={handleChange}
        />
      )}

      {/* Step 3: Animal */}
      {currentStep === 2 && (
        <StepAnimal
          formData={formData}
          campanhas={campanhas}
          errors={errors}
          onChange={handleChange}
        />
      )}

      {/* Navegação */}
      <div className="flex gap-3">
        {currentStep > 0 ? (
          <Button variant="outline" onClick={handlePrev} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        ) : (
          <Button variant="outline" onClick={() => router.back()} className="flex-1">
            Cancelar
          </Button>
        )}

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} className="flex-1">
            Próximo
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Finalizar Cadastro
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
