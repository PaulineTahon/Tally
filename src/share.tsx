import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Facebook, Instagram, Linkedin, WhatsApp, XLogo } from './brand'
import {
  ArrowUpRight, ChevronDown, Copy, MessageSquareText, SlidersHorizontal, MoreHorizontal, Download, Globe, Check, Mail, Megaphone, Plus, QrCode, Share, PencilLine, Trash2,
} from 'lucide-react'
import { canNativeShare, copyText, FORM_ID, FORM_TITLE, MAIN_QR, MESSAGE_REF, qrUrl, slugify, useIsMobile, useReducedMotion, useStore, type Source } from './store'
import { UpgradeButton, AutoHeight, Collapse, CopyButton, IconSwap, Menu, Pro, QrImage, Segmented, SmallCopy } from './ui'
import { download, fileFor, type QrFormat } from './qr'
import { QR_COPY, fileName, saveOrShare } from './qrpanel'
import { endingCopy, planCopy, rowCopy, shareCopy } from './copy'
import { tick } from './guide'

export type Channel = 'social' | 'email' | 'qr'

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
          <span onClickCapture={() => tick('publish-copy')} style={{ display: 'contents' }}><CopyButton text={url()} className="btn-secondary" big /></span>
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
      <span onClickCapture={() => tick('publish-copy')} style={{ display: 'contents' }}><CopyButton text={url()} /></span>
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
          { value: 'social', label: 'Social', icon: <Megaphone aria-hidden /> },
          { value: 'email', label: 'Email', icon: <Mail aria-hidden /> },
          { value: 'qr', label: 'QR Code', icon: <QrCode aria-hidden /> },
        ]}
      />
    </div>
  )
}

const enc = encodeURIComponent
export const SHARE_TEXT = shareCopy.defaultMessage(FORM_TITLE)

/** WhatsApp opens its own share screen. The rest are Copy, so there's one button per row. */
export const SOCIAL: { ref: string; label: string; icon: ReactNode; open?: (link: string) => string }[] = [
  { ref: 'whatsapp', label: 'WhatsApp', icon: <WhatsApp />, open: (l) => `https://wa.me/?text=${enc(`${SHARE_TEXT} ${l}`)}` },
  { ref: 'instagram', label: 'Instagram', icon: <Instagram /> },
  { ref: 'facebook', label: 'Facebook', icon: <Facebook /> },
  { ref: 'linkedin', label: 'LinkedIn', icon: <Linkedin /> },
  { ref: 'x', label: 'X', icon: <XLogo /> },
]

/** The message you edit is kept for the session, so switching tabs doesn't lose it. */
const draft = { message: SHARE_TEXT, subject: shareCopy.defaultSubject(FORM_TITLE), body: shareCopy.defaultBody(FORM_TITLE) }
const withLink = (text: string, link: string) => `${text.trim()}${text.trim() ? '\n\n' : ''}${link}`
export const emailHref = (link: string, subject = draft.subject, body = draft.body) => `mailto:?subject=${enc(subject)}&body=${enc(withLink(body, link))}`

/* ---------- Link ---------- */

const PREVIEW_DESC = 'Made with Tally, the simplest way to create forms.'

/** Compact: thumbnail on the left, title and description on the right. */
/** Link ending, with every old ending still redirecting and listed under Also works. */
function LinkEnding() {
  const s = useStore()
  const [ending, setEnding] = useState(() => (s.slug === FORM_ID ? 'summer-rsvp' : s.slug))
  const [removing, setRemoving] = useState<string | null>(null)
  const value = ending || s.slug
  const dirty = value !== s.slug
  const pro = s.plan === 'pro'
  // On Free you can try any ending, but saving it is Pro.
  const save = () => { tick('link-ending'); if (!pro) { s.upgrade(); return } s.setSlug(value); s.toast(endingCopy.updated) }
  const also = [...s.oldEndings].reverse()
  return (
    <div className="stack gap-8">
      <span className="field-label row gap-4">{endingCopy.label} <Pro /></span>
      <span className="xs muted">{endingCopy.help}</span>
      <div className="input-group">
        <span className="prefix">tally.so/r/</span>
        <input aria-label="Link ending" value={value} onChange={(e) => setEnding(slugify(e.target.value))} />
      </div>
      {dirty && (
        <div className="callout callout-info xs" role="status">
          <Check aria-hidden />
          <span>{endingCopy.changeNote}</span>
        </div>
      )}
      <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
        {dirty && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEnding(s.slug)}>{endingCopy.cancel}</button>}
        {pro
          ? <button type="button" className="btn btn-black btn-sm" disabled={!dirty || !value} onClick={save}>{dirty ? endingCopy.change : endingCopy.save}</button>
          : <UpgradeButton disabled={!dirty || !value} onClick={save} />}
      </div>
      {(also.length > 0 || s.slug !== FORM_ID) && (
        <div className="stack gap-4 also-works">
          <span className="field-label">{endingCopy.alsoWorks}</span>
          <span className="xs muted">{endingCopy.alsoWorksHelp}</span>
          <ul className="also-list">
            {also.map((e) => (
              <li key={e}>
                {removing === e ? (
                  <div className="stack gap-8 grow" role="alertdialog" aria-label={endingCopy.removeConfirm(`tally.so/r/${e}`)}>
                    <span className="small">{endingCopy.removeConfirm(`tally.so/r/${e}`)}</span>
                    <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRemoving(null)}>{endingCopy.cancel}</button>
                      <button type="button" className="btn btn-danger btn-sm" autoFocus onClick={() => { s.removeEnding(e); setRemoving(null); s.toast(endingCopy.removed(`tally.so/r/${e}`)) }}>{endingCopy.remove}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="grow small mono-ish">tally.so/r/{e}</span>
                    <button type="button" className="link-btn small" onClick={() => setRemoving(e)}>{endingCopy.remove}</button>
                  </>
                )}
              </li>
            ))}
            {s.slug !== FORM_ID && (
              <li><span className="grow small mono-ish">tally.so/r/{FORM_ID}</span><span className="xs muted">{endingCopy.formId}</span></li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Under the link bar: two quiet links that open in place. The link preview lives in More Link Options. */
function LinkDetails() {
  const s = useStore()
  const [domain, setDomain] = useState('')
  const [more, setMore] = useState(false)
  const [embed, setEmbed] = useState(false)
  const [lpTitle, setLpTitle] = useState(FORM_TITLE)
  const [lpDesc, setLpDesc] = useState(PREVIEW_DESC)
  const [lpImg, setLpImg] = useState<string | null>(null)
  const defaultImg = `${import.meta.env.BASE_URL}link-preview.jpg`
  const resetPreview = () => { setLpTitle(FORM_TITLE); setLpDesc(PREVIEW_DESC); setLpImg(null) }
  const previewDirty = lpTitle !== FORM_TITLE || lpDesc !== PREVIEW_DESC || lpImg !== null
  return (
    <div className="stack gap-8">
      <div className="row link-extras">
        <button type="button" className="link-btn embed-toggle" aria-expanded={more} aria-controls="more-options" onClick={() => setMore((v) => !v)}>
          More Link Options <Pro /><ChevronDown aria-hidden className="expand-chev" style={{ transform: more ? 'rotate(180deg)' : undefined }} />
        </button>
        <button type="button" className="link-btn embed-toggle" aria-expanded={embed} aria-controls="embed-options" onClick={() => setEmbed((v) => !v)}>
          Embed on your site<ChevronDown aria-hidden className="expand-chev" style={{ transform: embed ? 'rotate(180deg)' : undefined }} />
        </button>
      </div>
      <Collapse open={more} id="more-options" gap={8}>
        <div className="stack gap-12 more-box">
          <LinkEnding />
          <hr className="divider" />
          <div className="stack gap-8">
            <span className="field-label row gap-4">Custom Domain <Pro /></span>
            <span className="xs muted">Use your own, like forms.yourdomain.com.</span>
            <div className="input-group">
              <span className="prefix">https://</span>
              <input aria-label="Custom domain" placeholder="forms.yourdomain.com" value={domain} onChange={(e) => setDomain(e.target.value.trim().toLowerCase())} />
            </div>
            <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
              {s.plan === 'pro'
                ? <button type="button" className="btn btn-black btn-sm" disabled={!domain} onClick={() => { s.setDomain(domain); s.toast(planCopy.domainSaved) }}>Save</button>
                : <UpgradeButton disabled={!domain} onClick={s.upgrade} />}
            </div>
          </div>
          <hr className="divider" />
          <div className="stack gap-8" id="lp-edit">
            <span className="field-label row gap-4">Link Preview <Pro /></span>
            <span className="xs muted">What people see when you paste the link in a chat or a post.</span>
            <div className="lp-row" aria-label="Link preview">
              <img className="lp-thumb" src={lpImg || defaultImg} alt="" />
              <span className="lp-title grow">{lpTitle || FORM_TITLE}</span>
              <label className="btn btn-secondary btn-sm">Replace image
                <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setLpImg(URL.createObjectURL(f)) }} />
              </label>
            </div>
            <label className="field-label" htmlFor="lp-title">Title</label>
            <input id="lp-title" className="input" value={lpTitle} onChange={(e) => setLpTitle(e.target.value)} />
            <label className="field-label" htmlFor="lp-desc">Description</label>
            <input id="lp-desc" className="input" value={lpDesc} onChange={(e) => setLpDesc(e.target.value)} />
            <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
              {previewDirty && <button type="button" className="btn btn-ghost btn-sm" onClick={resetPreview}>Cancel</button>}
              {s.plan === 'pro'
                ? <button type="button" className="btn btn-black btn-sm" disabled={!previewDirty} onClick={() => s.toast(planCopy.previewSaved)}>Save</button>
                : <UpgradeButton disabled={!previewDirty} onClick={s.upgrade} />}
            </div>
          </div>
        </div>
      </Collapse>
      <Collapse open={embed} id="embed-options" gap={8}><EmbedPanel /></Collapse>
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
  // Copied message is an Insights source, not a place you made, so it isn't listed.
  const rows = only ? s.placements : s.sources.filter((p) => p.ref !== MAIN_QR && p.ref !== MESSAGE_REF)
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
  const hit = useRef<HTMLSpanElement>(null)
  const [pulsing, setPulsing] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  // Jumped to from the QR Code button: bring the row into view, focus it, pulse once.
  useEffect(() => {
    if (!pulse) return
    const el = li.current
    if (!el) return
    el.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
    ;(hit.current ?? el).focus({ preventScroll: true })
    setPulsing(false)
    const r = requestAnimationFrame(() => setPulsing(true))
    const t = window.setTimeout(() => setPulsing(false), 1000)
    return () => { cancelAnimationFrame(r); window.clearTimeout(t) }
  }, [pulse]) // eslint-disable-line react-hooks/exhaustive-deps
  const { settings } = s
  const style = settings.style
  const [menu, setMenu] = useState(false)
  const [up, setUp] = useState(false)
  const [copied, setCopied] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(p.label)
  const [confirming, setConfirming] = useState(false)
  const more = useRef<HTMLButtonElement>(null)
  const qr = p.kind === 'qr'
  const link = qr ? qrUrl(p.ref) : s.url(p.ref)
  const n = `${p.responses} ${p.responses === 1 ? 'response' : 'responses'}`
  // Print-size PNG by default; SVG and PDF sit in the menu.
  const fmt: QrFormat = 'png'
  const download1 = async (f: QrFormat) => {
    const o = { url: link, shortLink: s.shortLink, style, showLink: settings.showLink }
    download(await fileFor(o, f), fileName(p.ref, f))
    s.markDownloaded()
    if (main) tick('download-main')
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
  // Code rows use the same plain icon as the QR Code button; the full code is one click away.
  const icon = qr
    ? <span className="src-icon is-code" aria-hidden><QrCode /></span>
    : <span className="src-icon" aria-hidden>{sourceIcon(p)}</span>
  const openCode = () => { s.setQrRef(p.ref); s.setQrOpen(true) }
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
    <li ref={li} tabIndex={-1} className={[pulsing ? 'is-pulse' : '', qr ? 'is-clickable' : ''].join(' ').trim() || undefined}
      onClick={qr ? (e) => { if (!(e.target as HTMLElement).closest('button, a, [role="menu"]')) openCode() } : undefined}>
      {qr ? (
        <span ref={hit} className="row-hit" role="button" tabIndex={0} aria-label={`${p.label}, ${n}. Open code`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCode() } }}>
          {icon}
          <span className="title grow">{p.label}</span>
          <span className="xs muted count">{n}</span>
        </span>
      ) : <>
        {icon}
        <span className="title grow">{p.label}</span>
        <span className="xs muted count">{n}</span>
      </>}
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
          <button role="menuitem" onClick={pick(copy)}><Copy aria-hidden />{rowCopy.copyLink}</button>
          {qr && <button role="menuitem" onClick={pick(() => { setName(p.label); setRenaming(true) })}><PencilLine aria-hidden />{rowCopy.rename}</button>}
          {!qr && <a role="menuitem" className="menu-link" href={link} target="_blank" rel="noreferrer" onClick={() => setMenu(false)}><ArrowUpRight aria-hidden />{rowCopy.openLink}</a>}
          {qr && <div className="menu-sep" role="separator" />}
          {qr && (['png', 'svg', 'pdf'] as QrFormat[]).map((f) => (
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

/** With only the main code, the tab shows the code itself. */
function SingleCode({ pulse }: { pulse: number }) {
  const s = useStore()
  const reduced = useReducedMotion()
  const p = s.placements[0]
  const style = s.settings.style
  const link = qrUrl(p.ref)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(p.label)
  const [pulsing, setPulsing] = useState(false)
  const [done, setDone] = useState<QrFormat | null>(null)
  const card = useRef<HTMLDivElement>(null)
  const primary = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!pulse || !card.current) return
    card.current.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
    primary.current?.focus({ preventScroll: true })
    setPulsing(false)
    const r = requestAnimationFrame(() => setPulsing(true))
    const t = window.setTimeout(() => setPulsing(false), 1000)
    return () => { cancelAnimationFrame(r); window.clearTimeout(t) }
  }, [pulse]) // eslint-disable-line react-hooks/exhaustive-deps
  const mobile = useIsMobile()
  const opts = { url: link, shortLink: s.shortLink, style, showLink: s.settings.showLink }
  const flash = (f: QrFormat) => { s.markDownloaded(); tick('download-main'); setDone(f); window.setTimeout(() => setDone(null), 2000) }
  const get = async (f: QrFormat) => {
    download(await fileFor(opts, f), fileName(p.ref, f))
    flash(f)
    s.toast(QR_COPY.downloaded)
  }
  // Phones: the system share sheet with the PNG, which covers Save to Photos.
  const share = async () => { flash('png'); if ((await saveOrShare(opts, p.ref)) === 'downloaded') s.toast(QR_COPY.downloaded) }
  const save = () => { s.renameSource(p.ref, name); setRenaming(false); s.toast(rowCopy.renamed(name.trim())) }
  return (
    <div ref={card} className={`single-code ${pulsing ? 'is-pulse' : ''}`}>
      <button type="button" className="single-preview" aria-label={`Open ${p.label} full size`} onClick={() => { s.setQrRef(p.ref); s.setQrOpen(true) }}>
        <QrImage url={link} style={style} size={168} label={`QR code that opens ${s.display()}`} />
        {s.settings.showLink && <span className="single-link">{s.shortLink}</span>}
      </button>
      <div className="stack gap-8 single-side">
        {renaming ? (
          <form className="row gap-8" onSubmit={(e) => { e.preventDefault(); save() }}>
            <input className="input input-sm grow" autoFocus aria-label={`New name for ${p.label}`} value={name}
              onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setRenaming(false) } }} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setName(p.label); setRenaming(false) }}>{rowCopy.cancel}</button>
            <button type="submit" className="btn btn-black btn-sm" disabled={!name.trim()}>Save</button>
          </form>
        ) : (
          <div className="row gap-8">
            <b className="single-name">{p.label}</b>
            <button type="button" className="link-btn xs" onClick={() => { setName(p.label); setRenaming(true) }}>{rowCopy.rename}</button>
          </div>
        )}
        <p className="small muted" style={{ margin: 0 }}>Your QR code is ready. Download it and add it to a poster, flyer or slide.</p>
        <div className="row gap-8 single-dl">
          <button ref={primary} type="button" className={`btn btn-black btn-sm single-primary ${done === 'png' ? 'is-copied' : ''}`}
            aria-label={mobile ? QR_COPY.saveOrShare : rowCopy.download(p.label, 'png')} onClick={() => (mobile ? share() : get('png'))}>
            {mobile ? <Share aria-hidden /> : <IconSwap on={done === 'png'} icon="download" />}{mobile ? QR_COPY.saveOrShare : QR_COPY.downloadPng}
          </button>
          {(['svg', 'pdf'] as QrFormat[]).map((f) => (
            <button key={f} type="button" className="btn btn-secondary btn-sm" aria-label={rowCopy.download(p.label, f)} onClick={() => get(f)}>{f.toUpperCase()}</button>
          ))}
        </div>
        <div>
          <button type="button" className="link-btn small" onClick={() => { s.setQrRef(p.ref); s.setQrPersonalize(true); s.setQrOpen(true) }}>
            <SlidersHorizontal aria-hidden />Personalize
          </button>
        </div>
      </div>
    </div>
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
  const single = s.placements.length <= 1
  return (
    <div className="stack gap-12">
      {/* One code: the code itself. Two or more: the list. The box eases between the two. */}
      <AutoHeight k={single ? 'one' : 'list'} slow>
        {single ? <SingleCode pulse={pulse} /> : (
          <div className="stack gap-12">
            <p className="small muted" style={{ margin: 0 }}>Your QR code is ready. Download it and add it to a poster, flyer or slide.</p>
            <PlaceList only="qr" pulse={pulse} />
          </div>
        )}
      </AutoHeight>
      <div className="stack gap-4">
        <div>
          <button type="button" className="link-btn small add-code-link" aria-expanded={adding} aria-controls="add-code" onClick={() => setAdding((v) => !v)}>
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

/** One channel row: the whole row is the tap target. WhatsApp opens, the rest copy and confirm in place. */
function ChannelRow({ icon, label, href, text, aria }: { icon: ReactNode; label: string; href?: string; text?: string; aria: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>()
  const copy = async () => {
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
    if (text) await copyText(text)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const body = <>
    <span className="row-icon">{icon}</span>
    <span className="title grow">{label}</span>
    <span className="ch-trail" data-on={copied} aria-hidden>
      {href ? <ArrowUpRight className="ch-a" /> : <><Copy className="ch-a" /><span className="ch-b"><Check />{shareCopy.copiedInline}</span></>}
    </span>
  </>
  return (
    <li>
      {href
        ? <a className="ch-row" href={href} target="_blank" rel="noreferrer" aria-label={aria}>{body}</a>
        : <button type="button" className={`ch-row ${copied ? 'is-copied' : ''}`} aria-label={aria} onClick={copy}>{body}<span className="sr-only" aria-live="polite">{copied ? shareCopy.copiedInline : ''}</span></button>}
    </li>
  )
}

function SocialPanel() {
  const s = useStore()
  const [message, setMessage] = useState(draft.message)
  const [editing, setEditing] = useState(false)
  const field = useRef<HTMLTextAreaElement>(null)
  const editBtn = useRef<HTMLButtonElement>(null)
  const update = (v: string) => { draft.message = v; setMessage(v) }
  const done = () => { setEditing(false); requestAnimationFrame(() => editBtn.current?.focus({ preventScroll: true })) }
  useEffect(() => { if (editing) field.current?.focus({ preventScroll: true }) }, [editing])
  return (
    <div className="stack gap-8">
      {editing ? (
        <div className="stack gap-8 msg-edit">
          <div className="row-between">
            <label className="field-label" htmlFor="share-message">{shareCopy.messageLabel}</label>
            <button type="button" className="link-btn quiet small" onClick={done}>{shareCopy.messageDone}</button>
          </div>
          <textarea ref={field} id="share-message" className="input textarea" rows={2} value={message} onChange={(e) => update(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); done() } }} />
          <span className="xs muted">{shareCopy.messageHint}</span>
        </div>
      ) : (
        <div className="msg-line">
          <span className="msg-label">{shareCopy.messageLabel}:</span>
          <span className="msg-text">{message.trim() || shareCopy.messageEmpty}</span>
          <button ref={editBtn} type="button" className="link-btn quiet small" aria-label={shareCopy.editMessage} onClick={() => setEditing(true)}>{shareCopy.edit}</button>
        </div>
      )}
      <ul className="ch-list" aria-label="Share to">
        {SOCIAL.map((x) => x.open
          ? <ChannelRow key={x.ref} icon={x.icon} label={x.label} aria={`${shareCopy.send} on ${x.label}`} href={`https://wa.me/?text=${enc(`${message.trim()} ${s.url(x.ref)}`)}`} />
          : <ChannelRow key={x.ref} icon={x.icon} label={x.label} aria={`${shareCopy.copyFor(x.label)}`} text={s.url(x.ref)} />)}
        <ChannelRow icon={<MessageSquareText aria-hidden />} label={shareCopy.copyMessageAndLink} aria={shareCopy.copyMessageAria}
          text={withLink(message, s.url(MESSAGE_REF)).replace('\n\n', ' ')} />
      </ul>
    </div>
  )
}

function EmailPanel() {
  const s = useStore()
  const [subject, setSubject] = useState(draft.subject)
  const [body, setBody] = useState(draft.body)
  const copy = async () => { await copyText(withLink(body, s.url(MESSAGE_REF))); s.toast(shareCopy.emailCopied) }
  return (
    <div className="stack gap-8">
      <p className="small muted" style={{ margin: 0 }}>{shareCopy.emailIntro}</p>
      <div className="email-draft stack gap-8">
        <label className="field-label" htmlFor="email-subject">{shareCopy.subjectLabel}</label>
        <input id="email-subject" className="input" value={subject} onChange={(e) => { draft.subject = e.target.value; setSubject(e.target.value) }} />
        <label className="field-label" htmlFor="email-body">{shareCopy.bodyLabel}</label>
        <textarea id="email-body" className="input textarea" rows={4} value={body} onChange={(e) => { draft.body = e.target.value; setBody(e.target.value) }} />
        <span className="xs muted">{shareCopy.linkNote} <span className="mono-ish">{s.display('email')}</span></span>
      </div>
      <div className="row gap-8">
        <a className="btn btn-secondary btn-sm" href={emailHref(s.url('email'), subject, body)}><Mail aria-hidden />{shareCopy.openMail}</a>
        <button type="button" className="btn btn-secondary btn-sm" onClick={copy}><Copy aria-hidden />{shareCopy.copyEmail}</button>
      </div>
      <p className="xs muted" style={{ margin: 0 }}>{shareCopy.emailHint}</p>
    </div>
  )
}

export function ChannelPanel({ channel, pulse = 0 }: { channel: Channel; pulse?: number }) {
  if (channel === 'qr') return <QrCodePanel pulse={pulse} />
  if (channel === 'social') return <SocialPanel />
  return <EmailPanel />
}

let lastChannel: Channel = 'social'

export function ShareBlock() {
  const [channel, setChannelState] = useState<Channel>(lastChannel)
  const setChannel = (c: Channel) => { lastChannel = c; setChannelState(c) }
  // Counts jumps from the QR Code button, so the main code row can pulse each time.
  const [jump, setJump] = useState(0)
  return (
    <div className="stack gap-16">
      <LinkBar onQr={() => { setChannel('qr'); setJump((j) => j + 1) }} />
      <LinkDetails />
      <ChannelPicker value={channel} onChange={(c) => { setJump(0); setChannel(c) }} />
      <div role="tabpanel"><AutoHeight k={channel}><ChannelPanel channel={channel} pulse={jump} /></AutoHeight></div>
    </div>
  )
}

