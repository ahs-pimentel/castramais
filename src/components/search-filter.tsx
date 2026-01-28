'use client'

import { Search } from 'lucide-react'
import { Input } from './ui/input'
import { Select } from './ui/select'

interface SearchFilterProps {
  search: string
  status: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
}

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'cancelado', label: 'Cancelado' },
]

export function SearchFilter({
  search,
  status,
  onSearchChange,
  onStatusChange,
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
      <Select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        options={statusOptions}
      />
    </div>
  )
}
