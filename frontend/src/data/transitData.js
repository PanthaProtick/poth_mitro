import transitData from '../../../json/transit-data.json'

const point = (item) => [item.lng, item.lat]
const metroStations = transitData.metro.stations.map((station) => ({ ...station, coordinates: point(station) }))
const buses = transitData.buses.map((bus) => ({ ...bus, stops: bus.stops.map((stop) => ({ ...stop, coordinates: point(stop) })), segments: bus.segments.map((segment) => ({ ...segment, coordinates: segment.coordinates.map(([lat, lng]) => [lng, lat]) })) }))

export const transitNetwork = { ...transitData, metro: { ...transitData.metro, stations: metroStations }, buses }
export const allStops = [...metroStations, ...buses.flatMap((bus) => bus.stops)]
export const networkBounds = allStops.reduce((bounds, stop) => ({ minLng: Math.min(bounds.minLng, stop.coordinates[0]), maxLng: Math.max(bounds.maxLng, stop.coordinates[0]), minLat: Math.min(bounds.minLat, stop.coordinates[1]), maxLat: Math.max(bounds.maxLat, stop.coordinates[1]) }), { minLng: 999, maxLng: -999, minLat: 999, maxLat: -999 })
