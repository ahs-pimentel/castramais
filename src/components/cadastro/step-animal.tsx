import { PawPrint } from 'lucide-react'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { Card, CardContent } from '../ui/card'
import { Campanha } from '@/lib/types'

const especieOptions = [
  { value: 'cachorro', label: 'Cachorro' },
  { value: 'gato', label: 'Gato' },
]

const sexoOptions = [
  { value: 'macho', label: 'Macho' },
  { value: 'femea', label: 'Fêmea' },
]

interface StepAnimalProps {
  formData: {
    nome: string
    especie: string
    raca: string
    sexo: string
    peso: string
    idadeAnos: string
    idadeMeses: string
    observacoes: string
    campanhaId: string
    tutorNome: string
  }
  campanhas: Campanha[]
  errors: Record<string, string>
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
}

export function StepAnimal({ formData, campanhas, errors, onChange }: StepAnimalProps) {
  return (
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

        <div>
          <Select
            id="campanhaId"
            name="campanhaId"
            label="Campanha *"
            value={formData.campanhaId}
            onChange={onChange}
            options={[
              { value: '', label: 'Selecione a campanha' },
              ...campanhas.map(c => ({
                value: c.id,
                label: `${c.nome} — ${c.cidade}${c.dataDescricao ? ` (${c.dataDescricao})` : ''}`,
              })),
            ]}
            error={errors.campanhaId}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="nome"
            name="nome"
            label="Nome do Pet"
            value={formData.nome}
            onChange={onChange}
            placeholder="Ex: Rex, Mel, Thor..."
            error={errors.nome}
          />
          <Select
            id="especie"
            name="especie"
            label="Espécie"
            value={formData.especie}
            onChange={onChange}
            options={especieOptions}
          />
          <Input
            id="raca"
            name="raca"
            label="Raça"
            value={formData.raca}
            onChange={onChange}
            placeholder="Ex: Vira-lata, Siamês, Labrador..."
            error={errors.raca}
          />
          <Select
            id="sexo"
            name="sexo"
            label="Sexo"
            value={formData.sexo}
            onChange={onChange}
            options={sexoOptions}
          />
          <Input
            id="peso"
            name="peso"
            label="Peso aproximado (kg)"
            type="number"
            step="0.1"
            value={formData.peso}
            onChange={onChange}
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
              onChange={onChange}
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
              onChange={onChange}
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
            onChange={onChange}
            rows={3}
            placeholder="Alergias, medicamentos em uso, cirurgias anteriores..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-xl space-y-2">
          <p className="text-sm font-medium text-gray-700">Resumo do cadastro:</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Tutor:</span> {formData.tutorNome}</p>
            <p><span className="font-medium">Pet:</span> {formData.nome || '(não informado)'} - {formData.especie === 'cachorro' ? 'Cachorro' : 'Gato'}</p>
            {formData.campanhaId && (
              <p><span className="font-medium">Campanha:</span> {campanhas.find(c => c.id === formData.campanhaId)?.nome}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
