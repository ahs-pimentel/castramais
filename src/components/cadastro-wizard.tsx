'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  QrCode,
  User,
  PawPrint,
  HelpCircle,
  ExternalLink,
  AlertCircle,
  MapPin
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Card, CardContent } from './ui/card'
import { OnboardingSinpatinhas } from './onboarding-sinpatinhas'
import { CreateAnimalDTO } from '@/lib/types'
import { formatCPF, cleanCPF, validateCPF } from '@/lib/utils'
import { validarSinpatinhas, getMensagemErroSinpatinhas } from '@/lib/validators'
import { getCidadesCampanhaLista } from '@/lib/config/cities'

const especieOptions = [
  { value: 'cachorro', label: 'Cachorro' },
  { value: 'gato', label: 'Gato' },
]

const sexoOptions = [
  { value: 'macho', label: 'Macho' },
  { value: 'femea', label: 'Fêmea' },
]

const STEPS = [
  { id: 'registro', title: 'RG Animal', icon: QrCode },
  { id: 'tutor', title: 'Tutor', icon: User },
  { id: 'animal', title: 'Pet', icon: PawPrint },
]

// Opções de cidades da campanha para o select
const cidadeOptions = getCidadesCampanhaLista().map(c => ({
  value: c.nome,
  label: `${c.nome} - ${c.uf}`
}))

export function CadastroWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [loading, setLoading] = useState(false)
  const [searchingTutor, setSearchingTutor] = useState(false)
  const [tutorFound, setTutorFound] = useState<boolean | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Registro SinPatinhas
    registroSinpatinhas: '',
    // Tutor
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
    tutorUf: '',
    // Animal
    nome: '',
    especie: 'cachorro',
    raca: '',
    sexo: 'macho',
    peso: '',
    idadeAnos: '',
    idadeMeses: '',
    observacoes: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    // Se selecionou uma cidade, auto-preenche UF com MG
    if (name === 'tutorCidade' && value) {
      setFormData((prev) => ({ ...prev, [name]: value, tutorUf: 'MG' }))
      setErrors((prev) => ({ ...prev, [name]: '' }))
      return
    }

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
          tutorUf: '',
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
      // Montar endereço completo
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
          cidade: formData.tutorUf ? `${formData.tutorCidade}/${formData.tutorUf}` : formData.tutorCidade,
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
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Informe o RG Animal
              </h2>
              <p className="text-gray-500">
                Digite o número de registro do SinPatinhas do pet
              </p>
            </div>

            <div className="space-y-4">
              <Input
                id="registroSinpatinhas"
                name="registroSinpatinhas"
                label="Número do RG Animal (SinPatinhas)"
                value={formData.registroSinpatinhas}
                onChange={handleChange}
                placeholder="BR-000000000000"
                error={errors.registroSinpatinhas}
                className="text-center text-lg font-mono"
              />

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Onde encontro esse número?</p>
                    <p className="text-blue-700">
                      O número está na carteirinha digital do pet, gerada após o cadastro no site do SinPatinhas.
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="https://sinpatinhas.mma.gov.br"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-3 text-primary hover:bg-primary/5 rounded-xl transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Ainda não tem? Cadastre grátis no SinPatinhas
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Tutor */}
      {currentStep === 1 && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Dados do Tutor
              </h2>
              <p className="text-gray-500">
                Digite o CPF para buscar ou cadastrar o tutor
              </p>
            </div>

            <div className="relative">
              <Input
                id="tutorCpf"
                name="tutorCpf"
                label="CPF do Tutor"
                value={formatCPF(formData.tutorCpf)}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                error={errors.tutorCpf}
              />
              {searchingTutor && (
                <Loader2 className="absolute right-3 top-9 w-5 h-5 text-gray-400 animate-spin" />
              )}
            </div>

            {tutorFound === true && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Tutor encontrado!</p>
                    <p className="text-sm text-green-700">{formData.tutorNome}</p>
                    <p className="text-sm text-green-600">{formData.tutorTelefone}</p>
                  </div>
                </div>
              </div>
            )}

            {tutorFound === false && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Tutor não encontrado</p>
                      <p className="text-yellow-700">Preencha os dados abaixo para cadastrar</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="tutorNome"
                    name="tutorNome"
                    label="Nome Completo"
                    value={formData.tutorNome}
                    onChange={handleChange}
                    error={errors.tutorNome}
                  />
                  <Input
                    id="tutorTelefone"
                    name="tutorTelefone"
                    label="Telefone (WhatsApp)"
                    value={formData.tutorTelefone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    error={errors.tutorTelefone}
                  />
                  <Input
                    id="tutorEmail"
                    name="tutorEmail"
                    label="Email (opcional)"
                    type="email"
                    value={formData.tutorEmail}
                    onChange={handleChange}
                  />
                </div>

                {/* Seção de Endereço */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Endereço</span>
                  </div>

                  {/* Cidade - Primeiro campo */}
                  <div className="mb-4">
                    <Select
                      id="tutorCidade"
                      name="tutorCidade"
                      label="Cidade"
                      value={formData.tutorCidade}
                      onChange={handleChange}
                      options={[{ value: '', label: 'Selecione a cidade' }, ...cidadeOptions]}
                      error={errors.tutorCidade}
                    />
                    <p className="text-xs text-amber-600 mt-1">
                      A campanha está disponível apenas para as cidades listadas
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        id="tutorEndereco"
                        name="tutorEndereco"
                        label="Rua/Avenida"
                        value={formData.tutorEndereco}
                        onChange={handleChange}
                        error={errors.tutorEndereco}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <Input
                      id="tutorNumero"
                      name="tutorNumero"
                      label="Número"
                      value={formData.tutorNumero}
                      onChange={handleChange}
                      placeholder="123"
                      error={errors.tutorNumero}
                    />
                    <div className="col-span-2">
                      <Input
                        id="tutorComplemento"
                        name="tutorComplemento"
                        label="Complemento"
                        value={formData.tutorComplemento}
                        onChange={handleChange}
                        placeholder="Apto, Bloco..."
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Input
                      id="tutorBairro"
                      name="tutorBairro"
                      label="Bairro"
                      value={formData.tutorBairro}
                      onChange={handleChange}
                      error={errors.tutorBairro}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Animal */}
      {currentStep === 2 && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <PawPrint className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Dados do Pet
              </h2>
              <p className="text-gray-500">
                Informe os dados do animal para castração
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="nome"
                name="nome"
                label="Nome do Pet"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Rex, Mel, Thor..."
                error={errors.nome}
              />
              <Select
                id="especie"
                name="especie"
                label="Espécie"
                value={formData.especie}
                onChange={handleChange}
                options={especieOptions}
              />
              <Input
                id="raca"
                name="raca"
                label="Raça"
                value={formData.raca}
                onChange={handleChange}
                placeholder="Ex: Vira-lata, Siamês, Labrador..."
                error={errors.raca}
              />
              <Select
                id="sexo"
                name="sexo"
                label="Sexo"
                value={formData.sexo}
                onChange={handleChange}
                options={sexoOptions}
              />
              <Input
                id="peso"
                name="peso"
                label="Peso aproximado (kg)"
                type="number"
                step="0.1"
                value={formData.peso}
                onChange={handleChange}
                placeholder="Ex: 5.5"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="idadeAnos"
                  name="idadeAnos"
                  label="Idade (anos)"
                  type="number"
                  min="0"
                  value={formData.idadeAnos}
                  onChange={handleChange}
                  placeholder="0"
                />
                <Input
                  id="idadeMeses"
                  name="idadeMeses"
                  label="Meses"
                  type="number"
                  min="0"
                  max="11"
                  value={formData.idadeMeses}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações médicas (opcional)
              </label>
              <textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={3}
                placeholder="Alergias, medicamentos em uso, cirurgias anteriores..."
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Resumo */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
              <p className="text-sm font-medium text-gray-700">Resumo do cadastro:</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">RG Animal:</span> {formData.registroSinpatinhas}</p>
                <p><span className="font-medium">Tutor:</span> {formData.tutorNome}</p>
                <p><span className="font-medium">Pet:</span> {formData.nome || '(não informado)'} - {formData.especie === 'cachorro' ? 'Cachorro' : 'Gato'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
