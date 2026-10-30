import { useCallback, useEffect, useState } from 'react'
import { StoreProvider, useIsMobile, useStore } from './store'
import { Editor, ShareTab } from './screens'
import { Insights, Submissions, type InsightsState } from './insights'
import { PublishedSheet } from './modals'
import { QrPanel } from './qrpanel'
import type { Tab } from './chrome'

type Route = 'edit' | 'share' | 'insights' | 'submissions'

function readRoute(): { route: Route; publish: boolean; state: InsightsState; qr: boolean } {
  const h = window.location.hash.replace(/^#\/?/, '')
  const [path, q = ''] = h.split('?')
  const p = new URLSearchParams(q)
  const route: Route = path === 'share' ? 'share' : path === 'insights' || path === 'results' ? 'insights' : path === 'submissions' ? 'submissions' : 'edit'
  const st = p.get('state')
  return {
    route,
    publish: p.get('published') === '1',
    state: st === 'noqr' || st === 'empty' ? st : 'data',
    qr: p.get('qr') === '1',
  }
}

function Inner() {
  const [r, setR] = useState(readRoute)
  const [sheet, setSheet] = useState(r.route === 'edit' && r.publish)
  const s = useStore()
  const mobile = useIsMobile()
  const [navOpen, setNavOpen] = useState(false)
  useEffect(() => { setNavOpen(false) }, [r.route, r.state])
  useEffect(() => {
    const on = () => setR(readRoute())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  useEffect(() => { s.setQrOpen(false) }, [r.route, r.state]) // eslint-disable-line
  useEffect(() => { if (r.qr) s.setQrOpen(true) }, []) // eslint-disable-line
  const go = useCallback((route: Route, extra = '') => { window.location.hash = `/${route}${extra}`; window.scrollTo(0, 0) }, [])
  const onTab = (t: Tab) => go(t === 'insights' ? 'insights' : t === 'submissions' ? 'submissions' : 'share')
  const openQr = () => { s.setQrRef('qr'); s.setQrOpen(true) }

  return (
    <>
      {r.route === 'edit' && <Editor published={r.publish} onPublished={() => setSheet(true)} />}
      {r.route === 'share' && <ShareTab onTab={onTab} onEdit={() => go('edit')} />}
      {r.route === 'insights' && <Insights key={r.state} onTab={onTab} onEdit={() => go('edit')} state={r.state} onOpenQr={openQr} onShare={() => go('share')} />}
      {r.route === 'submissions' && <Submissions onTab={onTab} onEdit={() => go('edit')} onShare={() => go('share')} />}

      {/* The QR panel replaces the sheet instead of stacking on it; closing it brings the sheet back. */}
      <PublishedSheet open={sheet && !s.qrOpen} onClose={() => setSheet(false)} />
      <QrPanel />

      {/* On phones the prototype bar folds into one small button, so it doesn't cover the screen. */}
      {mobile && !navOpen && <button type="button" className="proto-pill" onClick={() => setNavOpen(true)} aria-expanded={false}>Screens</button>}
      {(!mobile || navOpen) && <nav className="proto-nav" aria-label="Prototype screens">
        <span className="proto-label">Prototype</span>
        <a href="#/edit" aria-current={r.route === 'edit'}>Publish</a>
        <a href="#/share" aria-current={r.route === 'share'}>Share tab</a>
        <a href="#/insights" aria-current={r.route === 'insights'}>Insights</a>
        {r.route === 'insights' && (
          <select aria-label="Insights state" value={r.state} onChange={(e) => go('insights', `?state=${e.target.value}`)}>
            <option value="data">With QR responses</option>
            <option value="noqr">No QR responses yet</option>
            <option value="empty">No submissions</option>
          </select>
        )}
        <a href="./visuals/">Visuals</a>
        {mobile && <button type="button" className="proto-close" aria-label="Hide prototype bar" onClick={() => setNavOpen(false)}>✕</button>}
      </nav>}
    </>
  )
}

export default function App() {
  return <StoreProvider><Inner /></StoreProvider>
}
