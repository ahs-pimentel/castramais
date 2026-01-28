import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
})

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        console.log('=== AUTH DEBUG ===')
        console.log('Email:', credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log('Credenciais faltando')
          return null
        }

        try {
          const result = await pool.query(
            'SELECT id, email, password, nome FROM users WHERE email = $1',
            [credentials.email]
          )

          const user = result.rows[0]

          console.log('Usuário encontrado:', user ? 'SIM' : 'NÃO')

          if (!user) {
            return null
          }

          console.log('Hash no banco:', user.password?.substring(0, 20) + '...')

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('Senha válida:', isValidPassword)

          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.nome,
          }
        } catch (error) {
          console.error('Erro na autenticação:', error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}
