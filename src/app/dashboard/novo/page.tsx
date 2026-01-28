'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { CadastroWizard } from '@/components/cadastro-wizard'

export default function NovoAnimalPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Novo Cadastro</h1>
          <p className="text-sm text-gray-500">Cadastrar animal para castração</p>
        </div>
      </div>

      <CadastroWizard />
    </div>
  )
}
