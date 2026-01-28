'use client'

import Link from 'next/link'
import { User, Phone, Calendar, Cat, Dog, QrCode } from 'lucide-react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { AnimalWithTutor } from '@/lib/types'
import { formatPhone, formatDate } from '@/lib/utils'

interface AnimalCardProps {
  animal: AnimalWithTutor
}

const statusLabels = {
  pendente: 'Pendente',
  agendado: 'Agendado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
}

export function AnimalCard({ animal }: AnimalCardProps) {
  const Icon = animal.especie === 'gato' ? Cat : Dog

  return (
    <Link href={`/dashboard/${animal.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="p-4 flex gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon className="w-8 h-8 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">{animal.nome}</h3>
                <p className="text-sm text-gray-500">
                  {animal.sexo === 'macho' ? 'Macho' : 'Fêmea'} &middot; {animal.raca}
                </p>
              </div>
              <Badge variant={animal.status}>{statusLabels[animal.status]}</Badge>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <QrCode className="w-4 h-4" />
                <span className="font-mono text-xs">{animal.registroSinpatinhas}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="truncate">{animal.tutor.nome}</span>
                <Phone className="w-4 h-4 ml-2" />
                <span>{formatPhone(animal.tutor.telefone)}</span>
              </div>
              {(animal.dataAgendamento || animal.dataRealizacao) && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {animal.dataRealizacao
                      ? formatDate(animal.dataRealizacao)
                      : formatDate(animal.dataAgendamento)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
