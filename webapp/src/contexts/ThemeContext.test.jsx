import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ThemeProvider, useTheme, THEMES, THEME_NAMES } from './ThemeContext'

function TestConsumer() {
  const { theme, switchTheme, themeNames } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="names">{JSON.stringify(themeNames)}</span>
      <button onClick={() => switchTheme('light')}>Light</button>
      <button onClick={() => switchTheme('berlin')}>Berlin</button>
      <button onClick={() => switchTheme('invalid')}>Invalid</button>
    </div>
  )
}

describe('ThemeContext constants', () => {
  it('exports THEMES with dark, light, berlin', () => {
    expect(THEMES.DARK).toBe('dark')
    expect(THEMES.LIGHT).toBe('light')
    expect(THEMES.BERLIN).toBe('berlin')
  })

  it('exports THEME_NAMES for all themes', () => {
    expect(THEME_NAMES[THEMES.DARK]).toBe('Dunkel')
    expect(THEME_NAMES[THEMES.LIGHT]).toBe('Hell')
    expect(THEME_NAMES[THEMES.BERLIN]).toBe('Berlin')
  })
})

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to dark theme', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('switches to light theme', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    act(() => {
      screen.getByText('Light').click()
    })
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('switches to berlin theme', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    act(() => {
      screen.getByText('Berlin').click()
    })
    expect(screen.getByTestId('theme')).toHaveTextContent('berlin')
  })

  it('rejects invalid theme', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    act(() => {
      screen.getByText('Invalid').click()
    })
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('persists theme to localStorage', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    act(() => {
      screen.getByText('Berlin').click()
    })
    expect(localStorage.getItem('berlinometer-theme')).toBe('berlin')
  })

  it('restores theme from localStorage', () => {
    localStorage.setItem('berlinometer-theme', 'light')
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })
})
