import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-white rounded-xl shadow-sm border border-gray-100', className)}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-4 py-3 border-b border-gray-100', className)}
        {...props}
      />
    )
  }
)

CardHeader.displayName = 'CardHeader'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('p-4', className)} {...props} />
  }
)

CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardContent }
