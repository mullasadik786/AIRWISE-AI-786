import { buildDemoFallbackSnapshot } from '../data/presets.ts';
import type { CityLocation, EnvironmentalSnapshot } from '../types/airwise.ts';
import { isPlainRecord, safeReadJsonRecord } from './http.ts';

function isEnvironmentalSnapshot(value: unknown): value is EnvironmentalSnapshot {
  return (
    isPlainRecord(value) &&
    isPlainRecord(value.location) &&
    typeof value.location.name === 'string' &&
    isPlainRecord(value.pollutants) &&
    typeof value.cpcbCategory === 'string' &&
    Array.isArray(value.hourly) &&
    Array.isArray(value.daily)
  );
}

function isCityLocation(value: unknown): value is CityLocation {
  return (
    isPlainRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.region === 'string' &&
    typeof value.country === 'string' &&
    typeof value.countryCode === 'string' &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    typeof value.timezone === 'string' &&
    typeof value.isIndia === 'boolean'
  );
}

/**
 * Queries the backend atmospheric feed for a city/coordinate pair and safely
 * unwraps the response snapshot, falling back to an explicitly labeled demo
 * snapshot on incomplete responses.
 */
export async function fetchAirQualitySnapshot(
  location: CityLocation,
  signal?: AbortSignal,
  fallbackReason?: string
): Promise<EnvironmentalSnapshot> {
  const qs = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    name: location.name,
    region: location.region,
    country: location.country,
    countryCode: location.countryCode,
    timezone: location.timezone,
  });

  const res = await fetch(`/api/air-quality?${qs.toString()}`, { signal });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await safeReadJsonRecord(res);
  if (data && isEnvironmentalSnapshot(data.snapshot)) {
    return data.snapshot;
  }

  return buildDemoFallbackSnapshot(location, fallbackReason);
}

/**
 * Searches matching global/Indian cities via the backend geocoding proxy.
 */
export async function searchCityLocations(
  query: string,
  signal?: AbortSignal
): Promise<{ results: CityLocation[]; error?: string }> {
  const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`, {
    signal,
  });
  const data = await safeReadJsonRecord(res);
  if (!res.ok) {
    const errorMessage = typeof data?.error === 'string' ? data.error : 'Search failed.';
    return { results: [], error: errorMessage };
  }
  const rawResults = Array.isArray(data?.results) ? data.results : [];
  return {
    results: rawResults.filter(isCityLocation),
  };
}
