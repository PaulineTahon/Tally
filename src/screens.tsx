import { useState } from 'react'
import { X, Plus, GripVertical, Undo2, Redo2, Eye, Settings2, Palette, ChevronRight, Check, Zap } from 'lucide-react'
import { EXAMPLE_UNTAGGED, FORM_TITLE, copyText, useIsMobile, useStore } from './store'
import { DashHeader, FormTitle, Shell, TallyMark, Avatar, type Tab } from './chrome'
import { publishCopy, shareCopy } from './copy'
import { CoverArt, VISUAL_URL } from './coverArt'
import { ShareBlock, SOCIAL, useNativeShare } from './share'

/* ---------- Editor ---------- */

export type PublishState = 'first' | 'empty' | 'data'

export function Editor({ onPublished, published, pub }: { onPublished: (first: boolean) => void; published: boolean; pub: PublishState }) {
  const mobile = useIsMobile()
  const s = useStore()
  const [phase, setPhase] = useState<'idle' | 'done'>(published ? 'done' : 'idle')
  const publish = () => {
    // The very first publish of this form, as opposed to reopening the sheet from Published.
    const first = pub === 'first' && phase === 'idle'
    setPhase('done')
    // The full sheet only helps when nobody has answered yet. After that, a quiet toast with a way back to it.
    if (pub === 'data') s.toast(publishCopy.updated, { action: { label: publishCopy.share, onClick: () => onPublished(false) } })
    else onPublished(first)
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
            {phase === 'done' ? <><Check aria-hidden />Published</> : 'Publish'}
          </button>
        </div>
      </header>
      <main className="editor-canvas">
        <div className="cover" aria-hidden><CoverArt url={VISUAL_URL('qr-cover')} slice /></div>
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
  const share = useNativeShare()
  const best = [...s.sources].sort((a, b) => b.responses - a.responses)[0]
  const total = s.sources.reduce((t, x) => t + x.responses, 0) + EXAMPLE_UNTAGGED
  // A social or Email copies its tagged link, never opening the app or the site.
  const bestCopies = best.ref === 'email' || SOCIAL.some((x) => x.ref === best.ref)
  const copyBest = async () => { await copyText(s.url(best.ref)); s.toast(shareCopy.copiedFor(best.label)) }
  // The note stays closed once you close it. #/share?nudge=1 brings it back, to try it again.
  const [nudgeGone, setNudgeGone] = useState(() => {
    try {
      if (/[?&]nudge=1\b/.test(window.location.hash)) { localStorage.removeItem(NUDGE_KEY); return false }
      return localStorage.getItem(NUDGE_KEY) === '1'
    } catch { return false }
  })
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
              <span className="nudge-action">
                {bestCopies
                  ? <button type="button" className="btn btn-secondary btn-sm" onClick={copyBest}>{shareCopy.copyFor(best.label)}</button>
                  : <button type="button" className="btn btn-secondary btn-sm" onClick={() => best.ref === 'qr' ? (s.setQrRef('qr'), s.setQrOpen(true)) : share(s.url(best.ref))}>Share on {best.label}</button>}
              </span>
              <button type="button" className="btn btn-ghost btn-sm icon-btn" aria-label="Dismiss" onClick={dismissNudge}><X aria-hidden /></button>
            </div>
          )}

          <section className="stack gap-16" aria-labelledby="share-h">
            <h2 id="share-h" className="section-h">Share Link</h2>
            <ShareBlock />
          </section>

        </div>
      </div>
    </Shell>
  )
}

const NUDGE_KEY = 'share-nudge-dismissed'


