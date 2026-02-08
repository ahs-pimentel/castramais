'use client'

import { Loader2 } from 'lucide-react'
import { Input } from '../ui/input'
import { formatCPF } from '@/lib/utils'

interface TutorSearchProps {
  formData: {
    tutorCpf: string
    tutorNome: string
    tutorTelefone: string
    tutorEmail: string
    tutorEndereco: string
    tutorCidade: string
    tutorBairro: string
  }
  errors: Record<string, string>
  tutorFound: boolean | null
  searchingTutor: boolean
  onCPFChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function TutorSearch({
  formData,
  errors,
  tutorFound,
  searchingTutor,
  onCPFChange,
  onChange,
}: TutorSearchProps) {
  return (
    <div className="space-y-4">
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
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          Tutor encontrado: {formData.tutorNome}
        </div>
      )}

      {tutorFound === false && (
        <>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            Tutor n&atilde;o encontrado. Preencha os dados abaixo para cadastrar.
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
              label="Telefone"
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
            <Input
              id="tutorEndereco"
              name="tutorEndereco"
              label="Endere&ccedil;o"
              value={formData.tutorEndereco}
              onChange={onChange}
              error={errors.tutorEndereco}
            />
            <Input
              id="tutorCidade"
              name="tutorCidade"
              label="Cidade"
              value={formData.tutorCidade}
              onChange={onChange}
              error={errors.tutorCidade}
            />
            <Input
              id="tutorBairro"
              name="tutorBairro"
              label="Bairro"
              value={formData.tutorBairro}
              onChange={onChange}
              error={errors.tutorBairro}
            />
          </div>
        </>
      )}
    </div>
  )
}
