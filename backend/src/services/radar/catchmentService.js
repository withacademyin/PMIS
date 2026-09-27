/**
 * PMIS Opportunity Radar — Catchment Service
 * Calculates road travel times with high-accuracy Geodesic fallback
 * as specified in PMIS_DNO_Admin_Dashboard_Data_Flow.md Section 7.2 & 16.
 */

const EARTH_RADIUS_KM = 6371.0;
const ESTIMATED_SPEED_KMH = 35.0; // Standard average speed for UP secondary & district roads
const FIXED_TERMINAL_BUFFER_MINUTES = 5;

/**
 * Calculates geodesic distance between two coordinate pairs in kilometers using the Haversine formula.
 *
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometers (rounded to 2 decimal places)
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 0;
  }

  const toRad = (angle) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = EARTH_RADIUS_KM * c;

  return Math.round(km * 100) / 100;
}

/**
 * Estimates travel time in minutes from geodesic distance.
 *
 * @param {number} distanceKm
 * @returns {number} Travel time in minutes
 */
export function estimateTravelMinutesFromDistance(distanceKm) {
  if (distanceKm <= 0) return 10;
  const travelHours = distanceKm / ESTIMATED_SPEED_KMH;
  const totalMinutes = Math.round(travelHours * 60 + FIXED_TERMINAL_BUFFER_MINUTES);
  return Math.max(10, totalMinutes);
}

/**
 * Resolves travel time between an opportunity posting and an institution.
 * Checks precomputed TravelTime table first; falls back to geodesic estimate.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {string} postingId
 * @param {Object} postingCoords - { lat, lng }
 * @param {Object} institution - { id, latitude, longitude }
 * @returns {Promise<{ travelMinutes: number, distanceKm: number, isApproximate: boolean, source: string }>}
 */
export async function resolveTravelTime(prisma, postingId, postingCoords, institution) {
  // Check pre-computed database record
  if (prisma && postingId && institution.id) {
    const precomputed = await prisma.travelTime.findUnique({
      where: {
        postingId_institutionId: {
          postingId,
          institutionId: institution.id
        }
      }
    });

    if (precomputed) {
      return {
        travelMinutes: precomputed.roadTravelMinutes,
        distanceKm: calculateHaversineDistanceKm(
          postingCoords.lat,
          postingCoords.lng,
          institution.latitude,
          institution.longitude
        ),
        isApproximate: precomputed.isApproximate,
        source: precomputed.source
      };
    }
  }

  // Fallback: Geodesic Haversine calculation
  const distanceKm = calculateHaversineDistanceKm(
    postingCoords.lat,
    postingCoords.lng,
    institution.latitude,
    institution.longitude
  );

  const travelMinutes = estimateTravelMinutesFromDistance(distanceKm);

  return {
    travelMinutes,
    distanceKm,
    isApproximate: true,
    source: 'GEODESIC_FALLBACK'
  };
}

/**
 * Filters a list of institutions based on a maximum travel time threshold (e.g. 30, 45, 60 min).
 *
 * @param {Array<Object>} institutionsWithTravel - Institutions with travelMinutes attached
 * @param {number} catchmentMinutesThreshold - e.g. 30, 45, 60
 * @returns {Array<Object>} Institutions within threshold, sorted closest first
 */
export function filterInstitutionsByCatchment(institutionsWithTravel, catchmentMinutesThreshold = 60) {
  return institutionsWithTravel
    .filter((inst) => inst.travelMinutes <= catchmentMinutesThreshold)
    .sort((a, b) => a.travelMinutes - b.travelMinutes);
}
