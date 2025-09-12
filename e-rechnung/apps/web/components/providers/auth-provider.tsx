'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface User {
  id: string
  email: string
  name: string
  tenantId: string
  role: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = React.createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Query to get current user
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const token = localStorage.getItem('auth-token')
      if (!token) return null
      
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        localStorage.removeItem('auth-token')
        return null
      }
      
      return response.json()
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }

    const { token, user } = await response.json()
    localStorage.setItem('auth-token', token)
    
    // Update the auth query cache
    queryClient.setQueryData(['auth', 'user'], user)
    
    router.push('/dashboard')
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      // Ignore logout errors - we'll clear local state anyway
    } finally {
      localStorage.removeItem('auth-token')
      queryClient.setQueryData(['auth', 'user'], null)
      queryClient.clear()
      router.push('/login')
    }
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}