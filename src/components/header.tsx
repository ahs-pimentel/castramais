'use client'

import { signOut } from 'next-auth/react'
import { LogOut, Cat } from 'lucide-react'
import { Button } from './ui/button'

export function Header() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Cat className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">Castra<span className="text-primary">+</span></span>
          </div>
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
    </header>
  )
}
