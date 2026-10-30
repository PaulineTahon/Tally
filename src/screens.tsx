import { useState } from 'react'
import { Loader2, X, Plus, GripVertical, Undo2, Redo2, Eye, Settings2, Palette, Code, ChevronRight, ChevronDown, QrCode, Globe, Check, Zap, Mail } from 'lucide-react'
import { EXAMPLE_UNTAGGED, FORM_TITLE, useIsMobile, useReducedMotion, useStore } from './store'
import { DashHeader, FormTitle, Shell, TallyMark, Avatar, type Tab } from './chrome'
import { ShareBlock, SOCIAL, emailHref, useNativeShare } from './share'
import { Pro, SmallCopy } from './ui'
import { Instagram } from './brand'

/* ---------- Editor ---------- */

export function Editor({ onPublished, published }: { onPublished: () => void; published: boolean }) {
  const mobile = useIsMobile()
  const [phase, setPhase] = useState<'idle' | 'publishing' | 'done'>(published ? 'done' : 'idle')
  const reduced = useReducedMotion()
  const publish = () => {
    if (phase === 'publishing') return
    setPhase('publishing')
    // A short, playful beat. The share sheet opens right after; Copy is never delayed.
    setTimeout(() => { setPhase('done'); onPublished() }, reduced ? 0 : 420)
  }
  return (
    <div className="editor">
      <header className="editor-bar">
        <div className="crumbs">
          <TallyMark />
          {!mobile && <><span className="sep">/</span><span>My workspace</span><span className="sep">/</span><span className="cur">{FORM_TITLE}</span></>}
        </div>
        <div className="row gap-4">
          {!mobile && <>
            <button type="button" className="btn btn-ghost btn-sm icon-btn" aria-label="Undo"><Undo2 aria-hidden /></button>
            <button type="button" className="btn btn-ghost btn-sm icon-btn" aria-label="Redo"><Redo2 aria-hidden /></button>
            <button type="button" className="btn btn-ghost btn-sm"><Palette aria-hidden />Customize</button>
            <button type="button" className="btn btn-ghost btn-sm icon-btn" aria-label="Settings"><Settings2 aria-hidden /></button>
          </>}
          <button type="button" className="btn btn-ghost btn-sm">{mobile ? <Eye aria-hidden /> : 'Preview'}</button>
          <Avatar size={22} />
          <button type="button" className={`btn btn-blue btn-sm publish-btn ${phase}`} onClick={publish} aria-live="polite">
            {phase === 'publishing' ? <><Loader2 aria-hidden className="spin" />Publishing</> : phase === 'done' ? <><Check aria-hidden />Published</> : 'Publish'}
          </button>
        </div>
      </header>
      <main className="editor-canvas">
        <div className="cover" aria-hidden />
        <div className="form-col">
          <div className="form-logo" aria-hidden>🧺</div>
          <h1 className="form-title">{FORM_TITLE}</h1>
          <p className="block-text">Bring a blanket, we bring the lemonade. Saturday 14 June, Park Belvedère, from noon.</p>
          <Block label="What's your name?" required><div className="fake-input">Type your answer here</div></Block>
          <Block label="Are you coming?" required>
            {['Yes, count me in', 'Maybe', "Can't make it"].map((o, i) => <div key={o} className="choice"><span className="radio" />{o}{i === 0 && <span className="kbd" />}</div>)}
          </Block>
          <Block label="Bringing anything to share?">
            {['Something sweet', 'Something savoury', 'Drinks', 'Just good vibes'].map((o) => <div key={o} className="choice"><span className="checkbox" />{o}</div>)}
          </Block>
          <div className="fake-submit">Submit <ChevronRight aria-hidden /></div>
        </div>
      </main>
    </div>
  )
}

function Block({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="block">
      <div className="block-handles" aria-hidden><Plus /><GripVertical /></div>
      <div className="block-label">{label}{required && <span className="req">*</span>}</div>
      {children}
    </div>
  )
}

/* ---------- Share tab ---------- */

export function ShareTab({ onTab, onEdit }: { onTab: (t: Tab) => void; onEdit: () => void }) {
  const s = useStore()
  const mobile = useIsMobile()
  const share = useNativeShare()
  const [embedOpen, setEmbedOpen] = useState(false)
  const [newSource, setNewSource] = useState('')
  const best = [...s.sources].sort((a, b) => b.responses - a.responses)[0]
  const total = s.sources.reduce((t, x) => t + x.responses, 0) + EXAMPLE_UNTAGGED
  const bestOpen = SOCIAL.find((x) => x.ref === best.ref)?.open
  const bestHref = bestOpen ? bestOpen(s.url(best.ref)) : best.ref === 'email' ? emailHref(s.url('email')) : null
  const [nudgeGone, setNudgeGone] = useState(() => { try { return localStorage.getItem(NUDGE_KEY) === '1' } catch { return false } })
  const dismissNudge = () => { setNudgeGone(true); try { localStorage.setItem(NUDGE_KEY, '1') } catch { /* private mode */ } }
  return (
    <Shell>
      <DashHeader onEdit={onEdit} />
      <div className="page">
        <FormTitle tab="share" onTab={onTab} />
        <div className="share-page">
          {!nudgeGone && (
            <div className="nudge" role="note">
              <Zap aria-hidden />
              <span className="grow">{total} responses, slowing down. Most came from {best.label}. Give it another push?</span>
              {bestHref
                ? <a className="btn btn-secondary btn-sm" href={bestHref} target="_blank" rel="noreferrer">Share on {best.label}</a>
                : <button type="button" className="btn btn-secondary btn-sm" onClick={() => best.ref === 'qr' ? (s.setQrRef('qr'), s.setQrOpen(true)) : share(s.url(best.ref))}>Share on {best.label}</button>}
              <button type="button" className="btn btn-ghost btn-sm icon-btn" aria-label="Dismiss" onClick={dismissNudge}><X aria-hidden /></button>
            </div>
          )}

          <section className="stack gap-16" aria-labelledby="share-h">
            <h2 id="share-h" className="section-h">Share</h2>
            <ShareBlock />
          </section>

          <section className="stack gap-12" aria-labelledby="tracked-h">
            <div className="row-between">
              <h2 id="tracked-h" className="section-h">Tracked links</h2>
              <button type="button" className="link-btn small" onClick={() => onTab('submissions')}>Responses by source</button>
            </div>
            <p className="small muted" style={{ margin: 0 }}>One link per place you share, so you know which one brings responses.</p>
            <div className="card tracked">
              {s.sources.map((src) => (
                <div className="tracked-row" key={src.ref}>
                  <span className="src-icon">{iconFor(src.ref, src.kind)}</span>
                  <span className="grow">
                    <span className="title">{src.label}</span>
                    <span className="mono xs muted">{s.display(src.ref)}</span>
                  </span>
                  {!mobile && <span className="xs muted count">{src.responses} {src.responses === 1 ? 'response' : 'responses'}</span>}
                  {src.kind === 'qr' || src.kind === 'place'
                    ? <button type="button" className="btn btn-secondary btn-sm" onClick={() => { s.setQrRef(src.ref); s.setQrOpen(true) }}><QrCode aria-hidden />QR</button>
                    : <SmallCopy text={s.url(src.ref)} />}
                </div>
              ))}
              <form className="tracked-row add" onSubmit={(e) => { e.preventDefault(); if (!newSource.trim()) return; s.addSource(newSource); setNewSource(''); s.toast('Tracked link added.') }}>
                <span className="src-icon"><Plus aria-hidden /></span>
                <div className="input-group" style={{ flex: 1, height: 32 }}>
                  <span className="prefix">?ref=</span>
                  <input aria-label="New source name" placeholder="poster-cafe" value={newSource} onChange={(e) => setNewSource(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-black btn-sm" disabled={!newSource.trim()}>Add</button>
              </form>
            </div>
            <span className="xs muted">Untagged links keep working. Responses from them show up as "Untagged link".</span>
          </section>

          <section className="stack gap-8 secondary" aria-labelledby="more-h">
            <h2 id="more-h" className="section-h small-h">Embed Form</h2>
            {mobile ? (
              <button type="button" className="list-row" aria-expanded={embedOpen} onClick={() => setEmbedOpen((v) => !v)}>
                <span className="row-icon"><Code aria-hidden /></span>
                <span className="grow"><span className="title">Embed on a website</span><span className="help" style={{ display: 'block' }}>Works best on desktop</span></span>
                {embedOpen ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
              </button>
            ) : <p className="small" style={{ margin: 0 }}>Use these options to embed your form into your own website.</p>}
            {(!mobile || embedOpen) && (
              <div className="embed-cards">
                {['Standard', 'Popup', 'Full page'].map((t) => (
                  <button type="button" key={t} className="embed-card">
                    <span className={`embed-thumb ${t.replace(' ', '').toLowerCase()}`} aria-hidden><i /><i /><i /><b /><em /></span>
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </Shell>
  )
}

const NUDGE_KEY = 'share-nudge-dismissed'

function iconFor(ref: string, kind: string) {
  const social = SOCIAL.find((x) => x.ref === ref)
  if (social) return social.icon
  if (kind === 'qr' || kind === 'place') return <QrCode aria-hidden />
  if (kind === 'email') return <Mail aria-hidden />
  if (kind === 'social') return <Instagram />
  return <Globe aria-hidden />
}

/* ---------- Results: Submissions with Responses by source ---------- */

export type ResultsState = 'data' | 'firstqr' | 'nosources' | 'empty'

export function Results({ onTab, onEdit, state, onGetLink }: { onTab: (t: Tab) => void; onEdit: () => void; state: ResultsState; onGetLink: () => void }) {
  const s = useStore()
  const mobile = useIsMobile()
  type R = { key: string; label: string; n: number; help?: string }
  const rows: R[] = state === 'firstqr'
    ? [
        { key: 'untagged', label: 'Untagged link', n: 6, help: 'Responses from a link without a ?ref tag.' },
        { key: 'qr', label: 'QR code', n: 1, help: 'Your first response from the real world. 📷' },
      ]
    : [
        ...s.sources.map((x): R => ({
          key: x.ref, label: x.label, n: x.responses,
          help: x.responses === 0 && (x.kind === 'place' || x.kind === 'custom' || x.kind === 'qr') ? 'No responses from your QR code yet. Is the poster up?' : undefined,
        })),
        { key: 'untagged', label: 'Untagged link', n: EXAMPLE_UNTAGGED, help: 'Responses from a link without a ?ref tag.' },
      ].sort((a, b) => b.n - a.n)
  const total = rows.reduce((t, r) => t + r.n, 0)
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <Shell>
      <DashHeader onEdit={onEdit} />
      <div className="page">
        <FormTitle tab="submissions" onTab={onTab} />
        <div className="results">
          <section className="card sources" aria-labelledby="src-h">
            <div className="row-between">
              <div className="stack gap-4">
                <h2 id="src-h" className="section-h">Responses by source</h2>
                <span className="small muted">Where your responses came from.</span>
              </div>
              {(state === 'data' || state === 'firstqr') && <span className="badge badge-grey">Example data</span>}
            </div>
            {state === 'empty' && (
              <div className="empty"><span className="empty-art" aria-hidden>📭</span><span className="small">No responses yet. Your first one will show up here.</span></div>
            )}
            {state === 'nosources' && (
              <div className="empty">
                <div className="sample" aria-label="Sample breakdown, not your data">
                  <div className="row-between"><span className="xs muted">Here's how your sources will show up</span><span className="badge badge-grey">Sample</span></div>
                  <ol className="src-list sample-list" aria-hidden>
                    {[['QR code', 6], ['Email', 4], ['Instagram', 2]].map(([l, n]) => (
                      <li key={l}>
                        <div className="row-between"><span className="src-name">{l}</span><span className="src-n"><b>{n}</b></span></div>
                        <div className="bar"><span style={{ width: `${(Number(n) / 6) * 100}%` }} /></div>
                      </li>
                    ))}
                  </ol>
                </div>
                <b>No sources yet</b>
                <span className="small muted" style={{ maxWidth: 360 }}>Share a tagged link or your QR code, and we'll show you where responses come from.</span>
                <button type="button" className="btn btn-black btn-sm" onClick={onGetLink}>Get a tagged link</button>
              </div>
            )}
            {(state === 'data' || state === 'firstqr') && (
              <ol className={`src-list ${mobile ? 'is-list' : ''}`}>
                {rows.map((r) => (
                  <li key={r.key}>
                    <div className="row-between">
                      <span className="stack">
                        <span className="src-name">{r.label}</span>
                        {r.help && <span className="xs muted">{r.help}</span>}
                      </span>
                      <span className="src-n"><b>{r.n}</b><span className="muted xs"> · {Math.round((r.n / Math.max(1, total)) * 100)}%</span></span>
                    </div>
                    {!mobile && <div className="bar" aria-hidden><span style={{ width: `${(r.n / max) * 100}%` }} /></div>}
                  </li>
                ))}
              </ol>
            )}
            {state === 'data' && (
              <div className="pro-row">
                <span className="small">See which sources turn visits into responses, and where people drop off.</span>
                <Pro />
              </div>
            )}
          </section>

          <section className="stack gap-8">
            <div className="row-between"><h2 className="section-h small-h">Submissions</h2><span className="badge badge-grey">Example data</span></div>
            <div className="card table-wrap">
              <table className="subs">
                <thead><tr><th>Submitted</th><th>Name</th><th>Coming?</th>{!mobile && <th>Bringing</th>}<th>ref</th></tr></thead>
                <tbody>
                  {state === 'empty' ? <tr><td colSpan={5} className="muted small" style={{ textAlign: 'center', padding: 24 }}>Nothing here yet.</td></tr> : [
                    ['Oct 29', 'Sam', 'Yes', 'Drinks', 'qr'], ['Oct 29', 'Noor', 'Yes', 'Something sweet', 'email'], ['Oct 28', 'Jules', 'Maybe', 'Just good vibes', 'qr'],
                    ['Oct 28', 'Ana', 'Yes', 'Something savoury', 'instagram'], ['Oct 27', 'Tom', "Can't make it", '', state === 'nosources' ? '' : 'poster-library'],
                  ].map((r, i) => (
                    <tr key={i}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td>{!mobile && <td>{r[3]}</td>}<td>{state === 'nosources' ? <span className="muted">none</span> : r[4] ? <code className="mono-chip">{r[4]}</code> : null}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </Shell>
  )
}
