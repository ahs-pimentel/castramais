'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Trash2, Loader2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimalForm } from '@/components/animal-form'
import { AnimalWithTutor } from '@/lib/types'

type PageParams = { id: string }

export default function EditarAnimalPage({ params }: { params: Promise<PageParams> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role || 'admin'
  const [animal, setAnimal] = useState<AnimalWithTutor | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchAnimal = async () => {
      try {
        const res = await fetch(`/api/animais/${id}`)
        if (res.ok) {
          const data = await res.json()
          setAnimal(data)
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Erro ao buscar animal:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchAnimal()
  }, [id, router])

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este animal?')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/animais/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        alert('Erro ao excluir. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!animal) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Editar Animal</h1>
        </div>
        <div className="flex items-center gap-2">
          {animal.tutor?.telefone && (
            <a
              href={`https://wa.me/55${animal.tutor.telefone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button type="button" variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </a>
          )}
          {role === 'admin' && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <AnimalForm animal={animal} mode="edit" />
    </div>
  )
}
