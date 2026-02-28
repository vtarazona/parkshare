import ngeohash from 'ngeohash';

const GEOHASH_PRECISION = 7; // ~153m x 153m cells

export function encodeGeohash(latitude: number, longitude: number): string {
  return ngeohash.encode(latitude, longitude, GEOHASH_PRECISION);
}

export function decodeGeohash(hash: string): { latitude: number; longitude: number } {
  const { latitude, longitude } = ngeohash.decode(hash);
  return { latitude, longitude };
}

/**
 * Returns an array of geohash ranges [lower, upper] that cover
 * a circular area around a center point.
 * Used for Firestore range queries to find nearby spots.
 */
export function getGeohashRanges(
  latitude: number,
  longitude: number,
  radiusKm: number
): Array<[string, string]> {
  // Approximate degrees per km
  const latDelta = radiusKm / 110.574;
  const lonDelta = radiusKm / (111.32 * Math.cos((latitude * Math.PI) / 180));

  const minLat = latitude - latDelta;
  const maxLat = latitude + latDelta;
  const minLon = longitude - lonDelta;
  const maxLon = longitude + lonDelta;

  // Get geohash bounds for the bounding box
  const lowerHash = ngeohash.encode(minLat, minLon, GEOHASH_PRECISION);
  const upperHash = ngeohash.encode(maxLat, maxLon, GEOHASH_PRECISION);

  // Get all neighboring geohash cells to ensure full coverage
  const centerHash = ngeohash.encode(latitude, longitude, GEOHASH_PRECISION);
  const neighbors = ngeohash.neighbors(centerHash);

  // Create ranges from all neighbor cells
  const allHashes = [centerHash, ...neighbors].sort();

  if (allHashes.length === 0) {
    return [[lowerHash, upperHash]];
  }

  // Group consecutive geohashes into ranges
  const ranges: Array<[string, string]> = [];
  let rangeStart = allHashes[0];
  let rangePrev = allHashes[0];

  for (let i = 1; i < allHashes.length; i++) {
    const current = allHashes[i];
    // If not consecutive, close current range and start new one
    if (current.slice(0, -1) !== rangePrev.slice(0, -1)) {
      ranges.push([rangeStart, rangePrev + '~']);
      rangeStart = current;
    }
    rangePrev = current;
  }
  ranges.push([rangeStart, rangePrev + '~']);

  return ranges;
}

/**
 * Calculate distance between two coordinates in km (Haversine formula)
 */
export function distanceBetween(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
