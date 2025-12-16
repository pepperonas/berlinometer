import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

function SearchBar({ onSearch, placeholder }) {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  
  // Use translation as fallback if no placeholder provided
  const searchPlaceholder = placeholder || t('searchLocationsPlaceholder')

  const handleInputChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearch(value)
  }

  const handleClear = () => {
    setSearchTerm('')
    onSearch('')
  }

  return (
    <div className="search-container" style={{
      position: 'relative',
      marginBottom: '1rem',
      maxWidth: '400px',
      width: '100%'
    }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
      }}>
        <span style={{
          position: 'absolute',
          left: '0.75rem',
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          🔍
        </span>
        
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={searchPlaceholder}
          style={{
            width: '100%',
            padding: '0.75rem 2.5rem 0.75rem 2.5rem',
            fontSize: '0.875rem',
            backgroundColor: 'var(--background-darker)',
            border: '1px solid rgba(209, 213, 219, 0.2)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent-blue)'
            e.target.style.boxShadow = '0 0 0 3px rgba(104, 141, 177, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(209, 213, 219, 0.2)'
            e.target.style.boxShadow = 'none'
          }}
        />
        
        {searchTerm && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '0.75rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.125rem',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 1
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(156, 163, 175, 0.1)'
              e.target.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = 'var(--text-secondary)'
            }}
            title={t('clearSearch')}
          >
            ✕
          </button>
        )}
      </div>
      
      {searchTerm && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          right: '0',
          marginTop: '0.25rem',
          padding: '0.5rem 0.75rem',
          backgroundColor: 'var(--background-darker)',
          border: '1px solid rgba(209, 213, 219, 0.2)',
          borderRadius: 'var(--radius)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          zIndex: 10
        }}>
          {t('searchFor')} "{searchTerm}"
        </div>
      )}
    </div>
  )
}

export default SearchBar