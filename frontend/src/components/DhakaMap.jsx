import { useEffect, useMemo, useRef, useState } from 'react'
import { LngLatBounds, Map, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'

setWorkerUrl(mapLibreWorkerUrl)

const emptyCollection = { type: 'FeatureCollection', features: [] }

function networkCollection(network) {
  const features = (network?.routes || []).flatMap((route) => route.segments.map((segment) => ({
    type: 'Feature',
    properties: { route_id: route.id, mode: route.mode, name: route.name },
    geometry: { type: 'LineString', coordinates: segment.coordinates },
  })))
  return { type: 'FeatureCollection', features }
}

function journeyCollection(option) {
  return {
    type: 'FeatureCollection',
    features: (option?.steps || []).filter((step) => step.coordinates.length > 1).map((step) => ({
      type: 'Feature',
      properties: { kind: step.kind, route_id: step.route_id },
      geometry: { type: 'LineString', coordinates: step.coordinates },
    })),
  }
}

function placeCollection(network) {
  return {
    type: 'FeatureCollection',
    features: (network?.places || []).map((place) => ({
      type: 'Feature', properties: { name: place.name },
      geometry: { type: 'Point', coordinates: place.coordinates },
    })),
  }
}

export default function DhakaMap({ network, option }) {
  const node = useRef(null)
  const map = useRef(null)
  const markers = useRef([])
  const [ready, setReady] = useState(false)
  const routeData = useMemo(() => networkCollection(network), [network])
  const journeyData = useMemo(() => journeyCollection(option), [option])
  const placeData = useMemo(() => placeCollection(network), [network])

  useEffect(() => {
    if (!node.current || map.current) return undefined
    const instance = new Map({
      container: node.current,
      center: [90.392, 23.79],
      zoom: 11,
      attributionControl: true,
      style: {
        version: 8,
        sources: {
          osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap contributors' },
        },
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#dce9e7' } },
          { id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-opacity': 0.88, 'raster-saturation': -0.25 } },
        ],
      },
    })
    map.current = instance
    instance.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')
    instance.on('load', () => {
      instance.addSource('transit-network', { type: 'geojson', data: emptyCollection })
      instance.addLayer({ id: 'transit-network-line', type: 'line', source: 'transit-network', paint: { 'line-color': '#278a93', 'line-width': 1.5, 'line-opacity': 0.38 } })
      instance.addSource('network-places', { type: 'geojson', data: emptyCollection })
      instance.addLayer({ id: 'network-place-dots', type: 'circle', source: 'network-places', paint: { 'circle-radius': 3, 'circle-color': '#ffffff', 'circle-stroke-color': '#137781', 'circle-stroke-width': 1.5 } })
      instance.addLayer({ id: 'network-place-labels', type: 'symbol', source: 'network-places', minzoom: 12, layout: { 'text-field': ['get', 'name'], 'text-size': 10, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-allow-overlap': false }, paint: { 'text-color': '#153b45', 'text-halo-color': '#ffffff', 'text-halo-width': 1.3 } })
      instance.addSource('selected-journey', { type: 'geojson', data: emptyCollection })
      instance.addLayer({ id: 'selected-journey-casing', type: 'line', source: 'selected-journey', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 11, 'line-opacity': 0.96 } })
      instance.addLayer({ id: 'selected-transit-line', type: 'line', source: 'selected-journey', filter: ['!=', ['get', 'kind'], 'walk'], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#d94332', 'line-width': 6, 'line-opacity': 1 } })
      instance.addLayer({ id: 'selected-walk-line', type: 'line', source: 'selected-journey', filter: ['==', ['get', 'kind'], 'walk'], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#bb690d', 'line-width': 5, 'line-opacity': 1, 'line-dasharray': [1.5, 1.5] } })
      setReady(true)
    })
    return () => {
      markers.current.forEach((marker) => marker.remove())
      markers.current = []
      instance.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    const instance = map.current
    if (!ready || !instance) return
    instance.getSource('transit-network')?.setData(routeData)
    instance.getSource('network-places')?.setData(placeData)
    instance.getSource('selected-journey')?.setData(journeyData)
    markers.current.forEach((marker) => marker.remove())
    markers.current = []

    const points = (option?.steps || []).flatMap((step) => step.coordinates)
    const uniquePoints = points.filter((point, index) => index === 0 || point[0] !== points[index - 1][0] || point[1] !== points[index - 1][1])
    if (uniquePoints.length) {
      const endpoints = [uniquePoints[0], uniquePoints[uniquePoints.length - 1]]
      endpoints.forEach((coordinate, index) => {
        const element = document.createElement('div')
        element.className = `route-marker route-marker-${index === 0 ? 'origin' : 'destination'}`
        element.setAttribute('aria-hidden', 'true')
        element.textContent = index === 0 ? '↗' : '✦'
        markers.current.push(new Marker({ element, anchor: 'center' }).setLngLat(coordinate).addTo(instance))
      })
      const bounds = uniquePoints.reduce((box, coordinate) => box.extend(coordinate), new LngLatBounds(uniquePoints[0], uniquePoints[0]))
      instance.fitBounds(bounds, { padding: { top: 70, bottom: 100, left: 70, right: 70 }, duration: 600, maxZoom: 13 })
    } else {
      const places = network?.places || []
      if (places.length) {
        const bounds = places.reduce((box, place) => box.extend(place.coordinates), new LngLatBounds(places[0].coordinates, places[0].coordinates))
        instance.fitBounds(bounds, { padding: 45, duration: 400, maxZoom: 12 })
      }
    }
  }, [ready, routeData, journeyData, placeData, network, option])

  return <div className="map-wrap">
    <div ref={node} className="map-canvas" />
    <div className="map-fade" />
    <div className="map-label map-label-start"><span className="marker-dot marker-start" />{option?.steps?.[0]?.from_stop.name || 'Transit network'}</div>
    <div className="map-label map-label-end"><span className="marker-dot marker-end" />{option?.steps?.at(-1)?.to_stop.name || 'Select a route'}</div>
    <div className="map-simulated">APPROXIMATE IMPORTED NETWORK</div>
  </div>
}
