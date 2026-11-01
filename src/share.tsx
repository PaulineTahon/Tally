import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Facebook, Instagram, Linkedin, WhatsApp, XLogo } from './brand'
import {
  ArrowLeft, ArrowUpRight, ChevronRight, Code2, Image as ImageIcon, Copy, SlidersHorizontal, MoreHorizontal, Download, Globe, Check, Link2, Mail, Megaphone, Plus, QrCode, Share, PencilLine, Trash2,
} from 'lucide-react'
import { canNativeShare, copyText, FORM_ID, FORM_TITLE, MAIN_QR, MAIN_QR_LABEL, qrUrl, slugify, useIsMobile, useReducedMotion, useStore, type Source } from './store'
import { UpgradeButton, AutoHeight, Collapse, CopyButton, IconSwap, Menu, PanelStack, Pro, QrImage, Segmented, SmallCopy } from './ui'
import { download, fileFor, type QrFormat } from './qr'
import { QR_COPY, fileName, saveOrShare } from './qrpanel'
import { embedCopy, endingCopy, linkCopy, planCopy, rowCopy, shareCopy } from './copy'
import { tick } from './guide'

export type Channel = 'link' | 'qr' | 'social' | 'embed'

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

/** The link and Copy, the one primary action, always on top. The pencil opens the link options in the Link tab. */
export function LinkBar({ onEdit }: { onEdit?: () => void }) {
  const { display, url } = useStore()
  const mobile = useIsMobile()
  const share = useNativeShare()
  const edit = onEdit && (
    <button type="button" className="field-icon-btn" aria-label={shareCopy.editLink} title={shareCopy.editLink} onClick={onEdit}><PencilLine aria-hidden /></button>
  )
  if (mobile) {
    return (
      <div className="stack gap-8">
        <div className="input-group" style={{ height: 44 }}>
          <span className="prefix">https://</span>
          <input readOnly value={display()} aria-label="Form link" onFocus={(e) => e.currentTarget.select()} />
          {edit}
        </div>
        <div className="row gap-8">
          <button type="button" className="btn btn-black btn-lg" style={{ flex: 1 }} onClick={() => share(url())}>
            <Share aria-hidden />Share
          </button>
          <span onClickCapture={() => tick('publish-copy')} style={{ display: 'contents' }}><CopyButton text={url()} className="btn-secondary" big /></span>
        </div>
      </div>
    )
  }
  return (
    <div className="row gap-8">
      <div className="input-group" style={{ flex: 1 }}>
        <input readOnly value={display()} aria-label="Form link" onFocus={(e) => e.currentTarget.select()} />
        {edit}
      </div>
      <span onClickCapture={() => tick('publish-copy')} style={{ display: 'contents' }}><CopyButton text={url()} /></span>
    </div>
  )
}

export function ChannelPicker({ value, onChange }: { value: Channel; onChange: (c: Channel) => void }) {
  return (
    <div className="stack gap-8 share-to">
      <div className="xs muted" style={{ fontWeight: 600 }}>Share To</div>
      <Segmented<Channel>
        label="Share to" value={value} onChange={onChange}
        options={[
          { value: 'link', label: 'Link', icon: <Link2 aria-hidden /> },
          { value: 'qr', label: 'QR Code', icon: <QrCode aria-hidden /> },
          { value: 'social', label: 'Social', icon: <Megaphone aria-hidden /> },
          { value: 'embed', label: 'Embed', icon: <Code2 aria-hidden /> },
        ]}
      />
    </div>
  )
}

const enc = encodeURIComponent

/** Each row shares just its own tagged link. WhatsApp and Email open their app; the rest copy. */
export const SOCIAL: { ref: string; label: string; icon: ReactNode; open?: (link: string) => string }[] = [
  { ref: 'whatsapp', label: 'WhatsApp', icon: <WhatsApp />, open: (l) => `https://wa.me/?text=${enc(l)}` },
  { ref: 'instagram', label: 'Instagram', icon: <Instagram /> },
  { ref: 'facebook', label: 'Facebook', icon: <Facebook /> },
  { ref: 'linkedin', label: 'LinkedIn', icon: <Linkedin /> },
  { ref: 'x', label: 'X', icon: <XLogo /> },
]

export const emailHref = (link: string) => `mailto:?subject=${enc(FORM_TITLE)}&body=${enc(link)}`

/* ---------- Link ---------- */

const PREVIEW_DESC = 'Made with Tally, the simplest way to create forms.'

/** Link ending, with every old ending still redirecting and listed under Also works. */
function LinkEnding() {
  const s = useStore()
  const [ending, setEnding] = useState(() => (s.slug === FORM_ID ? 'summer-rsvp' : s.slug))
  const [removing, setRemoving] = useState<string | null>(null)
  const value = ending || s.slug
  const dirty = value !== s.slug
  const pro = s.plan === 'pro'
  // On Free you can try any ending, but saving it is Pro. What you typed stays put.
  const save = () => { tick('link-ending'); if (!pro) { s.upgrade(); return } s.setSlug(value); s.toast(endingCopy.updated) }
  const also = [...s.oldEndings].reverse()
  return (
    <div className="stack gap-8">
      <span className="field-label">{endingCopy.label}</span>
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
          ? <button type="button" className="btn btn-secondary btn-sm" disabled={!dirty || !value} onClick={save}>{dirty ? endingCopy.change : endingCopy.save}</button>
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

export type LinkView = 'main' | 'ending' | 'preview'
const LINK_VIEWS: LinkView[] = ['main', 'ending', 'preview']

/** How the link shows up when it's pasted in a chat or a post. */
function PreviewCard({ img, title, desc }: { img: string; title: string; desc: string }) {
  return (
    <div className="lp-card" role="img" aria-label={`Link preview: ${title}. ${desc}`}>
      <img className="lp-card-img" src={img} alt="" />
      <span className="lp-card-text" aria-hidden>
        <span className="lp-card-site">tally.so</span>
        <span className="lp-card-title">{title}</span>
        <span className="lp-card-desc">{desc}</span>
      </span>
    </div>
  )
}

/** Back arrow and title at the top of a view inside the Link tab. The title takes focus on the way in. */
function ViewHead({ title, onBack, headRef }: { title: string; onBack: () => void; headRef: React.RefObject<HTMLHeadingElement> }) {
  return (
    <div className="lt-head">
      <button type="button" className="lt-back" aria-label={linkCopy.back} title={linkCopy.back} onClick={onBack}><ArrowLeft aria-hidden /></button>
      <h3 ref={headRef} tabIndex={-1}>{title}</h3>
    </div>
  )
}

/**
 * Link tab: the preview card, then two quiet rows that each open a view inside the tab.
 * Every view stays mounted, so going Back keeps what you typed as a draft. Back never saves.
 */
function LinkPanel({ view, setView }: { view: LinkView; setView: (v: LinkView) => void }) {
  const s = useStore()
  const [domain, setDomain] = useState('')
  const [lpTitle, setLpTitle] = useState(FORM_TITLE)
  const [lpDesc, setLpDesc] = useState(PREVIEW_DESC)
  const [lpImg, setLpImg] = useState<string | null>(null)
  const defaultImg = `${import.meta.env.BASE_URL}link-preview.jpg`
  const resetPreview = () => { setLpTitle(FORM_TITLE); setLpDesc(PREVIEW_DESC); setLpImg(null) }
  const previewDirty = lpTitle !== FORM_TITLE || lpDesc !== PREVIEW_DESC || lpImg !== null
  const card = <PreviewCard img={lpImg || defaultImg} title={lpTitle || FORM_TITLE} desc={lpDesc} />
  // Focus: the view title on the way in, the row you came from on the way back.
  const heads = { ending: useRef<HTMLHeadingElement>(null), preview: useRef<HTMLHeadingElement>(null) }
  const rows = { ending: useRef<HTMLButtonElement>(null), preview: useRef<HTMLButtonElement>(null) }
  const prev = useRef<LinkView>(view)
  const [enterKey, setEnterKey] = useState(0)
  useEffect(() => {
    const from = prev.current
    prev.current = view
    if (view !== 'main') heads[view].current?.focus({ preventScroll: true })
    else if (from !== 'main') rows[from].current?.focus({ preventScroll: true })
  }, [view, enterKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const open = (v: LinkView) => { setView(v); setEnterKey((k) => k + 1) }
  const back = () => setView('main')
  const main = (
    <div className="stack gap-12">
      <div className="stack gap-8">
        {card}
        <span className="xs muted">{linkCopy.previewHelp}</span>
      </div>
      <div className="lt-rows">
        <button ref={rows.ending} type="button" className="lt-row" onClick={() => open('ending')}>
          <Globe aria-hidden className="lt-ico" />
          <span className="lt-title">{linkCopy.endingRow} <Pro /></span>
          <ChevronRight aria-hidden className="lt-chev" />
        </button>
        <button ref={rows.preview} type="button" className="lt-row" onClick={() => open('preview')}>
          <ImageIcon aria-hidden className="lt-ico" />
          <span className="lt-title">{linkCopy.previewRow}</span>
          <span className="lt-meta">{linkCopy.customize} <Pro /></span>
          <ChevronRight aria-hidden className="lt-chev" />
        </button>
      </div>
    </div>
  )
  const ending = (
    <div className="stack gap-12">
      <ViewHead title={linkCopy.endingRow} onBack={back} headRef={heads.ending} />
      <LinkEnding />
      <hr className="divider" />
      <div className="stack gap-8">
        <span className="field-label">Custom Domain</span>
        <span className="xs muted">{linkCopy.domainHelp}</span>
        <div className="input-group">
          <span className="prefix">https://</span>
          <input aria-label="Custom domain" placeholder="forms.yourdomain.com" value={domain} onChange={(e) => setDomain(e.target.value.trim().toLowerCase())} />
        </div>
        <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
          {s.plan === 'pro'
            ? <button type="button" className="btn btn-secondary btn-sm" disabled={!domain} onClick={() => { s.setDomain(domain); s.toast(planCopy.domainSaved) }}>Save</button>
            : <UpgradeButton disabled={!domain} onClick={s.upgrade} />}
        </div>
      </div>
    </div>
  )
  const preview = (
    <div className="stack gap-12">
      <ViewHead title={linkCopy.previewRow} onBack={back} headRef={heads.preview} />
      {card}
      <div className="row-between">
        <span className="field-label">Image</span>
        <label className="btn btn-secondary btn-sm">Replace image
          <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setLpImg(URL.createObjectURL(f)) }} />
        </label>
      </div>
      <label className="field-label" htmlFor="lp-title">Title</label>
      <input id="lp-title" className="input" value={lpTitle} onChange={(e) => setLpTitle(e.target.value)} />
      <label className="field-label" htmlFor="lp-desc">Description</label>
      <input id="lp-desc" className="input" value={lpDesc} onChange={(e) => setLpDesc(e.target.value)} />
      <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
        {previewDirty && <button type="button" className="btn btn-ghost btn-sm" onClick={resetPreview}>{endingCopy.cancel}</button>}
        {s.plan === 'pro'
          ? <button type="button" className="btn btn-secondary btn-sm" disabled={!previewDirty} onClick={() => s.toast(planCopy.previewSaved)}>Save</button>
          : <UpgradeButton disabled={!previewDirty} onClick={s.upgrade} />}
      </div>
    </div>
  )
  const nodes: Record<LinkView, ReactNode> = { main, ending, preview }
  return <PanelStack active={view} plain panels={LINK_VIEWS.map((v) => ({ key: v, node: nodes[v] }))} />
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
      <p className="small muted" style={{ margin: 0 }}>{embedCopy.intro}{mobile && ` ${embedCopy.desktop}`} <a className="link-btn small inline-link" href={embedCopy.helpUrl} target="_blank" rel="noreferrer">{embedCopy.help}<span className="sr-only"> {embedCopy.newTab}</span></a></p>
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
  // The form's own code lives in the QR Code tab only, so it shows up once.
  // Copied message is an Insights source, not a place you made, so it isn't listed.
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
  const hit = useRef<HTMLSpanElement>(null)
  const [pulsing, setPulsing] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  // When asked to (pulse > 0): bring the row into view, focus it, pulse once.
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
  // Code rows use the same plain QR icon as the QR Code tab; the full code is one click away.
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
            <button type="submit" className="btn btn-secondary btn-sm" disabled={!name.trim()}>Save</button>
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

/** With only one code, the tab shows the code itself. */
function SingleCode({ pulse }: { pulse: number }) {
  const s = useStore()
  const reduced = useReducedMotion()
  const p = s.placements[0]
  const style = s.settings.style
  const link = qrUrl(p.ref)
  const [formats, setFormats] = useState(false)
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
  return (
    <div ref={card} className={`single-code ${pulsing ? 'is-pulse' : ''}`}>
      <button type="button" className="single-preview" aria-label={`Open ${p.label} full size`} onClick={() => { s.setQrRef(p.ref); s.setQrOpen(true) }}>
        <QrImage url={link} style={style} size={160} label={`QR code that opens ${s.display()}`} />
        {s.settings.showLink && <span className="single-link">{s.shortLink}</span>}
      </button>
      <div className="stack gap-8 single-side">
        {/* One code: nothing to tell apart, so no Rename. It comes back on every code once there are two. */}
        <b className="single-name">{p.ref === MAIN_QR && p.label === MAIN_QR_LABEL ? QR_COPY.yourCode : p.label}</b>
        <p className="small muted" style={{ margin: 0 }}>{QR_COPY.readyLine}</p>
        <div className="row gap-8 single-dl">
          <button ref={primary} type="button" className={`btn btn-secondary btn-sm single-primary ${done === 'png' ? 'is-copied' : ''}`}
            aria-label={mobile ? QR_COPY.saveOrShare : rowCopy.download(p.label, 'png')} onClick={() => (mobile ? share() : get('png'))}>
            {mobile ? <Download aria-hidden /> : <IconSwap on={done === 'png'} icon="download" />}{mobile ? QR_COPY.saveOrShare : QR_COPY.downloadPng}
          </button>
        </div>
        <div className="row gap-16 single-more">
          <button type="button" className="link-btn small" aria-expanded={formats} aria-controls="qr-formats" onClick={() => setFormats((v) => !v)}>{QR_COPY.moreFormats}</button>
          <button type="button" className="link-btn small" onClick={() => { s.setQrRef(p.ref); s.setQrPersonalize(true); s.setQrOpen(true) }}>
            <SlidersHorizontal aria-hidden />Personalize
          </button>
        </div>
        <Collapse open={formats} id="qr-formats" gap={8}>
          <div className="row gap-8">
            {(['svg', 'pdf'] as QrFormat[]).map((f) => (
              <button key={f} type="button" className={`btn btn-secondary btn-sm ${done === f ? 'is-copied' : ''}`} aria-label={rowCopy.download(p.label, f)} onClick={() => get(f)}>
                <Download aria-hidden />{f.toUpperCase()}
              </button>
            ))}
          </div>
        </Collapse>
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
      {href
        ? <span className="ch-a"><ArrowUpRight />{shareCopy.open}</span>
        : <><span className="ch-a"><Copy />{shareCopy.copyLink}</span><span className="ch-b"><Check />{shareCopy.copiedInline}</span></>}
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
  return (
    <div className="stack gap-8">
      <p className="small muted" style={{ margin: 0 }}>{shareCopy.tagLine}</p>
      <ul className="ch-list" aria-label="Share to">
        {SOCIAL.map((x) => x.open
          ? <ChannelRow key={x.ref} icon={x.icon} label={x.label} aria={shareCopy.openFor(x.label)} href={x.open(s.url(x.ref))} />
          : <ChannelRow key={x.ref} icon={x.icon} label={x.label} aria={shareCopy.copyFor(x.label)} text={s.url(x.ref)} />)}
        <ChannelRow icon={<Mail aria-hidden />} label="Email" aria={shareCopy.openFor('Email')} href={emailHref(s.url('email'))} />
      </ul>
    </div>
  )
}

export function ChannelPanel({ channel, pulse = 0, view = 'main', setView = () => {} }: { channel: Channel; pulse?: number; view?: LinkView; setView?: (v: LinkView) => void }) {
  if (channel === 'link') return <LinkPanel view={view} setView={setView} />
  if (channel === 'qr') return <QrCodePanel pulse={pulse} />
  if (channel === 'social') return <SocialPanel />
  return <EmbedPanel />
}

/** The last Share To tab you used, kept per browser. Link until you pick another. */
const TAB_KEY = 'share-tab'
const CHANNELS: Channel[] = ['link', 'qr', 'social', 'embed']
function readChannel(): Channel {
  try { const v = localStorage.getItem(TAB_KEY) as Channel | null; return v && CHANNELS.includes(v) ? v : 'link' } catch { return 'link' }
}
function saveChannel(c: Channel) { try { localStorage.setItem(TAB_KEY, c) } catch { /* private mode */ } }

/** `first`: the sheet right after a form's first publish, which always opens on Link. */
export function ShareBlock({ first = false }: { first?: boolean }) {
  const [channel, setChannelState] = useState<Channel>(() => { if (first) { saveChannel('link'); return 'link' } return readChannel() })
  const setChannel = (c: Channel) => { saveChannel(c); setChannelState(c) }
  const [view, setView] = useState<LinkView>('main')
  // The pencil on the link: Link tab, straight into Link ending and domain.
  const editLink = () => { setChannel('link'); setView('ending') }
  return (
    <div className="stack gap-16">
      <LinkBar onEdit={editLink} />
      <ChannelPicker value={channel} onChange={setChannel} />
      <PanelStack active={channel} label="Share to" panels={CHANNELS.map((c) => ({ key: c, node: <ChannelPanel channel={c} view={view} setView={setView} /> }))} />
    </div>
  )
}

