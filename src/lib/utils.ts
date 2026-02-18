import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

export function formatDate(date: string | Date | null): string {
  if (!date) return ''
  let d: Date
  
  if (typeof date === 'string') {
    // Remove hora se existir (YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS)
    const datePart = date.split('T')[0]
    const [year, month, day] = datePart.split('-')
    // Cria date usando construtor com componentes locais
    // Isso evita a interpretação como UTC
    d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  } else {
    d = new Date(date)
  }
  
  return d.toLocaleDateString('pt-BR')
}

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

// Re-exportar validações de sanitize.ts (source of truth)
export { cleanCPF, validateCPF } from './sanitize'
