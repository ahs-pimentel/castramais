import { User, Loader2, Check, AlertCircle, MapPin } from 'lucide-react'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { formatCPF } from '@/lib/utils'

interface StepTutorProps {
  formData: {
    tutorCpf: string
    tutorNome: string
    tutorTelefone: string
    tutorEmail: string
    tutorEndereco: string
    tutorNumero: string
    tutorComplemento: string
    tutorBairro: string
    tutorCidade: string
  }
  errors: Record<string, string>
  tutorFound: boolean | null
  searchingTutor: boolean
  onCPFChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function StepTutor({
  formData,
  errors,
  tutorFound,
  searchingTutor,
  onCPFChange,
  onChange,
}: StepTutorProps) {
  return (
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
            onChange={onCPFChange}
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
                onChange={onChange}
                error={errors.tutorNome}
              />
              <Input
                id="tutorTelefone"
                name="tutorTelefone"
                label="Telefone (WhatsApp)"
                value={formData.tutorTelefone}
                onChange={onChange}
                placeholder="(00) 00000-0000"
                error={errors.tutorTelefone}
              />
              <Input
                id="tutorEmail"
                name="tutorEmail"
                label="Email (opcional)"
                type="email"
                value={formData.tutorEmail}
                onChange={onChange}
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">Endereço</span>
              </div>

              <div className="mb-4">
                <Input
                  id="tutorCidade"
                  name="tutorCidade"
                  label="Cidade"
                  value={formData.tutorCidade}
                  onChange={onChange}
                  placeholder="Ex: Barbacena, Carandaí..."
                  error={errors.tutorCidade}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    id="tutorEndereco"
                    name="tutorEndereco"
                    label="Rua/Avenida"
                    value={formData.tutorEndereco}
                    onChange={onChange}
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
                  onChange={onChange}
                  placeholder="123"
                  error={errors.tutorNumero}
                />
                <div className="col-span-2">
                  <Input
                    id="tutorComplemento"
                    name="tutorComplemento"
                    label="Complemento"
                    value={formData.tutorComplemento}
                    onChange={onChange}
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
                  onChange={onChange}
                  error={errors.tutorBairro}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
