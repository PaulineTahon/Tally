import { useCallback, useEffect, useState } from 'react'
import { StoreProvider, useStore } from './store'
import { Editor, Results, ShareTab, type ResultsState } from './screens'
import { PublishedSheet, LinkEndingModal, LinkPreviewModal } from './modals'
import { QrPanel } from './qrpanel'
import type { Tab } from './chrome'

type Route = 'edit' | 'share' | 'results'

function readRoute(): { route: Route; publish: boolean; state: ResultsState; qr: boolean } {
  const h = window.location.hash.replace(/^#\/?/, '')
  const [path, q = ''] = h.split('?')
  const p = new URLSearchParams(q)
  const route: Route = path === 'share' ? 'share' : path === 'results' ? 'results' : 'edit'
  const st = p.get('state')
  return {
    route,
    publish: p.get('published') === '1',
    state: st === 'nosources' || st === 'empty' || st === 'firstqr' ? st : 'data',
    qr: p.get('qr') === '1',
  }
}

function Inner() {
  const [r, setR] = useState(readRoute)
  const [sheet, setSheet] = useState(r.route === 'edit' && r.publish)
  const s = useStore()
  useEffect(() => {
    const on = () => setR(readRoute())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  useEffect(() => { if (r.qr) s.setQrOpen(true) }, []) // eslint-disable-line
  const go = useCallback((route: Route, extra = '') => { window.location.hash = `/${route}${extra}`; window.scrollTo(0, 0) }, [])
  const onTab = (t: Tab) => go(t === 'submissions' || t === 'insights' ? 'results' : 'share')
  const setState = (state: ResultsState) => go('results', `?state=${state}`)

  return (
    <>
      {r.route === 'edit' && <Editor published={r.publish} onPublished={() => setSheet(true)} />}
      {r.route === 'share' && <ShareTab onTab={onTab} onEdit={() => go('edit')} />}
      {r.route === 'results' && <Results onTab={onTab} onEdit={() => go('edit')} state={r.state} onGetLink={() => go('share')} />}

      <PublishedSheet open={sheet} onClose={() => setSheet(false)} onOpenShareTab={() => { setSheet(false); go('share') }} />
      <QrPanel />
      <LinkEndingModal />
      <LinkPreviewModal />

      <nav className="proto-nav" aria-label="Prototype screens">
        <span className="proto-label">Prototype</span>
        <a href="#/edit" aria-current={r.route === 'edit'}>Publish</a>
        <a href="#/share" aria-current={r.route === 'share'}>Share tab</a>
        <a href="#/results" aria-current={r.route === 'results'}>Results</a>
        {r.route === 'results' && (
          <select aria-label="Results state" value={r.state} onChange={(e) => setState(e.target.value as ResultsState)}>
            <option value="data">With sources</option>
            <option value="firstqr">First QR response</option>
            <option value="nosources">No sources yet</option>
            <option value="empty">No responses</option>
          </select>
        )}
        <a href="./visuals/">Visuals</a>
      </nav>
    </>
  )
}

export default function App() {
  return <StoreProvider><Inner /></StoreProvider>
}
