import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BusFront,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Info,
  MapPin,
  RefreshCw,
  TrainFront,
  WifiOff,
  Footprints,
} from 'lucide-react'

function formatTime(value) {
  if (!value) return 'Time not provided'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Time not provided'
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  }).format(parsed)
}

function tripLabel(trip) {
  return trip.label || trip.name || `${trip.origin || 'Unknown start'} to ${trip.destination || 'Unknown destination'}`
}

function getResultState(context) {
  const state = context?.relevance?.state
  if (state === 'affects_trip') return 'affects'
  if (state === 'not_affected') return 'no-match'
  return 'unknown'
}

function ModeIcon({ mode }) {
  const value = (mode || '').toLowerCase()
  if (value.includes('mrt') || value.includes('metro') || value.includes('train')) return <TrainFront aria-hidden="true" />
  if (value.includes('walk')) return <Footprints aria-hidden="true" />
  return <BusFront aria-hidden="true" />
}

function InlineStatus({ kind, children, icon: Icon }) {
  return (
    <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {Icon ? <Icon aria-hidden="true" size={19} /> : null}
      <div>{children}</div>
    </div>
  )
}

export default function TripBriefScreen(props) {
  return <TripBriefContent key={`${props.workspaceId || 'no-workspace'}:${props.demo ? 'preview' : 'app'}`} {...props} />
}

function TripBriefContent({ api, workspaceId, workspaceName, demo = false }) {
  const [trips, setTrips] = useState([])
  const [selectedTripId, setSelectedTripId] = useState('')
  const [context, setContext] = useState(null)
  const [lastFetchedAt, setLastFetchedAt] = useState(null)
  const [loadingTrips, setLoadingTrips] = useState(true)
  const [loadingContext, setLoadingContext] = useState(false)
  const [tripError, setTripError] = useState(null)
  const [contextError, setContextError] = useState(null)
  const [stale, setStale] = useState(false)
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [notice, setNotice] = useState('')
  const requestRef = useRef(null)
  const workspaceKey = workspaceId || ''

  const loadTrips = useCallback(async (signal) => {
    if (!workspaceKey) return
    try {
      const result = await api.listTrips(workspaceKey, { signal })
      setTrips(result)
      setSelectedTripId((current) => result.some((trip) => trip.id === current) ? current : '')
    } catch (error) {
      if (error.name !== 'AbortError') setTripError(error)
    } finally {
      if (!signal?.aborted) setLoadingTrips(false)
    }
  }, [api, workspaceKey])

  const loadContext = useCallback(async (tripId) => {
    if (!workspaceKey || !tripId) return
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setLoadingContext(true)
    setContextError(null)
    setNotice('')
    try {
      const result = await api.getContext(workspaceKey, tripId, { signal: controller.signal })
      if (controller.signal.aborted) return
      setContext(result)
      setLastFetchedAt(new Date().toISOString())
      setStale(false)
    } catch (error) {
      if (error.name === 'AbortError') return
      setContextError(error)
      if (context) setStale(true)
      if (!navigator.onLine) setIsOnline(false)
    } finally {
      if (!controller.signal.aborted) setLoadingContext(false)
    }
  }, [api, context, workspaceKey])

  useEffect(() => {
    const controller = new AbortController()
    requestRef.current?.abort()
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) loadTrips(controller.signal)
    })
    return () => {
      controller.abort()
      requestRef.current?.abort()
    }
  }, [workspaceKey, loadTrips])

  useEffect(() => {
    const onOnline = () => { setIsOnline(true); setNotice('Connection restored. Refresh to check for updates.') }
    const onOffline = () => { setIsOnline(false); setStale(Boolean(context)) }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [context])

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId)
  const resultState = getResultState(context)
  const reports = context?.reports || []
  const resultCopy = {
    affects: {
      title: 'May affect this trip',
      body: context?.relevance?.reason || context?.relevance_reason || 'A saved report overlaps with a known part of this trip. Review its time and location below.',
      icon: AlertTriangle,
    },
    'no-match': {
      title: 'No match found in available reports',
      body: context?.relevance?.reason || context?.relevance_reason || 'No available report matched the known trip details. This does not confirm that the trip is clear.',
      icon: Check,
    },
    unknown: {
      title: 'Not enough information',
      body: context?.relevance?.reason || context?.relevance_reason || 'The available trip or report details are incomplete or conflicting, so the app cannot make a supported comparison.',
      icon: CircleHelp,
    },
  }[resultState]

  function handleTripChange(event) {
    const nextId = event.target.value
    setSelectedTripId(nextId)
    setContext(null)
    setLastFetchedAt(null)
    setContextError(null)
    setStale(false)
    setNotice('')
  }

  async function handleCheck() {
    if (!selectedTripId) return
    await loadContext(selectedTripId)
  }

  function handleRefresh() {
    if (selectedTripId) loadContext(selectedTripId)
  }

  function handleRetryTrips() {
    setLoadingTrips(true)
    setTripError(null)
    loadTrips()
  }

  const tripSegments = context?.trip?.segments || []
  const reportsEmpty = context && reports.length === 0
  const ResultIcon = resultCopy.icon

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">Skip to trip information</a>
      <header className="app-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="DhakaPath home">
            <span className="brand-mark"><MapPin size={20} aria-hidden="true" /></span>
            <span>DhakaPath</span>
          </a>
          <div className="account-context">
            <div className="workspace-caption">{demo ? 'SYNTHETIC PREVIEW' : 'LOCAL ACCESS'}</div>
            <div className="workspace-name">{demo ? workspaceName || 'Synthetic local preview' : 'This device only'}</div>
          </div>
        </div>
      </header>

      <main id="main-content" className="main-content">
        <div className="page-intro">
          <div>
            <p className="eyebrow">TRIP INFORMATION</p>
            <h1>Trip brief</h1>
            <p className="intro-copy">Use this prototype from this computer. Trip and report details come from its local database.</p>
          </div>
          {demo ? <span className="demo-chip"><Info size={15} aria-hidden="true" /> Synthetic preview</span> : null}
        </div>

        {!workspaceKey ? (
          <section className="access-panel" aria-labelledby="access-title">
            <div className="access-icon"><CircleHelp size={22} aria-hidden="true" /></div>
            <div>
              <h2 id="access-title">Local-only prototype</h2>
              <p>This app is intended for one operator on this computer. It has no sign-in or shared workspace.</p>
            </div>
          </section>
        ) : (
          <>
            {notice && isOnline ? <p className="sr-only" role="status">{notice}</p> : null}

            <section className="trip-picker-panel" aria-labelledby="trip-picker-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">YOUR JOURNEY</p>
                  <h2 id="trip-picker-title">Choose a trip</h2>
                </div>
                {context ? (
                  <button className="button button-quiet" onClick={handleRefresh} disabled={loadingContext || !isOnline}>
                    <RefreshCw size={17} aria-hidden="true" className={loadingContext ? 'spin' : ''} />
                    <span>Refresh</span>
                  </button>
                ) : null}
              </div>

              <label className="field-label" htmlFor="trip-select">Prepared trip</label>
              <div className="select-wrap">
                <select id="trip-select" value={selectedTripId} onChange={handleTripChange} disabled={loadingTrips || trips.length === 0}>
                  <option value="">{loadingTrips ? 'Loading trips…' : 'Select a trip'}</option>
                  {trips.map((trip) => <option key={trip.id} value={trip.id}>{tripLabel(trip)}</option>)}
                </select>
                <ChevronDown size={18} aria-hidden="true" />
              </div>
              {tripError ? (
                <div className="inline-error" role="alert">
                  <span>Trip information could not be loaded.</span>
                  {isOnline ? <button className="text-button" onClick={handleRetryTrips}>Try again</button> : null}
                </div>
              ) : null}
              {trips.length === 0 && !loadingTrips && !tripError ? (
                <p className="helper-copy">No prepared trips are available yet.</p>
              ) : null}
              <div className="check-row">
                <p className="helper-copy">The comparison uses saved trip and report details.</p>
                <button className="button button-primary" onClick={handleCheck} disabled={!selectedTripId || loadingContext || !isOnline}>
                  {loadingContext ? <RefreshCw size={17} aria-hidden="true" className="spin" /> : <ArrowRight size={17} aria-hidden="true" />}
                  <span>{loadingContext ? 'Checking…' : 'Check this trip'}</span>
                </button>
              </div>
            </section>

            {contextError && !context ? (
              <InlineStatus kind="error" icon={AlertTriangle}>
                <strong>Trip information is unavailable right now.</strong>
                <span> No new result is available. Try again when the connection or access issue is resolved.</span>
              </InlineStatus>
            ) : null}

            {context ? (
              <div className="brief-grid" aria-live="polite" aria-busy={loadingContext}>
                <section className={`result-card result-${resultState}`} aria-labelledby="result-title">
                  {stale || contextError ? (
                    <div className="stale-strip" role={contextError ? 'alert' : 'status'}>
                      {isOnline ? <AlertTriangle size={16} aria-hidden="true" /> : <WifiOff size={16} aria-hidden="true" />}
                      <span><strong>{isOnline ? 'Refresh failed' : 'Offline'} — showing the last successful result</strong> · Loaded {formatTime(lastFetchedAt || context.as_of)}. This copy may be out of date.</span>
                    </div>
                  ) : null}
                  <div className="result-content">
                    <div className="result-symbol"><ResultIcon size={23} aria-hidden="true" /></div>
                    <div>
                      <p className="eyebrow">TRIP CHECK</p>
                      <h2 id="result-title">{resultCopy.title}</h2>
                      <p className="result-explanation">{resultCopy.body}</p>
                    </div>
                  </div>
                  <div className="result-meta">
                    <span><Clock3 size={15} aria-hidden="true" /> Server checked {formatTime(context.as_of)} · Loaded {formatTime(lastFetchedAt || context.as_of)}</span>
                    {demo ? <span className="data-origin">Synthetic example</span> : null}
                  </div>
                </section>

                <section className="journey-card" aria-labelledby="journey-title">
                  <div className="section-heading compact-heading">
                    <div>
                      <p className="eyebrow">ORDERED LEGS</p>
                      <h2 id="journey-title">{context.trip?.name || tripLabel(selectedTrip || {})}</h2>
                    </div>
                    {selectedTrip?.is_synthetic || context.trip?.is_synthetic ? <span className="synthetic-label">Synthetic data</span> : null}
                  </div>
                  {tripSegments.length ? (
                    <ol className="segment-list">
                      {tripSegments.map((segment, index) => (
                        <li className="segment-item" key={segment.id || `${segment.mode}-${index}`}>
                          <span className="mode-icon"><ModeIcon mode={segment.mode} /></span>
                          <div className="segment-copy">
                            <span className="segment-mode">{segment.mode || 'Mode not provided'}</span>
                            <span className="segment-route">{segment.origin || 'Start not provided'} <ArrowRight size={14} aria-hidden="true" /> {segment.destination || 'End not provided'}</span>
                            {segment.route_reference_available === false ? <span className="helper-copy">Route reference unavailable; this leg is not checked against route-linked reports.</span> : segment.route_data_quality === 'approximate' ? <span className="helper-copy">Approximate stored route reference</span> : null}
                          </div>
                          {index < tripSegments.length - 1 ? <ArrowDown className="segment-down" size={16} aria-hidden="true" /> : null}
                        </li>
                      ))}
                    </ol>
                  ) : <p className="empty-copy">Trip segments were not included in the available response.</p>}
                </section>

                <section className="evidence-card" aria-labelledby="evidence-title">
                  <div className="section-heading compact-heading">
                    <div>
                      <p className="eyebrow">REPORT EVIDENCE</p>
                      <h2 id="evidence-title">What this check used</h2>
                    </div>
                  </div>
                  {reportsEmpty ? (
                    <div className="empty-report">
                      <Info size={19} aria-hidden="true" />
                      <p>No matching reports were returned as of {formatTime(context.as_of)}. This does not confirm that the trip is clear.</p>
                    </div>
                  ) : (
                    <ul className="report-list">
                      {reports.map((report) => (
                        <li key={report.id} className="report-item">
                          <div className="report-topline">
                            <h3>{report.title || report.location || 'Disruption report'}</h3>
                            {report.is_synthetic || demo ? <span className="synthetic-label">Synthetic example</span> : null}
                          </div>
                          <dl className="evidence-fields">
                            <div><dt>Location</dt><dd>{report.location || 'Not provided'}</dd></div>
                            <div><dt>Mode / direction</dt><dd>{[report.mode, report.direction].filter(Boolean).join(' · ') || 'Not provided'}</dd></div>
                            <div><dt>Observed</dt><dd>{formatTime(report.observed_at)} · {report.age_minutes == null ? report.freshness : `${report.age_minutes} min · ${report.freshness}`}</dd></div>
                            <div><dt>Source</dt><dd>{report.source_type || 'Not provided'}</dd></div>
                            <div><dt>Report state</dt><dd>{report.status || 'Unknown'}</dd></div>
                          </dl>
                          {report.description ? <p className="report-description">{report.description}</p> : null}
                          {report.confirmation_note ? <p className="report-note"><Info size={15} aria-hidden="true" />{report.confirmation_note}</p> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="provenance-note"><Info size={15} aria-hidden="true" /> The result compares the available saved details. It does not independently verify a report or guarantee route safety.</p>
                </section>
              </div>
            ) : null}

            <p className="page-footnote">Reports can become outdated. Check the observation time and source before relying on a claim.</p>
          </>
        )}
      </main>
    </div>
  )
}
