'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select } from '../ui/select'
import { Card, CardContent, CardHeader } from '../ui/card'
import { CreateAnimalDTO, AnimalWithTutor, UpdateAnimalDTO, Entidade, Campanha } from '@/lib/types'
import { cleanCPF, validateCPF } from '@/lib/utils'
import { TutorSearch } from './tutor-search'
import { PetFields } from './pet-fields'

interface AnimalFormProps {
  animal?: AnimalWithTutor
  mode: 'create' | 'edit'
}

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
  const [entidades, setEntidades] = useState<Entidade[]>([])
  const [campanhas, setCampanhas] = useState<Campanha[]>([])

  const [formData, setFormData] = useState({
    // Animal
    nome: animal?.nome || '',
    especie: animal?.especie || 'cachorro',
    raca: animal?.raca || '',
    sexo: animal?.sexo || 'macho',
    peso: animal?.peso?.toString() || '',
    idadeAnos: animal?.idadeAnos?.toString() || '',
    idadeMeses: animal?.idadeMeses?.toString() || '',
    registroSinpatinhas: animal?.registroSinpatinhas || '',
    observacoes: animal?.observacoes || '',
    status: animal?.status || 'pendente',
    dataAgendamento: animal?.dataAgendamento?.split('T')[0] || '',
    horarioAgendamento: animal?.horarioAgendamento || '',
    localAgendamento: animal?.localAgendamento || '',
    enderecoAgendamento: animal?.enderecoAgendamento || '',
    dataRealizacao: animal?.dataRealizacao?.split('T')[0] || '',
    campanhaId: (animal as unknown as { campanhaId?: string })?.campanhaId || '',
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

  useEffect(() => {
    if (mode === 'edit') {
      fetch('/api/admin/entidades')
        .then(res => res.ok ? res.json() : [])
        .then((data: Entidade[]) => setEntidades(data.filter(e => e.ativo)))
        .catch(() => setEntidades([]))

      fetch('/api/campanhas')
        .then(res => res.ok ? res.json() : [])
        .then((data: Campanha[]) => setCampanhas(data))
        .catch(() => setCampanhas([]))
    }
  }, [mode])

  const handleEntidadeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const entidadeId = e.target.value
    const entidade = entidades.find(ent => ent.id === entidadeId)
    if (entidade) {
      const endereco = entidade.endereco || [entidade.bairro, entidade.cidade].filter(Boolean).join(' - ')
      setFormData(prev => ({
        ...prev,
        localAgendamento: entidade.nome,
        enderecoAgendamento: endereco,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        localAgendamento: '',
        enderecoAgendamento: '',
      }))
    }
  }

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

    if (!formData.nome.trim()) newErrors.nome = 'Nome \u00e9 obrigat\u00f3rio'
    if (!formData.raca.trim()) newErrors.raca = 'Ra\u00e7a \u00e9 obrigat\u00f3ria'
    if (!formData.tutorCpf.trim()) newErrors.tutorCpf = 'CPF \u00e9 obrigat\u00f3rio'
    else if (!validateCPF(formData.tutorCpf)) newErrors.tutorCpf = 'CPF inv\u00e1lido'

    if (tutorFound === false) {
      if (!formData.tutorNome.trim()) newErrors.tutorNome = 'Nome do tutor \u00e9 obrigat\u00f3rio'
      if (!formData.tutorTelefone.trim()) newErrors.tutorTelefone = 'Telefone \u00e9 obrigat\u00f3rio'
      if (!formData.tutorEndereco.trim()) newErrors.tutorEndereco = 'Endere\u00e7o \u00e9 obrigat\u00f3rio'
      if (!formData.tutorCidade.trim()) newErrors.tutorCidade = 'Cidade \u00e9 obrigat\u00f3ria'
      if (!formData.tutorBairro.trim()) newErrors.tutorBairro = 'Bairro \u00e9 obrigat\u00f3rio'
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
        const payload: CreateAnimalDTO & { campanhaId?: string } = {
          nome: formData.nome,
          especie: formData.especie as 'cachorro' | 'gato',
          raca: formData.raca,
          sexo: formData.sexo as 'macho' | 'femea',
          peso: formData.peso ? parseFloat(formData.peso) : undefined,
          idadeAnos: formData.idadeAnos ? parseInt(formData.idadeAnos) : undefined,
          idadeMeses: formData.idadeMeses ? parseInt(formData.idadeMeses) : undefined,
          registroSinpatinhas: formData.registroSinpatinhas,
          observacoes: formData.observacoes || undefined,
          campanhaId: formData.campanhaId || undefined,
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
        const payload: UpdateAnimalDTO & { campanhaId?: string | null } = {
          nome: formData.nome,
          especie: formData.especie as 'cachorro' | 'gato',
          raca: formData.raca,
          sexo: formData.sexo as 'macho' | 'femea',
          peso: formData.peso ? parseFloat(formData.peso) : null,
          idadeAnos: formData.idadeAnos ? parseInt(formData.idadeAnos) : null,
          idadeMeses: formData.idadeMeses ? parseInt(formData.idadeMeses) : null,
          registroSinpatinhas: formData.registroSinpatinhas || null,
          observacoes: formData.observacoes || null,
          status: formData.status as 'pendente' | 'agendado' | 'realizado' | 'cancelado',
          dataAgendamento: formData.dataAgendamento || null,
          horarioAgendamento: formData.horarioAgendamento || null,
          localAgendamento: formData.localAgendamento || null,
          enderecoAgendamento: formData.enderecoAgendamento || null,
          dataRealizacao: formData.dataRealizacao || null,
          campanhaId: formData.campanhaId || null,
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

  const campanhaOptions = [
    { value: '', label: 'Sem campanha' },
    ...campanhas.map(c => ({
      value: c.id,
      label: `${c.nome} \u2014 ${c.cidade}${!c.ativa ? ' (inativa)' : ''}`,
    })),
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'create' && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Tutor</h2>
          </CardHeader>
          <CardContent>
            <TutorSearch
              formData={formData}
              errors={errors}
              tutorFound={tutorFound}
              searchingTutor={searchingTutor}
              onCPFChange={handleCPFChange}
              onChange={handleChange}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Animal</h2>
        </CardHeader>
        <CardContent>
          <PetFields
            formData={formData}
            errors={errors}
            onChange={handleChange}
            registroSinpatinhas={animal?.registroSinpatinhas}
            showRG={mode === 'edit'}
          />
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
              <Select
                id="campanhaId"
                name="campanhaId"
                label="Campanha"
                value={formData.campanhaId}
                onChange={handleChange}
                options={campanhaOptions}
              />
              <Input
                id="dataRealizacao"
                name="dataRealizacao"
                label="Data de Realiza\u00e7\u00e3o"
                type="date"
                value={formData.dataRealizacao}
                onChange={handleChange}
              />
            </div>

            {(formData.status === 'agendado' || formData.dataAgendamento) && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                <h3 className="font-medium text-blue-900">Dados do Agendamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="dataAgendamento"
                    name="dataAgendamento"
                    label="Data do Agendamento"
                    type="date"
                    value={formData.dataAgendamento}
                    onChange={handleChange}
                  />
                  <Input
                    id="horarioAgendamento"
                    name="horarioAgendamento"
                    label="Hor\u00e1rio"
                    type="time"
                    value={formData.horarioAgendamento}
                    onChange={handleChange}
                    placeholder="Ex: 08:00"
                  />
                  <div className="w-full">
                    <label htmlFor="entidadeSelect" className="block text-sm font-medium text-gray-700 mb-1">
                      Local de Castra\u00e7\u00e3o (Entidade)
                    </label>
                    <select
                      id="entidadeSelect"
                      value={entidades.find(e => e.nome === formData.localAgendamento)?.id || ''}
                      onChange={handleEntidadeChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">Selecione uma entidade...</option>
                      {entidades.map(ent => (
                        <option key={ent.id} value={ent.id}>
                          {ent.nome} \u2014 {[ent.bairro, ent.cidade].filter(Boolean).join(', ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    id="enderecoAgendamento"
                    name="enderecoAgendamento"
                    label="Endere\u00e7o do Local"
                    value={formData.enderecoAgendamento}
                    onChange={handleChange}
                    placeholder="Preenchido automaticamente pela entidade"
                  />
                </div>
              </div>
            )}
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
            'Salvar altera\u00e7\u00f5es'
          )}
        </Button>
      </div>
    </form>
  )
}
