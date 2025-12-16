/**
 * Analytics utilities for tracking user interactions
 */

/**
 * Track a Google Maps link click
 * @param {number|null} locationId - The ID of the location being clicked (if known)
 * @param {Object} locationData - The full location object with name, url, address
 */
export const trackMapClick = async (locationId, locationData = {}) => {
  try {
    const locationName = locationData.name || 'Unknown'
    console.log(`📊 Tracking map click for location: ${locationName} (ID: ${locationId})`)

    const payload = {
      location_id: locationId,
      location_name: locationData.name,
      location_url: locationData.url,
      location_address: locationData.address
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/track-map-click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      console.log(`✅ Map click tracked successfully for ${locationName}`)
    } else {
      console.warn(`⚠️ Map click tracking failed for ${locationName}:`, result.error)
    }

    return result
  } catch (error) {
    console.error(`❌ Error tracking map click for ${locationName}:`, error)
    // Don't throw - tracking errors shouldn't break the user experience
    return { success: false, error: error.message }
  }
}

/**
 * Find location ID from location data
 * @param {Object} location - Location object with name and potentially id
 * @param {Array} defaultLocations - Array of default locations to search through
 * @returns {number|null} - Location ID if found, null otherwise
 */
export const findLocationId = (location, defaultLocations = []) => {
  // Try to find the location ID by matching name or URL
  if (location.id) {
    return location.id
  }

  // Search in default locations by name
  const foundLocation = defaultLocations.find(loc =>
    loc.name === location.name ||
    loc.url === location.url ||
    (location.google_maps_url && loc.url === location.google_maps_url)
  )

  return foundLocation ? foundLocation.id : null
}