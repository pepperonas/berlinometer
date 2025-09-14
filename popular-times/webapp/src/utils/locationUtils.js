// Utility functions for location and distance calculations

/**
 * Haversine formula to calculate distance between two GPS coordinates
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Extract GPS coordinates from Google Maps URL
 * @param {string} url - Google Maps URL
 * @returns {object|null} - {lat, lng} or null if not found
 */
export const extractCoordinatesFromUrl = (url) => {
  if (!url) return null;
  
  // Look for the @lat,lng pattern in Google Maps URLs
  const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2])
    };
  }
  
  return null;
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
};

/**
 * Get user's current location using Geolocation API
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000 // 5 minutes
      }
    );
  });
};

/**
 * Parse CSV data and create location coordinate mapping
 * @param {string} csvContent - CSV content as string
 * @returns {Map<string, {lat: number, lng: number}>} Map of location names to coordinates
 */
export const parseLocationCoordinates = (csvContent) => {
  const coordinateMap = new Map();
  
  if (!csvContent) return coordinateMap;
  
  const lines = csvContent.split('\n');
  
  // Skip header line and process data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line - handle quoted fields
    const columns = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' && (j === 0 || line[j-1] === ';')) {
        inQuotes = true;
      } else if (char === '"' && (j === line.length - 1 || line[j+1] === ';')) {
        inQuotes = false;
      } else if (char === ';' && !inQuotes) {
        columns.push(current);
        current = '';
        continue;
      } else {
        current += char;
      }
    }
    columns.push(current); // Add last column
    
    if (columns.length >= 3) {
      const locationName = columns[1]; // Name column
      const url = columns[2]; // URL column
      
      const coordinates = extractCoordinatesFromUrl(url);
      if (coordinates && locationName) {
        coordinateMap.set(locationName, coordinates);
      }
    }
  }
  
  return coordinateMap;
};