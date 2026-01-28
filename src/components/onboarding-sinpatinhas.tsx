'use client'

import { useState } from 'react'
import {
  ExternalLink,
  CheckCircle2,
  Smartphone,
  FileText,
  QrCode,
  ChevronRight,
  ChevronLeft,
  PawPrint
} from 'lucide-react'
import { Button } from './ui/button'

interface OnboardingSinpatinhasProps {
  onComplete: () => void
  onSkip: () => void
}

const steps = [
  {
    icon: PawPrint,
    title: 'O que é o RG Animal?',
    description: 'O RG Animal (SinPatinhas) é o documento oficial do Governo Federal que identifica seu pet. É obrigatório para castração gratuita.',
    tip: 'É gratuito e leva apenas 5 minutos para fazer!',
  },
  {
    icon: Smartphone,
    title: 'Acesse o Gov.br',
    description: 'Entre no site sinpatinhas.mma.gov.br usando sua conta Gov.br. Se não tiver conta, crie uma gratuitamente.',
    tip: 'Você pode usar CPF e senha ou o app Gov.br',
    link: {
      url: 'https://sinpatinhas.mma.gov.br',
      text: 'Abrir SinPatinhas',
    },
  },
  {
    icon: FileText,
    title: 'Cadastre seu Pet',
    description: 'Preencha os dados do animal: nome, espécie (cachorro ou gato), raça, idade e informações de saúde.',
    tip: 'Tenha em mãos a carteira de vacinação do pet',
  },
  {
    icon: QrCode,
    title: 'Obtenha o Número',
    description: 'Após o cadastro, você receberá um número único de registro. É esse número que você vai informar aqui!',
    tip: 'O número fica na carteirinha digital com QR Code',
    example: 'Exemplo: SP-2024-001234567',
  },
]

export function OnboardingSinpatinhas({ onComplete, onSkip }: OnboardingSinpatinhasProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = steps[currentStep]
  const Icon = step.icon

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header com progresso */}
        <div className="bg-gradient-to-r from-primary to-orange-500 p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm opacity-80">
              Passo {currentStep + 1} de {steps.length}
            </span>
            <button
              onClick={onSkip}
              className="text-sm opacity-80 hover:opacity-100 underline"
            >
              Já tenho o número
            </button>
          </div>
          <div className="flex gap-1 mb-4">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  idx <= currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Icon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">{step.title}</h2>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-lg leading-relaxed">
            {step.description}
          </p>

          {step.tip && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">{step.tip}</p>
            </div>
          )}

          {step.example && (
            <div className="p-4 bg-gray-100 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Formato do número:</p>
              <p className="font-mono text-lg font-semibold text-gray-800">{step.example}</p>
            </div>
          )}

          {step.link && (
            <a
              href={step.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium"
            >
              <ExternalLink className="w-5 h-5" />
              {step.link.text}
            </a>
          )}
        </div>

        {/* Footer com navegação */}
        <div className="p-6 bg-gray-50 flex gap-3">
          {currentStep > 0 ? (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          <Button
            onClick={handleNext}
            className="flex-1"
          >
            {currentStep < steps.length - 1 ? (
              <>
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Entendi, vamos cadastrar!
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
