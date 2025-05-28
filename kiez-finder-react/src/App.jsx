import React, { useState, useEffect } from 'react'
import { GoogleMap, LoadScript, Marker, useJsApiLoader } from '@react-google-maps/api'
import './App.css'

const API_KEY = 'AIzaSyC7ks_lygeT7pWKRILFVVGNb-IZxdJyohQ'

const mapContainerStyle = {
  width: '100%',
  height: '70vh',
  borderRadius: '10px',
  marginTop: '3rem',
  marginBottom: '1rem'
}

const center = {
  lat: 51.1657,
  lng: 10.4515
}

const mapOptions = {
  styles: [
    {elementType: "geometry", stylers: [{color: "#242f3e"}]},
    {elementType: "labels.text.stroke", stylers: [{color: "#242f3e"}]},
    {elementType: "labels.text.fill", stylers: [{color: "#746855"}]},
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{color: "#d59563"}],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{color: "#d59563"}],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{color: "#263c3f"}],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{color: "#6b9a76"}],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{color: "#38414e"}],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{color: "#212a37"}],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{color: "#9ca5b3"}],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{color: "#746855"}],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{color: "#1f2835"}],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{color: "#f3d19c"}],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{color: "#2f3948"}],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{color: "#d59563"}],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{color: "#17263c"}],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{color: "#515c6d"}],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{color: "#17263c"}],
    },
  ],
  zoom: 6
}

function App() {
  const [location, setLocation] = useState(null)
  const [district, setDistrict] = useState('-')
  const [address, setAddress] = useState('-')
  const [coordinates, setCoordinates] = useState('-')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [map, setMap] = useState(null)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY
  })

  const onLoad = React.useCallback(function callback(map) {
    setMap(map)
  }, [])

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null)
  }, [])

  const getUserLocation = () => {
    setLoading(true)
    setError(null)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setLocation(pos)
          setCoordinates(`Lat: ${pos.lat.toFixed(5)}, Lng: ${pos.lng.toFixed(5)}`)
          
          if (map) {
            map.setCenter(pos)
            map.setZoom(14)
          }

          getAddressInfo(pos)
        },
        (error) => {
          setLoading(false)
          setError(getGeolocationErrorMessage(error))
        }
      )
    } else {
      setLoading(false)
      setError('Geolocation wird von diesem Browser nicht unterstützt.')
    }
  }

  const getAddressInfo = (position) => {
    if (!window.google) return
    
    const geocoder = new window.google.maps.Geocoder()

    geocoder.geocode({ location: position }, (results, status) => {
      if (status === 'OK') {
        if (results[0]) {
          setLoading(false)
          
          let districtName = ''
          const fullAddress = results[0].formatted_address
          setAddress(fullAddress)

          for (const component of results[0].address_components) {
            if (component.types.includes('sublocality') ||
                component.types.includes('political') ||
                component.types.includes('administrative_area_level_3')) {
              districtName = component.long_name
              break
            }
          }

          if (!districtName) {
            for (const component of results[0].address_components) {
              if (component.types.includes('locality')) {
                districtName = component.long_name
                break
              }
            }
          }

          setDistrict(districtName || 'Nicht verfügbar')
        } else {
          setLoading(false)
          setError('Keine Ergebnisse gefunden')
        }
      } else {
        setLoading(false)
        setError('Geokodierung fehlgeschlagen: ' + status)
      }
    })
  }

  const getGeolocationErrorMessage = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Der Benutzer hat die Anfrage zur Geolokalisierung abgelehnt."
      case error.POSITION_UNAVAILABLE:
        return "Standortinformationen sind nicht verfügbar."
      case error.TIMEOUT:
        return "Die Anfrage zur Standortermittlung ist abgelaufen."
      case error.UNKNOWN_ERROR:
        return "Ein unbekannter Fehler ist aufgetreten."
      default:
        return "Ein Fehler ist aufgetreten."
    }
  }

  useEffect(() => {
    if (isLoaded) {
      getUserLocation()
    }
  }, [isLoaded])

  return (
    <div className="app">
      <header>
        <h1>Kiez-Finder</h1>
      </header>

      <main>
        {error && (
          <div className="error-container">
            <div className="error">{error}</div>
          </div>
        )}
        
        <div className="info">
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Standort wird ermittelt...</p>
            </div>
          ) : (
            <div className="location-info">
              <h2>Du befindest dich in:</h2>
              <p className="district-name">{district}</p>
              <p className="address">{address}</p>
              <p className="coordinates">{coordinates}</p>
              <button onClick={getUserLocation}>Aktualisieren</button>
            </div>
          )}
          
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={location || center}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={mapOptions}
            >
              {location && <Marker position={location} animation={window.google?.maps?.Animation?.DROP} />}
            </GoogleMap>
          )}
        </div>
      </main>
    </div>
  )
}

export default App