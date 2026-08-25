import { useEffect, useState } from 'react'
import { Home } from './screens/Home'
import { TripDetail } from './screens/TripDetail'
import { ToastHost } from './components/Toast'
import { initStore, useStore } from './state/store'
import { applyDocumentLang, useT } from './i18n'

type Route = { name: 'home' } | { name: 'trip'; id: string }

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#/, '')
  const m = hash.match(/^\/trip\/([\w-]+)$/)
  if (m) return { name: 'trip', id: m[1] }
  return { name: 'home' }
}

export function navigate(path: string): void {
  window.location.hash = path
}

export function goHome(): void {
  if (window.history.length > 1) window.history.back()
  else navigate('/')
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash)
  const { loaded } = useStore()
  const t = useT()

  useEffect(() => {
    void initStore()
    const onHash = () => {
      setRoute(parseHash())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    applyDocumentLang()
  })

  return (
    <div className="app">
      {!loaded ? (
        <div className="loading">
          <div className="spinner" />
          <p className="muted tiny">{t('app.loading')}</p>
        </div>
      ) : route.name === 'trip' ? (
        <TripDetail tripId={route.id} />
      ) : (
        <Home />
      )}
      <ToastHost />
    </div>
  )
}
