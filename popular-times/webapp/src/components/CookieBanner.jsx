import { useState, useEffect } from 'react'

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('berlinometer-cookies-accepted')
    if (!hasAccepted) {
      setIsVisible(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('berlinometer-cookies-accepted', 'true')
    setIsVisible(false)
  }

  const declineCookies = () => {
    localStorage.setItem('berlinometer-cookies-accepted', 'false')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '1rem',
      right: '1rem',
      maxWidth: '500px',
      margin: '0 auto',
      background: '#2B2B2B',
      border: '1px solid #515151',
      borderRadius: '4px',
      padding: '1rem',
      fontSize: '0.875rem',
      fontFamily: 'SF Mono, Monaco, Inconsolata, "Roboto Mono", Consolas, "Courier New", monospace',
      color: '#BBBBBB',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      lineHeight: '1.4'
    }}>
      <div style={{ marginBottom: '0.75rem', color: '#A9B7C6' }}>
        🍪 <span style={{ color: '#FFC66D' }}>console.log</span>(<span style={{ color: '#6A8759' }}>'Cookie-Hinweis'</span>);
      </div>
      <div style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
        Diese Website verwendet Cookies für Analytics und zur Verbesserung der Nutzererfahrung.
      </div>
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem',
        fontSize: '0.8rem'
      }}>
        <button
          onClick={acceptCookies}
          style={{
            background: '#365880',
            color: 'white',
            border: '1px solid #4A90E2',
            borderRadius: '3px',
            padding: '0.25rem 0.75rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.75rem'
          }}
          onMouseEnter={(e) => e.target.style.background = '#4A90E2'}
          onMouseLeave={(e) => e.target.style.background = '#365880'}
        >
          Akzeptieren
        </button>
        <button
          onClick={declineCookies}
          style={{
            background: 'transparent',
            color: '#BBBBBB',
            border: '1px solid #515151',
            borderRadius: '3px',
            padding: '0.25rem 0.75rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.75rem'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#3C3C3C'
            e.target.style.borderColor = '#6B6B6B'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent'
            e.target.style.borderColor = '#515151'
          }}
        >
          Ablehnen
        </button>
      </div>
      <div style={{ 
        marginTop: '0.5rem', 
        fontSize: '0.7rem', 
        opacity: 0.7,
        color: '#808080'
      }}>
        <a 
          href="https://celox.io/privacy" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#6897BB', textDecoration: 'none' }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          Mehr Details in der Datenschutzerklärung
        </a>
      </div>
    </div>
  )
}

export default CookieBanner