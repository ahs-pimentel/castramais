import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'pendente' | 'agendado' | 'realizado' | 'cancelado' | 'lista_espera'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'pendente', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          {
            'bg-pending-bg text-pending-text': variant === 'pendente',
            'bg-scheduled-bg text-scheduled-text': variant === 'agendado',
            'bg-completed-bg text-completed-text': variant === 'realizado',
            'bg-canceled-bg text-canceled-text': variant === 'cancelado',
            'bg-amber-100 text-amber-700': variant === 'lista_espera',
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
