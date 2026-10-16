import { useEffect, useState } from 'react'
import './App.css'
import TripBriefScreen from './features/trips/TripBriefScreen'
import { tripBriefApi } from './services/tripBriefApi'

export default function App() {
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!import.meta.env.DEV || params.get('design-preview') !== '1') return

    let active = true
    import('./test/fixtures/tripBriefFixtureApi').then(({ tripBriefFixtureApi }) => {
      if (active) setPreview(tripBriefFixtureApi)
    })
    return () => { active = false }
  }, [])

  if (preview) {
    return (
      <TripBriefScreen
        api={preview}
        workspaceId="local-preview"
        workspaceName="Synthetic local preview"
        demo
      />
    )
  }

  return (
    <TripBriefScreen
      api={tripBriefApi}
      workspaceId="local-single-operator"
      workspaceName={null}
    />
  )
}
