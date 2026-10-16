import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, ArrowRight, Bot, BusFront, CircleDollarSign, Compass, FileWarning, Footprints, MapPin, Search, ShieldCheck, Timer, TrainFront } from 'lucide-react'
import DhakaMap from './components/DhakaMap'
import { journeyApi } from './services/journeyApi'
import './App.css'

const WelcomePage = lazy(() => import('./components/WelcomePage'))
const ChatScreen = lazy(() => import('./features/chat/ChatScreen'))
const transitions = { duration: 0.35, ease: 'easeOut' }

function Planner({ network, networkState, networkError, form, setForm, onSearch, searchState, searchError, avoidReported, setAvoidReported }) {
  const places = network?.places || []
  const nameCounts = places.reduce((counts, place) => {
    const key = place.name.toLocaleLowerCase()
    counts.set(key, (counts.get(key) || 0) + 1)
    return counts
  }, new Map())
  const placeLabel = (place) => nameCounts.get(place.name.toLocaleLowerCase()) > 1
    ? `${place.name} · ${place.route_names.join(' / ') || 'separate stop reference'}`
    : place.name
  return <motion.section className="planner-panel glass-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={transitions}>
    <div className="panel-eyebrow"><Search size={14} /> JOURNEY PLANNER <span>Routes from imported local network data</span></div>
    {networkState === 'loading' ? <p className="planner-status" role="status">Loading places and routes from the local API…</p> : null}
    {networkState === 'error' ? <div className="planner-error" role="alert"><strong>Could not load the transit network.</strong><span>{networkError}</span><span>Start FastAPI, import the map data, then return here and retry.</span></div> : null}
    {networkState === 'ready' && !places.length ? <div className="planner-error" role="status"><strong>The local network catalog is empty.</strong><span>Run the documented map-data validate/import commands, then reload the planner.</span></div> : null}
    {places.length ? <>
      <div className="planner-grid dynamic-planner-grid">
        <label className="planner-field"><span>From</span><div><MapPin size={17} /><select value={form.originId} onChange={(event) => setForm({ ...form, originId: event.target.value })}><option value="">Choose a stop</option>{places.map((place) => <option key={place.id} value={place.id}>{placeLabel(place)}</option>)}</select></div></label>
        <button className="swap-button" aria-label="Swap origin and destination" onClick={() => setForm({ ...form, originId: form.destinationId, destinationId: form.originId })}>↕</button>
        <label className="planner-field"><span>To</span><div><MapPin size={17} /><select value={form.destinationId} onChange={(event) => setForm({ ...form, destinationId: event.target.value })}><option value="">Choose a stop</option>{places.map((place) => <option key={place.id} value={place.id}>{placeLabel(place)}</option>)}</select></div></label>
        <label className={`avoid-toggle avoid-reports ${avoidReported ? 'active' : ''}`}><input type="checkbox" checked={avoidReported} onChange={(event) => setAvoidReported(event.target.checked)} /><span>Avoid routes linked to fresh reports</span></label>
        <button className="primary-button search-button" onClick={onSearch} disabled={networkState !== 'ready' || !form.originId || !form.destinationId || form.originId === form.destinationId || searchState === 'loading'}><Search size={18} />{searchState === 'loading' ? 'Finding routes…' : 'Find routes'}</button>
      </div>
      <div className="recent-row network-meta"><span>{places.length} named stops · {network.routes.length} routes · source {network.source_version || 'unknown'}</span><span>Catalog quality: {network.data_quality}</span></div>
    </> : null}
    {searchError ? <div className="planner-error" role="alert"><strong>Route search failed.</strong><span>{searchError}</span></div> : null}
  </motion.section>
}

function ModeBadge({ mode }) {
  const icon = mode === 'rail' ? <TrainFront size={13} /> : mode === 'walk' ? <Footprints size={13} /> : <BusFront size={13} />
  return <span className="mode-badge" title={mode}>{icon}<span>{mode === 'rail' ? 'MRT-6' : mode === 'walk' ? 'Walk' : 'Bus'}</span></span>
}

function RouteCard({ option, selected, onSelect }) {
  const modes = [...new Set(option.steps.map((step) => step.mode))]
  const estimate = option.demo_estimate
  return <motion.button className={`route-card ${selected ? 'selected' : ''}`} onClick={onSelect} whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} layout>
    <div className="route-card-top"><span>{option.ranking}</span><span className="updated">{estimate ? 'Demo estimate' : 'Approximate'}</span></div>
    <div className="route-stats"><strong>{option.distance_km.toFixed(1)}<small> km</small></strong><strong>{option.transfer_count}<small> inferred transfer{option.transfer_count === 1 ? '' : 's'}</small></strong></div>
    {estimate ? <div className="route-demo-estimate"><span><CircleDollarSign size={13} /> ৳{estimate.fare_bdt} estimated</span><span><Timer size={13} /> {estimate.duration_min_minutes}–{estimate.duration_max_minutes} min</span></div> : null}
    <div className="route-meta"><span className="mode-badges">{modes.map((mode) => <ModeBadge key={mode} mode={mode} />)}</span><span className="status-pill">{option.alerts.length ? `${option.alerts.length} linked report${option.alerts.length === 1 ? '' : 's'}` : 'No linked reports'}</span></div>
  </motion.button>
}

function JourneyFeedback({ option, response, avoidReported, onSubmit }) {
  const [verdict, setVerdict] = useState('')
  const [correction, setCorrection] = useState('')
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')
  if (!option) return null
  const submit = async (selectedVerdict) => {
    setState('loading')
    setMessage('')
    try {
      await onSubmit({
        pathFingerprint: option.path_fingerprint,
        catalogVersion: response.catalog_version,
        originId: response.origin.id,
        destinationId: response.destination.id,
        avoidReportedRoutes: avoidReported,
        verdict: selectedVerdict,
        correction: selectedVerdict === 'does_not_work' ? correction.trim() : undefined,
      })
      setVerdict(selectedVerdict)
      setState('success')
      setMessage('Saved locally against this route and catalog version.')
    } catch (error) {
      setState('error')
      setMessage(error.message || 'Feedback could not be saved.')
    }
  }
  return <section className="journey-feedback" aria-labelledby="journey-feedback-title">
    <h3 id="journey-feedback-title">Does this route match the real trip?</h3>
    <p>Local prototype feedback only. It is not commuter-verified evidence.</p>
    {state === 'success' ? <div className="feedback-result" role="status">{message} <button type="button" onClick={() => { setState('idle'); setVerdict('') }}>Change feedback</button></div> : <>
      <div className="feedback-actions">
        <button type="button" disabled={state === 'loading'} onClick={() => void submit('works')}>Works for this trip</button>
        <button type="button" disabled={state === 'loading'} onClick={() => { setVerdict('does_not_work'); setState('editing') }}>Needs correction</button>
      </div>
      {verdict === 'does_not_work' || state === 'editing' ? <div className="feedback-correction"><label htmlFor="route-correction">What should be corrected? (optional)</label><textarea id="route-correction" maxLength={500} value={correction} onChange={(event) => setCorrection(event.target.value)} placeholder="For example, this route does not serve the selected stop." /><button type="button" disabled={state === 'loading'} onClick={() => void submit('does_not_work')}>{state === 'loading' ? 'Saving…' : 'Save correction feedback'}</button></div> : null}
      {state === 'error' ? <p className="feedback-error" role="alert">{message}</p> : null}
    </>}
  </section>
}

function JourneyDetails({ option, response, network, avoidReported, onFeedback }) {
  if (!option) return <section className="detail-panel glass-panel"><h2>{response ? 'No connected path found' : 'Search the imported network'}</h2><p className="detail-lead">{response ? 'The current imported graph has no path between these selected places under the chosen report filter.' : 'Choose two stops and find routes. Results will be calculated from the local SQLite catalog.'}</p></section>
  const estimate = option.demo_estimate
  const estimateSources = (response.demo_estimate_sources || []).filter((source) => estimate?.source_ids.includes(source.id))
  return <motion.section className="detail-panel glass-panel" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={transitions}>
    <div className="detail-heading"><div><span className="panel-eyebrow">NETWORK-DERIVED OPTION</span><h2>{option.ranking}</h2></div><div className="detail-time">{option.distance_km.toFixed(2)} approximate km</div></div>
    <p className="detail-lead">{response.origin.name} to {response.destination.name}. This path was found from the imported route graph; geometry and transfer links are approximate.</p>
    <div className="transport-strip">{[...new Set(option.steps.map((step) => step.mode))].map((mode) => <ModeBadge key={mode} mode={mode} />)}</div>
    <ol className="journey-steps">{option.steps.map((step, index) => <li className="step-row" key={`${step.kind}-${step.route_id ?? 'walk'}-${step.from_stop.id}-${step.to_stop.id}`}><div className="step-marker">{step.kind === 'walk' ? <Footprints size={14} /> : <span>{index + 1}</span>}</div><div><strong>{step.kind === 'walk' ? 'Walk transfer' : step.route_name}</strong><span>{step.from_stop.name} → {step.to_stop.name} · {step.distance_km.toFixed(2)} km</span>{step.demo_estimate ? <span className={`leg-demo-estimate ${step.demo_estimate.fare_status === 'synthetic_conditional_diesel_minimum' ? 'conditional' : ''}`}>{step.mode === 'walk' ? 'Walk' : `৳${step.demo_estimate.fare_bdt} demo fare`} · ~{step.demo_estimate.duration_min_minutes}–{step.demo_estimate.duration_max_minutes} min{step.demo_estimate.fare_status === 'synthetic_conditional_diesel_minimum' ? ' · assumes diesel bus' : ''}</span> : null}</div><span className="step-quality">{step.data_quality}</span></li>)}</ol>
    <div className="detail-metrics dynamic-metrics"><div><span>{estimate ? 'Demo fare' : 'Fare'}</span><strong>{estimate ? `৳${estimate.fare_bdt}` : 'Unavailable'}</strong><em>{estimate ? estimate.fare_status === 'conditional_bus_assumption' ? 'Conditional: bus edges assumed diesel city buses' : 'Research station-fare estimate' : 'No estimate for this corridor'}</em></div><div><span>Approx. moving time</span><strong>{estimate ? `${estimate.duration_min_minutes}–${estimate.duration_max_minutes} min` : 'Unavailable'}</strong><em>{estimate ? estimate.time_scope_note : 'No estimate for this corridor'}</em></div><div><span>Transfer count</span><strong>{option.transfer_count}</strong><em>Walk links inferred within 250 m</em></div></div>
    {estimate ? <details className="estimate-provenance"><summary>Demo estimate sources and limitations</summary><p>These values are attached only because every leg matches the reviewed Mirpur 10 → Shahbagh research example. They demonstrate the interface; they are not live or authoritative route predictions. Walking time is an explicit assumption, metro segment time is derived from DMTCL's line runtime, and bus time is synthetic. {estimate.time_scope_note}</p><ul>{estimateSources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.publisher}</a> — {source.claim}</li>)}</ul><p>See the repository's <code>docs/fare_time_research.md</code> and <code>Map Data/research/fare_time_estimates.json</code> for the full snapshot.</p></details> : null}
    {option.alerts.length ? <section className="journey-alerts"><h3><AlertTriangle size={16} /> Reports linked to these routes</h3>{option.alerts.map((alert) => <article key={alert.id} className="journey-alert"><strong>{alert.title}</strong><span>{alert.location} · {alert.status} · {alert.age_minutes == null ? alert.freshness : `${alert.age_minutes} min old (${alert.freshness})`} · {alert.source_type}{alert.is_synthetic ? ' · synthetic example' : ''}</span><small>Route-level association; the report does not verify an exact blockage on this path.</small></article>)}</section> : <p className="journey-alert-empty">No saved reports are linked to the routes in this option. That does not confirm the trip is clear.</p>}
    {response.excluded_route_ids.length ? <p className="route-filter-note">Excluded {response.excluded_route_ids.map((id) => network?.routes.find((route) => route.id === id)?.name || `route ${id}`).join(', ')} because of fresh, non-synthetic reports. This broad route-level filter may remove a route even when the report is not on this exact segment.</p> : null}
    <details className="journey-assumptions"><summary>Data and routing assumptions</summary><ul>{response.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></details>
    <div className="detail-source"><ShieldCheck size={16} /><span><strong>Local API result</strong> · {response.source_version || 'No imported version'} · {response.data_quality} source data</span></div>
    <JourneyFeedback key={option.path_fingerprint} option={option} response={response} avoidReported={avoidReported} onSubmit={onFeedback} />
  </motion.section>
}

export default function App() {
  const [page, setPage] = useState('welcome')
  const [network, setNetwork] = useState(null)
  const [networkState, setNetworkState] = useState('idle')
  const [networkError, setNetworkError] = useState('')
  const [form, setForm] = useState({ originId: '', destinationId: '' })
  const [avoidReported, setAvoidReported] = useState(false)
  const [searchResult, setSearchResult] = useState(null)
  const [searchState, setSearchState] = useState('idle')
  const [searchError, setSearchError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const networkRequest = useRef(null)
  const searchRequest = useRef(null)
  const selectedOption = useMemo(() => searchResult?.options.find((option) => option.id === selectedId) || searchResult?.options[0] || null, [searchResult, selectedId])

  const goWelcome = () => { setPage('welcome'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const loadNetwork = useCallback(async () => {
    networkRequest.current?.abort()
    const controller = new AbortController()
    networkRequest.current = controller
    setNetworkState('loading')
    setNetworkError('')
    try {
      const result = await journeyApi.getNetwork({ signal: controller.signal })
      setNetwork(result)
      setNetworkState('ready')
      setForm((current) => {
        const ids = new Set(result.places.map((place) => place.id))
        const findPlace = (label) => result.places.find((place) => place.name.toLowerCase() === label.toLowerCase())?.id
        const originId = ids.has(current.originId) ? current.originId : findPlace('Mirpur 10') || result.places[0]?.id || ''
        let destinationId = ids.has(current.destinationId) ? current.destinationId : findPlace('Shahbagh') || result.places.find((place) => place.id !== originId)?.id || ''
        if (destinationId === originId) destinationId = result.places.find((place) => place.id !== originId)?.id || ''
        return { originId, destinationId }
      })
    } catch (error) {
      if (error.name === 'AbortError') return
      setNetworkState('error')
      setNetworkError(error.message || 'Could not reach the local API.')
    }
  }, [])

  const goPlan = () => {
    setPage('planner')
    if (networkState === 'idle' || networkState === 'error') void loadNetwork()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const showJourneyOnMap = async (journey) => {
    const originId = journey?.origin?.id
    const destinationId = journey?.destination?.id
    if (!originId || !destinationId) return
    setForm({ originId, destinationId })
    setAvoidReported(false)
    setPage('planner')
    if (networkState === 'idle' || networkState === 'error') void loadNetwork()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    searchRequest.current?.abort()
    const controller = new AbortController()
    searchRequest.current = controller
    setSearchState('loading')
    setSearchError('')
    try {
      const result = await journeyApi.search({ originId, destinationId, avoidReportedRoutes: false, signal: controller.signal })
      if (controller.signal.aborted) return
      setSearchResult(result)
      setSelectedId(result.options[0]?.id || null)
      setSearchState('ready')
    } catch (error) {
      if (error.name === 'AbortError') return
      setSearchState('error')
      setSearchError(error.message || 'Could not load the route on the planner map.')
    }
  }

  useEffect(() => () => {
    networkRequest.current?.abort()
    searchRequest.current?.abort()
  }, [])

  const search = async () => {
    if (!form.originId || !form.destinationId || form.originId === form.destinationId) return
    searchRequest.current?.abort()
    const controller = new AbortController()
    searchRequest.current = controller
    setSearchState('loading')
    setSearchError('')
    setSearchResult(null)
    setSelectedId(null)
    try {
      const result = await journeyApi.search({
        originId: form.originId,
        destinationId: form.destinationId,
        avoidReportedRoutes: avoidReported,
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      setSearchResult(result)
      setSelectedId(result.options[0]?.id || null)
      setSearchState('ready')
    } catch (error) {
      if (error.name === 'AbortError') return
      setSearchState('error')
      setSearchError(error.message || 'Could not search the local network.')
    }
  }

  const resetPlanner = () => {
    setSearchResult(null)
    setSearchError('')
    setSearchState('idle')
    setSelectedId(null)
  }

  const submitJourneyFeedback = (feedback) => journeyApi.submitFeedback(feedback)

  return <div className="app-shell">
    <header className="topbar"><div className="topbar-inner">
      <button className="product-logo logo-button" onClick={goWelcome}><span className="brand-mark"><Compass size={18} /></span><span>Poth Mitro</span></button>
      <nav aria-label="Main navigation">
        <button className={page === 'welcome' ? 'nav-active' : ''} onClick={goWelcome}><Compass size={15} /> Welcome</button>
        <button className={page === 'planner' ? 'nav-active' : ''} onClick={goPlan}><MapPin size={15} /> Plan a journey</button>
        <button className={page === 'chat' ? 'nav-active' : ''} onClick={() => setPage('chat')}><Bot size={15} /> Commute assistant</button>
      </nav>
      <div className="topbar-actions"><span className="simulated-chip"><span className="status-dot amber" /> Approximate local transit data</span></div>
    </div></header>
    <main className={`app-main ${page === 'welcome' ? 'welcome-main' : ''}`}>
      <AnimatePresence mode="wait">
        {page === 'welcome' ? <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Suspense fallback={<p className="map-loading" role="status">Loading Poth Mitro…</p>}><WelcomePage onPlan={goPlan} onChat={() => setPage('chat')} /></Suspense></motion.div> : null}
        {page === 'chat' ? <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Suspense fallback={<p className="map-loading" role="status">Loading commute assistant…</p>}><ChatScreen onShowJourney={showJourneyOnMap} /></Suspense></motion.div> : null}
        {page === 'planner' ? <motion.div key="planner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="demo-disclosure" role="note"><FileWarning size={17} /><span><strong>Network-derived planner with a research demo overlay.</strong> Fare/time estimates appear only for exact researched Mirpur 10 → Shahbagh paths. Bus fare assumes an unverified diesel service; times are approximate moving time and exclude waiting. Other searches remain unknown.</span><button className="icon-button" onClick={loadNetwork} aria-label="Refresh network catalog"><Search size={16} /></button></div>
          <div className="hero-copy"><div><span className="panel-eyebrow">DHAKA, BANGLADESH · LOCAL TRANSIT CATALOG</span><h1>Plan with the <span>available network.</span></h1><p>Select stops from the imported catalog. The API calculates connected paths and attaches saved route reports.</p></div><div className="hero-stat"><CircleDollarSign size={16} /><span><strong>Sample overlay</strong> fare and time</span></div></div>
          <Planner network={network} networkState={networkState} networkError={networkError} form={form} setForm={(next) => { setForm(next); resetPlanner() }} onSearch={search} searchState={searchState} searchError={searchError} avoidReported={avoidReported} setAvoidReported={(next) => { setAvoidReported(next); resetPlanner() }} />
          {searchResult ? <div className="understanding-card" role="status"><div className="understanding-title">{searchResult.options.length ? `${searchResult.options.length} path${searchResult.options.length === 1 ? '' : 's'} found in the local network` : 'No path found in the imported local network'}</div><div className="understanding-items"><span><MapPin size={13} /> {searchResult.origin.name} → {searchResult.destination.name}</span><span>Source {searchResult.source_version || 'unknown'}</span><span>{searchResult.options.some((option) => option.demo_estimate) ? 'Research demo overlay · illustrative only' : 'Approximate graph · fare/time unavailable'}</span></div></div> : null}
          <div className="workspace-grid dynamic-workspace-grid">
            <section className="map-column"><div className="map-header"><div><span className="panel-eyebrow">IMPORTED TRANSIT NETWORK</span><h2>{selectedOption ? <>{searchResult.origin.name} <ArrowRight size={18} /> {searchResult.destination.name}</> : 'Dhaka route geometry'}</h2></div><div className="map-tools"><span className="map-legend"><i className="legend-dot selected-route" /> Selected route</span></div></div><DhakaMap network={network} option={selectedOption} /></section>
            <section className="route-column"><div className="route-column-head"><div><span className="panel-eyebrow">LOCAL API RESULTS</span><h2>{searchResult?.options.length ? 'Route options' : 'Journey details'}</h2></div><span className="result-count">{searchResult?.options.length || 0} paths</span></div>{searchResult?.options.length ? <div className="route-list">{searchResult.options.map((option) => <RouteCard key={option.id} option={option} selected={option.id === selectedOption?.id} onSelect={() => setSelectedId(option.id)} />)}</div> : null}<JourneyDetails option={selectedOption} response={searchResult} network={network} avoidReported={avoidReported} onFeedback={submitJourneyFeedback} /></section>
          </div>
          <div className="footer-note"><span><ShieldCheck size={15} /> Route geometry comes from the imported local catalog.</span><span><FileWarning size={15} /> Sample fares/times are labeled estimates; unresearched routes remain unknown.</span></div>
        </motion.div> : null}
      </AnimatePresence>
    </main>
  </div>
}
