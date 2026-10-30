import { useState } from 'react'
import { ChevronDown, Inbox, QrCode, TrendingUp, Check, CircleHelp } from 'lucide-react'
import { useIsMobile } from './store'
import { DashHeader, FormTitle, Shell, type Tab } from './chrome'
import { Menu, Pro } from './ui'

export type InsightsState = 'data' | 'noqr' | 'empty'
type View = 'answers' | 'visits' | 'dropoffs'
type Range = '24h' | '7d' | '30d' | 'all'
const RANGES: { id: Range; label: string }[] = [
  { id: '24h', label: 'Last 24 hours' }, { id: '7d', label: 'Last 7 days' }, { id: '30d', label: 'Last 30 days' }, { id: 'all', label: 'All time' },
]

interface SourceRow { name: string; visits: number; subs: number; qr?: boolean }

/** Example numbers for the prototype. Direct / None is the real referrer row; the rest are ?ref values, shown by place name. */
const DATA: Record<Range, SourceRow[]> = {
  all: [
    { name: 'WhatsApp', visits: 14, subs: 4 }, { name: 'Poster', visits: 11, subs: 3, qr: true }, { name: 'Direct / None', visits: 9, subs: 1 },
    { name: 'Email', visits: 6, subs: 2 }, { name: 'Flyer', visits: 5, subs: 1, qr: true }, { name: 'Instagram', visits: 4, subs: 1 },
  ],
  '30d': [
    { name: 'WhatsApp', visits: 14, subs: 4 }, { name: 'Poster', visits: 11, subs: 3, qr: true }, { name: 'Direct / None', visits: 9, subs: 1 },
    { name: 'Email', visits: 6, subs: 2 }, { name: 'Flyer', visits: 5, subs: 1, qr: true }, { name: 'Instagram', visits: 4, subs: 1 },
  ],
  '7d': [
    { name: 'Poster', visits: 6, subs: 2, qr: true }, { name: 'WhatsApp', visits: 5, subs: 1 }, { name: 'Direct / None', visits: 3, subs: 0 },
    { name: 'Flyer', visits: 2, subs: 1, qr: true }, { name: 'Email', visits: 1, subs: 0 },
  ],
  '24h': [{ name: 'Poster', visits: 2, subs: 1, qr: true }, { name: 'Direct / None', visits: 1, subs: 0 }],
}
const DAYS: Record<Range, number[][]> = {
  all: [[2, 0], [5, 1], [8, 3], [6, 2], [4, 1], [3, 0], [2, 1], [4, 1], [3, 0], [5, 2], [2, 0], [1, 0], [2, 1], [2, 0]],
  '30d': [[2, 0], [5, 1], [8, 3], [6, 2], [4, 1], [3, 0], [2, 1], [4, 1], [3, 0], [5, 2], [2, 0], [1, 0], [2, 1], [2, 0]],
  '7d': [[3, 1], [4, 1], [2, 0], [5, 2], [1, 0], [0, 0], [2, 0]],
  '24h': [[0, 0], [0, 0], [1, 0], [0, 0], [2, 1], [0, 0]],
}

function rowsFor(range: Range, state: InsightsState) {
  if (state === 'empty') return [{ name: 'Direct / None', visits: 8, subs: 0 }]
  const r = DATA[range]
  return state === 'noqr' ? r.filter((x) => !x.qr) : r
}

export function Insights({ onTab, onEdit, state, onOpenQr, onShare }: {
  onTab: (t: Tab) => void; onEdit: () => void; state: InsightsState; onOpenQr: () => void; onShare: () => void
}) {
  const [view, setView] = useState<View>(state === 'empty' ? 'answers' : 'visits')
  const [range, setRange] = useState<Range>('all')
  const [menu, setMenu] = useState(false)
  const rows = rowsFor(range, state)
  const visits = rows.reduce((t, r) => t + r.visits, 0)
  const subs = rows.reduce((t, r) => t + r.subs, 0)
  const days = state === 'empty' ? DAYS[range].map(() => [0, 0]).map((d, i, a) => (i === a.length - 1 ? [8, 0] : d)) : DAYS[range]
  return (
    <Shell>
      <DashHeader onEdit={onEdit} />
      <div className="page">
        <FormTitle tab="insights" onTab={onTab} />
        <div className="ins">
          <div className="row-between ins-bar">
            <div className="pills" role="tablist" aria-label="Insights">
              {([['answers', 'Answers'], ['visits', 'Visits'], ['dropoffs', 'Drop-offs']] as [View, string][]).map(([id, l]) => (
                <button key={id} role="tab" type="button" className="pill" aria-selected={view === id} onClick={() => setView(id)}>{l}</button>
              ))}
            </div>
            {view !== 'dropoffs' && (
              <div style={{ position: 'relative' }}>
                <button type="button" className="range-btn" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
                  {RANGES.find((r) => r.id === range)!.label}<ChevronDown aria-hidden />
                </button>
                <Menu open={menu} onClose={() => setMenu(false)} style={{ top: 30, right: 0, width: 180 }}>
                  {RANGES.map((r) => (
                    <button key={r.id} role="menuitemradio" aria-checked={range === r.id} onClick={() => { setRange(r.id); setMenu(false) }}>
                      {range === r.id ? <Check aria-hidden /> : <span style={{ width: 16 }} />}{r.label}
                    </button>
                  ))}
                </Menu>
              </div>
            )}
          </div>

          {view === 'dropoffs' ? <DropOffs /> : (
            <>
              <div className="metrics">
                <Metric label="Visits" value={String(visits)} />
                <Metric label="Submissions" value={String(subs)} />
                <Metric label="Unique respondents" value={String(subs)} />
                <Metric label="Visit duration" value={state === 'empty' ? '1s' : '1m 12s'} />
              </div>
              {view === 'answers' && (subs === 0 ? <SubmissionsEmpty onShare={onShare} /> : <Answers />)}
              {view === 'visits' && (
                <>
                  <div className="charts">
                    <Chart values={days.map((d) => d[0])} caption={<><b>{visits}</b> visits</>} />
                    <Chart values={days.map((d) => d[1])} caption={<><b>{subs}</b> submissions</>} />
                  </div>
                  <div className="panels">
                    <SourcesPanel rows={rows} showQrEmpty={state !== 'data'} onOpenQr={onOpenQr} />
                    <Devices mobile={state === 'empty' ? 0 : Math.round(visits * 0.62)} desktop={state === 'empty' ? 8 : visits - Math.round(visits * 0.62)} />
                    <Panel title="Countries" rows={[{ name: 'Belgium', n: visits, flag: true }]} />
                    <Panel title="Cities" rows={state === 'empty' ? [{ name: 'Gent', n: 8, flag: true }] : [{ name: 'Brussels', n: Math.ceil(visits * 0.7), flag: true }, { name: 'Gent', n: Math.floor(visits * 0.3), flag: true }]} />
                    <Panel title="Browsers" rows={state === 'empty' ? [{ name: 'Chrome', n: 8 }] : [{ name: 'Safari', n: Math.ceil(visits * 0.55) }, { name: 'Chrome', n: Math.floor(visits * 0.45) }]} />
                    <Panel title="Operating Systems" rows={state === 'empty' ? [{ name: 'Linux', n: 8 }] : [{ name: 'iOS', n: Math.ceil(visits * 0.45) }, { name: 'Android', n: Math.round(visits * 0.17) }, { name: 'macOS', n: visits - Math.ceil(visits * 0.45) - Math.round(visits * 0.17) }]} />
                  </div>
                  <div className="ins-foot">
                    <span>Privacy-friendly and fully anonymous analytics: no cookies, no personal data, and no cross-device tracking.</span>
                    <a href="https://tally.so/help" target="_blank" rel="noreferrer" aria-label="About Tally analytics" className="ins-help"><CircleHelp aria-hidden /></a>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Shell>
  )
}

function Metric({ label, value, blur = false }: { label: string; value: string; blur?: boolean }) {
  return (
    <div className="metric">
      <span className="metric-l">{label}</span>
      <span className={`metric-v ${blur ? 'is-blur' : ''}`} aria-hidden={blur}>{value}</span>
    </div>
  )
}

function Chart({ values, caption }: { values: number[]; caption: React.ReactNode }) {
  const max = Math.max(...values)
  return (
    <div className="chart">
      <div className="chart-area" aria-hidden>
        {max === 0 ? <span className="chart-empty">No data</span> : values.map((v, i) => (
          <span key={i} className="chart-bar" style={{ height: `${(v / max) * 100}%` }} />
        ))}
      </div>
      <div className="chart-cap">{caption}</div>
    </div>
  )
}

function Flag() {
  return <span className="flag-be" aria-hidden><i /><i /><i /></span>
}

function Panel({ title, rows }: { title: string; rows: { name: string; n: number; flag?: boolean }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <section className="panel">
      <h3>{title}</h3>
      <ul className="bars">
        {rows.filter((r) => r.n > 0).map((r) => (
          <li key={r.name}>
            <span className="bar-cell"><span className="bar-fill" style={{ width: `${(r.n / max) * 100}%` }} /><span className="bar-text">{r.flag && <Flag />}{r.name}</span></span>
            <span className="bar-n">{r.n}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Tally's Sources panel, with each ?ref shown by its place name and a Submissions column. */
function SourcesPanel({ rows, showQrEmpty, onOpenQr }: { rows: SourceRow[]; showQrEmpty: boolean; onOpenQr: () => void }) {
  const max = Math.max(1, ...rows.map((r) => r.visits))
  const mobile = useIsMobile()
  return (
    <section className="panel panel-sources">
      <div className="panel-h">
        <h3>Sources</h3>
        <span className="col-h">Visits</span>
        <span className="col-h">{mobile ? 'Subm.' : 'Submissions'}</span>
      </div>
      <ul className="bars">
        {rows.map((r) => (
          <li key={r.name}>
            <span className="bar-cell">
              <span className="bar-fill" style={{ width: `${(r.visits / max) * 100}%` }} />
              <span className="bar-text">{r.name}</span>
            </span>
            <span className="bar-n">{r.visits}</span>
            <span className="bar-n">{r.subs}</span>
          </li>
        ))}
      </ul>
      {showQrEmpty && (
        <div className="empty-state is-small">
          <QrCode aria-hidden className="empty-icon" />
          <b>No responses from your QR code yet</b>
          <span>Print it or put it on a slide. Responses from it show up here.</span>
          <button type="button" className="btn btn-blue btn-sm" onClick={onOpenQr}>Get QR code</button>
        </div>
      )}
    </section>
  )
}

function Devices({ mobile, desktop }: { mobile: number; desktop: number }) {
  const total = Math.max(1, mobile + desktop)
  return (
    <section className="panel">
      <h3>Devices</h3>
      <div className="dev-bar" aria-hidden>
        {mobile > 0 && <span className="dev-m" style={{ width: `${(mobile / total) * 100}%` }} />}
        {desktop > 0 && <span className="dev-d" style={{ width: `${(desktop / total) * 100}%` }} />}
      </div>
      <div className="dev-legend">
        {mobile > 0 && <span><i className="dev-m" /><b>{mobile}</b> mobile visits</span>}
        {desktop > 0 && <span><i className="dev-d" /><b>{desktop}</b> desktop visits</span>}
      </div>
    </section>
  )
}

function Answers() {
  const qs: { q: string; rows: { name: string; n: number }[] }[] = [
    { q: 'Are you coming?', rows: [{ name: 'Yes, count me in', n: 8 }, { name: 'Maybe', n: 3 }, { name: "Can't make it", n: 1 }] },
    { q: 'Bringing anything to share?', rows: [{ name: 'Something sweet', n: 5 }, { name: 'Drinks', n: 4 }, { name: 'Something savoury', n: 3 }, { name: 'Just good vibes', n: 2 }] },
  ]
  return (
    <div className="panels one">
      {qs.map((x) => <Panel key={x.q} title={x.q} rows={x.rows} />)}
    </div>
  )
}

export function SubmissionsEmpty({ onShare }: { onShare: () => void }) {
  return (
    <div className="empty-state">
      <Inbox aria-hidden className="empty-icon" />
      <b>No completed submissions yet</b>
      <span>Your form is published and ready to be shared with the world!</span>
      <button type="button" className="btn btn-blue btn-sm" onClick={onShare}>Share</button>
    </div>
  )
}

/** Same lock pattern as Tally's Drop-offs tab. */
function DropOffs() {
  return (
    <>
      <div className="metrics">
        <Metric label="Started answering" value="8" blur />
        <Metric label="Completions" value="4" blur />
        <Metric label="Completion rate" value="50%" blur />
        <Metric label="Completion duration" value="1m" blur />
      </div>
      <div className="empty-state">
        <TrendingUp aria-hidden className="empty-icon" />
        <b className="row gap-8" style={{ justifyContent: 'center' }}>Ready to optimize your form? <Pro /></b>
        <span style={{ maxWidth: 300 }}>Pro users can track question-by-question drop-offs to boost completions.</span>
        <button type="button" className="btn btn-blue btn-sm">Upgrade plan</button>
      </div>
    </>
  )
}

export function Submissions({ onTab, onEdit, onShare }: { onTab: (t: Tab) => void; onEdit: () => void; onShare: () => void }) {
  return (
    <Shell>
      <DashHeader onEdit={onEdit} />
      <div className="page">
        <FormTitle tab="submissions" onTab={onTab} />
        <div className="subs-empty"><SubmissionsEmpty onShare={onShare} /></div>
      </div>
    </Shell>
  )
}
