'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const STEPS = [
  {
    id: 'cadastro-entidade',
    title: '1. Cadastro de Entidade',
    description: 'Primeiro passo: cadastrar uma nova entidade no sistema',
    redirectUrl: '/entidade/cadastro',
    redirectTime: 10,
  },
  {
    id: 'login-entidade',
    title: '2. Login da Entidade',
    description: 'Após o cadastro, faça login com as credenciais criadas',
    redirectUrl: '/entidade/login',
    redirectTime: 10,
  },
  {
    id: 'dashboard-entidade',
    title: '3. Dashboard da Entidade',
    description: 'Acesse o dashboard para gerenciar animais e agendamentos',
    redirectUrl: '/entidade/dashboard',
    redirectTime: 10,
  },
]

export default function TutorialPage() {
  const [currentStep, setCurrentStep] = useState(-1)
  const [countdown, setCountdown] = useState(0)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (currentStep >= 0 && currentStep < STEPS.length) {
      const step = STEPS[currentStep]
      setCountdown(step.redirectTime)
      setRedirecting(true)

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            // Redirecionar
            window.location.href = step.redirectUrl
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [currentStep])

  const handleStart = () => {
    setCurrentStep(0)
  }

  const handleSkipRedirect = () => {
    setRedirecting(false)
    setCurrentStep(-1)
  }

  if (currentStep >= 0 && currentStep < STEPS.length && redirecting) {
    const step = STEPS[currentStep]
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <PlayCircle className="w-10 h-10 text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {step.title}
              </h2>
              <p className="text-gray-600">{step.description}</p>
            </div>

            <div className="p-6 bg-orange-50 rounded-xl">
              <p className="text-lg font-semibold text-orange-900 mb-2">
                Redirecionando em...
              </p>
              <div className="text-6xl font-bold text-orange-600">
                {countdown}
              </div>
              <p className="text-sm text-orange-700 mt-2">
                Para: <span className="font-mono">{step.redirectUrl}</span>
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleSkipRedirect}
              className="mt-4"
            >
              Cancelar redirecionamento
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlayCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tutorial de Gravação
          </h1>
          <p className="text-lg text-gray-600">
            Guia passo a passo para demonstração do sistema Castra+MG
          </p>
        </div>

        <div className="space-y-6 mb-12">
          {STEPS.map((step, index) => (
            <Card key={step.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-mono">{step.redirectUrl}</span>
                      <span className="text-orange-600">
                        (redirecionamento automático em {step.redirectTime}s)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 border-0">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Pronto para começar?
            </h3>
            <p className="text-orange-100 mb-6">
              Ao iniciar, você será redirecionado automaticamente para cada etapa do fluxo
            </p>
            <Button
              size="lg"
              onClick={handleStart}
              className="bg-white text-orange-600 hover:bg-orange-50 font-semibold px-8"
            >
              Iniciar Tutorial
              <PlayCircle className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>💡 Dica:</strong> Mantenha esta aba aberta em segundo plano. Quando terminar cada etapa,
            volte aqui para continuar o tutorial (ou aguarde o redirecionamento automático).
          </p>
        </div>
      </div>
    </div>
  )
}
