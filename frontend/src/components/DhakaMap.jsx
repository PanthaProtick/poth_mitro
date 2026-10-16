import { useEffect, useRef } from 'react'
import { LngLatBounds, Map, Marker, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { hubs, incidents } from '../data/dhakaSample'
import { transitNetwork } from '../data/transitData'

const lineFor = (ids) => ids.map((id) => hubs[id].coordinates)
const routeGeoJson = (route, selected) => ({ type: 'Feature', properties: { selected }, geometry: { type: 'LineString', coordinates: route.coordinates?.length ? route.coordinates : lineFor(route.path) } })

export default function DhakaMap({ selectedRoute, onSelectIncident }) {
  const node = useRef(null); const map = useRef(null)
  useEffect(() => {
    if (!node.current || map.current) return undefined
    const instance = new Map({ container: node.current, center: [90.392, 23.79], zoom: 11.6, pitch: 34, bearing: -8, attributionControl: true, style: { version: 8, sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap contributors' } }, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#dce9e7' } }, { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.88, 'raster-saturation': -0.25, 'raster-contrast': 0.08, 'raster-brightness-max': 0.95 } }] } })
    map.current = instance
    instance.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')
    instance.on('load', () => {
      instance.addSource('network-stations', { type: 'geojson', data: { type: 'FeatureCollection', features: transitNetwork.metro.stations.map((station) => ({ type: 'Feature', properties: { name: station.name }, geometry: { type: 'Point', coordinates: station.coordinates } })) } })
      instance.addLayer({ id: 'network-stations', type: 'circle', source: 'network-stations', paint: { 'circle-radius': 3, 'circle-color': '#8eeef4', 'circle-opacity': .8, 'circle-stroke-color': '#07333e', 'circle-stroke-width': 1 } })
      instance.addLayer({ id: 'network-station-labels', type: 'symbol', source: 'network-stations', minzoom: 11.5, layout: { 'text-field': ['get', 'name'], 'text-size': 10, 'text-offset': [0, 1.2], 'text-anchor': 'top' }, paint: { 'text-color': '#153b45', 'text-halo-color': '#ffffff', 'text-halo-width': 1.4 } })
      instance.addSource('route', { type: 'geojson', data: routeGeoJson(selectedRoute, true) })
      instance.addLayer({ id: 'route-halo', type: 'line', source: 'route', paint: { 'line-color': '#33e6ff', 'line-width': 13, 'line-opacity': 0.13, 'line-blur': 5 } })
      instance.addLayer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': '#42e8ff', 'line-width': 5, 'line-opacity': 0.96, 'line-dasharray': [1, 0.4] } })
      instance.addSource('incidents', { type: 'geojson', data: { type: 'FeatureCollection', features: incidents.map((incident) => ({ type: 'Feature', properties: incident, geometry: { type: 'Point', coordinates: incident.coordinates } })) } })
      instance.addLayer({ id: 'incident-pulse', type: 'circle', source: 'incidents', paint: { 'circle-radius': 15, 'circle-color': '#ffb454', 'circle-opacity': 0.12, 'circle-stroke-color': '#ffb454', 'circle-stroke-width': 1 } })
      instance.addLayer({ id: 'incident-dot', type: 'circle', source: 'incidents', paint: { 'circle-radius': 7, 'circle-color': '#ffb454', 'circle-stroke-color': '#07131f', 'circle-stroke-width': 2 } })
      const coordinates = selectedRoute.coordinates?.length ? selectedRoute.coordinates : selectedRoute.path.map((id) => hubs[id].coordinates)
      const markerTypes = coordinates.length > 2 ? ['origin', ...coordinates.slice(1, -1).map(() => 'transfer'), 'destination'] : ['origin', 'destination']
      coordinates.filter((_, index) => index === 0 || index === coordinates.length - 1 || (coordinates.length > 2 && index === Math.floor(coordinates.length / 2))).forEach((coordinate, index, visible) => {
        const element = document.createElement('div'); element.className = `route-marker route-marker-${markerTypes[index] || 'transfer'}`; element.innerHTML = index === 0 ? '↗' : index === visible.length - 1 ? '✦' : '⇄'; new Marker({ element, anchor: 'center' }).setLngLat(coordinate).addTo(instance)
      })
      instance.on('click', 'incident-dot', (event) => onSelectIncident(event.features?.[0]?.properties?.id))
      instance.on('mouseenter', 'incident-dot', () => { instance.getCanvas().style.cursor = 'pointer' })
      instance.on('mouseleave', 'incident-dot', () => { instance.getCanvas().style.cursor = '' })
    })
    return () => { instance.remove(); map.current = null }
  }, [onSelectIncident, selectedRoute])
  useEffect(() => {
    const instance = map.current
    if (!instance || !instance.isStyleLoaded()) return
    const source = instance.getSource('route'); if (source) source.setData(routeGeoJson(selectedRoute, true))
    const coordinates = selectedRoute.coordinates?.length ? selectedRoute.coordinates : selectedRoute.path.map((id) => hubs[id].coordinates)
    const bounds = coordinates.reduce((box, coordinate) => box.extend(coordinate), new LngLatBounds(coordinates[0], coordinates[0]))
    instance.fitBounds(bounds, { padding: { top: 80, bottom: 150, left: 80, right: 80 }, duration: 1100, essential: true, maxZoom: 12.8 })
  }, [selectedRoute])
  return <div className="map-wrap"><div ref={node} className="map-canvas" /><div className="map-fade" /><div className="map-label map-label-start"><span className="marker-dot marker-start" />{hubs[selectedRoute.path[0]].label}</div><div className="map-label map-label-end"><span className="marker-dot marker-end" />{hubs[selectedRoute.path[selectedRoute.path.length - 1]].label}</div><div className="map-simulated">SIMULATED DHAKA NETWORK</div></div>
}
