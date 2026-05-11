/**
 * Parse geographic coordinates from any of the four supported formats
 * and return { lat, lng } in decimal degrees, or null if not recognised.
 *
 * Supported formats:
 *   DD    →  41.40338, -2.17403
 *   DMS   →  41°24'12.2"N 2°10'26.5"E
 *   DDM   →  41°24.2028', -2°10.4418'
 *   WKT   →  POINT(-0.1278 51.5074)   (WKT order is lng lat)
 */

export interface LatLng {
  lat: number
  lng: number
}

// ── DD: "41.40338, -2.17403" or "41.40338 -2.17403" ─────────────────────────
const DD_RE = /^(-?\d{1,3}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/

// ── DMS: 41°24'12.2"N 2°10'26.5"E  (hemisphere letters required) ────────────
// Accepts °, d, º as degree marker; ', m as minute marker; ", s as second marker
const DMS_RE =
  /^(\d{1,3})[°dº]\s*(\d{1,2})['m]\s*(\d{1,2}(?:\.\d+)?)[""s]?\s*([NS])\s*[,\s]*(\d{1,3})[°dº]\s*(\d{1,2})['m]\s*(\d{1,2}(?:\.\d+)?)[""s]?\s*([EW])$/i

// ── DDM: 41°24.2028', -2°10.4418'  (optional hemisphere or sign) ─────────────
const DDM_RE =
  /^(-)?(\d{1,3})[°dº]\s*(\d{1,2}(?:\.\d+)?)'?\s*([NS])?\s*[,\s]+(-)?(\d{1,3})[°dº]\s*(\d{1,2}(?:\.\d+)?)'?\s*([EW])?$/i

// ── WKT POINT: POINT(-0.1278 51.5074)  (lng lat order per OGC spec) ──────────
const WKT_RE = /^POINT\s*\(\s*(-?\d{1,3}(?:\.\d+)?)\s+(-?\d{1,3}(?:\.\d+)?)\s*\)$/i

function dmsToDD(deg: number, min: number, sec: number, hemi: string): number {
  const dd = deg + min / 60 + sec / 3600
  return /[SW]/i.test(hemi) ? -dd : dd
}

function ddmToDD(deg: number, decMin: number, negative: boolean, hemi?: string): number {
  const dd = deg + decMin / 60
  const isNeg = negative || (hemi != null && /[SW]/i.test(hemi))
  return isNeg ? -dd : dd
}

export function parseCoords(input: string): LatLng | null {
  const s = input.trim()

  // WKT POINT — must check before DD since it has alpha prefix
  const wkt = WKT_RE.exec(s)
  if (wkt) {
    const lng = parseFloat(wkt[1]!)
    const lat = parseFloat(wkt[2]!)
    if (isValidLatLng(lat, lng)) return { lat, lng }
    return null
  }

  // DMS (requires hemisphere letters)
  const dms = DMS_RE.exec(s)
  if (dms) {
    const lat = dmsToDD(parseFloat(dms[1]!), parseFloat(dms[2]!), parseFloat(dms[3]!), dms[4]!)
    const lng = dmsToDD(parseFloat(dms[5]!), parseFloat(dms[6]!), parseFloat(dms[7]!), dms[8]!)
    if (isValidLatLng(lat, lng)) return { lat, lng }
    return null
  }

  // DDM
  const ddm = DDM_RE.exec(s)
  if (ddm) {
    const lat = ddmToDD(parseFloat(ddm[2]!), parseFloat(ddm[3]!), ddm[1] === '-', ddm[4])
    const lng = ddmToDD(parseFloat(ddm[6]!), parseFloat(ddm[7]!), ddm[5] === '-', ddm[8])
    if (isValidLatLng(lat, lng)) return { lat, lng }
    return null
  }

  // DD (most permissive — last to avoid false positives)
  const dd = DD_RE.exec(s)
  if (dd) {
    const lat = parseFloat(dd[1]!)
    const lng = parseFloat(dd[2]!)
    if (isValidLatLng(lat, lng)) return { lat, lng }
    return null
  }

  return null
}

function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * Format a lat/lng pair as compact decimal degrees string: "41.40338,-2.17403"
 * This is the canonical storage format used in frontmatter and mention syntax.
 */
export function formatDD(lat: number, lng: number): string {
  return `${lat},${lng}`
}
