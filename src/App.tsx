import { useCallback, useEffect, useState } from 'react'
import { StoreProvider, useIsMobile, useStore } from './store'
import { Editor, ShareTab, type PublishState } from './screens'
import { publishCopy } from './copy'
import { Insights, Submissions, type InsightsState } from './insights'
import { PublishedSheet } from './modals'
import { QrPanel } from './qrpanel'
import type { Tab } from './chrome'
import { GuideCard, tick, useGuide } from './guide'
import { guideCopy, type GuidePage } from './guideCopy'

type Route = 'edit' | 'share' | 'insights' | 'submissions'

function readRoute(): { route: Route; publish: boolean; state: InsightsState; qr: boolean; pub: PublishState } {
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
    pub: p.get('pub') === 'empty' || p.get('pub') === 'data' ? (p.get('pub') as PublishState) : 'first',
  }
}

function Inner() {
  const [r, setR] = useState(readRoute)
  const [sheet, setSheet] = useState(r.route === 'edit' && r.publish)
  const s = useStore()
  const mobile = useIsMobile()
  const [navOpen, setNavOpen] = useState(false)
  useEffect(() => { setNavOpen(false) }, [r.route, r.state])
  useEffect(() => { if (r.route !== 'edit') setSheet(false) }, [r.route])
  useEffect(() => {
    const on = () => setR(readRoute())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  useEffect(() => { s.setQrOpen(false) }, [r.route, r.state]) // eslint-disable-line
  useEffect(() => { if (r.qr) s.setQrOpen(true) }, []) // eslint-disable-line
  const go = useCallback((route: Route, extra = '') => { window.location.hash = `/${route}${extra}`; window.scrollTo(0, 0) }, [])
  const onTab = (t: Tab) => { if (t === 'share' && r.route === 'insights' && r.state === 'empty') tick('go-share'); go(t === 'insights' ? 'insights' : t === 'submissions' ? 'submissions' : 'share') }
  const openQr = () => { tick('make-code'); s.setQrRef('qr'); s.setQrOpen(true) }
  const toShare = () => { if (r.state === 'empty') tick('go-share'); go('share') }
  const page: GuidePage | null = r.route === 'edit' ? 'publish' : r.route === 'share' ? 'share' : r.route === 'insights' ? `insights-${r.state}` : null
  const g = useGuide(page ?? 'publish')
  // Phones: the guide opens from the prototype bar instead of sitting on the screen.
  const [guideOpen, setGuideOpen] = useState(false)
  useEffect(() => { setGuideOpen(false) }, [r.route, r.state])

  return (
    <>
      {r.route === 'edit' && <Editor key={r.pub} pub={r.pub} published={r.publish} onPublished={() => setSheet(true)} />}
      {r.route === 'share' && <ShareTab onTab={onTab} onEdit={() => go('edit')} />}
      {r.route === 'insights' && <Insights key={r.state} onTab={onTab} onEdit={() => go('edit')} state={r.state} onOpenQr={openQr} onShare={toShare} />}
      {r.route === 'submissions' && <Submissions onTab={onTab} onEdit={() => go('edit')} onShare={() => go('share')} />}

      {/* The QR panel replaces the sheet instead of stacking on it; closing it brings the sheet back. */}
      <PublishedSheet open={sheet && !s.qrOpen} onClose={() => setSheet(false)} />
      <QrPanel />

      {page && !mobile && <GuideCard key={page} page={page} open={!g.hidden} onClose={g.hide} />}
      {page && mobile && <GuideCard key={page} page={page} open={guideOpen && navOpen} onClose={() => setGuideOpen(false)} mobile delay={false} />}

      {/* On phones the prototype bar folds into one small button, so it doesn't cover the screen. */}
      {mobile && !navOpen && <button type="button" className="proto-pill" onClick={() => setNavOpen(true)} aria-expanded={false}>Screens</button>}
      {(!mobile || navOpen) && <nav className="proto-nav" aria-label="Prototype screens">
        <span className="proto-label">Prototype</span>
        <a href="#/edit" aria-current={r.route === 'edit'}>Publish</a>
        {r.route === 'edit' && (
          <select aria-label={publishCopy.protoLabel} value={r.pub} onChange={(e) => { setSheet(false); go('edit', e.target.value === 'first' ? '' : `?pub=${e.target.value}`) }}>
            <option value="first">{publishCopy.protoFirst}</option>
            <option value="empty">{publishCopy.protoNoResponses}</option>
            <option value="data">{publishCopy.protoResponses}</option>
          </select>
        )}
        <a href="#/share" aria-current={r.route === 'share'}>Share tab</a>
        <a href="#/insights" aria-current={r.route === 'insights'}>Insights</a>
        {r.route === 'insights' && (
          <select aria-label="Insights state" value={r.state} onChange={(e) => { tick('switch-states'); go('insights', `?state=${e.target.value}`) }}>
            <option value="data">With QR responses</option>
            <option value="noqr">No QR responses yet</option>
            <option value="empty">No submissions</option>
          </select>
        )}
        <a href="./visuals/">Visuals</a>
        {page && !mobile && g.hidden && <button type="button" className="proto-guide" onClick={g.show}>{guideCopy.restore}</button>}
        {page && mobile && <button type="button" className="proto-guide" aria-expanded={guideOpen} onClick={() => setGuideOpen((v) => !v)}>{guideCopy.mobileToggle(g.left)}</button>}
        {mobile && <button type="button" className="proto-close" aria-label="Hide prototype bar" onClick={() => setNavOpen(false)}>✕</button>}
      </nav>}
    </>
  )
}

export default function App() {
  return <StoreProvider><Inner /></StoreProvider>
}
