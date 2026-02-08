'use client'

import { QrCode } from 'lucide-react'
import { Input } from '../ui/input'
import { Select } from '../ui/select'

const especieOptions = [
  { value: 'cachorro', label: 'Cachorro' },
  { value: 'gato', label: 'Gato' },
]

const sexoOptions = [
  { value: 'macho', label: 'Macho' },
  { value: 'femea', label: 'F\u00eamea' },
]

interface PetFieldsProps {
  formData: {
    nome: string
    especie: string
    raca: string
    sexo: string
    peso: string
    idadeAnos: string
    idadeMeses: string
    observacoes: string
  }
  errors: Record<string, string>
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  registroSinpatinhas?: string | null
  showRG?: boolean
}

export function PetFields({ formData, errors, onChange, registroSinpatinhas, showRG }: PetFieldsProps) {
  return (
    <div className="space-y-4">
      {showRG && registroSinpatinhas && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <QrCode className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">RG Animal (SinPatinhas)</p>
            <p className="font-mono font-medium text-gray-900">{registroSinpatinhas}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="nome"
          name="nome"
          label="Nome do Animal"
          value={formData.nome}
          onChange={onChange}
          error={errors.nome}
        />
        <Select
          id="especie"
          name="especie"
          label="Esp\u00e9cie"
          value={formData.especie}
          onChange={onChange}
          options={especieOptions}
        />
        <Input
          id="raca"
          name="raca"
          label="Ra\u00e7a"
          value={formData.raca}
          onChange={onChange}
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
          label="Peso (kg)"
          type="number"
          step="0.1"
          value={formData.peso}
          onChange={onChange}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            id="idadeAnos"
            name="idadeAnos"
            label="Idade (anos)"
            type="number"
            value={formData.idadeAnos}
            onChange={onChange}
          />
          <Input
            id="idadeMeses"
            name="idadeMeses"
            label="Meses"
            type="number"
            value={formData.idadeMeses}
            onChange={onChange}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observa\u00e7\u00f5es m\u00e9dicas
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          value={formData.observacoes}
          onChange={onChange}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  )
}
