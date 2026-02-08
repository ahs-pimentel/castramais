import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function requireRole(...roles: string[]) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }), session: null }
  }
  const role = session.user.role || 'assistente'
  if (!roles.includes(role)) {
    return { error: NextResponse.json({ error: 'Sem permissão' }, { status: 403 }), session: null }
  }
  return { error: null, session }
}

export function canDelete(role: string) {
  return role === 'admin'
}

export function canManageUsers(role: string) {
  return role === 'admin'
}
