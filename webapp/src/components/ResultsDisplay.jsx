import { useState, useMemo, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import OccupancyChart from './OccupancyChart'
import SearchBar from './SearchBar'
import { calculateDistance, formatDistance, getUserLocation, extractCoordinatesFromUrl } from '../utils/locationUtils'
import { trackMapClick, findLocationId } from '../utils/analytics'

function ResultsDisplay({ results, user, token }) {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCard, setExpandedCard] = useState(null)
  const [customOrder, setCustomOrder] = useState(() => {
    if (user && token) {
      const saved = localStorage.getItem('berlinometer-results-order')
      return saved ? JSON.parse(saved) : null
    }
    return null
  })
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [locationCoordinates, setLocationCoordinates] = useState(new Map())
  const [defaultLocations, setDefaultLocations] = useState([])
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false)
  const [manualSortingEnabled, setManualSortingEnabled] = useState(() => {
    const saved = localStorage.getItem('berlinometer-manual-sorting-enabled')
    return saved ? JSON.parse(saved) : false
  })
  const [sortOption, setSortOption] = useState(() => {
    const saved = localStorage.getItem('berlinometer-sort-option')
    return saved || 'occupancy'
  })

  // Save custom order to localStorage whenever it changes
  useEffect(() => {
    if (user && token && customOrder) {
      localStorage.setItem('berlinometer-results-order', JSON.stringify(customOrder))
    }
  }, [customOrder, user, token])

  // Save sort option to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('berlinometer-sort-option', sortOption)
  }, [sortOption])

  // Handle sort option change - disable manual sorting when dropdown is used
  const handleSortOptionChange = (newSortOption) => {
    setSortOption(newSortOption)
    // Disable manual sorting when user selects a sort option from dropdown
    if (manualSortingEnabled) {
      setManualSortingEnabled(false)
      localStorage.setItem('berlinometer-manual-sorting-enabled', JSON.stringify(false))
    }
    // Clear custom order
    setCustomOrder(null)
    localStorage.removeItem('berlinometer-results-order')
  }

  // Load location coordinates from API - execute immediately
  useEffect(() => {
    console.log('🚀 ResultsDisplay mounted, starting location coordinates load from API...')
    
    const loadLocationCoordinates = async () => {
      try {
        console.log('🔍 Loading location coordinates from API...')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/default-locations`)
        console.log('📦 API fetch response status:', response.status)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('📄 API response data:', data)
        console.log('📄 Locations count:', data.locations?.length)
        
        if (data.success && data.locations) {
          // Store default locations for analytics
          setDefaultLocations(data.locations)

          const coordinateMap = new Map()

          data.locations.forEach(location => {
            if (location.url) {
              const coordinates = extractCoordinatesFromUrl(location.url)
              if (coordinates) {
                coordinateMap.set(location.name, coordinates)
                console.log(`📍 Added coordinates for "${location.name}":`, coordinates)
              } else {
                console.warn(`⚠️ No coordinates found for "${location.name}" in URL:`, location.url.substring(0, 100))
              }
            }
          })

          console.log('🗺️ Parsed coordinates for locations:', coordinateMap.size)
          console.log('📍 Sample coordinates:', Array.from(coordinateMap.entries()).slice(0, 3))

          setLocationCoordinates(coordinateMap)
          console.log('✅ Location coordinates loaded successfully!')
          
          // Auto-request location after coordinates are loaded
          console.log('🔄 Auto-requesting user location...')
          requestLocation()
        } else {
          throw new Error('API response was not successful or missing locations')
        }
      } catch (error) {
        console.error('❌ Failed to load location coordinates:', error)
        console.error('❌ Error details:', error.message)
      }
    }
    
    // Execute immediately
    loadLocationCoordinates()
  }, [])

  // Get user's current location 
  const requestLocation = async () => {
    try {
      console.log('📍 Requesting user location...')
      const location = await getUserLocation()
      console.log('✅ User location obtained:', location)
      setUserLocation(location)
      setLocationPermissionDenied(false)
    } catch (error) {
      console.warn('Could not get user location:', error.message)
      if (error.code === 1) { // PERMISSION_DENIED
        console.log('❌ User denied location permission')
        setLocationPermissionDenied(true)
      } else {
        console.log('⚠️ Location request failed for other reason:', error.code)
      }
    }
  }

  // Listen for manual sorting setting changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('berlinometer-manual-sorting-enabled')
      setManualSortingEnabled(saved ? JSON.parse(saved) : false)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Drag & Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e, index) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null)
      return
    }

    const draggedItem = sortedResults[draggedIndex]
    const newResults = [...sortedResults]
    
    // Remove dragged item
    newResults.splice(draggedIndex, 1)
    // Insert at new position
    newResults.splice(dropIndex, 0, draggedItem)
    
    // Create new order based on location names
    const newOrder = newResults.map(result => result.location_name)
    setCustomOrder(newOrder)
    
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const resetSortOrder = () => {
    setCustomOrder(null)
    localStorage.removeItem('berlinometer-results-order')
  }

  const handleMapClick = async (result) => {
    try {
      console.log('🔍 Attempting to track map click for:', result)
      console.log('🔍 Default locations available:', defaultLocations.length)

      const locationId = findLocationId(result, defaultLocations)
      console.log('🔍 Found location ID:', locationId)

      // Always try to track, even if locationId is null - backend will try to find it
      console.log('✅ Tracking map click with result data:', {
        id: locationId,
        name: result.location_name,
        url: result.url,
        address: result.address
      })
      await trackMapClick(locationId, result)

      if (!locationId) {
        console.warn('⚠️ No location ID found initially, backend will try to find it')
        console.warn('⚠️ Result object:', result)
        console.warn('⚠️ Available default locations:', defaultLocations.map(loc => ({ id: loc.id, name: loc.name, url: loc.url })))
      }
    } catch (error) {
      console.error('Error tracking map click:', error)
    }
  }

  // Calculate distance to a location
  const getDistanceToLocation = (locationName, locationUrl = null) => {
    console.log('🔍 Getting distance for:', locationName)
    console.log('👤 User location:', userLocation)

    if (!userLocation) {
      console.log('❌ Cannot calculate distance - no user location')
      return null
    }

    // Try exact match first
    let hasCoords = locationCoordinates.has(locationName)
    let locationCoords = null

    if (hasCoords) {
      locationCoords = locationCoordinates.get(locationName)
      console.log('✅ Found coordinates in CSV data for:', locationName)
    } else {
      // Try with normalized name (remove spaces, lowercase, etc.)
      const normalizedName = locationName.toLowerCase().trim()
      for (const [key, value] of locationCoordinates.entries()) {
        if (key.toLowerCase().trim() === normalizedName) {
          locationCoords = value
          hasCoords = true
          console.log('📍 Found coordinates using normalized name matching:', key)
          break
        }
      }

      // Try partial matching (for cases like "Laidak" vs "Schankwirtschaft Laidak")
      if (!hasCoords) {
        for (const [key, value] of locationCoordinates.entries()) {
          if (locationName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(locationName.toLowerCase())) {
            locationCoords = value
            hasCoords = true
            console.log('📍 Found coordinates using partial name matching:', key, 'for', locationName)
            break
          }
        }
      }

      // Fallback: Extract coordinates directly from the location's Google Maps URL
      if (!hasCoords && locationUrl) {
        console.log('🔄 Trying to extract coordinates from URL as fallback for:', locationName)
        locationCoords = extractCoordinatesFromUrl(locationUrl)
        if (locationCoords) {
          hasCoords = true
          console.log('✅ Extracted coordinates from URL for:', locationName, locationCoords)
        }
      }
    }

    console.log('🗺️ Has coordinates for location:', hasCoords)

    if (!hasCoords || !locationCoords) {
      console.log('❌ Cannot calculate distance - missing coordinates for:', locationName)
      console.log('Available location names:', Array.from(locationCoordinates.keys()).slice(0, 5))
      return null
    }

    console.log('📍 Location coords:', locationCoords)

    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      locationCoords.lat,
      locationCoords.lng
    )

    console.log('📏 Calculated distance:', distance)
    const formatted = formatDistance(distance)
    console.log('✅ Formatted distance:', formatted)

    return formatted
  }

  // Get numeric distance in meters for sorting
  const getNumericDistanceToLocation = (locationName, locationUrl = null) => {
    if (!userLocation) return null

    // Try exact match first
    let hasCoords = locationCoordinates.has(locationName)
    let locationCoords = null

    if (hasCoords) {
      locationCoords = locationCoordinates.get(locationName)
    } else {
      // Try with normalized name (remove spaces, lowercase, etc.)
      const normalizedName = locationName.toLowerCase().trim()
      for (const [key, value] of locationCoordinates.entries()) {
        if (key.toLowerCase().trim() === normalizedName) {
          locationCoords = value
          hasCoords = true
          break
        }
      }

      // Try partial matching (for cases like "Laidak" vs "Schankwirtschaft Laidak")
      if (!hasCoords) {
        for (const [key, value] of locationCoordinates.entries()) {
          if (locationName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(locationName.toLowerCase())) {
            locationCoords = value
            hasCoords = true
            break
          }
        }
      }

      // Fallback: Extract coordinates directly from the location's Google Maps URL
      if (!hasCoords && locationUrl) {
        locationCoords = extractCoordinatesFromUrl(locationUrl)
        if (locationCoords) {
          hasCoords = true
        }
      }
    }

    if (!hasCoords || !locationCoords) {
      return null
    }

    // Return distance in meters as number
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      locationCoords.lat,
      locationCoords.lng
    )
  }

  const formatTimestamp = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now - time
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffSeconds < 60) {
      return 'vor weniger als einer Minute'
    } else if (diffMinutes < 60) {
      return `vor ${diffMinutes} ${diffMinutes === 1 ? 'Minute' : 'Minuten'}`
    } else if (diffHours < 24) {
      return `vor ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`
    } else if (diffDays < 7) {
      return `vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'}`
    } else if (diffWeeks < 4) {
      return `vor ${diffWeeks} ${diffWeeks === 1 ? 'Woche' : 'Wochen'}`
    } else if (diffMonths < 12) {
      return `vor ${diffMonths} ${diffMonths === 1 ? 'Monat' : 'Monaten'}`
    } else {
      return `vor ${diffYears} ${diffYears === 1 ? 'Jahr' : 'Jahren'}`
    }
  }

  const getOccupancyStatus = (occupancy, isLive) => {
    if (!occupancy) return null
    
    if (isLive) {
      return <span className="status status-live">🔴 {t('live')}</span>
    }
    
    return <span className="status status-success">📊 {t('historical')}</span>
  }

  // Clean address from unwanted Unicode characters
  const cleanAddress = (address) => {
    if (!address) return address
    return address
      .replace(/◉/g, '')
      .replace(/\ue8b5/g, '') // Remove clock icon
      .replace(/\ue5cf/g, '') // Remove clock icon
      .replace(/\u22c5/g, '') // Remove bullet
      .replace(/[\u2000-\u206F]/g, '') // Remove general punctuation
      .replace(/[\u2E00-\u2E7F]/g, '') // Remove supplemental punctuation
      .replace(/[\uFE00-\uFE0F]/g, '') // Remove variation selectors
      .replace(/[\uE000-\uF8FF]/g, '') // Remove private use area characters
      .trim()
  }

  const extractPercentageValues = (occupancyText) => {
    if (!occupancyText) return { current: null, usual: null }
    
    // Verschiedene Muster für Prozentangaben
    const patterns = [
      // "Derzeit zu 32 % ausgelastet; normal sind 65 %."
      /derzeit\s+zu\s+(\d+)\s*%.*?normal\s+sind\s+(\d+)\s*%/i,
      // "Derzeit 50% (gewöhnlich 30%)"
      /derzeit\s+(\d+)%.*?gewöhnlich\s+(\d+)%/i,
      // "Currently 50% (usually 30%)"
      /currently\s+(\d+)%.*?usually\s+(\d+)%/i,
      // "50% busy (typical: 30%)"
      /(\d+)%.*?typical:?\s*(\d+)%/i,
      // "50% (normal: 30%)"
      /(\d+)%.*?normal:?\s*(\d+)%/i,
      // Weitere deutsche Muster
      /aktuell\s+(\d+)%.*?üblich\s+(\d+)%/i,
      /(\d+)%.*?normalerweise\s+(\d+)%/i,
      // Zusätzliche Muster
      /zu\s+(\d+)\s*%\s+ausgelastet.*?normal.*?(\d+)\s*%/i
    ]
    
    for (const pattern of patterns) {
      const match = occupancyText.match(pattern)
      if (match) {
        const current = parseInt(match[1])
        const usual = parseInt(match[2])
        console.log('📊 Extracted percentages:', { current, usual, text: occupancyText })
        return { current, usual }
      }
    }
    
    return { current: null, usual: null }
  }

  const compareToUsual = (occupancyText) => {
    if (!occupancyText) return 'unknown'
    
    const text = occupancyText.toLowerCase()
    const { current, usual } = extractPercentageValues(occupancyText)
    
    // Wenn wir Prozent-Werte extrahieren können, verwende numerischen Vergleich
    if (current !== null && usual !== null) {
      const difference = current - usual
      
      if (difference > 5) {
        console.log('🟢 Numeric analysis:', occupancyText, `→ higher (${current}% vs ${usual}% = +${difference}%)`)
        return 'higher' // Grün: Aktuelle Auslastung > 5% über gewöhnlich
      } else if (Math.abs(difference) <= 5) {
        console.log('🟡 Numeric analysis:', occupancyText, `→ normal (${current}% vs ${usual}% = ${difference >= 0 ? '+' : ''}${difference}%)`)
        return 'normal' // Gelb: Innerhalb ±5% der gewöhnlichen Auslastung
      } else {
        console.log('🔴 Numeric analysis:', occupancyText, `→ lower (${current}% vs ${usual}% = ${difference}%)`)
        return 'lower' // Rot: Aktuelle Auslastung < 5% unter gewöhnlich
      }
    }
    
    // Fallback: Textbasierte Analyse für Fälle ohne klare Prozent-Werte
    if (text.includes('derzeit mehr') || text.includes('mehr als gewöhnlich') || 
        text.includes('mehr als üblich') || text.includes('überdurchschnittlich voll') ||
        text.includes('stärker frequentiert') || text.includes('busier than usual') ||
        text.includes('mehr besucht') || text.includes('höher als gewöhnlich')) {
      console.log('🟢 Text analysis:', occupancyText, '→ higher (green)')
      return 'higher'
    }
    
    if (text.includes('derzeit weniger') || text.includes('weniger als gewöhnlich') || 
        text.includes('weniger als üblich') || text.includes('unterdurchschnittlich') ||
        text.includes('weniger besucht') || text.includes('ruhiger als') ||
        text.includes('less busy than usual') || text.includes('niedriger als gewöhnlich')) {
      console.log('🔴 Text analysis:', occupancyText, '→ lower (red)')
      return 'lower'
    }
    
    if (text.includes('wie gewöhnlich') || text.includes('wie üblich') || 
        text.includes('usual for') || text.includes('normal für') ||
        text.includes('typisch für') || text.includes('as busy as usual')) {
      console.log('🟡 Text analysis:', occupancyText, '→ normal (yellow)')
      return 'normal'
    }
    
    console.log('🔍 Analysis result:', occupancyText, '→ unknown (default red)')
    return 'unknown'
  }

  const getOccupancyColor = (occupancy, isLive) => {
    if (!occupancy) return 'rgba(156, 163, 175, 0.1)'
    
    if (isLive) {
      const comparison = compareToUsual(occupancy)
      switch (comparison) {
        case 'higher':
          return 'rgba(34, 197, 94, 0.15)' // Green - more than usual
        case 'normal':
          return 'rgba(234, 179, 8, 0.15)' // Yellow - same as usual
        case 'lower':
        default:
          return 'rgba(225, 97, 98, 0.15)' // Red - less than usual or unknown
      }
    }
    
    return 'rgba(156, 182, 143, 0.1)' // Default for historical data
  }

  const getOccupancyBorderColor = (occupancy, isLive) => {
    if (!occupancy) return 'rgba(156, 163, 175, 0.2)'
    
    if (isLive) {
      const comparison = compareToUsual(occupancy)
      switch (comparison) {
        case 'higher':
          return 'rgba(34, 197, 94, 0.3)' // Green border
        case 'normal':
          return 'rgba(234, 179, 8, 0.3)' // Yellow border
        case 'lower':
        default:
          return 'rgba(225, 97, 98, 0.3)' // Red border
      }
    }
    
    return 'rgba(156, 182, 143, 0.2)'
  }

  const getOccupancyIcon = (occupancy, isLive) => {
    if (!isLive) return '📊'
    
    const comparison = compareToUsual(occupancy)
    switch (comparison) {
      case 'higher':
        return '🟢' // Green circle - more than usual
      case 'normal':
        return '🟡' // Yellow circle - same as usual
      case 'lower':
      default:
        return '🔴' // Red circle - less than usual or unknown
    }
  }

  // Hilfsfunktion für Sortierung - gleiche Logik wie in App.jsx
  const extractOccupancyPercentage = (occupancyText) => {
    if (!occupancyText) return -1
    
    const matches = occupancyText.match(/(\d+)\s*%/g)
    if (matches && matches.length > 0) {
      return parseInt(matches[0].replace('%', '').trim())
    }
    
    return -1
  }

  // Funktion zum Übersetzen von Auslastungstexten
  const translateOccupancyText = (occupancyText) => {
    if (!occupancyText) return occupancyText

    // Deutsche Patterns
    const currentMatch = occupancyText.match(/derzeit\s+zu\s+(\d+)\s*%\s*ausgelastet/i)
    const normalMatch = occupancyText.match(/normal\s+sind\s+(\d+)\s*%/i)

    if (currentMatch && normalMatch) {
      const currentPercent = currentMatch[1]
      const normalPercent = normalMatch[1]
      return `${t('currentlyOccupied').replace('{percent}', currentPercent)}; ${t('normalOccupancyIs').replace('{percent}', normalPercent)}.`
    }

    // Fallback für andere Formate
    return occupancyText
  }

  // Extract opening hours from occupancy text
  const extractOpeningHours = (openingHoursText) => {
    if (!openingHoursText) return null

    // Clean up Unicode characters and normalize text
    const cleanText = openingHoursText
      .replace(/\ue8b5/g, '') // Remove clock icon
      .replace(/\ue5cf/g, '') // Remove clock icon
      .replace(/\u22c5/g, '·') // Replace bullet with standard dot
      .replace(/\u00d6/g, 'Ö') // Fix Ö character
      .trim()

    // Pattern 1: "Geöffnet bis HH:MM" or "Geöffnet ⋅ Schließt um HH:MM"
    const openUntilMatch = cleanText.match(/Geöffnet.*?(?:bis|Schließt um) (\d{1,2}):(\d{2})/i)
    if (openUntilMatch) {
      const closeTime = `${openUntilMatch[1].padStart(2, '0')}:${openUntilMatch[2]}`
      return {
        isOpen: true,
        closeTime: closeTime,
        status: 'open',
        raw: cleanText
      }
    }

    // Pattern 2: "Geschlossen · Öffnet um HH:MM"
    const closedUntilMatch = cleanText.match(/Geschlossen.*?Öffnet um (\d{1,2}):(\d{2})/i)
    if (closedUntilMatch) {
      const openTime = `${closedUntilMatch[1].padStart(2, '0')}:${closedUntilMatch[2]}`
      return {
        isOpen: false,
        openTime: openTime,
        status: 'closed',
        raw: cleanText
      }
    }

    // Pattern 3: "Rund um die Uhr geöffnet" or "24 Stunden geöffnet"
    if (/rund um die uhr|24 stunden/i.test(cleanText)) {
      return {
        isOpen: true,
        closeTime: null,
        status: 'always_open',
        raw: cleanText
      }
    }

    // Pattern 4: "Schließt demnächst · HH:MM" or "Schließt demnächst um HH:MM"
    const closingSoonMatch = cleanText.match(/Schließt demnächst.*?(\d{1,2}):(\d{2})/i)
    if (closingSoonMatch) {
      const closeTime = `${closingSoonMatch[1].padStart(2, '0')}:${closingSoonMatch[2]}`
      return {
        isOpen: true,
        closeTime: closeTime,
        status: 'open',
        raw: cleanText
      }
    }

    // Pattern 5: "Vorübergehend geschlossen"
    if (/vorübergehend geschlossen/i.test(cleanText)) {
      return {
        isOpen: false,
        openTime: null,
        status: 'closed_unknown',
        raw: cleanText
      }
    }

    // Pattern 6: Just "Geschlossen"
    if (/^geschlossen$/i.test(cleanText)) {
      return {
        isOpen: false,
        openTime: null,
        status: 'closed_unknown',
        raw: cleanText
      }
    }

    return null
  }

  // Calculate remaining time until closing
  const calculateRemainingTime = (closeTime) => {
    if (!closeTime) return null

    try {
      const now = new Date()
      const [hours, minutes] = closeTime.split(':').map(Number)
      const closeDateTime = new Date()
      closeDateTime.setHours(hours, minutes, 0, 0)

      // If close time is earlier than current time, it's tomorrow
      if (closeDateTime < now) {
        closeDateTime.setDate(closeDateTime.getDate() + 1)
      }

      const diffMs = closeDateTime - now
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMinutes / 60)
      const remainingMinutes = diffMinutes % 60

      if (diffMinutes < 0) return null

      if (diffHours > 0) {
        return `${diffHours}h ${remainingMinutes}m`
      } else if (diffMinutes > 0) {
        return `${diffMinutes}m`
      } else {
        return 'Schließt bald'
      }
    } catch (error) {
      console.error('Error calculating remaining time:', error)
      return null
    }
  }

  // Filter results based on search term with pipe (||) support for OR search
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return results
    }
    
    const term = searchTerm.toLowerCase().trim()
    
    // Check if search contains pipe symbols for OR search
    const searchTerms = term.includes('||') 
      ? term.split('||').map(t => t.trim()).filter(t => t.length > 0)
      : [term]
    
    return results.filter(result => {
      // Check if any of the search terms match (OR logic)
      return searchTerms.some(searchTerm => {
        // Search in location name
        if (result.location_name && result.location_name.toLowerCase().includes(searchTerm)) {
          return true
        }
        
        // Search in address
        if (result.address && result.address.toLowerCase().includes(searchTerm)) {
          return true
        }
        
        // Search in occupancy text
        if (result.live_occupancy && result.live_occupancy.toLowerCase().includes(searchTerm)) {
          return true
        }
        
        // Search in rating
        if (result.rating && result.rating.toString().includes(searchTerm)) {
          return true
        }
        
        return false
      })
    })
  }, [results, searchTerm])

  const sortResultsByOption = (results, option) => {
    return [...results].sort((a, b) => {
      if (option === 'occupancy') {
        return sortByOccupancy(a, b)
      } else if (option === 'distance') {
        return sortByDistance(a, b)
      } else if (option === 'hours') {
        return sortByOpeningHours(a, b)
      }
      return 0
    })
  }

  const getOccupancyComparison = (a, b) => {
    const occupancyA = extractOccupancyPercentage(a.live_occupancy)
    const occupancyB = extractOccupancyPercentage(b.live_occupancy)
    const isLiveA = a.is_live_data === true
    const isLiveB = b.is_live_data === true

    // Live-Daten haben höchste Priorität
    if (isLiveA && !isLiveB) return -1
    if (!isLiveA && isLiveB) return 1

    // Wenn beide live oder beide nicht live sind
    if (isLiveA === isLiveB) {
      // Locations ohne Daten ans Ende
      if (occupancyA === -1 && occupancyB === -1) return 0
      if (occupancyA === -1) return 1
      if (occupancyB === -1) return -1

      // Höhere Auslastung zuerst
      return occupancyB - occupancyA
    }

    return 0
  }

  const getDistanceComparison = (a, b) => {
    const distanceA = getNumericDistanceToLocation(a.location_name, a.url)
    const distanceB = getNumericDistanceToLocation(b.location_name, b.url)

    // Locations ohne Entfernungsdaten gleichwertig behandeln
    if (distanceA === null && distanceB === null) return 0
    if (distanceA === null) return 1
    if (distanceB === null) return -1

    // Näheste zuerst (numerischer Vergleich in Metern)
    return distanceA - distanceB
  }

  const sortByOccupancy = (a, b) => {
    // Primär nach Auslastung sortieren
    const occupancySort = getOccupancyComparison(a, b)
    if (occupancySort !== 0) return occupancySort

    // Sekundär nach Entfernung sortieren
    return getDistanceComparison(a, b)
  }

  const sortByDistance = (a, b) => {
    // Primär nach Entfernung sortieren
    const distanceSort = getDistanceComparison(a, b)
    if (distanceSort !== 0) return distanceSort

    // Sekundär nach Auslastung sortieren
    return getOccupancyComparison(a, b)
  }

  const sortByOpeningHours = (a, b) => {
    const hoursA = a.opening_hours ? extractOpeningHours(a.opening_hours) : null
    const hoursB = b.opening_hours ? extractOpeningHours(b.opening_hours) : null

    // Rund um die Uhr geöffnet hat höchste Priorität
    const alwaysOpenA = hoursA?.status === 'always_open'
    const alwaysOpenB = hoursB?.status === 'always_open'

    if (alwaysOpenA && !alwaysOpenB) return -1
    if (!alwaysOpenA && alwaysOpenB) return 1

    // Wenn beide rund um die Uhr oder beide nicht
    if (alwaysOpenA === alwaysOpenB) {
      // Berechne verbleibende Zeit
      const remainingA = hoursA?.isOpen ? calculateRemainingTime(hoursA.closeTime) : null
      const remainingB = hoursB?.isOpen ? calculateRemainingTime(hoursB.closeTime) : null

      // Geschlossene Locations ans Ende
      if (!hoursA?.isOpen && !hoursB?.isOpen) {
        return getOccupancyComparison(a, b)
      }
      if (!hoursA?.isOpen) return 1
      if (!hoursB?.isOpen) return -1

      // Beide offen - längere verbleibende Zeit zuerst
      const getRemainingMinutes = (remaining) => {
        if (!remaining || remaining === 'Schließt bald') return 0
        const match = remaining.match(/(\d+)h (\d+)min|(\d+)min|(\d+)h/)
        if (!match) return 0
        if (match[1] && match[2]) return parseInt(match[1]) * 60 + parseInt(match[2])
        if (match[3]) return parseInt(match[3])
        if (match[4]) return parseInt(match[4]) * 60
        return 0
      }

      const minutesA = getRemainingMinutes(remainingA)
      const minutesB = getRemainingMinutes(remainingB)

      if (minutesA !== minutesB) {
        return minutesB - minutesA
      }

      // Bei gleicher Öffnungszeit -> nach Auslastung sortieren
      const occupancySort = getOccupancyComparison(a, b)
      if (occupancySort !== 0) return occupancySort

      // Bei gleicher Auslastung -> nach Entfernung sortieren
      return getDistanceComparison(a, b)
    }

    return 0
  }

  // Apply sorting - custom order only if enabled and user has set custom order
  const sortedResults = useMemo(() => {
    // Use custom order only if manual sorting is enabled, user is logged in, and has a custom order
    if (user && token && manualSortingEnabled && customOrder && customOrder.length > 0) {
      const sorted = [...filteredResults].sort((a, b) => {
        const indexA = customOrder.indexOf(a.location_name)
        const indexB = customOrder.indexOf(b.location_name)

        // If item is not in customOrder, put it at the end
        if (indexA === -1 && indexB === -1) return 0
        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
      })

      return sorted
    }

    // Use selected sort option
    return sortResultsByOption(filteredResults, sortOption)
  }, [filteredResults, customOrder, user, token, manualSortingEnabled, sortOption])

  // Export-Funktionen entfernt für Produktionsversion

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex flex-col gap-3 mb-4" style={{
          alignItems: 'stretch'
        }}>
          <div className="text-center">
            <h3 className="card-title mb-2" style={{ fontSize: '1.25rem' }}>{t('scrapingResults')}</h3>
            <p className="card-description" style={{ fontSize: '0.875rem' }}>
              {sortedResults.length} von {results.length} {results.length !== 1 ? t('locationsAnalyzed').replace('{count}', 's') : t('locationsAnalyzed').replace('{count}', '')} 
              {searchTerm ? t('locationsFiltered').replace('{count}', '') : ''}
            </p>

            {/* Distance Feature Info */}
            {!userLocation && !locationPermissionDenied && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(104, 141, 177, 0.1)',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(104, 141, 177, 0.2)'
              }}>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  📍 {t('allowLocation') || 'Standort zulassen für Entfernungsanzeige'}
                </div>
                <button
                  onClick={requestLocation}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  📍 Standort aktivieren
                </button>
              </div>
            )}
            
            {/* Location permission denied */}
            {locationPermissionDenied && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(225, 97, 98, 0.1)',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(225, 97, 98, 0.2)',
                fontSize: '0.875rem'
              }}>
                ❌ {t('locationNotAvailable') || 'Standort nicht verfügbar'} - Entfernungsanzeige deaktiviert
              </div>
            )}
            
            {/* Location active */}
            {userLocation && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                fontSize: '0.875rem'
              }}>
                ✅ Entfernungsanzeige aktiv
              </div>
            )}

            {/* Sort Dropdown - Mobile Optimized */}
            <div style={{
              marginTop: '1rem',
              display: 'flex',
              flexDirection: window.innerWidth <= 640 ? 'column' : 'row',
              alignItems: window.innerWidth <= 640 ? 'stretch' : 'center',
              gap: '0.75rem'
            }}>
              <label style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                fontWeight: '500',
                textAlign: window.innerWidth <= 640 ? 'center' : 'left'
              }}>
                {t('sortBy')}:
              </label>
              <select
                value={sortOption}
                onChange={(e) => handleSortOptionChange(e.target.value)}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'var(--background-darker)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s',
                  width: window.innerWidth <= 640 ? '100%' : 'auto',
                  minWidth: window.innerWidth > 640 ? '200px' : 'auto'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-color)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)'
                }}
              >
                <option value="occupancy">📊 {t('sortByOccupancy')}</option>
                <option value="distance">📍 {t('sortByDistance')}</option>
                <option value="hours">⏰ {t('sortByHours')}</option>
              </select>
            </div>

            {user && token && manualSortingEnabled && customOrder && (
              <button 
                onClick={resetSortOrder}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--background-darker)'
                  e.target.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.color = 'var(--text-secondary)'
                }}
              >
                🔄 {t('resetSortOrder') || 'Sortierung zurücksetzen'}
              </button>
            )}
          </div>
          
          
          {/* Export buttons entfernt für Produktionsversion */}
          
          {/* Desktop Export buttons ebenfalls entfernt */}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        marginTop: '1rem'
      }}>
        <SearchBar 
          onSearch={setSearchTerm}
          placeholder={t('searchLocationsPlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedResults.map((result, index) => (
          <div 
            key={result.location_name || index} 
            className={`p-4 ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
            draggable={user && token && manualSortingEnabled}
            onDragStart={(e) => user && token && manualSortingEnabled && handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            style={{ 
              backgroundColor: 'var(--background-darker)', 
              borderRadius: 'var(--radius-lg)',
              border: dragOverIndex === index ? '2px dashed var(--primary-color)' : '1px solid rgba(209, 213, 219, 0.1)',
              marginBottom: '1rem',
              opacity: draggedIndex === index ? 0.5 : 1,
              transition: 'all 0.2s ease',
              position: 'relative',
              cursor: user && token && manualSortingEnabled ? 'move' : 'default'
            }}
          >
            {/* Drag Handle */}
            {user && token && manualSortingEnabled && (
              <div 
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'grab',
                  padding: '8px',
                  opacity: 0.3,
                  transition: 'opacity 0.2s',
                  fontSize: '1.5rem',
                  lineHeight: 1,
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                onMouseLeave={(e) => e.target.style.opacity = '0.3'}
                title={t('dragToReorder') || 'Ziehen zum Neuordnen'}
              >
                ⋮⋮
              </div>
            )}
            
            {/* Mobile-optimized header */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex justify-between items-start">
                <h4 className="mb-0 flex-1" style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  lineHeight: '1.3',
                  paddingRight: '0.5rem'
                }}>
                  {result.location_name || t('unknownLocation')}
                </h4>
                
                <div className="flex flex-col gap-1 items-end" style={{ flexShrink: 0 }}>
                  {getOccupancyStatus(result.live_occupancy, result.is_live_data)}
                </div>
              </div>
              
              {/* Mobile-optimized metadata */}
              <div className="flex flex-col gap-2" style={{ fontSize: '0.875rem' }}>
                {result.address && (
                  <div className="flex items-start gap-2 text-secondary">
                    <span style={{ flexShrink: 0 }}>📍</span>
                    <span style={{ lineHeight: '1.4' }}>
                      {cleanAddress(result.address.startsWith('+') ? result.address.substring(1) : result.address)}
                      {(() => {
                        const distance = getDistanceToLocation(result.location_name, result.url)
                        return distance ? ` • ${distance}` : ''
                      })()}
                    </span>
                  </div>
                )}

                {/* Opening Hours Display */}
                {(() => {
                  // Use dedicated opening_hours field from API
                  const openingHours = result.opening_hours ? extractOpeningHours(result.opening_hours) : null
                  if (!openingHours) return null

                  const remainingTime = openingHours.isOpen ? calculateRemainingTime(openingHours.closeTime) : null

                  return (
                    <div className="flex items-start gap-2 text-secondary">
                      <span style={{ flexShrink: 0 }}>
                        {openingHours.isOpen ? '🟢' : '🔴'}
                      </span>
                      <span style={{ lineHeight: '1.4' }}>
                        {openingHours.isOpen ? (
                          openingHours.status === 'always_open' ? (
                            <span>Rund um die Uhr geöffnet</span>
                          ) : (
                            <>
                              Geöffnet bis {openingHours.closeTime}
                              {remainingTime && (
                                <span style={{
                                  color: remainingTime === 'Schließt bald' ? '#f59e0b' : 'inherit',
                                  fontWeight: remainingTime === 'Schließt bald' ? '600' : 'normal'
                                }}>
                                  {' • '}noch {remainingTime}
                                </span>
                              )}
                            </>
                          )
                        ) : (
                          openingHours.status === 'closed_unknown' ? (
                            <span>Geschlossen</span>
                          ) : (
                            <span>Geschlossen • Öffnet um {openingHours.openTime}</span>
                          )
                        )}
                      </span>
                    </div>
                  )
                })()}
                
                <div className="flex justify-between items-center">
                  {result.rating && (
                    <div className="flex items-center gap-1 text-secondary">
                      <span>⭐</span>
                      <span>{result.rating} {t('stars')}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-secondary" style={{ textAlign: 'right' }}>
                    {formatTimestamp(result.timestamp)}
                  </div>
                </div>
              </div>
            </div>

            {result.live_occupancy ? (
              <div 
                className="p-4 mb-4"
                style={{ 
                  backgroundColor: getOccupancyColor(result.live_occupancy, result.is_live_data),
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${getOccupancyBorderColor(result.live_occupancy, result.is_live_data)}`
                }}
              >
                <div className="font-weight-500 text-sm mb-2">
                  {result.is_live_data ? `${getOccupancyIcon(result.live_occupancy, result.is_live_data)} ${t('liveOccupancy')}` : `📊 ${t('occupancyData')}`}
                </div>
                <div className="text-sm mb-2">
                  {translateOccupancyText(result.live_occupancy)}
                </div>
              </div>
            ) : (
              <div 
                className="p-4 mb-4"
                style={{ 
                  backgroundColor: 'rgba(156, 163, 175, 0.1)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid rgba(156, 163, 175, 0.2)'
                }}
              >
                <div className="text-sm text-secondary">
                  {result.error ? `${t('errorLabel')} ${result.error}` : t('noOccupancyData')}
                </div>
              </div>
            )}

            {/* Mobile-optimized footer */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2" style={{
                flexDirection: window.innerWidth <= 480 ? 'column' : 'row'
              }}>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                  onClick={() => handleMapClick(result)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(104, 141, 177, 0.1)',
                    borderRadius: 'var(--radius)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    flex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(104, 141, 177, 0.2)'
                    e.target.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(104, 141, 177, 0.1)'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  <span>🔗</span>
                  <span>{t('openGoogleMaps')}</span>
                </a>
                
                <button
                  onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                  className="btn btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: expandedCard === index ? 'rgba(225, 97, 98, 0.2)' : 'rgba(156, 182, 143, 0.1)',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    flex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = expandedCard === index ? 'rgba(225, 97, 98, 0.3)' : 'rgba(156, 182, 143, 0.2)'
                    e.target.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = expandedCard === index ? 'rgba(225, 97, 98, 0.2)' : 'rgba(156, 182, 143, 0.1)'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  <span>{expandedCard === index ? '📉' : '📈'}</span>
                  <span>{expandedCard === index ? t('closeHistory') : t('showHistory')}</span>
                </button>
              </div>
              
              {/* Render OccupancyChart when expanded */}
              {expandedCard === index && (
                <OccupancyChart 
                  url={result.url} 
                  isExpanded={expandedCard === index}
                />
              )}
              
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center text-secondary py-8">
          <p>{t('noResultsYet')}</p>
        </div>
      )}
      
      {results.length > 0 && filteredResults.length === 0 && (
        <div className="text-center text-secondary py-8">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{t('noMatchesFound')}</p>
          <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>{t('tryDifferentSearch')}</p>
        </div>
      )}
    </div>
  )
}

export default ResultsDisplay