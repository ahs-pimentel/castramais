import { QrCode, HelpCircle, ExternalLink } from 'lucide-react'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'

interface StepRegistroProps {
  registroSinpatinhas: string
  error?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function StepRegistro({ registroSinpatinhas, error, onChange }: StepRegistroProps) {
  return (
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
            value={registroSinpatinhas}
            onChange={onChange}
            placeholder="BR-000000000000"
            error={error}
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
  )
}
