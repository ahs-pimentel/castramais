'use client'

import { Search } from 'lucide-react'
import { Input } from './ui/input'
import { Select } from './ui/select'

interface SearchFilterProps {
  search: string
  status: string
  cidade?: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onCidadeChange?: (value: string) => void
  showCidadeFilter?: boolean
}

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'lista_espera', label: 'Lista de Espera' },
]

const cidadeOptions = [
  { value: '', label: 'Todas as cidades' },
  { value: 'entre-rios-de-minas', label: 'Entre Rios de Minas' },
  { value: 'caranaiba', label: 'Caranaíba' },
  { value: 'carandai', label: 'Carandaí' },
  { value: 'barbacena', label: 'Barbacena' },
]

export function SearchFilter({
  search,
  status,
  cidade = '',
  onSearchChange,
  onStatusChange,
  onCidadeChange,
  showCidadeFilter = false,
}: SearchFilterProps) {
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
      <div className={`grid gap-3 ${showCidadeFilter ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <Select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={statusOptions}
        />
        {showCidadeFilter && onCidadeChange && (
          <Select
            value={cidade}
            onChange={(e) => onCidadeChange(e.target.value)}
            options={cidadeOptions}
          />
        )}
      </div>
    </div>
  )
}
