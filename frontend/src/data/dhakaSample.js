import { allStops, transitNetwork } from './transitData'

const find = (name) => allStops.find((stop) => stop.name.toLowerCase() === name.toLowerCase()) || allStops.find((stop) => stop.name.toLowerCase().includes(name.toLowerCase()))
const stop = (name) => { const item = find(name); return { id: item?.id || name.toLowerCase().replaceAll(' ', '-'), label: item?.name || name, coordinates: item?.coordinates || [90.396, 23.74] } }
export const hubs = { mirpur: stop('Mirpur 10'), farmgate: stop('Farmgate'), shahbagh: stop('Shahbagh'), uttara: stop('Uttara North'), badda: { id: 'badda', label: 'Badda', coordinates: [90.4262, 23.7806] }, motijheel: stop('Motijheel') }
const metroPath = transitNetwork.metro.stations.map((station) => station.coordinates)
const bikolpoPath = transitNetwork.buses.find((bus) => bus.id === 'bikolpo')?.segments.flatMap((segment) => segment.coordinates) || []
const uttaraPath = transitNetwork.buses.find((bus) => bus.id === 'uttara_bus')?.segments.flatMap((segment) => segment.coordinates) || []

export const routeOptions = [
  { id: 'fastest', label: 'Fastest', icon: 'zap', color: 'cyan', time: 42, fare: [40, 55], transfers: 1, confidence: 92, status: 'Clear', source: 'MRT-6 + field reports', updated: '6 min ago', modes: ['MRT-6', 'Bus'], path: ['mirpur', 'farmgate', 'shahbagh'], coordinates: [...metroPath.slice(5, 13)], detail: 'MRT-6 to Farmgate, then a short bus hop to Shahbagh.' },
  { id: 'cheapest', label: 'Cheapest', icon: 'wallet', color: 'green', time: 58, fare: [25, 35], transfers: 2, confidence: 78, status: 'Variable fare', source: 'Routemap-BikolpoBus.csv', updated: '18 min ago', modes: ['Bus', 'Walk'], path: ['mirpur', 'badda', 'motijheel'], coordinates: bikolpoPath.filter((_, index) => index % 4 === 0), detail: 'Bikolpo bus corridor with a final walk to the civic district.' },
  { id: 'reliable', label: 'Most reliable', icon: 'shield', color: 'violet', time: 49, fare: [45, 60], transfers: 1, confidence: 96, status: 'Fresh reports', source: 'MRT-6 station data', updated: '3 min ago', modes: ['MRT-6', 'Walk'], path: ['mirpur', 'farmgate', 'shahbagh'], coordinates: metroPath.slice(5, 13), detail: 'Stay on the rail spine and walk from Farmgate to the destination.' },
]

export const incidents = [{ id: 'farmgate-waterlogging', title: 'Waterlogging near Farmgate west crossing', location: 'Farmgate', coordinates: hubs.farmgate.coordinates, status: 'Unconfirmed', freshness: 'Fresh · 15 min', source: 'Traveller report', confidence: 64, route: 'fastest', severity: 'medium' }]
