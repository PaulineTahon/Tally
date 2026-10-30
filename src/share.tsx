import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Facebook, Instagram, Linkedin, WhatsApp, XLogo } from './brand'
import {
  ArrowUpRight, ChevronDown, Code, Copy, MoreHorizontal, Download, Globe, Link2, Mail, Megaphone, Plus, QrCode, Settings2, Share, TriangleAlert, PencilLine, Trash2,
} from 'lucide-react'
import { canNativeShare, copyText, FORM_ID, FORM_TITLE, MAIN_QR, slugify, useIsMobile, useReducedMotion, useStore, type Source } from './store'
import { AutoHeight, Collapse, CopyButton, Expand, IconSwap, Menu, Pro, QrImage, Segmented, SmallCopy } from './ui'
import { download, fileFor, type QrFormat } from './qr'
import { fileName, safeStyle } from './qrpanel'
import { rowCopy } from './copy'

export type Channel = 'link' | 'social' | 'email' | 'qr'

export function useNativeShare() {
  const { toast } = useStore()
  return async (url: string) => {
    if (canNativeShare()) {
      try {
        await navigator.share({ title: FORM_TITLE, text: `Got a minute? ${FORM_TITLE}`, url })
      } catch {
        /* closed by the user */
      }
      return
    }
    // No native share here, so fall back to Copy. Never a dead button.
    await copyText(url)
    toast('Link copied. Go spread the word.')
  }
}

/** Link, single Copy and the QR Code button, which opens the QR Code tab below. */
export function LinkBar({ onQr }: { onQr: () => void }) {
  const { display, url } = useStore()
  const mobile = useIsMobile()
  const share = useNativeShare()
  const openQr = onQr
  if (mobile) {
    return (
      <div className="stack gap-8">
        <div className="input-group" style={{ height: 44 }}>
          <span className="prefix">https://</span>
          <input readOnly value={display()} aria-label="Form link" onFocus={(e) => e.currentTarget.select()} />
        </div>
        {/* One row of actions, so the Share To options stay above the fold. */}
        <div className="row gap-8">
          <button type="button" className="btn btn-black btn-lg" style={{ flex: 1 }} onClick={() => share(url())}>
            <Share aria-hidden />Share
          </button>
          <CopyButton text={url()} className="btn-secondary" big />
          <button type="button" className="btn btn-secondary btn-lg" onClick={openQr}>
            <QrCode aria-hidden />QR Code
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="row gap-8">
      <div className="input-group" style={{ flex: 1 }}>
        <input readOnly value={display()} aria-label="Form link" onFocus={(e) => e.currentTarget.select()} />
      </div>
      <CopyButton text={url()} />
      <button type="button" className="btn btn-secondary" onClick={openQr}>
        <QrCode aria-hidden />QR Code
      </button>
    </div>
  )
}

export function ChannelPicker({ value, onChange }: { value: Channel; onChange: (c: Channel) => void }) {
  return (
    <div className="stack gap-8">
      <div className="xs muted" style={{ fontWeight: 600 }}>Share To</div>
      <Segmented<Channel>
        label="Share to" value={value} onChange={onChange}
        options={[
          { value: 'link', label: 'Link', icon: <Link2 aria-hidden /> },
          { value: 'social', label: 'Social', icon: <Megaphone aria-hidden /> },
          { value: 'email', label: 'Email', icon: <Mail aria-hidden /> },
          { value: 'qr', label: 'QR Code', icon: <QrCode aria-hidden /> },
        ]}
      />
    </div>
  )
}

function Row({ icon, title, help, right }: { icon?: ReactNode; title: ReactNode; help?: ReactNode; right?: ReactNode }) {
  return (
    <div className="list-row is-static">
      {icon && <span className="row-icon">{icon}</span>}
      <span className="grow"><span className="title row gap-8">{title}</span>{help && <span className="help" style={{ display: 'block' }}>{help}</span>}</span>
      {right}
    </div>
  )
}

const enc = encodeURIComponent
export const SHARE_TEXT = `Quick one: ${FORM_TITLE}. It takes a minute.`

/** WhatsApp opens its own share screen. The rest are Copy, so there's one button per row. */
export const SOCIAL: { ref: string; label: string; icon: ReactNode; open?: (link: string) => string }[] = [
  { ref: 'whatsapp', label: 'WhatsApp', icon: <WhatsApp />, open: (l) => `https://wa.me/?text=${enc(`${SHARE_TEXT} ${l}`)}` },
  { ref: 'instagram', label: 'Instagram', icon: <Instagram /> },
  { ref: 'facebook', label: 'Facebook', icon: <Facebook /> },
  { ref: 'linkedin', label: 'LinkedIn', icon: <Linkedin /> },
  { ref: 'x', label: 'X', icon: <XLogo /> },
]

const EMAIL_SUBJECT = `Quick one: ${FORM_TITLE}`
const emailBody = (link: string) => `Hi!\n\nWe're getting the picnic together and would love to know if you can make it. It takes a minute:\n\n${link}`
export const emailHref = (link: string) => `mailto:?subject=${enc(EMAIL_SUBJECT)}&body=${enc(emailBody(link))}`

/* ---------- Link ---------- */

const PREVIEW_DESC = 'Made with Tally, the simplest way to create forms.'

/** Compact: thumbnail on the left, title and description on the right. */
export function LinkPreviewCard({ title, desc, img }: { title: string; desc: string; img: string }) {
  return (
    <div className="lp-compact" aria-label="Link preview">
      <img className="lp-thumb" src={img} alt="" />
      <span className="lp-text">
        <span className="lp-title">{title || FORM_TITLE}</span>
        <span className="lp-desc">{desc}</span>
      </span>
    </div>
  )
}

function LinkPanel() {
  const s = useStore()
  const [open, setOpen] = useState(false)
  const [ending, setEnding] = useState('')
  const [customize, setCustomize] = useState(false)
  const [lpTitle, setLpTitle] = useState(FORM_TITLE)
  const [lpDesc, setLpDesc] = useState(PREVIEW_DESC)
  const [lpImg, setLpImg] = useState<string | null>(null)
  const defaultImg = `${import.meta.env.BASE_URL}link-preview.jpg`
  const value = ending || s.slug
  const dirty = value !== s.slug
  const toggle = () => { if (!open) setEnding(s.slug === FORM_ID ? 'summer-rsvp' : s.slug); setOpen((v) => !v) }
  const save = () => { s.setSlug(value); s.toast('Link updated.'); setEnding('') }
  const resetPreview = () => { setCustomize(false); setLpTitle(FORM_TITLE); setLpDesc(PREVIEW_DESC); setLpImg(null) }
  return (
    <div className="stack gap-12" id="panel-link">
      <LinkPreviewCard title={customize ? lpTitle : FORM_TITLE} desc={customize ? lpDesc : PREVIEW_DESC} img={(customize && lpImg) || defaultImg} />
      {/* One row, one Pro pill. Everything opens in place. */}
      <Expand id="more" icon={<Settings2 aria-hidden />} title={<>More Link Options <Pro /></>}
        open={open} onToggle={toggle}>
        <div className="stack gap-8">
          <span className="field-label row gap-4">Link Ending <Pro /></span>
          <span className="xs muted">Make it yours, like tally.so/r/summer-rsvp.</span>
          <div className="input-group">
            <span className="prefix">tally.so/r/</span>
            <input aria-label="Link ending" value={value} onChange={(e) => setEnding(slugify(e.target.value))} />
          </div>
          {dirty && (
            <div className="callout callout-warn xs" role="alert">
              <TriangleAlert aria-hidden />
              <span>Printed QR codes and links you've already shared point to <b>{s.shortLink}</b>. Change it, and they stop working.</span>
            </div>
          )}
          <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
            {dirty && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEnding(s.slug)}>Cancel</button>}
            <button type="button" className="btn btn-black btn-sm" disabled={!dirty || !value} onClick={save}>{dirty ? 'Change link' : 'Save'}</button>
          </div>
        </div>
        <hr className="divider" />
        <div className="stack gap-8">
          <span className="field-label row gap-4">Custom Domain <Pro /></span>
          <span className="xs muted">Use your own, like forms.yourdomain.com.</span>
          <div className="input-group is-disabled">
            <span className="prefix">https://</span>
            <input aria-label="Custom domain" placeholder="forms.yourdomain.com" disabled />
          </div>
          <div><button type="button" className="link-btn small">Upgrade plan</button></div>
        </div>
        <hr className="divider" />
        <div className="stack gap-8">
          <span className="field-label row gap-4">Link Preview <Pro /></span>
          {!customize ? (
            <div><button type="button" className="link-btn small" onClick={() => setCustomize(true)}>Customize</button></div>
          ) : (
            <>
              <label className="field-label" htmlFor="lp-title">Title</label>
              <input id="lp-title" className="input" value={lpTitle} onChange={(e) => setLpTitle(e.target.value)} />
              <label className="field-label" htmlFor="lp-desc">Description</label>
              <input id="lp-desc" className="input" value={lpDesc} onChange={(e) => setLpDesc(e.target.value)} />
              <div className="row-between">
                <span className="field-label">Image</span>
                <label className="btn btn-secondary btn-sm">Replace
                  <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setLpImg(URL.createObjectURL(f)) }} />
                </label>
              </div>
              <div className="callout callout-info xs"><span>Try it, then upgrade to apply.</span></div>
              <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={resetPreview}>Cancel</button>
                <button type="button" className="btn btn-blue btn-sm">Upgrade to apply</button>
              </div>
            </>
          )}
        </div>
      </Expand>
    </div>
  )
}

/* ---------- Embed ---------- */

type EmbedMode = 'standard' | 'popup' | 'fullpage'
const EMBEDS: { id: EmbedMode; label: string }[] = [
  { id: 'standard', label: 'Standard' }, { id: 'popup', label: 'Popup' }, { id: 'fullpage', label: 'Full page' },
]

function embedCode(mode: EmbedMode, slug: string) {
  if (mode === 'popup') return `<button data-tally-open="${slug}" data-tally-emoji-text="👋" data-tally-emoji-animation="wave">RSVP</button>\n<script async src="https://tally.so/widgets/embed.js"></script>`
  if (mode === 'fullpage') return `<iframe data-tally-src="https://tally.so/r/${slug}?transparentBackground=1" width="100%" height="100%" frameborder="0" marginheight="0" marginwidth="0" title="${FORM_TITLE}" style="position:absolute;inset:0;border:0"></iframe>\n<script async src="https://tally.so/widgets/embed.js"></script>`
  return `<iframe data-tally-src="https://tally.so/embed/${slug}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1" loading="lazy" width="100%" height="320" frameborder="0" marginheight="0" marginwidth="0" title="${FORM_TITLE}"></iframe>\n<script async src="https://tally.so/widgets/embed.js"></script>`
}

/** A tiny, real-looking version of the form. */
export function MiniForm({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`mini-form ${compact ? 'is-compact' : ''}`} aria-hidden>
      <span className="mf-title">{FORM_TITLE}</span>
      <span className="mf-label">What's your name?</span>
      <span className="mf-input" />
      <span className="mf-label">Are you coming?</span>
      <span className="mf-choice"><i />Yes, count me in</span>
      <span className="mf-choice"><i />Maybe</span>
      {!compact && <span className="mf-choice"><i />Can't make it</span>}
      <span className="mf-btn">Submit</span>
    </span>
  )
}

export function EmbedThumb({ mode }: { mode: EmbedMode }) {
  return (
    <span className={`embed-thumb ${mode}`} aria-hidden>
      {mode !== 'fullpage' && <><i className="et-h" /><i className="et-l" /><i className="et-l short" /></>}
      {mode === 'standard' && <span className="et-inline"><MiniForm compact /></span>}
      {mode === 'standard' && <><i className="et-l" /><i className="et-l short" /></>}
      {mode === 'popup' && <><i className="et-l" /><i className="et-l" /><i className="et-l short" /><span className="et-pop"><MiniForm compact /></span></>}
      {mode === 'fullpage' && <span className="et-full"><MiniForm /></span>}
    </span>
  )
}

function EmbedPanel() {
  const s = useStore()
  const mobile = useIsMobile()
  const [mode, setMode] = useState<EmbedMode | null>(null)
  return (
    <div className="stack gap-12">
      <p className="small muted" style={{ margin: 0 }}>Use these options to embed your form into your own website.{mobile && ' Works best on desktop.'}</p>
      <div className="embed-cards is-sheet" role="radiogroup" aria-label="Embed type">
        {EMBEDS.map((e) => (
          <button type="button" key={e.id} className="embed-card" role="radio" aria-checked={mode === e.id} onClick={() => setMode(e.id)}>
            <EmbedThumb mode={e.id} />
            <span>{e.label}</span>
          </button>
        ))}
      </div>
      {mode && (
        <div className="stack gap-8">
          <pre className="code-box">{embedCode(mode, s.slug)}</pre>
          <div><SmallCopy text={embedCode(mode, s.slug)} label="Copy code" toastText="Embed code copied." /></div>
        </div>
      )}
    </div>
  )
}

/** Secondary: a plain link that opens the embed options in place. */
function EmbedLink() {
  const [open, setOpen] = useState(false)
  return (
    <div className="stack gap-12 embed-link">
      <button type="button" className="link-btn embed-toggle" aria-expanded={open} aria-controls="embed-options" onClick={() => setOpen((v) => !v)}>
        <Code aria-hidden />Embed on your site<ChevronDown aria-hidden className="expand-chev" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
      </button>
      <Collapse open={open} id="embed-options" gap={12}><EmbedPanel /></Collapse>
    </div>
  )
}

/* ---------- Codes and tracked links: one list ---------- */

const SUGGESTED = ['Poster', 'Flyer', 'Slides', 'Newspaper']

function sourceIcon(src: Source) {
  const social = SOCIAL.find((x) => x.ref === src.ref)
  if (social) return social.icon
  if (src.kind === 'email') return <Mail aria-hidden />
  return <Globe aria-hidden />
}

/** Every code and tracked link, by place name. Refs only live in the URLs and file names. */
export function PlaceList({ only, pulse = 0 }: { only?: 'qr'; pulse?: number }) {
  const s = useStore()
  // The main code lives in the QR Code tab only, so it shows up once.
  const rows = only ? s.placements : s.sources.filter((p) => p.ref !== MAIN_QR)
  if (!rows.length) return null
  return (
    <ul className="placements" aria-label={only ? 'Your QR codes' : 'Your codes and tracked links'}>
      {rows.map((p) => <PlaceRow key={p.ref} p={p} pulse={p.ref === MAIN_QR ? pulse : 0} />)}
    </ul>
  )
}

/** Same row for every place: icon, name, responses, one icon action, then everything else under More. */
function PlaceRow({ p, pulse }: { p: Source; pulse: number }) {
  const s = useStore()
  const reduced = useReducedMotion()
  const li = useRef<HTMLLIElement>(null)
  const [pulsing, setPulsing] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  // Jumped to from the QR Code button: bring the row into view, focus it, pulse once.
  useEffect(() => {
    if (!pulse) return
    const el = li.current
    if (!el) return
    el.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
    el.focus({ preventScroll: true })
    setPulsing(false)
    const r = requestAnimationFrame(() => setPulsing(true))
    const t = window.setTimeout(() => setPulsing(false), 1000)
    return () => { cancelAnimationFrame(r); window.clearTimeout(t) }
  }, [pulse]) // eslint-disable-line react-hooks/exhaustive-deps
  const { settings } = s
  const style = safeStyle(settings.style)
  const [menu, setMenu] = useState(false)
  const [up, setUp] = useState(false)
  const [copied, setCopied] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(p.label)
  const [confirming, setConfirming] = useState(false)
  const more = useRef<HTMLButtonElement>(null)
  const qr = p.kind === 'qr'
  const link = s.url(p.ref)
  const n = `${p.responses} ${p.responses === 1 ? 'response' : 'responses'}`
  const fmt = settings.format
  const download1 = async (f: QrFormat) => {
    const o = { url: link, shortLink: s.shortLink, style, madeWithTally: true }
    download(await fileFor(o, f), fileName(p.ref, f))
    s.markDownloaded()
    setDownloaded(true); window.setTimeout(() => setDownloaded(false), 2000)
    s.toast('QR code downloaded. Time to print!')
  }
  const copy = async () => {
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    await copyText(link); s.toast('Link copied. Go spread the word.')
  }
  const openMenu = () => {
    // Open upward when there isn't room below, so the menu never hides under the sheet edge.
    const r = more.current?.getBoundingClientRect()
    const box = more.current?.closest('.modal-body, .sheet-body')?.getBoundingClientRect()
    const floor = Math.min(window.innerHeight, box?.bottom ?? Infinity)
    setUp(!!r && r.bottom + (qr ? (main ? 270 : 320) : 100) > floor)
    setMenu((m) => !m)
  }
  const pick = (fn: () => void) => () => { setMenu(false); fn() }
  const main = p.ref === MAIN_QR
  const remove = () => {
    // Always asks first. Its responses stay in Insights either way.
    setConfirming(true)
  }
  const confirmDelete = () => { s.removeSource(p.ref); s.toast(rowCopy.deleted(p.label)) }
  const icon = qr
    ? <span className="qr-thumb is-static" aria-hidden><QrImage url={link} style={style} size={30} label="" /></span>
    : <span className="src-icon" aria-hidden>{sourceIcon(p)}</span>
  if (renaming) {
    const save = () => { s.renameSource(p.ref, name); setRenaming(false); s.toast(rowCopy.renamed(name.trim())) }
    return (
      <li className="is-editing">
        {icon}
        <form className="stack gap-4 grow" onSubmit={(e) => { e.preventDefault(); save() }}>
          <div className="row gap-8">
            <input className="input input-sm grow" autoFocus aria-label={`New name for ${p.label}`} value={name}
              onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setRenaming(false) } }} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setName(p.label); setRenaming(false) }}>Cancel</button>
            <button type="submit" className="btn btn-black btn-sm" disabled={!name.trim()}>Save</button>
          </div>
          <span className="xs muted">The link stays the same, so printed codes keep working.</span>
        </form>
      </li>
    )
  }
  if (confirming) {
    return (
      <li className="is-editing is-confirm" role="alertdialog" aria-labelledby={`del-${p.ref}`} aria-describedby={`del-${p.ref}-d`}>
        {icon}
        <div className="stack gap-4 grow">
          <b id={`del-${p.ref}`} className="small">{rowCopy.deleteTitle(p.label)}</b>
          <span id={`del-${p.ref}-d`} className="xs muted">{[rowCopy.deleteKept(p.responses), rowCopy.deleteUntag(p.label)].filter(Boolean).join(' ')}</span>
          <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>{rowCopy.cancel}</button>
            <button type="button" className="btn btn-danger btn-sm" autoFocus onClick={confirmDelete}>{rowCopy.deleteConfirm}</button>
          </div>
        </div>
      </li>
    )
  }
  return (
    <li ref={li} tabIndex={-1} className={pulsing ? 'is-pulse' : undefined}>
      {icon}
      <span className="title grow">{p.label}</span>
      <span className="xs muted count">{n}</span>
      {qr ? (
        <button type="button" className={`btn btn-secondary btn-sm icon-btn ${downloaded ? 'is-copied' : ''}`} data-tip={rowCopy.download(p.label, fmt)} aria-label={rowCopy.download(p.label, fmt)} onClick={() => download1(fmt)}>
          <IconSwap on={downloaded} icon="download" />
          <span className="sr-only" aria-live="polite">{downloaded ? 'Downloaded' : ''}</span>
        </button>
      ) : (
        <button type="button" className={`btn btn-secondary btn-sm icon-btn ${copied ? 'is-copied' : ''}`} data-tip={rowCopy.copyLink} aria-label={`${rowCopy.copyLink}: ${p.label}`} onClick={copy}>
          <IconSwap on={copied} />
          <span className="sr-only" aria-live="polite">{copied ? 'Copied' : ''}</span>
        </button>
      )}
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <button ref={more} type="button" className="btn btn-ghost btn-sm icon-btn" aria-label={`More for ${p.label}`} aria-haspopup="menu" aria-expanded={menu} onClick={openMenu}>
          <MoreHorizontal aria-hidden />
        </button>
        <Menu open={menu} onClose={() => setMenu(false)} style={up ? { bottom: 34, right: 0, minWidth: 200 } : { top: 34, right: 0, minWidth: 200 }}>
          {qr && <button role="menuitem" onClick={pick(() => { s.setQrRef(p.ref); s.setQrOpen(true) })}><QrCode aria-hidden />View code</button>}
          <button role="menuitem" onClick={pick(copy)}><Copy aria-hidden />{rowCopy.copyLink}</button>
          {qr && <button role="menuitem" onClick={pick(() => { setName(p.label); setRenaming(true) })}><PencilLine aria-hidden />{rowCopy.rename}</button>}
          {!qr && <a role="menuitem" className="menu-link" href={link} target="_blank" rel="noreferrer" onClick={() => setMenu(false)}><ArrowUpRight aria-hidden />{rowCopy.openLink}</a>}
          {qr && <div className="menu-sep" role="separator" />}
          {qr && (['svg', 'pdf', 'png'] as QrFormat[]).map((f) => (
            <button key={f} role="menuitem" onClick={pick(() => download1(f))}><Download aria-hidden />Download {f.toUpperCase()}</button>
          ))}
          {qr && !main && <div className="menu-sep" role="separator" />}
          {qr && !main && <button role="menuitem" className="danger" onClick={pick(remove)}><Trash2 aria-hidden />{rowCopy.delete}</button>}
        </Menu>
      </span>
    </li>
  )
}

/** The same add input everywhere: it asks for a place name, never a ref. */
export function AddPlace({ label, onAdd, placeholder = 'Place name, like Poster or Library' }: { label: string; onAdd: (name: string) => void; placeholder?: string }) {
  const [name, setName] = useState('')
  const field = useRef<HTMLInputElement>(null)
  return (
    <form className="row gap-8" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; field.current?.focus({ preventScroll: true }); onAdd(name.trim()); setName('') }}>
      <input ref={field} className="input" style={{ flex: 1 }} aria-label={label} placeholder={placeholder} value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit" className="btn btn-secondary" disabled={!name.trim()}><Plus aria-hidden />Add</button>
    </form>
  )
}

/** One ready-made code first. Extra codes per place are optional, and free. */
function QrCodePanel({ pulse }: { pulse: number }) {
  const s = useStore()
  const mobile = useIsMobile()
  const [adding, setAdding] = useState(false)
  const add = (label: string) => {
    const p = s.addPlacement(label)
    s.toast(`Code added for ${p.label}`)
  }
  const taken = new Set(s.placements.map((p) => p.label.toLowerCase()))
  const missing = SUGGESTED.filter((l) => !taken.has(l.toLowerCase()))
  return (
    <div className="stack gap-12">
      <p className="small muted" style={{ margin: 0 }}>Your QR code is ready. Download it and add it to a poster, flyer or slide.</p>
      <PlaceList only="qr" pulse={pulse} />
      <div className="stack gap-8">
        <div>
          <button type="button" className="btn btn-secondary btn-sm" aria-expanded={adding} aria-controls="add-code" onClick={() => setAdding((v) => !v)}>
            <Plus aria-hidden />Add another code
          </button>
        </div>
        <span className="xs muted">{mobile ? 'Give each place its own code to see which one works.' : 'Using it in more than one place? Give each place its own code to see which one brings in responses.'}</span>
        <Collapse open={adding} id="add-code" gap={8}>
          <div className="stack gap-8">
            <AddPlace label="Add another code" placeholder={mobile ? 'Like Poster or Slides' : 'Where will it go? Like Poster or Slides'} onAdd={add} />
            {missing.length > 0 && (
              <div className="chips">
                {missing.map((l) => <button key={l} type="button" className="chip" onClick={() => add(l)}><Plus aria-hidden />{l}</button>)}
              </div>
            )}
          </div>
        </Collapse>
      </div>
    </div>
  )
}

/* ---------- Panels ---------- */

export function ChannelPanel({ channel, pulse = 0 }: { channel: Channel; pulse?: number }) {
  const { url } = useStore()
  if (channel === 'link') return <LinkPanel />
  if (channel === 'qr') return <QrCodePanel pulse={pulse} />
  if (channel === 'social') {
    return (
      <div className="stack gap-8">
        <p className="small muted" style={{ margin: 0 }}>Post it where your people are.</p>
        <div className="stack">
          {SOCIAL.map((x) => (
            <Row key={x.ref} icon={x.icon} title={x.label}
              right={x.open
                ? <a className="btn btn-secondary btn-sm" href={x.open(url(x.ref))} target="_blank" rel="noreferrer" aria-label="Send on WhatsApp"><ArrowUpRight aria-hidden />Send</a>
                : <SmallCopy text={url(x.ref)} />} />
          ))}
        </div>
        <p className="xs muted" style={{ margin: 0 }}>Each link is tagged, so you know which post worked.</p>
      </div>
    )
  }
  const link = url('email')
  return (
    <div className="stack gap-8">
      <p className="small muted" style={{ margin: 0 }}>Drop it in your newsletter or inbox.</p>
      <div className="row gap-8">
        <a className="btn btn-secondary btn-sm" href={emailHref(link)}><Mail aria-hidden />Write email</a>
        <SmallCopy text={link} />
      </div>
      <p className="xs muted" style={{ margin: 0 }}>The link is tagged, so you'll see responses from email.</p>
    </div>
  )
}

/** Remembered while the page is open, so coming back from the QR panel lands on the same channel. */
let lastChannel: Channel = 'link'

export function ShareBlock() {
  const [channel, setChannelState] = useState<Channel>(lastChannel)
  const setChannel = (c: Channel) => { lastChannel = c; setChannelState(c) }
  // Counts jumps from the QR Code button, so the main code row can pulse each time.
  const [jump, setJump] = useState(0)
  return (
    <div className="stack gap-16">
      <LinkBar onQr={() => { setChannel('qr'); setJump((j) => j + 1) }} />
      <ChannelPicker value={channel} onChange={(c) => { setJump(0); setChannel(c) }} />
      <div role="tabpanel"><AutoHeight k={channel}><ChannelPanel channel={channel} pulse={jump} /></AutoHeight></div>
      <EmbedLink />
    </div>
  )
}

