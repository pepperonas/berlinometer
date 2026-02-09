import { describe, it, expect } from 'vitest'
import { findLocationId } from './analytics'

describe('findLocationId', () => {
  const defaultLocations = [
    { id: 1, name: 'Berghain', url: 'https://maps.google.com/berghain' },
    { id: 2, name: 'Tresor', url: 'https://maps.google.com/tresor' },
    { id: 3, name: 'Watergate', url: 'https://maps.google.com/watergate' },
  ]

  it('returns direct id if present on location', () => {
    expect(findLocationId({ id: 42, name: 'Test' }, defaultLocations)).toBe(42)
  })

  it('finds by name match', () => {
    expect(findLocationId({ name: 'Tresor' }, defaultLocations)).toBe(2)
  })

  it('finds by url match', () => {
    expect(
      findLocationId({ name: 'Unknown', url: 'https://maps.google.com/watergate' }, defaultLocations)
    ).toBe(3)
  })

  it('finds by google_maps_url match', () => {
    expect(
      findLocationId(
        { name: 'Unknown', google_maps_url: 'https://maps.google.com/berghain' },
        defaultLocations
      )
    ).toBe(1)
  })

  it('returns null when location not found', () => {
    expect(findLocationId({ name: 'NonExistent' }, defaultLocations)).toBeNull()
  })

  it('returns null with empty default locations array', () => {
    expect(findLocationId({ name: 'Berghain' }, [])).toBeNull()
  })

  it('returns null with no default locations argument', () => {
    expect(findLocationId({ name: 'Berghain' })).toBeNull()
  })
})
