import { useCallback, useEffect, useState } from 'react'
import { keepParams, screenHref, currentVariant, VARIANTS } from './params'
import { StoreProvider, useIsMobile, useStore } from './store'
import { Editor, ShareTab, type PublishState } from './screens'
import { planCopy, publishCopy } from './copy'
import { Insights, Submissions, type InsightsState } from './insights'
import { PublishedSheet } from './modals'
import { QrPanel } from './qrpanel'
import { UpgradeOverlay } from './upgrade'
import type { Tab } from './chrome'
import { GuideCard, tick, useGuide } from './guide'
import { guideCopy, type GuidePage } from './guideCopy'

type Route = 'edit' | 'share' | 'insights' | 'submissions'

/** The share sheet layouts, by their ?variant= value: none (or simple) for Simple, the default, split for Split, tabs for Tabs, entry for Rows, tiles for Tiles, jobs for Jobs. */
type Variant = 'split' | 'tabs' | 'entry' | 'tiles' | 'jobs' | 'simple'
// Only the layouts this build offers (all six, unless VITE_VARIANTS says otherwise).
const VERSIONS: { id: Variant; label: string }[] = ([{ id: 'simple', label: 'Simple' }, { id: 'split', label: 'Split' }, { id: 'tabs', label: 'Tabs' }, { id: 'entry', label: 'Rows' }, { id: 'tiles', label: 'Tiles' }, { id: 'jobs', label: 'Jobs' }] as { id: Variant; label: string }[]).filter((v) => VARIANTS.includes(v.id))
/** How the social links show, by their ?social= value: rows, icons or strip. None means the version's default: Icons in Split, Rows everywhere else. */
type Social = '' | 'rows' | 'icons' | 'strip'
function setParam(key: 'variant' | 'social', v: string) {
  const [path, q = ''] = window.location.hash.replace(/^#/, '').split('?')
  const p = new URLSearchParams(q)
  if (v) p.set(key, v); else p.delete(key)
  const qs = p.toString()
  window.location.hash = `${path || '/edit'}${qs ? `?${qs}` : ''}`
}
const setVariant = (v: Variant) => setParam('variant', v === 'simple' ? '' : v)

function readRoute(): { route: Route; variant: Variant; social: Social; publish: boolean; state: InsightsState; qr: boolean; pub: PublishState; mainOnly: boolean } {
  const h = window.location.hash.replace(/^#\/?/, '')
  const [path, q = ''] = h.split('?')
  const p = new URLSearchParams(q)
  const route: Route = path === 'share' ? 'share' : path === 'insights' || path === 'results' ? 'insights' : path === 'submissions' ? 'submissions' : 'edit'
  const st = p.get('state')
  return {
    route,
    // No ?variant= means Simple, my proposal, the changelog demo included.
    // A layout this build doesn't offer opens Simple too.
    variant: currentVariant(),
    social: p.get('social') === 'rows' || p.get('social') === 'icons' || p.get('social') === 'strip' ? (p.get('social') as Social) : '',
    publish: p.get('published') === '1',
    state: st === 'noqr' || st === 'empty' ? st : 'data',
    qr: p.get('qr') === '1',
    // codes=main: only your form's own code, to see the single-code view on the Share tab.
    mainOnly: p.get('codes') === 'main',
    pub: p.get('pub') === 'empty' || p.get('pub') === 'data' ? (p.get('pub') as PublishState) : 'first',
  }
}

function Inner() {
  const [r, setR] = useState(readRoute)
  const [sheet, setSheet] = useState(r.route === 'edit' && r.publish)
  // Opened straight from a first publish (or the ?published=1 link of one): QR Code tab first.
  const [sheetFirst, setSheetFirst] = useState(r.route === 'edit' && r.publish && r.pub === 'first')
  const s = useStore()
  const mobile = useIsMobile()
  const [navOpen, setNavOpen] = useState(false)
  useEffect(() => { setNavOpen(false) }, [r.route, r.state])
  useEffect(() => { if (r.route !== 'edit') setSheet(false) }, [r.route])
  // A form you are publishing starts with only its own QR code; the other screens show the example data.
  useEffect(() => { s.setDataset((r.route === 'edit' && r.pub !== 'data') || r.mainOnly ? 'fresh' : 'example') }, [r.route, r.pub, r.mainOnly]) // eslint-disable-line
  useEffect(() => {
    const on = () => setR(readRoute())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  useEffect(() => { s.setQrOpen(false) }, [r.route, r.state]) // eslint-disable-line
  useEffect(() => { if (r.qr) s.setQrOpen(true) }, []) // eslint-disable-line
  const go = useCallback((route: Route, extra = '') => { window.location.hash = `/${route}${keepParams(extra)}`; window.scrollTo(0, 0) }, [])
  const onTab = (t: Tab) => { if (t === 'share' && r.route === 'insights' && r.state === 'empty') tick('go-share'); go(t === 'insights' ? 'insights' : t === 'submissions' ? 'submissions' : 'share') }
  const toShare = () => { if (r.state === 'empty') tick('go-share'); go('share') }
  const page: GuidePage | null = r.route === 'edit' ? 'publish' : r.route === 'share' ? 'share' : r.route === 'insights' ? `insights-${r.state}` : null
  const g = useGuide(page ?? 'publish')
  // Phones: the guide opens from the prototype bar instead of sitting on the screen.
  const [guideOpen, setGuideOpen] = useState(false)
  useEffect(() => { setGuideOpen(false) }, [r.route, r.state])

  return (
    <>
      <UpgradeOverlay />
      {r.route === 'edit' && <Editor key={r.pub} pub={r.pub} published={r.publish} onPublished={(first) => { setSheetFirst(first); setSheet(true) }} />}
      {r.route === 'share' && <ShareTab onTab={onTab} onEdit={() => go('edit')} />}
      {r.route === 'insights' && <Insights key={r.state} onTab={onTab} onEdit={() => go('edit')} state={r.state} onShare={toShare} />}
      {r.route === 'submissions' && <Submissions onTab={onTab} onEdit={() => go('edit')} onShare={() => go('share')} />}

      {/* The QR panel replaces the sheet instead of stacking on it; closing it brings the sheet back. */}
      <PublishedSheet open={sheet && !s.qrOpen} first={sheetFirst} onClose={() => { setSheet(false); setSheetFirst(false) }} />
      <QrPanel />

      {page && !mobile && <GuideCard key={page} page={page} open={!g.hidden} onClose={g.hide} />}
      {page && mobile && <GuideCard key={page} page={page} open={guideOpen && navOpen} onClose={() => setGuideOpen(false)} mobile delay={false} />}

      {/* On phones the prototype bar folds into one small button, so it doesn't cover the screen. */}
      {mobile && !navOpen && <button type="button" className="proto-pill" onClick={() => setNavOpen(true)} aria-expanded={false}>Screens</button>}
      {(!mobile || navOpen) && <nav className="proto-nav" aria-label="Prototype screens">
        <span className="proto-label">Prototype</span>
        <a href={screenHref('/edit')} aria-current={r.route === 'edit'}>Publish</a>
        {r.route === 'edit' && (
          <select aria-label={publishCopy.protoLabel} value={r.pub} onChange={(e) => { setSheet(false); go('edit', e.target.value === 'first' ? '' : `?pub=${e.target.value}`) }}>
            <option value="first">{publishCopy.protoFirst}</option>
            <option value="empty">{publishCopy.protoNoResponses}</option>
            <option value="data">{publishCopy.protoResponses}</option>
          </select>
        )}
        <a href={screenHref('/share')} aria-current={r.route === 'share'}>Share tab</a>
        <a href={screenHref('/insights')} aria-current={r.route === 'insights'}>Insights</a>
        {r.route === 'insights' && (
          <select aria-label="Insights state" value={r.state} onChange={(e) => { tick('switch-states'); go('insights', `?state=${e.target.value}`) }}>
            <option value="data">With QR responses</option>
            <option value="noqr">No QR codes</option>
            <option value="empty">No submissions</option>
          </select>
        )}
        <a href="./visuals/">Visuals</a>
        <select aria-label={planCopy.protoLabel} value={s.plan} onChange={(e) => s.setPlan(e.target.value === 'pro' ? 'pro' : 'free')}>
          <option value="free">{planCopy.free}</option>
          <option value="pro">{planCopy.pro}</option>
        </select>
        {/* Starts over with a saved custom ending on your own domain, so changing it can be tried. */}
        <select aria-label="Link state" value={/[?&]link=custom\b/.test(window.location.hash) ? 'custom' : 'id'}
          onChange={(e) => { window.location.hash = `#/${r.route}${keepParams(e.target.value === 'custom' ? '?link=custom' : '')}`; window.location.reload() }}>
          <option value="id">tally.so link</option>
          <option value="custom">Custom ending</option>
        </select>
        {/* Prototype only: switch between the share sheet layouts this build offers. Kept in sync with ?variant=, so each one can be linked. */}
        {(r.route === 'edit' || r.route === 'share' || r.route === 'insights') && (
          <span className="proto-version" role="group" aria-label="Share sheet version">
            <span className="proto-version-label">Version:</span>
            {VERSIONS.map((v) => (
              <button key={v.id} type="button" aria-pressed={r.variant === v.id} onClick={() => setVariant(v.id)}>{v.label}</button>
            ))}
          </span>
        )}
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
