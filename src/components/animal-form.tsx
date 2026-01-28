'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, QrCode } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Card, CardContent, CardHeader } from './ui/card'
import { CreateAnimalDTO, AnimalWithTutor, UpdateAnimalDTO } from '@/lib/types'
import { formatCPF, cleanCPF, validateCPF } from '@/lib/utils'

interface AnimalFormProps {
  animal?: AnimalWithTutor
  mode: 'create' | 'edit'
}

const especieOptions = [
  { value: 'cachorro', label: 'Cachorro' },
  { value: 'gato', label: 'Gato' },
]

const sexoOptions = [
  { value: 'macho', label: 'Macho' },
  { value: 'femea', label: 'Fêmea' },
]

const statusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'cancelado', label: 'Cancelado' },
]

export function AnimalForm({ animal, mode }: AnimalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searchingTutor, setSearchingTutor] = useState(false)
  const [tutorFound, setTutorFound] = useState<boolean | null>(mode === 'edit' ? true : null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    // Animal
    nome: animal?.nome || '',
    especie: animal?.especie || 'cachorro',
    raca: animal?.raca || '',
    sexo: animal?.sexo || 'macho',
    peso: animal?.peso?.toString() || '',
    idadeAnos: animal?.idadeAnos?.toString() || '',
    idadeMeses: animal?.idadeMeses?.toString() || '',
    observacoes: animal?.observacoes || '',
    status: animal?.status || 'pendente',
    dataAgendamento: animal?.dataAgendamento?.split('T')[0] || '',
    dataRealizacao: animal?.dataRealizacao?.split('T')[0] || '',
    // Tutor
    tutorId: animal?.tutor?.id || '',
    tutorCpf: animal?.tutor?.cpf || '',
    tutorNome: animal?.tutor?.nome || '',
    tutorTelefone: animal?.tutor?.telefone || '',
    tutorEmail: animal?.tutor?.email || '',
    tutorEndereco: animal?.tutor?.endereco || '',
    tutorCidade: animal?.tutor?.cidade || '',
    tutorBairro: animal?.tutor?.bairro || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11)
    setFormData((prev) => ({ ...prev, tutorCpf: value }))
    setErrors((prev) => ({ ...prev, tutorCpf: '' }))
    if (value.length === 11) {
      searchTutor(value)
    } else {
      setTutorFound(null)
    }
  }

  const searchTutor = async (cpf: string) => {
    setSearchingTutor(true)
    try {
      const res = await fetch(`/api/tutores/cpf/${cpf}`)
      if (res.ok) {
        const tutor = await res.json()
        setFormData((prev) => ({
          ...prev,
          tutorId: tutor.id,
          tutorNome: tutor.nome,
          tutorTelefone: tutor.telefone,
          tutorEmail: tutor.email || '',
          tutorEndereco: tutor.endereco,
          tutorCidade: tutor.cidade,
          tutorBairro: tutor.bairro,
        }))
        setTutorFound(true)
      } else {
        setFormData((prev) => ({
          ...prev,
          tutorId: '',
          tutorNome: '',
          tutorTelefone: '',
          tutorEmail: '',
          tutorEndereco: '',
          tutorCidade: '',
          tutorBairro: '',
        }))
        setTutorFound(false)
      }
    } catch {
      setTutorFound(false)
    } finally {
      setSearchingTutor(false)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório'
    if (!formData.raca.trim()) newErrors.raca = 'Raça é obrigatória'
    if (!formData.tutorCpf.trim()) newErrors.tutorCpf = 'CPF é obrigatório'
    else if (!validateCPF(formData.tutorCpf)) newErrors.tutorCpf = 'CPF inválido'

    if (tutorFound === false) {
      if (!formData.tutorNome.trim()) newErrors.tutorNome = 'Nome do tutor é obrigatório'
      if (!formData.tutorTelefone.trim()) newErrors.tutorTelefone = 'Telefone é obrigatório'
      if (!formData.tutorEndereco.trim()) newErrors.tutorEndereco = 'Endereço é obrigatório'
      if (!formData.tutorCidade.trim()) newErrors.tutorCidade = 'Cidade é obrigatória'
      if (!formData.tutorBairro.trim()) newErrors.tutorBairro = 'Bairro é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      if (mode === 'create') {
        const payload: CreateAnimalDTO = {
          nome: formData.nome,
          especie: formData.especie as 'cachorro' | 'gato',
          raca: formData.raca,
          sexo: formData.sexo as 'macho' | 'femea',
          peso: formData.peso ? parseFloat(formData.peso) : undefined,
          idadeAnos: formData.idadeAnos ? parseInt(formData.idadeAnos) : undefined,
          idadeMeses: formData.idadeMeses ? parseInt(formData.idadeMeses) : undefined,
          observacoes: formData.observacoes || undefined,
        }

        if (formData.tutorId) {
          payload.tutorId = formData.tutorId
        } else {
          payload.tutor = {
            nome: formData.tutorNome,
            cpf: cleanCPF(formData.tutorCpf),
            telefone: formData.tutorTelefone,
            email: formData.tutorEmail || undefined,
            endereco: formData.tutorEndereco,
            cidade: formData.tutorCidade,
            bairro: formData.tutorBairro,
          }
        }

        const res = await fetch('/api/animais', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error('Erro ao cadastrar')
      } else {
        const payload: UpdateAnimalDTO = {
          nome: formData.nome,
          especie: formData.especie as 'cachorro' | 'gato',
          raca: formData.raca,
          sexo: formData.sexo as 'macho' | 'femea',
          peso: formData.peso ? parseFloat(formData.peso) : null,
          idadeAnos: formData.idadeAnos ? parseInt(formData.idadeAnos) : null,
          idadeMeses: formData.idadeMeses ? parseInt(formData.idadeMeses) : null,
          observacoes: formData.observacoes || null,
          status: formData.status as 'pendente' | 'agendado' | 'realizado' | 'cancelado',
          dataAgendamento: formData.dataAgendamento || null,
          dataRealizacao: formData.dataRealizacao || null,
        }

        const res = await fetch(`/api/animais/${animal?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error('Erro ao atualizar')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'create' && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Tutor</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                id="tutorCpf"
                name="tutorCpf"
                label="CPF do Tutor"
                value={formatCPF(formData.tutorCpf)}
                onChange={handleCPFChange}
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
                  Tutor não encontrado. Preencha os dados abaixo para cadastrar.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="tutorNome"
                    name="tutorNome"
                    label="Nome Completo"
                    value={formData.tutorNome}
                    onChange={handleChange}
                    error={errors.tutorNome}
                  />
                  <Input
                    id="tutorTelefone"
                    name="tutorTelefone"
                    label="Telefone"
                    value={formData.tutorTelefone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    error={errors.tutorTelefone}
                  />
                  <Input
                    id="tutorEmail"
                    name="tutorEmail"
                    label="Email (opcional)"
                    type="email"
                    value={formData.tutorEmail}
                    onChange={handleChange}
                  />
                  <Input
                    id="tutorEndereco"
                    name="tutorEndereco"
                    label="Endereço"
                    value={formData.tutorEndereco}
                    onChange={handleChange}
                    error={errors.tutorEndereco}
                  />
                  <Input
                    id="tutorCidade"
                    name="tutorCidade"
                    label="Cidade"
                    value={formData.tutorCidade}
                    onChange={handleChange}
                    error={errors.tutorCidade}
                  />
                  <Input
                    id="tutorBairro"
                    name="tutorBairro"
                    label="Bairro"
                    value={formData.tutorBairro}
                    onChange={handleChange}
                    error={errors.tutorBairro}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Animal</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'edit' && animal?.registroSinpatinhas && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <QrCode className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">RG Animal (SinPatinhas)</p>
                <p className="font-mono font-medium text-gray-900">{animal.registroSinpatinhas}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="nome"
              name="nome"
              label="Nome do Animal"
              value={formData.nome}
              onChange={handleChange}
              error={errors.nome}
            />
            <Select
              id="especie"
              name="especie"
              label="Espécie"
              value={formData.especie}
              onChange={handleChange}
              options={especieOptions}
            />
            <Input
              id="raca"
              name="raca"
              label="Raça"
              value={formData.raca}
              onChange={handleChange}
              error={errors.raca}
            />
            <Select
              id="sexo"
              name="sexo"
              label="Sexo"
              value={formData.sexo}
              onChange={handleChange}
              options={sexoOptions}
            />
            <Input
              id="peso"
              name="peso"
              label="Peso (kg)"
              type="number"
              step="0.1"
              value={formData.peso}
              onChange={handleChange}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                id="idadeAnos"
                name="idadeAnos"
                label="Idade (anos)"
                type="number"
                value={formData.idadeAnos}
                onChange={handleChange}
              />
              <Input
                id="idadeMeses"
                name="idadeMeses"
                label="Meses"
                type="number"
                value={formData.idadeMeses}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações médicas
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {mode === 'edit' && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Status</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                id="status"
                name="status"
                label="Status"
                value={formData.status}
                onChange={handleChange}
                options={statusOptions}
              />
              <Input
                id="dataAgendamento"
                name="dataAgendamento"
                label="Data de Agendamento"
                type="date"
                value={formData.dataAgendamento}
                onChange={handleChange}
              />
              <Input
                id="dataRealizacao"
                name="dataRealizacao"
                label="Data de Realização"
                type="date"
                value={formData.dataRealizacao}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || (mode === 'create' && tutorFound === null)}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : mode === 'create' ? (
            'Cadastrar'
          ) : (
            'Salvar alterações'
          )}
        </Button>
      </div>
    </form>
  )
}
