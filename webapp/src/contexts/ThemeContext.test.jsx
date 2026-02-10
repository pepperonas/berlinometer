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
      <button onClick={() => switchTheme('dark')}>Dark</button>
      <button onClick={() => switchTheme('xd')}>xD</button>
      <button onClick={() => switchTheme('invalid')}>Invalid</button>
    </div>
  )
}

describe('ThemeContext constants', () => {
  it('exports THEMES with xd, dark, light', () => {
    expect(THEMES.XD).toBe('xd')
    expect(THEMES.DARK).toBe('dark')
    expect(THEMES.LIGHT).toBe('light')
  })

  it('exports THEME_NAMES for all themes', () => {
    expect(THEME_NAMES[THEMES.XD]).toBe('xD')
    expect(THEME_NAMES[THEMES.DARK]).toBe('Dunkel')
    expect(THEME_NAMES[THEMES.LIGHT]).toBe('Hell')
  })
})

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to xd theme', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    expect(screen.getByTestId('theme')).toHaveTextContent('xd')
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

  it('switches to dark theme', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    act(() => {
      screen.getByText('Dark').click()
    })
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
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
    expect(screen.getByTestId('theme')).toHaveTextContent('xd')
  })

  it('persists theme to localStorage', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    act(() => {
      screen.getByText('Dark').click()
    })
    expect(localStorage.getItem('berlinometer-theme')).toBe('dark')
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
