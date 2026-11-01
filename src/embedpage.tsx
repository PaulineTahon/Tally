import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, CircleHelp, Code2, Eye, X } from 'lucide-react'
import { FORM_ID, useIsMobile, useStore } from './store'
import { Pro, SmallCopy } from './ui'
import { EGG_TITLE, embedCopy, embedPageCopy as C } from './copy'
import { EMBEDS, embedCode, type EmbedMode } from './share'

/**
 * Tally's Embed page, as it is today: options on the left, a live preview on the right where the form
 * really works. Close goes back to the share sheet, still on the Embed tab.
 */
export function EmbedPage({ mode: initial, onClose }: { mode: EmbedMode; onClose: () => void }) {
  const s = useStore()
  const mobile = useIsMobile()
  const [mode, setMode] = useState<EmbedMode>(initial)
  const [code, setCode] = useState(false)
  const head = useRef<HTMLHeadingElement>(null)
  // Standard
  const [height, setHeight] = useState(200)
  const [dynamic, setDynamic] = useState(true)
  const [transparent, setTransparent] = useState(true)
  // Popup
  const [open, setOpen] = useState<string>(C.openOptions[0])
  const [position, setPosition] = useState<string>(C.positionOptions[0])
  const [width, setWidth] = useState(376)
  const [overlay, setOverlay] = useState(false)
  const [emojiOn, setEmojiOn] = useState(true)
  const [emoji, setEmoji] = useState('👋')
  const [anim, setAnim] = useState<string>(C.animations[0])
  const [hideOnSubmit, setHideOnSubmit] = useState(false)
  // Shared, with Tally's defaults per layout
  const [hideTitle, setHideTitle] = useState(initial === 'standard')
  const [alignLeft, setAlignLeft] = useState(initial === 'standard')
  const [track, setTrack] = useState(false)
  const [branding, setBranding] = useState(true)
  const [popupShown, setPopupShown] = useState(true)
  const pickMode = (m: EmbedMode) => {
    setMode(m); setCode(false); setPopupShown(true)
    setHideTitle(m === 'standard'); setAlignLeft(m === 'standard')
  }
  const close = () => {
    onClose()
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`.embed-card[data-mode="${initial}"]`)?.focus())
  }
  useEffect(() => {
    requestAnimationFrame(() => head.current?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('.up-screen')) return
      e.stopImmediatePropagation(); e.preventDefault(); close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Pro switches on Free open the plans, like the Save buttons do.
  const proSwitch = (v: boolean, set: (v: boolean) => void) => (s.plan === 'pro' ? set(v) : s.upgrade())
  const snippet = embedCode(mode, FORM_ID)
  const form = <PreviewForm hideTitle={hideTitle} alignLeft={alignLeft} branding={branding} onDone={hideOnSubmit ? () => setPopupShown(false) : undefined} />
  return createPortal(
    <div className="ep" role="dialog" aria-modal="true" aria-labelledby="ep-title">
      <aside className="ep-panel">
        <div className="ep-head">
          <h2 id="ep-title" ref={head} tabIndex={-1}>{C.title}</h2>
          <button type="button" className="ep-close" onClick={close}>{C.close}</button>
        </div>
        <Select label={C.type} value={mode} onChange={(v) => pickMode(v as EmbedMode)} options={EMBEDS.map((e) => [e.id, e.label])} hideLabel />
        {code
          ? <button type="button" className="btn btn-secondary ep-get" onClick={() => setCode(false)}><Eye aria-hidden />{C.backToPreview}</button>
          : <button type="button" className="btn btn-black ep-get" onClick={() => setCode(true)}><Code2 aria-hidden />{C.getCode}</button>}
        {mode === 'standard' && <div className="ep-sub"><SmallCopy text={`https://tally.so/embed/${FORM_ID}`} label={C.copyEmbedLink} toastText={C.embedLinkCopied} /></div>}
        <hr className="divider" />
        <div className="ep-opts-head">
          <h3>{C.options}</h3>
          <a className="ep-help" href={embedCopy.helpUrl} target="_blank" rel="noreferrer"><CircleHelp aria-hidden />{C.help}<span className="sr-only"> {embedCopy.newTab}</span></a>
        </div>
        <div className="ep-opts">
          {mode === 'standard' && <>
            <NumberField label={C.height} value={height} onChange={setHeight} />
            <Toggle label={C.dynamicHeight} help value={dynamic} onChange={setDynamic} />
            <Toggle label={C.hideTitle} value={hideTitle} onChange={setHideTitle} />
            <Toggle label={C.alignLeft} value={alignLeft} onChange={setAlignLeft} />
            <Toggle label={C.transparent} value={transparent} onChange={setTransparent} />
          </>}
          {mode === 'popup' && <>
            <Select label={C.open} value={open} onChange={setOpen} options={C.openOptions.map((o) => [o, o])} />
            <Select label={C.position} value={position} onChange={setPosition} options={C.positionOptions.map((o) => [o, o])} />
            <NumberField label={C.width} value={width} onChange={setWidth} />
            <Toggle label={C.hideTitle} value={hideTitle} onChange={setHideTitle} />
            <Toggle label={C.alignLeft} value={alignLeft} onChange={setAlignLeft} />
            <Toggle label={C.overlay} value={overlay} onChange={setOverlay} />
            <div className="ep-opt-group">
              <Toggle label={C.emoji} value={emojiOn} onChange={setEmojiOn} bare />
              {emojiOn && <>
                <input className="input" aria-label={C.emoji} value={emoji} onChange={(e) => setEmoji(e.target.value)} />
                <Select label={C.animation} value={anim} onChange={setAnim} options={C.animations.map((a) => [a, a])} hideLabel bare />
              </>}
            </div>
            <Toggle label={C.hideOnSubmit} help value={hideOnSubmit} onChange={setHideOnSubmit} />
          </>}
          {mode === 'fullpage' && <Toggle label={C.transparent} value={transparent} onChange={setTransparent} />}
          <Toggle label={C.track} help value={track} onChange={setTrack} />
          <Toggle label={C.customDomain} pro help value={false} onChange={(v) => proSwitch(v, () => {})} />
          <Toggle label={C.branding} pro help value={branding} onChange={(v) => proSwitch(v, setBranding)} />
        </div>
      </aside>
      <main className={`ep-preview ${code ? 'is-code' : ''}`}>
        {code ? (
          <div className="ep-code">
            <h3>{C.codeTitle}</h3>
            <p>{C.codeHelp}</p>
            <pre>{snippet}</pre>
            <SmallCopy text={snippet} label={C.copyCode} toastText={C.codeCopied} />
          </div>
        ) : (
          <>
            {mode !== 'fullpage' && <span className="ep-label">{C.preview}</span>}
            {mode === 'fullpage' ? (
              <div className={`ep-full ${transparent ? 'is-clear' : ''}`}>{form}</div>
            ) : (
              <div className="ep-site" aria-label={C.preview}>
                <i className="sk sk-h" /><i className="sk sk-l" />
                <div className="sk-row"><i className="sk sk-a" /><i className="sk sk-b" /></div>
                {mode === 'standard' && (
                  <div className={`ep-inline ${transparent ? 'is-clear' : ''}`} style={dynamic ? undefined : { height, overflowY: 'auto' }}>{form}</div>
                )}
                <i className="sk sk-big" />
                <div className="sk-row"><i className="sk sk-c" /><i className="sk sk-c" /></div>
              </div>
            )}
                {mode === 'popup' && (popupShown ? (
                  <>
                    {overlay && <div className="ep-overlay" aria-hidden />}
                    <div className={`ep-popup ${position === C.positionOptions[1] ? 'is-center' : ''}`} style={{ width: mobile ? undefined : width }} role="dialog" aria-label={EGG_TITLE}>
                      {emojiOn && <span className={`ep-emoji anim-${anim.toLowerCase().replace(/\s+/g, '-')}`} aria-hidden>{emoji}</span>}
                      <button type="button" className="ep-popup-x" aria-label={C.closePopup} onClick={() => setPopupShown(false)}><X aria-hidden /></button>
                      <div className="ep-popup-body">{form}</div>
                    </div>
                  </>
                ) : (
                  <button type="button" className="btn btn-black btn-sm ep-reopen" data-ep-open onClick={() => setPopupShown(true)}>{C.openPopup}</button>
                ))}
          </>
        )}
      </main>
    </div>,
    document.body,
  )
}

/** The prototype's own form, small and real: type your name and submit. */
function PreviewForm({ hideTitle, alignLeft, branding, onDone }: { hideTitle: boolean; alignLeft: boolean; branding: boolean; onDone?: () => void }) {
  const [name, setName] = useState('')
  const [sent, setSent] = useState(false)
  const submit = () => { setSent(true); if (onDone) window.setTimeout(onDone, 1200) }
  return (
    <div className={`ep-form ${alignLeft ? 'is-left' : ''}`}>
      {sent ? (
        <div className="ep-thanks" role="status"><b>{C.thanks}</b><span>{C.thanksSub}</span></div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); submit() }}>
          {!hideTitle && <h4>{EGG_TITLE}</h4>}
          <label className="ep-q" htmlFor="ep-name">{C.yourName}</label>
          <input id="ep-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="btn btn-black btn-sm ep-submit">{C.submit} →</button>
        </form>
      )}
      {branding && <span className="ep-made">{C.madeWith}</span>}
    </div>
  )
}

function Toggle({ label, value, onChange, help = false, pro = false, bare = false }: { label: string; value: boolean; onChange: (v: boolean) => void; help?: boolean; pro?: boolean; bare?: boolean }) {
  return (
    <div className={`ep-opt ep-toggle ${bare ? 'is-bare' : ''}`}>
      <span className="ep-opt-label">{label}{pro && <Pro />}{help && <CircleHelp aria-hidden className="ep-q-ico" />}</span>
      <button type="button" role="switch" aria-checked={value} aria-label={label} className="switch" onClick={() => onChange(!value)} />
    </div>
  )
}

function Select({ label, value, onChange, options, hideLabel = false, bare = false }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; hideLabel?: boolean; bare?: boolean }) {
  return (
    <label className={`ep-opt ep-field ${bare ? 'is-bare' : ''}`}>
      <span className={hideLabel ? 'sr-only' : 'ep-opt-label'}>{label}</span>
      <span className="ep-select">
        <select value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
        <ChevronDown aria-hidden />
      </span>
    </label>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }): ReactNode {
  return (
    <label className="ep-opt ep-field">
      <span className="ep-opt-label">{label}</span>
      <span className="input-group">
        <input type="number" inputMode="numeric" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
        <span className="suffix">px</span>
      </span>
    </label>
  )
}
