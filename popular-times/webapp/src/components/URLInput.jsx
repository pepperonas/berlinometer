import { useState, useEffect } from 'react'

function URLInput({ onStartScraping, isScrapingActive }) {
  const [urls, setUrls] = useState('')
  const [inputMode, setInputMode] = useState('textarea') // 'textarea' or 'file'
  const [address, setAddress] = useState('')
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [locationStatus, setLocationStatus] = useState('Klicken Sie auf "📍 Mein Standort" um Ihren aktuellen Standort zu ermitteln')

  // Entferne automatische Geolocation - nur auf Benutzereingabe

  const getCurrentLocation = () => {
    // Geolocation wird gestartet...
    if ('geolocation' in navigator) {
      setLocationStatus('Ermittle Position...')
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          // Position ermittelt
          setLocationStatus('Position gefunden, ermittle Adresse...')
          
          try {
            // Verwende Google Maps Geocoding API (wie im bewährten Kiez-Finder)
            // Nutze einen kostenlosen Google Maps Geocoding Service
            
            let formattedAddress = ''
            
            // Versuche zuerst Google Maps Geocoding über eine kostenlose API
            try {
              // Rufe Google Maps Geocoding API auf...
              const googleResponse = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyC7ks_lygeT7pWKRILFVVGNb-IZxdJyohQ&language=de`
              )
              const googleData = await googleResponse.json()
              console.log('Google Maps API Response:', googleData)
              // Google API Status
              
              if (googleData.status === 'OK' && googleData.results && googleData.results.length > 0) {
                const result = googleData.results[0]
                console.log('Google address result:', result)
                // Google API: Ergebnisse gefunden
                
                // Verwende die formatted_address von Google (ist sehr genau)
                formattedAddress = result.formatted_address
                console.log('✅ Using Google Maps address:', formattedAddress)
                // Google Adresse gefunden
              } else {
                // Google API Fehler
              }
            } catch (googleError) {
              console.log('Google Maps failed, trying fallback...', googleError)
              console.log('Google Maps failed, trying fallback...', googleError)
            }
            
            // Fallback: Nominatim (OpenStreetMap) falls Google fehlschlägt
            if (!formattedAddress) {
              try {
                // Rufe Nominatim (OpenStreetMap) API auf...
                const nominatimResponse = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=de`
                )
                const nominatimData = await nominatimResponse.json()
                console.log('Nominatim API Response:', nominatimData)
                // Nominatim API Response erhalten
                
                if (nominatimData && nominatimData.address) {
                  const addr = nominatimData.address
                  console.log('Nominatim address parts:', addr)
                  // Nominatim Adressteile
                  
                  // Baue Adresse zusammen: Straße + Hausnummer + Stadt
                  const street = addr.road || addr.street || addr.pedestrian
                  const houseNumber = addr.house_number
                  const city = addr.city || addr.town || addr.village || addr.municipality
                  
                  // Adressteile gefunden
                  
                  if (street) {
                    formattedAddress = street
                    if (houseNumber) {
                      formattedAddress += ` ${houseNumber}`
                    }
                    if (city) {
                      formattedAddress += `, ${city}`
                    }
                    console.log('✅ Using Nominatim address:', formattedAddress)
                    // Nominatim Adresse gefunden
                  } else {
                    // Nominatim: Keine Straße gefunden
                  }
                } else {
                  // Nominatim: Keine Adressdaten erhalten
                }
              } catch (nominatimError) {
                console.log('Nominatim failed, using coordinates...', nominatimError)
                console.log('Nominatim failed, using coordinates...', nominatimError)
              }
            }
            
            // Letzter Fallback: Koordinaten anzeigen
            if (!formattedAddress) {
              formattedAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
              console.log('✅ Using coordinates fallback:', formattedAddress)
              // Fallback: Verwende Koordinaten als Adresse
            }
            
            setAddress(formattedAddress)
            setLocationStatus(`Position: ${formattedAddress}`)
            // Geolocation abgeschlossen
          } catch (error) {
            console.error('Fehler beim Ermitteln der Adresse:', error)
            console.error('Fehler beim Ermitteln der Adresse:', error)
            setLocationStatus('Position gefunden, aber Adresse konnte nicht ermittelt werden')
            setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
          }
        },
        (error) => {
          console.error('Geolocation Fehler:', error)
          console.error('Geolocation Fehler:', error)
          setLocationStatus('Position konnte nicht ermittelt werden')
          // Kein automatischer Fallback mehr
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 Minuten Cache
        }
      )
    } else {
      setLocationStatus('Geolocation wird nicht unterstützt')
      // Kein automatischer Fallback mehr
    }
  }

  const findNearbyLocations = async () => {
    if (!address.trim()) {
      alert('Bitte geben Sie eine Adresse ein')
      alert('Bitte geben Sie eine Adresse ein')
      return
    }

    // Starte Location-Suche
    setIsLoadingLocations(true)
    setLocationStatus('Suche nach nahegelegenen Locations...')

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5044'}/find-locations`
      // API Aufruf
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: address.trim() })
      })

      // API Response erhalten

      if (!response.ok) {
        throw new Error(`API-Aufruf fehlgeschlagen: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      // API Response erhalten
      
      if (data.urls && data.urls.length > 0) {
        setUrls(data.urls.join('\n'))
        setLocationStatus(`${data.urls.length} Locations gefunden!`)
        setInputMode('textarea')
        // Locations erfolgreich geladen
        // URLs geladen
      } else {
        setLocationStatus('Keine Locations gefunden')
        // Keine Locations gefunden
        alert('Keine Locations in der Nähe gefunden. Versuchen Sie eine andere Adresse.')
      }
    } catch (error) {
      console.error('Fehler beim Suchen der Locations:', error)
      console.error('Fehler beim Suchen der Locations:', error)
      setLocationStatus('Fehler beim Suchen der Locations')
      alert('Fehler beim Suchen der Locations. Bitte versuchen Sie es später erneut.')
    } finally {
      setIsLoadingLocations(false)
      // Location-Suche beendet
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!urls.trim()) {
      alert('Bitte geben Sie mindestens eine URL ein')
      return
    }

    const urlList = urls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && url.startsWith('https://'))

    if (urlList.length === 0) {
      alert('Bitte geben Sie gültige URLs ein (müssen mit https:// beginnen)')
      return
    }

    onStartScraping(urlList)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUrls(event.target.result)
        setInputMode('textarea')
      }
      reader.readAsText(file)
    }
  }

  const loadSampleUrls = () => {
    const sampleUrls = `https://www.google.de/maps/place/Majestic+-+Caf%C3%A9+%26+Cocktailbar/@52.4836184,13.426421,16z/data=!4m10!1m2!2m1!1sbar!3m6!1s0x47a84f6e51648823:0x6986bef12d8acdb!8m2!3d52.4827079!4d13.431962!15sCgNiYXJaBSIDYmFykgEDYmFyqgE0EAEqByIDYmFyKAUyHhABIhr1YsOeeuz9pPLCXbmL2X-3_jbHIKEgInT2-zIHEAIiA2JhcuABAA!16s%2Fg%2F11trlr2rt6!5m1!1e4?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D
https://www.google.de/maps/place/Yorcks+BAR/@52.49323,13.3746128,16z/data=!3m1!5s0x47a8502f3aac12f1:0x4c9ea32304684d8c!4m13!1m5!2m4!1sbars!5m1!2e1!6e5!3m6!1s0x47a8502f25a9badb:0x5f5e56cc135e0bd8!8m2!3d52.49323!4d13.38414!15sCgRiYXJzWgYiBGJhcnOSAQNiYXKqATYQASoIIgRiYXJzKAUyHhABIhrCnwOeg471m0unc4LJtFstzTvf0V5kZO59mjIIEAIiBGJhcnPgAQA!16s%2Fg%2F1q69jvz2f!5m1!1e4?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D
https://www.google.de/maps/place/Bierbaum+3/@52.4755215,13.4230856,16z/data=!3m1!4b1!4m6!3m5!1s0x47a84f9600b53623:0x10ecc057c123abc2!8m2!3d52.4755215!4d13.4230856!16s%2Fg%2F1232zv_2g!5m1!1e4?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D`
    setUrls(sampleUrls)
    setInputMode('textarea')
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Google Maps URLs</h3>
        <p className="card-description">
          Geben Sie die Google Maps URLs ein, die Sie analysieren möchten, oder lassen Sie Locations automatisch finden
        </p>
      </div>

      {/* Adressfeld für automatische Location-Suche */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--background-darker)' }}>
        <div className="card-header" style={{ paddingBottom: '0.5rem' }}>
          <h4 style={{ fontSize: '1rem', margin: 0 }}>📍 Automatische Location-Suche</h4>
          <p style={{ fontSize: '0.875rem', margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
            Finden Sie automatisch Bars und Clubs in Ihrer Nähe
          </p>
        </div>
        
        <div className="form-group">
          <label className="form-label">Adresse oder Standort</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="z.B. Musterstraße 1, Berlin oder klicken Sie auf 'Mein Standort'"
              disabled={isLoadingLocations}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => getCurrentLocation()}
              disabled={isLoadingLocations}
              style={{ whiteSpace: 'nowrap' }}
            >
              📍 Mein Standort
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={findNearbyLocations}
              disabled={isLoadingLocations || !address.trim()}
            >
              {isLoadingLocations ? (
                <>
                  <div className="loading mr-2"></div>
                  Suche...
                </>
              ) : (
                '🔍 Locations finden'
              )}
            </button>
          </div>
          {locationStatus && (
            <div className="text-sm mt-2" style={{ color: 'var(--accent-green)' }}>
              {locationStatus}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              className={`btn btn-sm ${inputMode === 'textarea' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setInputMode('textarea')}
            >
              Manuelle Eingabe
            </button>
            <button
              type="button"
              className={`btn btn-sm ${inputMode === 'file' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setInputMode('file')}
            >
              Datei hochladen
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={loadSampleUrls}
            >
              Beispiel-URLs laden
            </button>
          </div>

          {inputMode === 'textarea' ? (
            <>
              <label className="form-label">
                URLs (eine pro Zeile)
              </label>
              <textarea
                className="form-textarea"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://www.google.de/maps/place/..."
                rows={6}
                disabled={isScrapingActive}
              />
            </>
          ) : (
            <>
              <label className="form-label">
                URLs-Datei auswählen (.txt)
              </label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="form-input"
                disabled={isScrapingActive}
              />
            </>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-secondary">
            {urls.split('\n').filter(url => url.trim() && url.startsWith('https://')).length} gültige URLs
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setUrls('')}
              disabled={isScrapingActive}
            >
              Leeren
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isScrapingActive || !urls.trim()}
            >
              {isScrapingActive ? (
                <>
                  <div className="loading mr-2"></div>
                  Scraping läuft...
                </>
              ) : (
                'Scraping starten'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default URLInput