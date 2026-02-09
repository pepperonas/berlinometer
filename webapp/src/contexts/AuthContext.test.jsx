import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// Mock fetch to prevent network calls during tests
globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true }))

function TestConsumer() {
  const { user, token, login, logout, isAuthenticated, getAuthHeaders } = useAuth()
  return (
    <div>
      <span data-testid="user">{user ? user.username : 'none'}</span>
      <span data-testid="token">{token || 'none'}</span>
      <span data-testid="auth">{isAuthenticated() ? 'yes' : 'no'}</span>
      <span data-testid="headers">{JSON.stringify(getAuthHeaders())}</span>
      <button onClick={() => login({ username: 'martin' }, 'jwt-token-123')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('defaults to no user', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(screen.getByTestId('token')).toHaveTextContent('none')
    expect(screen.getByTestId('auth')).toHaveTextContent('no')
  })

  it('returns empty headers when not logged in', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    expect(screen.getByTestId('headers')).toHaveTextContent('{}')
  })

  it('login stores user and token', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    act(() => {
      screen.getByText('Login').click()
    })
    expect(screen.getByTestId('user')).toHaveTextContent('martin')
    expect(screen.getByTestId('token')).toHaveTextContent('jwt-token-123')
    expect(screen.getByTestId('auth')).toHaveTextContent('yes')
  })

  it('login persists to localStorage', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    act(() => {
      screen.getByText('Login').click()
    })
    expect(localStorage.getItem('auth_token')).toBe('jwt-token-123')
    expect(JSON.parse(localStorage.getItem('user_info'))).toEqual({ username: 'martin' })
  })

  it('provides auth headers after login', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    act(() => {
      screen.getByText('Login').click()
    })
    const headers = JSON.parse(screen.getByTestId('headers').textContent)
    expect(headers.Authorization).toBe('Bearer jwt-token-123')
  })

  it('logout clears user and token', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    act(() => {
      screen.getByText('Login').click()
    })
    act(() => {
      screen.getByText('Logout').click()
    })
    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(screen.getByTestId('token')).toHaveTextContent('none')
    expect(screen.getByTestId('auth')).toHaveTextContent('no')
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('user_info')).toBeNull()
  })
})
