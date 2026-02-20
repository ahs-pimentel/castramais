'use client'

import { ClipboardList, Clock, Calendar, CheckCircle, Hourglass, Dog, Cat } from 'lucide-react'
import { Card } from './ui/card'
import { Stats } from '@/lib/types'

interface StatsCardsProps {
  stats: Stats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total',
      value: stats.total,
      icon: ClipboardList,
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600',
    },
    {
      label: 'Pendentes',
      value: stats.pendentes,
      icon: Clock,
      bgColor: 'bg-pending-bg',
      iconColor: 'text-pending-text',
    },
    {
      label: 'Agendados',
      value: stats.agendados,
      icon: Calendar,
      bgColor: 'bg-scheduled-bg',
      iconColor: 'text-scheduled-text',
    },
    {
      label: 'Realizados',
      value: stats.realizados,
      icon: CheckCircle,
      bgColor: 'bg-completed-bg',
      iconColor: 'text-completed-text',
    },
    {
      label: 'Lista Espera',
      value: stats.listaEspera,
      icon: Hourglass,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Cachorros',
      value: stats.cachorros,
      icon: Dog,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      label: 'Gatos',
      value: stats.gatos,
      icon: Cat,
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className={card.bgColor}>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {card.value}
                </p>
              </div>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
