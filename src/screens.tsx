import { useState } from 'react'
import { Loader2, X, Plus, GripVertical, Undo2, Redo2, Eye, Settings2, Palette, ChevronRight, QrCode, Globe, Check, Zap, Mail } from 'lucide-react'
import { EXAMPLE_UNTAGGED, FORM_TITLE, useIsMobile, useReducedMotion, useStore } from './store'
import { DashHeader, FormTitle, Shell, TallyMark, Avatar, type Tab } from './chrome'
import { ShareBlock, SOCIAL, emailHref, useNativeShare } from './share'
import { SmallCopy } from './ui'

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
              <button type="button" className="link-btn small" onClick={() => onTab('insights')}>See them in Insights</button>
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
                  {src.kind === 'qr'
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

        </div>
      </div>
    </Shell>
  )
}

const NUDGE_KEY = 'share-nudge-dismissed'

function iconFor(ref: string, kind: string) {
  const social = SOCIAL.find((x) => x.ref === ref)
  if (social) return social.icon
  if (kind === 'qr') return <QrCode aria-hidden />
  if (kind === 'email') return <Mail aria-hidden />
  return <Globe aria-hidden />
}

