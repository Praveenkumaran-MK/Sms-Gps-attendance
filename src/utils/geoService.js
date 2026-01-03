/**
 * GeoGuard Geofencing Service
 * Provides geofence validation using Haversine formula
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if a worker's location is within the geofence radius
 * @param {number} workerLat - Worker's latitude
 * @param {number} workerLng - Worker's longitude
 * @param {number} siteLat - Site center latitude
 * @param {number} siteLng - Site center longitude
 * @param {number} radius - Geofence radius in meters
 * @returns {Object} { isInside: boolean, distance: number }
 */
function checkGeofence(workerLat, workerLng, siteLat, siteLng, radius) {
  // Validate inputs
  if (
    typeof workerLat !== 'number' ||
    typeof workerLng !== 'number' ||
    typeof siteLat !== 'number' ||
    typeof siteLng !== 'number' ||
    typeof radius !== 'number'
  ) {
    throw new Error('All parameters must be numbers');
  }

  if (radius <= 0) {
    throw new Error('Radius must be greater than 0');
  }

  // Calculate distance
  const distance = calculateDistance(workerLat, workerLng, siteLat, siteLng);

  // Check if inside geofence
  const isInside = distance <= radius;

  return {
    isInside,
    distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
  };
}

module.exports = {
  calculateDistance,
  checkGeofence,
};
