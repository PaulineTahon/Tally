import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Facebook, Instagram, Linkedin, WhatsApp, XLogo } from './brand'
import {
  ArrowLeft, ArrowUpRight, Code2, Copy, Image as ImageIcon, SlidersHorizontal, MoreHorizontal, Download, Globe, Check, Mail, Megaphone, Plus, QrCode, Share, PencilLine, Trash2,
} from 'lucide-react'
import { canNativeShare, copyText, FORM_ID, QR_CAPTION, FORM_TITLE, MAIN_QR, MAIN_QR_LABEL, qrUrl, slugify, useIsMobile, useReducedMotion, useStore, type Source } from './store'
import { ActionRow, UpgradeButton, AutoHeight, Collapse, CopyButton, IconSwap, Menu, PanelStack, QrImage, Segmented } from './ui'
import { download, fileFor, type QrFormat } from './qr'
import { DownloadSplit, QR_ALERT, QR_COPY, LogoView, QrDetail, fileName, qrTitle } from './qrpanel'
import { ENDING_GONE_NOTE, OLD_LINK_NOTE, embedCopy, endingCopy, linkCopy, planCopy, rowCopy, shareCopy } from './copy'
import { tick } from './guide'
import { EmbedPage } from './embedpage'

export type Channel = 'qr' | 'social' | 'embed'

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

/** The link and Copy, the one primary action, always on top. The pencil opens Link ending and domain. */
export function LinkBar({ onEdit }: { onEdit?: () => void }) {
  const { display, url } = useStore()
  const mobile = useIsMobile()
  const share = useNativeShare()
  const edit = onEdit && (
    <button type="button" className="field-icon-btn" data-row="ending" aria-label={shareCopy.editLinkName} title={shareCopy.editLink} onClick={onEdit}><PencilLine aria-hidden /></button>
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
      <div className="xs muted" style={{ fontWeight: 600 }}>Share to</div>
      <Segmented<Channel>
        label="Share to" value={value} onChange={onChange}
        options={[
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

export type ChannelView = 'ch-qr' | 'ch-social' | 'ch-embed'
export type LinkView = 'main' | 'ending' | 'preview' | 'code' | 'logo' | ChannelView

/** Inside the share sheet a code opens as a detail view; anywhere else, in its own dialog. */
const OpenCodeCtx = createContext<((ref: string, personalize?: boolean) => void) | null>(null)
function useOpenCode() {
  const s = useStore()
  const ctx = useContext(OpenCodeCtx)
  return ctx ?? ((ref: string, personalize = false) => { s.setQrRef(ref); s.setQrPersonalize(personalize); s.setQrOpen(true) })
}

/** The sheet's views as a stack: a detail view opened from a subpage goes back to that subpage. */
export function useViewStack() {
  const [stack, setStack] = useState<LinkView[]>(['main'])
  const view = stack[stack.length - 1]
  const go = useCallback((v: LinkView) => setStack((st) => (v === 'main' ? ['main'] : st[st.length - 1] === v ? st : [...st, v])), [])
  const back = useCallback(() => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)), [])
  const reset = useCallback(() => setStack(['main']), [])
  return { view, depth: stack.length - 1, go, back, reset }
}
export type ViewNav = ReturnType<typeof useViewStack>

/** `?variant=entry`: three entry rows instead of the tabs, each opening its own subpage. Tabs stay the default. */
export const entryVariant = () => /[?&]variant=entry\b/.test(window.location.hash + window.location.search)

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

export const VIEW_TITLE: Record<Exclude<LinkView, 'main' | 'code'>, string> = {
  ending: linkCopy.endingRow, preview: linkCopy.previewRow, logo: QR_COPY.logoTitle, 'ch-qr': 'QR Code', 'ch-social': 'Social', 'ch-embed': 'Embed',
}

/** Back arrow and title of a detail view. In the share modal it sits in the modal header; on the Share tab page, at the top of the view. */
export function ViewHead({ view, onBack, as = 'h3' }: { view: Exclude<LinkView, 'main'>; onBack: () => void; as?: 'h3' | 'span' }) {
  const s = useStore()
  const T = as
  const title = view === 'code' ? qrTitle(s.placements.find((p) => p.ref === s.qrRef)?.label, s.qrRef) : VIEW_TITLE[view]
  return (
    <span className="lt-head">
      <button type="button" className="lt-back" aria-label={linkCopy.back} title={linkCopy.back} onClick={onBack}><ArrowLeft aria-hidden /></button>
      <T id={`lt-title-${view}`} className="lt-title-text" tabIndex={-1}>{title}</T>
    </span>
  )
}

/** Focus follows the view: its title on the way in, the control that opened it on the way back. */
const openers: Partial<Record<LinkView, HTMLElement | null>> = {}
function useViewFocus(view: LinkView, depth: number) {
  const prev = useRef<{ view: LinkView; depth: number }>({ view, depth })
  useEffect(() => {
    const from = prev.current
    prev.current = { view, depth }
    if (from.view === view) return
    const forward = depth > from.depth || (depth === from.depth && view !== 'main')
    if (forward) openers[view] = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => {
      if (forward) { document.getElementById(`lt-title-${view}`)?.focus({ preventScroll: true }); return }
      const el = openers[from.view]
      if (el && el.isConnected && el.offsetParent) el.focus({ preventScroll: true })
      else ([...document.querySelectorAll<HTMLElement>(`[data-row="${from.view}"]`)].find((e) => e.offsetParent) ?? document.getElementById(`lt-title-${view}`))?.focus({ preventScroll: true })
    })
  }, [view, depth])
}

/** What the link preview shows, shared by the card under the link and its editor. Applies to every link and code. */
interface PreviewDraft { title: string; desc: string; img: string | null }
const PREVIEW_DEFAULT: PreviewDraft = { title: FORM_TITLE, desc: PREVIEW_DESC, img: null }
const previewImg = (d: PreviewDraft) => d.img || `${import.meta.env.BASE_URL}link-preview.jpg`

/** The compact preview card right under the link. Customize sits just under it. */
function PreviewStrip({ draft }: { draft: PreviewDraft }) {
  return (
    <div className="lp-strip" role="group" aria-label={linkCopy.previewRow} aria-description={linkCopy.previewHelp}>
      <img className="lp-strip-img" src={previewImg(draft)} alt="" />
      <span className="lp-strip-text">
        <span className="lp-strip-title">{draft.title || FORM_TITLE}</span>
        <span className="lp-strip-site">tally.so</span>
      </span>
    </div>
  )
}

/** "Both are part of Pro.", with Pro opening the plans on Free. Upgrading there keeps what you typed. */
function BothPro() {
  const s = useStore()
  const [before, pro, after] = linkCopy.bothPro
  return (
    <p className="small muted lt-note">
      {before}{s.plan === 'pro' ? pro : <button type="button" className="inline-link" aria-haspopup="dialog" onClick={s.upgrade}>{pro}</button>}{after}
    </p>
  )
}

const fill = (line: string, link: string) => line.replace('{link}', link)

/**
 * Detail view: custom domain and link ending, saved together with one primary button.
 * A custom ending only lives on your own domain, as an extra address: tally.so/r/<form ID> stays live,
 * and every QR code keeps pointing there. Changing a custom ending you had saved retires the old one.
 */
function EndingView({ inModal, onBack }: { inModal: boolean; onBack: () => void }) {
  const s = useStore()
  const savedEnding = s.domain && s.slug !== FORM_ID ? s.slug : ''
  const [domain, setDomain] = useState(s.domain)
  const [ending, setEnding] = useState(savedEnding)
  const pro = s.plan === 'pro'
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  const next = cleanDomain ? `${cleanDomain}/${ending || FORM_ID}` : `tally.so/r/${FORM_ID}`
  const savedFull = s.shortLink
  const dirty = next !== savedFull
  const hadCustom = !!(s.domain && savedEnding)
  const cancel = () => { setDomain(s.domain); setEnding(savedEnding) }
  const save = () => {
    tick('link-ending')
    if (!pro) { s.upgrade(); return }
    s.setDomain(cleanDomain)
    s.setSlug(cleanDomain && ending ? ending : FORM_ID)
    s.toast(endingCopy.updated)
  }
  return (
    <div className="stack gap-12">
      {!inModal && <ViewHead view="ending" onBack={onBack} />}
      <BothPro />
      <div className="stack gap-8">
        <label className="field-label" htmlFor="lt-domain">Custom Domain</label>
        <span className="xs muted">{linkCopy.domainHelp}</span>
        <div className="input-group">
          <span className="prefix">https://</span>
          <input id="lt-domain" aria-label="Custom domain" placeholder="forms.yourdomain.com" value={domain} onChange={(e) => setDomain(e.target.value.trim().toLowerCase())} />
        </div>
      </div>
      <div className="stack gap-8">
        <label className="field-label" htmlFor="lt-ending">{endingCopy.label}</label>
        <span className="xs muted">{cleanDomain ? endingCopy.help : endingCopy.needsDomain}</span>
        <div className="input-group">
          <span className="prefix">{cleanDomain || 'forms.yourdomain.com'}/</span>
          <input id="lt-ending" aria-label="Link ending" placeholder="summer-rsvp" disabled={!cleanDomain} value={ending} onChange={(e) => setEnding(slugify(e.target.value))} />
        </div>
      </div>
      <div className="lt-result" aria-live="polite">
        <span className="lt-result-label">{dirty ? endingCopy.newLink : endingCopy.yourLink}</span>
        <span className="lt-result-url">{next}</span>
      </div>
      <div className="stack gap-4">
        <p className="xs muted lt-line">{fill(OLD_LINK_NOTE, `tally.so/r/${FORM_ID}`)}</p>
        {hadCustom && dirty && <p className="xs lt-line lt-warn">{fill(ENDING_GONE_NOTE, savedFull)}</p>}
      </div>
      <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
        {dirty && <button type="button" className="btn btn-ghost btn-sm" onClick={cancel}>{endingCopy.cancel}</button>}
        {pro
          ? <button type="button" className="btn btn-black btn-sm save-btn" disabled={!dirty} onClick={save}>{endingCopy.save}</button>
          : <UpgradeButton primary disabled={!dirty} onClick={save} />}
      </div>
    </div>
  )
}

/** Detail view: the link preview editor. Back without saving puts the card back the way it was saved. */
function PreviewView({ inModal, onBack, saved, onSave }: { inModal: boolean; onBack: () => void; saved: PreviewDraft; onSave: (d: PreviewDraft) => void }) {
  const s = useStore()
  const [draft, setDraft] = useState<PreviewDraft>(saved)
  const dirty = draft.title !== saved.title || draft.desc !== saved.desc || draft.img !== saved.img
  return (
    <div className="stack gap-12">
      {!inModal && <ViewHead view="preview" onBack={onBack} />}
      <PreviewCard img={previewImg(draft)} title={draft.title || FORM_TITLE} desc={draft.desc} />
      <span className="xs muted">{linkCopy.previewHelp}</span>
      <div className="row-between">
        <span className="field-label">Image</span>
        <label className="btn btn-secondary btn-sm">Replace image
          <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setDraft({ ...draft, img: URL.createObjectURL(f) }) }} />
        </label>
      </div>
      <label className="field-label" htmlFor="lp-title">Title</label>
      <input id="lp-title" className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      <label className="field-label" htmlFor="lp-desc">Description</label>
      <input id="lp-desc" className="input" value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} />
      <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
        {dirty && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft(saved)}>{endingCopy.cancel}</button>}
        {s.plan === 'pro'
          ? <button type="button" className="btn btn-black btn-sm save-btn" disabled={!dirty} onClick={() => { onSave(draft); s.toast(planCopy.previewSaved) }}>Save</button>
          : <UpgradeButton primary disabled={!dirty} onClick={s.upgrade} />}
      </div>
    </div>
  )
}

/* ---------- Embed ---------- */

export type EmbedMode = 'standard' | 'popup' | 'fullpage'
export const EMBEDS: { id: EmbedMode; label: string }[] = [
  { id: 'standard', label: 'Standard' }, { id: 'popup', label: 'Popup' }, { id: 'fullpage', label: 'Full page' },
]

export function embedCode(mode: EmbedMode, slug: string) {
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

/** Three layouts. Picking one opens Tally's Embed page with that layout ready, where you can try it out. */
function EmbedPanel({ onPick }: { onPick?: (m: EmbedMode) => void }) {
  const mobile = useIsMobile()
  return (
    <div className="stack gap-12">
      <p className="small muted" style={{ margin: 0 }}>{embedCopy.intro}{mobile && ` ${embedCopy.desktop}`} <a className="link-btn small inline-link" href={embedCopy.helpUrl} target="_blank" rel="noreferrer">{embedCopy.help}<span className="sr-only"> {embedCopy.newTab}</span></a></p>
      <div className="embed-cards is-sheet">
        {EMBEDS.map((e) => (
          <button type="button" key={e.id} className="embed-card" data-mode={e.id} aria-haspopup="dialog" onClick={() => onPick?.(e.id)}>
            <EmbedThumb mode={e.id} />
            <span>{e.label}</span>
          </button>
        ))}
      </div>
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
  // Your QR Code comes first, then every code and link you made. Everything shows, even at 0 visits.
  const all = only ? s.placements : s.sources
  const rows = [...all.filter((p) => p.ref === MAIN_QR), ...all.filter((p) => p.ref !== MAIN_QR)]
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
  const n = `${rowCopy.visits(p.counts.all[0])}, ${rowCopy.submissions(p.counts.all[1])}`
  const count = <span className="xs muted count"><span>{rowCopy.visits(p.counts.all[0])}</span><span className="count-sep" aria-hidden>·</span><span>{rowCopy.submissions(p.counts.all[1])}</span></span>
  const shown = p.ref === MAIN_QR && p.label === MAIN_QR_LABEL ? QR_COPY.yourCode : p.label
  // Nothing to tell apart with one code, so Rename only shows once there are two.
  const canRename = qr && s.placements.length > 1
  // Print-size PNG by default; SVG and PDF sit in the menu.
  const fmt: QrFormat = 'png'
  const download1 = async (f: QrFormat) => {
    // Free with a logo in: downloading it is Pro, same as the Download button.
    if (s.plan !== 'pro' && style.logo) { s.upgrade(); return }
    const o = { url: link, shortLink: QR_CAPTION, style, showLink: settings.showLink }
    download(await fileFor(o, f), fileName(p.ref, f))
    s.markDownloaded()
    if (main) tick('download-main')
    s.toast(QR_COPY.downloadedAs(f), QR_ALERT)
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
  const open = useOpenCode()
  const openCode = () => open(p.ref)
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
        <span ref={hit} className="row-hit" role="button" tabIndex={0} aria-label={`${shown}, ${n}. Open code`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCode() } }}>
          {icon}
          <span className="title grow">{shown}</span>
          {count}
        </span>
      ) : <>
        {icon}
        <span className="title grow">{p.label}</span>
        {count}
      </>}
      {qr ? (
        <button type="button" className="btn btn-secondary btn-sm icon-btn" data-tip={rowCopy.download(shown, fmt)} aria-label={rowCopy.download(shown, fmt)} onClick={() => download1(fmt)}>
          <Download aria-hidden />
        </button>
      ) : (
        <button type="button" className={`btn btn-secondary btn-sm icon-btn ${copied ? 'is-copied' : ''}`} data-tip={rowCopy.copyLink} aria-label={`${rowCopy.copyLink}: ${p.label}`} onClick={copy}>
          <IconSwap on={copied} />
          <span className="sr-only" aria-live="polite">{copied ? 'Copied' : ''}</span>
        </button>
      )}
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <button ref={more} type="button" className="btn btn-ghost btn-sm icon-btn" aria-label={`More for ${shown}`} aria-haspopup="menu" aria-expanded={menu} onClick={openMenu}>
          <MoreHorizontal aria-hidden />
        </button>
        <Menu open={menu} onClose={() => setMenu(false)} style={up ? { bottom: 34, right: 0, minWidth: 200 } : { top: 34, right: 0, minWidth: 200 }}>
          <button role="menuitem" onClick={pick(copy)}><Copy aria-hidden />{rowCopy.copyLink}</button>
          {canRename && <button role="menuitem" onClick={pick(() => { setName(p.label); setRenaming(true) })}><PencilLine aria-hidden />{rowCopy.rename}</button>}
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
  const [pulsing, setPulsing] = useState(false)
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
  const openCode = useOpenCode()
  return (
    <div ref={card} className={`single-code ${pulsing ? 'is-pulse' : ''}`}>
      <button type="button" className="single-preview" aria-label={`Open ${p.label}`} onClick={() => openCode(p.ref)}>
        <QrImage url={link} style={style} size={160} label={`QR code that opens ${link.replace('https://', '')}`} />
        {s.settings.showLink && <span className="single-link">{QR_CAPTION}</span>}
      </button>
      <div className="stack gap-8 single-side">
        {/* One code: nothing to tell apart, so no Rename. It comes back on every code once there are two. */}
        <b className="single-name">{p.ref === MAIN_QR && p.label === MAIN_QR_LABEL ? QR_COPY.yourCode : p.label}</b>
        <p className="small muted" style={{ margin: 0 }}>{QR_COPY.readyLine}</p>
        <div className="act-rows">
          <ActionRow icon={<SlidersHorizontal />} label={QR_COPY.customizeCode} pro dataRow="logo" onClick={() => openCode(p.ref, true)} />
        </div>
        <div className="single-dl"><DownloadSplit refId={p.ref} label={p.label} primaryRef={primary} /></div>
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
        <ActionRow icon={<Plus />} label="Add another code" chevron={false} expanded={adding} controls="add-code" onClick={() => setAdding((v) => !v)} />
        <span className="xs muted act-help">{mobile ? 'Give each place its own code to see which one works.' : 'Using it in more than one place? Give each place its own code to see which one brings in responses.'}</span>
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

export function ChannelPanel({ channel, pulse = 0, onEmbed }: { channel: Channel; pulse?: number; onEmbed?: (m: EmbedMode) => void }) {
  if (channel === 'qr') return <QrCodePanel pulse={pulse} />
  if (channel === 'social') return <SocialPanel />
  return <EmbedPanel onPick={onEmbed} />
}

/** The last Share to tab you used, kept per browser. QR Code until you pick another. */
const TAB_KEY = 'share-tab'
const CHANNELS: Channel[] = ['qr', 'social', 'embed']
function readChannel(): Channel {
  try { const v = localStorage.getItem(TAB_KEY) as Channel | null; return v && CHANNELS.includes(v) ? v : 'qr' } catch { return 'qr' }
}
function saveChannel(c: Channel) { try { localStorage.setItem(TAB_KEY, c) } catch { /* private mode */ } }

/**
 * `first`: the sheet right after a form's first publish, which always opens on QR Code.
 * The link, its preview card and Customize sit on top, then the tabs (or, with `?variant=entry`, three entry rows).
 * A detail view takes over: in the share modal, Back and the title move into the modal header (`nav` from the modal);
 * on the Share tab page they sit at the top of the view. Back returns to where you came from.
 */
export function ShareBlock({ first = false, nav: ctlNav }: { first?: boolean; nav?: ViewNav }) {
  const [channel, setChannelState] = useState<Channel>(() => { if (first) { saveChannel('qr'); return 'qr' } return readChannel() })
  const setChannel = (c: Channel) => { saveChannel(c); setChannelState(c) }
  const own = useViewStack()
  const nav = ctlNav ?? own
  const inModal = !!ctlNav
  const { view } = nav
  const s = useStore()
  const entry = entryVariant()
  useViewFocus(view, nav.depth)
  // A download alert belongs to the place it came from: switching tab or view clears it.
  const { dismissGroup } = s
  useEffect(() => { dismissGroup(QR_ALERT.group) }, [channel, view, dismissGroup])
  const [saved, setSaved] = useState<PreviewDraft>(PREVIEW_DEFAULT)
  const [embed, setEmbed] = useState<EmbedMode | null>(null)
  // Back never saves and never asks: a view starts over from what is saved the next time you open it.
  const [round, setRound] = useState(0)
  const prevView = useRef(view)
  useEffect(() => { if (prevView.current !== view && view === 'main') setRound((n) => n + 1); prevView.current = view }, [view])
  // Customize code under a code in the tab goes straight to Logo; the code itself opens its own page.
  const openCode = useCallback((ref: string, logo = false) => { s.setQrRef(ref); nav.go(logo ? 'logo' : 'code') }, [s, nav])
  type Slot = Channel | Exclude<LinkView, 'main'> | 'menu'
  const head = (v: Exclude<LinkView, 'main'>) => (!inModal ? <ViewHead view={v} onBack={nav.back} /> : null)
  const panels: { key: Slot; node: ReactNode }[] = [
    ...(entry
      ? [
        { key: 'menu' as Slot, node: <EntryRows onOpen={(c) => nav.go(`ch-${c}` as ChannelView)} /> },
        ...CHANNELS.map((c) => ({ key: `ch-${c}` as Slot, node: <div className="stack gap-12">{head(`ch-${c}` as ChannelView)}<ChannelPanel channel={c} onEmbed={setEmbed} /></div> })),
      ]
      : CHANNELS.map((c) => ({ key: c as Slot, node: <ChannelPanel channel={c} onEmbed={setEmbed} /> }))),
    { key: 'ending', node: <EndingView key={`e${round}`} inModal={inModal} onBack={nav.back} /> },
    { key: 'preview', node: <PreviewView key={`p${round}`} inModal={inModal} onBack={nav.back} saved={saved} onSave={setSaved} /> },
    { key: 'code', node: <div className="stack gap-12">{head('code')}<QrDetail key={`c${round}-${s.qrRef}`} refId={s.qrRef} onCustomize={() => nav.go('logo')} /></div> },
    { key: 'logo', node: <div className="stack gap-12">{head('logo')}<LogoView refId={s.qrRef} /></div> },
  ]
  const active: Slot = view === 'main' ? (entry ? 'menu' : channel) : view
  return (
    <OpenCodeCtx.Provider value={openCode}>
      <div>
        {/* A detail view hides the link, the card and the tabs. They ease out and back in. */}
        <Collapse open={view === 'main'}>
          <div className="stack gap-12" style={{ paddingBottom: entry ? 8 : 16 }}>
            <LinkBar onEdit={() => nav.go('ending')} />
            <div className="stack">
              <PreviewStrip draft={saved} />
              <ActionRow icon={<ImageIcon />} label={linkCopy.customize} pro dataRow="preview" onClick={() => nav.go('preview')} />
            </div>
            {!entry && <ChannelPicker value={channel} onChange={setChannel} />}
          </div>
        </Collapse>
        <PanelStack<Slot> active={active} label="Share to" panels={panels} plain={entry} />
        {embed && <EmbedPage mode={embed} onClose={() => setEmbed(null)} />}
      </div>
    </OpenCodeCtx.Provider>
  )
}

/** The entry variant: one row per way to share, each opening its own subpage. */
function EntryRows({ onOpen }: { onOpen: (c: Channel) => void }) {
  return (
    <div className="stack gap-8">
      <div className="xs muted" style={{ fontWeight: 600 }}>Share to</div>
      <div className="entry-rows" role="list">
        <span role="listitem"><ActionRow icon={<QrCode />} label="QR Code" help="Download a code to print" dataRow="ch-qr" onClick={() => onOpen('qr')} /></span>
        <span role="listitem"><ActionRow icon={<Megaphone />} label="Social" help="A tagged link for each app" dataRow="ch-social" onClick={() => onOpen('social')} /></span>
        <span role="listitem"><ActionRow icon={<Code2 />} label="Embed" help="Put the form on your website" dataRow="ch-embed" onClick={() => onOpen('embed')} /></span>
      </div>
    </div>
  )
}

