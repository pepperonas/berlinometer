import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { LanguageProvider, useLanguage, LANGUAGES } from './LanguageContext'

function TestConsumer() {
  const { language, switchLanguage, t } = useLanguage()
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="welcome">{t('welcome')}</span>
      <span data-testid="login">{t('login')}</span>
      <button onClick={() => switchLanguage('en')}>English</button>
      <button onClick={() => switchLanguage('de')}>German</button>
      <button onClick={() => switchLanguage('fr')}>French</button>
    </div>
  )
}

describe('LANGUAGES constant', () => {
  it('exports DE and EN', () => {
    expect(LANGUAGES.DE).toBe('de')
    expect(LANGUAGES.EN).toBe('en')
  })
})

describe('LanguageProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to German', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )
    expect(screen.getByTestId('lang')).toHaveTextContent('de')
  })

  it('translates welcome in German', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )
    expect(screen.getByTestId('welcome')).toHaveTextContent('Willkommen')
  })

  it('translates login in German', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )
    expect(screen.getByTestId('login')).toHaveTextContent('Anmelden')
  })

  it('switches to English and translates', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )
    act(() => {
      screen.getByText('English').click()
    })
    expect(screen.getByTestId('lang')).toHaveTextContent('en')
    expect(screen.getByTestId('welcome')).toHaveTextContent('Welcome')
    expect(screen.getByTestId('login')).toHaveTextContent('Login')
  })

  it('rejects invalid language', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )
    act(() => {
      screen.getByText('French').click()
    })
    expect(screen.getByTestId('lang')).toHaveTextContent('de')
  })

  it('persists language to localStorage', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )
    act(() => {
      screen.getByText('English').click()
    })
    expect(localStorage.getItem('berlinometer-language')).toBe('en')
  })

  it('restores language from localStorage', () => {
    localStorage.setItem('berlinometer-language', 'en')
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    )
    expect(screen.getByTestId('lang')).toHaveTextContent('en')
    expect(screen.getByTestId('welcome')).toHaveTextContent('Welcome')
  })
})
