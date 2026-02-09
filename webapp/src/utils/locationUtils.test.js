import { describe, it, expect } from 'vitest'
import {
  calculateDistance,
  extractCoordinatesFromUrl,
  formatDistance,
  parseLocationCoordinates,
} from './locationUtils'

describe('calculateDistance', () => {
  it('returns 0 for identical coordinates', () => {
    expect(calculateDistance(52.48, 13.43, 52.48, 13.43)).toBe(0)
  })

  it('calculates distance between Brandenburger Tor and Alexanderplatz (~2.2km)', () => {
    const d = calculateDistance(52.5163, 13.3777, 52.5219, 13.4132)
    expect(d).toBeGreaterThan(2)
    expect(d).toBeLessThan(3)
  })

  it('calculates distance between Berlin and Munich (~504km)', () => {
    const d = calculateDistance(52.52, 13.405, 48.1351, 11.582)
    expect(d).toBeGreaterThan(480)
    expect(d).toBeLessThan(520)
  })

  it('handles negative coordinates', () => {
    const d = calculateDistance(-33.87, 151.21, -33.86, 151.2)
    expect(d).toBeGreaterThan(0)
    expect(d).toBeLessThan(2)
  })
})

describe('extractCoordinatesFromUrl', () => {
  it('extracts coordinates from a standard Google Maps URL', () => {
    const url = 'https://www.google.com/maps/place/Berghain/@52.5112,13.4428,17z'
    const result = extractCoordinatesFromUrl(url)
    expect(result).toEqual({ lat: 52.5112, lng: 13.4428 })
  })

  it('returns null when URL has no coordinates', () => {
    const url = 'https://www.google.com/maps/place/Berghain'
    expect(extractCoordinatesFromUrl(url)).toBeNull()
  })

  it('returns null for null input', () => {
    expect(extractCoordinatesFromUrl(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(extractCoordinatesFromUrl(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(extractCoordinatesFromUrl('')).toBeNull()
  })

  it('handles negative coordinates', () => {
    const url = 'https://www.google.com/maps/place/Test/@-33.8688,151.2093,17z'
    const result = extractCoordinatesFromUrl(url)
    expect(result).toEqual({ lat: -33.8688, lng: 151.2093 })
  })
})

describe('formatDistance', () => {
  it('formats distances under 1km in meters', () => {
    expect(formatDistance(0.5)).toBe('500m')
    expect(formatDistance(0.15)).toBe('150m')
    expect(formatDistance(0.001)).toBe('1m')
  })

  it('formats distances 1-10km with one decimal', () => {
    expect(formatDistance(1.0)).toBe('1.0km')
    expect(formatDistance(5.55)).toBe('5.5km')
    expect(formatDistance(9.99)).toBe('10.0km')
  })

  it('formats distances >=10km as rounded integers', () => {
    expect(formatDistance(10)).toBe('10km')
    expect(formatDistance(15.7)).toBe('16km')
    expect(formatDistance(504.2)).toBe('504km')
  })
})

describe('parseLocationCoordinates', () => {
  it('returns empty map for null input', () => {
    const result = parseLocationCoordinates(null)
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('returns empty map for empty string', () => {
    const result = parseLocationCoordinates('')
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('parses CSV content with valid coordinates', () => {
    const csv = `id;name;url;active
1;Berghain;https://www.google.com/maps/place/Berghain/@52.5112,13.4428,17z;1
2;Tresor;https://www.google.com/maps/place/Tresor/@52.5098,13.4195,17z;1`
    const result = parseLocationCoordinates(csv)
    expect(result.size).toBe(2)
    expect(result.get('Berghain')).toEqual({ lat: 52.5112, lng: 13.4428 })
    expect(result.get('Tresor')).toEqual({ lat: 52.5098, lng: 13.4195 })
  })

  it('skips lines without coordinates in URL', () => {
    const csv = `id;name;url;active
1;NoCoords;https://www.google.com/maps/place/Test;1`
    const result = parseLocationCoordinates(csv)
    expect(result.size).toBe(0)
  })
})
