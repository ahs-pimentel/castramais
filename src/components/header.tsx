'use client'

import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { LogOut, PawPrint, Users, Building2, MessageSquare, Megaphone, UserCog, Smartphone } from 'lucide-react'
import { Button } from './ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role || 'admin'
  const [chatwootUrl, setChatwootUrl] = useState<string | null>(null)
  const [whatsappStatus, setWhatsappStatus] = useState<{
    status: string
    conectado: boolean
    instancias?: { nome: string; conectado: boolean; mensagensHoje: number }[]
  } | null>(null)

  useEffect(() => {
    // Buscar URL do Chatwoot
    fetch('/api/admin/chatwoot')
      .then(res => res.json())
      .then(data => {
        if (data.configurado && data.url) {
          setChatwootUrl(data.url)
        }
      })
      .catch(() => {})

    // Buscar status WhatsApp
    fetch('/api/admin/whatsapp/status')
      .then(res => res.json())
      .then(data => setWhatsappStatus(data))
      .catch(() => setWhatsappStatus({ status: 'erro', conectado: false }))

    // Atualizar status a cada 60s
    const interval = setInterval(() => {
      fetch('/api/admin/whatsapp/status')
        .then(res => res.json())
        .then(data => setWhatsappStatus(data))
        .catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { href: '/dashboard', label: 'Animais', icon: PawPrint },
    { href: '/dashboard/tutores', label: 'Tutores', icon: Users },
    { href: '/dashboard/entidades', label: 'Entidades', icon: Building2 },
    { href: '/dashboard/campanhas', label: 'Campanhas', icon: Megaphone },
    ...(role === 'admin' ? [{ href: '/dashboard/usuarios', label: 'Usuários', icon: UserCog }] : []),
  ]

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center">
              <img
                src="/LOGO.svg"
                alt="Castra+ MG"
                className="h-10 w-auto"
              />
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {whatsappStatus && (() => {
              const instancias = whatsappStatus.instancias || []
              const conectadas = instancias.filter(i => i.conectado).length
              const total = instancias.length
              const tooltip = total > 0
                ? `WhatsApp: ${conectadas}/${total} conectadas`
                : `WhatsApp: ${whatsappStatus.status}`

              return (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    whatsappStatus.conectado
                      ? 'bg-green-50 text-green-700'
                      : whatsappStatus.status === 'não configurada'
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-red-50 text-red-700'
                  }`}
                  title={tooltip}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    WhatsApp{total > 1 ? ` ${conectadas}/${total}` : ''}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      whatsappStatus.conectado
                        ? 'bg-green-500'
                        : whatsappStatus.status === 'não configurada'
                          ? 'bg-gray-400'
                          : 'bg-red-500'
                    }`}
                  />
                </div>
              )
            })()}
            {chatwootUrl && (
              <a
                href={chatwootUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
                title="Abrir Central de Atendimento"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Atendimento</span>
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-gray-500"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
