'use client'

import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { LogOut, PawPrint, Users, Building2, MessageSquare, Megaphone, UserCog } from 'lucide-react'
import { Button } from './ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role || 'admin'
  const [chatwootUrl, setChatwootUrl] = useState<string | null>(null)

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
