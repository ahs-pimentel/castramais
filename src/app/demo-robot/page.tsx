'use client'

import { useState, useEffect } from 'react'
import { Bot, CheckCircle, Clock, PlayCircle, Pause, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Step {
  id: string
  title: string
  description: string
  action: () => Promise<void>
  duration: number
}

export default function DemoRobotPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [countdown, setCountdown] = useState(0)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR')
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const steps: Step[] = [
    {
      id: 'navigate-cadastro',
      title: 'Navegar para Cadastro de Entidade',
      description: 'Abrindo página de cadastro em nova aba',
      duration: 3,
      action: async () => {
        addLog('🌐 Abrindo /entidade/cadastro em nova aba...')
        window.open('/entidade/cadastro', '_blank')
        await new Promise(resolve => setTimeout(resolve, 2000))
        addLog('✅ Página aberta com sucesso')
      }
    },
    {
      id: 'fill-cadastro-data',
      title: 'Preencher Dados do Cadastro',
      description: 'Dados de exemplo: ONG Patinhas Felizes',
      duration: 5,
      action: async () => {
        addLog('📝 Simulando preenchimento do formulário...')
        addLog('   → Nome: ONG Patinhas Felizes')
        await new Promise(resolve => setTimeout(resolve, 800))
        addLog('   → CNPJ: 12.345.678/0001-90')
        await new Promise(resolve => setTimeout(resolve, 800))
        addLog('   → Responsável: Maria Silva')
        await new Promise(resolve => setTimeout(resolve, 800))
        addLog('   → Telefone: (31) 99999-8888')
        await new Promise(resolve => setTimeout(resolve, 800))
        addLog('   → Email: contato@patinhasfelizes.org')
        await new Promise(resolve => setTimeout(resolve, 800))
        addLog('   → Cidade: Belo Horizonte')
        await new Promise(resolve => setTimeout(resolve, 800))
        addLog('   → Endereço: Rua das Flores, 123 - Centro')
        addLog('✅ Formulário preenchido')
      }
    },
    {
      id: 'submit-cadastro',
      title: 'Enviar Cadastro',
      description: 'Clicando no botão de cadastrar',
      duration: 3,
      action: async () => {
        addLog('🚀 Enviando cadastro...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        addLog('✅ Cadastro enviado com sucesso!')
        addLog('🔑 Senha gerada: ********')
      }
    },
    {
      id: 'navigate-login',
      title: 'Navegar para Login',
      description: 'Redirecionando para tela de login',
      duration: 3,
      action: async () => {
        addLog('🌐 Abrindo /entidade/login em nova aba...')
        window.open('/entidade/login', '_blank')
        await new Promise(resolve => setTimeout(resolve, 2000))
        addLog('✅ Página de login aberta')
      }
    },
    {
      id: 'fill-login-data',
      title: 'Preencher Dados de Login',
      description: 'Email e senha da entidade cadastrada',
      duration: 3,
      action: async () => {
        addLog('📝 Preenchendo credenciais...')
        addLog('   → Email: contato@patinhasfelizes.org')
        await new Promise(resolve => setTimeout(resolve, 1000))
        addLog('   → Senha: ********')
        addLog('✅ Credenciais preenchidas')
      }
    },
    {
      id: 'submit-login',
      title: 'Fazer Login',
      description: 'Autenticando no sistema',
      duration: 3,
      action: async () => {
        addLog('🔐 Autenticando...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        addLog('✅ Login realizado com sucesso!')
      }
    },
    {
      id: 'navigate-dashboard',
      title: 'Acessar Dashboard',
      description: 'Redirecionando para painel da entidade',
      duration: 3,
      action: async () => {
        addLog('🌐 Abrindo /entidade/dashboard em nova aba...')
        window.open('/entidade/dashboard', '_blank')
        await new Promise(resolve => setTimeout(resolve, 2000))
        addLog('✅ Dashboard carregado')
      }
    },
    {
      id: 'explore-features',
      title: 'Explorar Funcionalidades',
      description: 'Visualizando recursos disponíveis',
      duration: 4,
      action: async () => {
        addLog('👀 Explorando funcionalidades...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        addLog('   → Lista de animais cadastrados')
        await new Promise(resolve => setTimeout(resolve, 1000))
        addLog('   → Estatísticas da campanha')
        await new Promise(resolve => setTimeout(resolve, 1000))
        addLog('   → Opções de cadastro de novos animais')
        addLog('✅ Tour completo')
      }
    },
    {
      id: 'complete',
      title: 'Demonstração Concluída',
      description: 'Todos os passos foram executados',
      duration: 2,
      action: async () => {
        addLog('🎉 Demonstração completa!')
        addLog('📹 Gravação de vídeo facilitada')
      }
    }
  ]

  useEffect(() => {
    if (!isRunning || isPaused || currentStepIndex >= steps.length) return

    const currentStep = steps[currentStepIndex]
    setCountdown(currentStep.duration)

    const executeStep = async () => {
      addLog(`▶️ Iniciando: ${currentStep.title}`)
      await currentStep.action()
      setCompletedSteps(prev => [...prev, currentStep.id])

      // Wait for countdown
      for (let i = currentStep.duration; i > 0; i--) {
        if (!isRunning || isPaused) break
        setCountdown(i)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1)
      } else {
        setIsRunning(false)
        addLog('✨ Automação finalizada!')
      }
    }

    executeStep()
  }, [isRunning, isPaused, currentStepIndex])

  const handleStart = () => {
    setIsRunning(true)
    setIsPaused(false)
    setCurrentStepIndex(0)
    setCompletedSteps([])
    setLogs([])
    addLog('🤖 Iniciando automação de demonstração...')
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
    addLog(isPaused ? '▶️ Retomando...' : '⏸️ Pausado')
  }

  const handleSkip = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
      addLog('⏭️ Pulando para próxima etapa...')
    }
  }

  const handleStop = () => {
    setIsRunning(false)
    setIsPaused(false)
    setCurrentStepIndex(-1)
    addLog('⏹️ Automação interrompida')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤖 Demo Robot - Automação
          </h1>
          <p className="text-lg text-gray-600">
            Demonstração automática do fluxo de cadastro de entidades
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Control Panel */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Controles
              </h2>

              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Iniciar Automação
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    {isPaused ? (
                      <>
                        <PlayCircle className="w-5 h-5 mr-2" />
                        Continuar
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Pausar
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleSkip}
                      variant="outline"
                      disabled={currentStepIndex >= steps.length - 1}
                    >
                      <SkipForward className="w-4 h-4 mr-2" />
                      Pular
                    </Button>
                    <Button
                      onClick={handleStop}
                      variant="danger"
                    >
                      Parar
                    </Button>
                  </div>
                </div>
              )}

              {isRunning && currentStepIndex >= 0 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl">
                  <p className="text-sm font-medium text-purple-900 mb-2">
                    Etapa Atual:
                  </p>
                  <p className="font-semibold text-purple-900">
                    {steps[currentStepIndex]?.title}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-700" />
                    <span className="text-2xl font-bold text-purple-700">
                      {countdown}s
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Progresso: {completedSteps.length} / {steps.length}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(completedSteps.length / steps.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Steps List */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Etapas da Automação
              </h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {steps.map((step, index) => {
                  const isCompleted = completedSteps.includes(step.id)
                  const isCurrent = currentStepIndex === index

                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isCurrent
                          ? 'border-purple-500 bg-purple-50'
                          : isCompleted
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-green-500'
                            : isCurrent
                              ? 'bg-purple-500 animate-pulse'
                              : 'bg-gray-300'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <span className="text-white text-sm font-bold">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${
                            isCurrent ? 'text-purple-900' : 'text-gray-900'
                          }`}>
                            {step.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Console Log */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-green-600">$</span>
              Console Log
            </h2>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">Aguardando início da automação...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <div className="mt-6 p-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white">
          <h3 className="text-xl font-bold mb-3">💡 Como usar</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span>1️⃣</span>
              <span>Clique em "Iniciar Automação" para começar o fluxo automatizado</span>
            </li>
            <li className="flex items-start gap-2">
              <span>2️⃣</span>
              <span>As páginas serão abertas automaticamente em novas abas</span>
            </li>
            <li className="flex items-start gap-2">
              <span>3️⃣</span>
              <span>Use Pausar/Pular para controlar o ritmo da demonstração</span>
            </li>
            <li className="flex items-start gap-2">
              <span>4️⃣</span>
              <span>Perfeito para gravar vídeos tutoriais!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
