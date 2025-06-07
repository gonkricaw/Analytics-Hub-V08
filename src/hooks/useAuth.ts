'use client'

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User, LoginCredentials, RegisterData, ChangePasswordData } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  changePassword: (data: ChangePasswordData) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        return true
      } else {
        setUser(null)
        return false
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      return false
    }
  }

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    await checkAuth()
  }

  // Login function
  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error occurred' }
    }
  }

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push('/login')
    }
  }

  // Register function
  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      })

      const result = await response.json()

      if (response.ok) {
        setUser(result.user)
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Registration failed' }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Network error occurred' }
    }
  }

  // Change password function
  const changePassword = async (data: ChangePasswordData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      })

      const result = await response.json()

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Password change failed' }
      }
    } catch (error) {
      console.error('Change password error:', error)
      return { success: false, error: 'Network error occurred' }
    }
  }

  // Check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)
      await checkAuth()
      setLoading(false)
    }

    initAuth()
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    changePassword,
    refreshUser,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for protected routes
export function useRequireAuth(redirectTo: string = '/login') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading }
}

// Hook for admin-only routes
export function useRequireAdmin(redirectTo: string = '/dashboard') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || (user.role.name !== 'admin' && user.role.name !== 'super_admin'))) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading }
}

// Hook for role-based access
export function useHasPermission(permission: string): boolean {
  const { user } = useAuth()
  
  if (!user || !user.role) return false
  
  // Super admin has all permissions
  if (user.role.name === 'super_admin') return true
  
  // Check if user has the specific permission
  if ('role_permissions' in user.role) {
    return user.role.role_permissions.some(
      (rp: any) => rp.permission.name === permission
    )
  }
  
  return false
}

// Hook for role checking
export function useHasRole(roleName: string): boolean {
  const { user } = useAuth()
  return user?.role?.name === roleName || false
}

// Hook for multiple roles checking
export function useHasAnyRole(roleNames: string[]): boolean {
  const { user } = useAuth()
  return roleNames.includes(user?.role?.name || '') || false
}