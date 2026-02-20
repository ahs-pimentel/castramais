'use client'

import { Search } from 'lucide-react'
import { Input } from './ui/input'
import { Select } from './ui/select'

interface SearchFilterProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  campanha: string
  onCampanhaChange: (value: string) => void
  animaisType: string
  onAnimaisTypeChange: (value: string) => void
  campanhas: { id: string; nome: string; cidade: string }[]
}

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'lista_espera', label: 'Lista de Espera' },
]

const animalTypeOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'cachorro', label: 'Cachorro' },
  { value: 'gato', label: 'Gato' },
]

export function SearchFilter({
  search,
  status,
  campanha,
  animaisType,
  onSearchChange,
  onStatusChange,
  onCampanhaChange,
  onAnimaisTypeChange,
  campanhas,
}: SearchFilterProps) {
  const campanhaOptions = [
    { value: '', label: 'Todas as campanhas' },
    ...campanhas.map((c) => ({
      value: c.id,
      label: `${c.nome} — ${c.cidade}`,
    })),
  ]

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nome, tutor, telefone ou cidade..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="grid gap-3 grid-cols-3">
        <Select
          value={animaisType}
          onChange={(e) => onAnimaisTypeChange(e.target.value)}
          options={animalTypeOptions}
        />
        <Select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={statusOptions}
        />
        <Select
          value={campanha}
          onChange={(e) => onCampanhaChange(e.target.value)}
          options={campanhaOptions}
        />
      </div>
    </div>
  )
}
