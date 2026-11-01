import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Facebook, Instagram, Linkedin, WhatsApp, XLogo } from './brand'
import {
  ArrowLeft, ArrowUpRight, Code2, Copy, Check, Mail, Megaphone, QrCode, Share, ChevronRight,
} from 'lucide-react'
import { canNativeShare, copyText, DEFAULT_ENDING, FORM_ID, QR_CAPTION, FORM_TITLE, MAIN_QR, MAIN_QR_LABEL, qrUrl, slugify, useIsMobile, useReducedMotion, useStore } from './store'
import { ActionRow, Modal, Pro, SmoothHeight, TextAction, UpgradeButton, Collapse, CopyButton, PanelStack, QrImage, Segmented } from './ui'
import { DownloadSplit, INSIGHTS_QR_HREF, QR_ALERT, QR_COPY, QrDetail, qrTitle } from './qrpanel'
import { ENDING_GONE_NOTE, OLD_LINK_NOTE, embedCopy, endingCopy, linkCopy, planCopy, shareCopy } from './copy'
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

/** The link and Copy, the one primary action, always on top. Use custom domain sits under it. */
export function LinkBar() {
  const { display, url } = useStore()
  const mobile = useIsMobile()
  const share = useNativeShare()
  if (mobile) {
    return (
      <div className="stack gap-8">
        <div className="input-group" style={{ height: 44 }}>
          <span className="prefix">https://</span>
          <input readOnly value={display()} aria-label="Form link" onFocus={(e) => e.currentTarget.select()} />
        </div>
        <div className="row gap-8">
          <button type="button" className="btn btn-black btn-lg" style={{ flex: 1 }} onClick={() => share(url())}>
            <Share aria-hidden />Share
          </button>
          <span onClickCapture={() => tick('publish-copy')} style={{ display: 'contents' }}><CopyButton text={url()} outline big /></span>
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
    </div>
  )
}

export function ChannelPicker({ value, onChange }: { value: Channel; onChange: (c: Channel) => void }) {
  return (
    <div className="stack gap-8 share-to">
      <div className="xs muted small-label">{shareCopy.moreWays}</div>
      <Segmented<Channel>
        label={shareCopy.moreWays} value={value} onChange={onChange}
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
export type LinkView = 'main' | 'ending' | 'preview' | 'code' | ChannelView

/** Inside the share sheet a code opens as a detail view; anywhere else, in its own dialog. */
/** In the share modal: the calm layout, one sentence and one block per tab. The Share tab page shows more. */
const CompactCtx = createContext(false)
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
/** `?variant=tiles`: a "Link preview" label over the card, and three tiles instead of the tabs, each opening its own subpage. */
export const tilesVariant = () => /[?&]variant=tiles\b/.test(window.location.hash + window.location.search)

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
  ending: linkCopy.endingRow, preview: linkCopy.previewRow, 'ch-qr': 'QR Code', 'ch-social': 'Social', 'ch-embed': 'Embed',
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
function useViewFocus(view: LinkView, depth: number, pageModal = false) {
  const prev = useRef<{ view: LinkView; depth: number }>({ view, depth })
  const trigger = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const from = prev.current
    prev.current = { view, depth }
    if (from.view === view) return
    if (pageModal && (from.view === 'main' || view === 'main')) {
      // Opening the page modal from the page: remember the trigger (the modal focuses itself). Closing it: focus goes back there.
      if (from.view === 'main') { trigger.current = document.activeElement as HTMLElement | null; return }
      const t = trigger.current
      requestAnimationFrame(() => { const el = t && t !== document.body && t.isConnected ? t : [...document.querySelectorAll<HTMLElement>(`[data-row="${from.view}"], .single-preview`)].find((e) => e.offsetParent); el?.focus({ preventScroll: true }) })
      return
    }
    const forward = depth > from.depth || (depth === from.depth && view !== 'main')
    if (forward) openers[view] = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => {
      if (forward) { document.getElementById(`lt-title-${view}`)?.focus({ preventScroll: true }); return }
      const el = openers[from.view]
      if (el && el.isConnected && el.offsetParent) el.focus({ preventScroll: true })
      else ([...document.querySelectorAll<HTMLElement>(`[data-row="${from.view}"]`)].find((e) => e.offsetParent) ?? document.getElementById(`lt-title-${view}`) ?? (pageModal ? document.querySelector<HTMLElement>('.modal[role=dialog]') : null))?.focus({ preventScroll: true })
    })
  }, [view, depth, pageModal])
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

/** In the share modal: one quiet row under the link, leading to Customize preview. */
function PreviewRow({ draft, onOpen }: { draft: PreviewDraft; onOpen: () => void }) {
  return (
    <button type="button" className="act-row preview-row" data-row="preview" aria-haspopup="dialog" onClick={onOpen}
      aria-label={`${linkCopy.previewRow}. ${linkCopy.customizeShort}, Pro`}>
      <img className="preview-row-img" src={previewImg(draft)} alt="" />
      <span className="act-label grow">{linkCopy.previewRow}</span>
      <span className="preview-row-act">{linkCopy.customizeShort}<Pro /></span>
      <ChevronRight className="act-chev" aria-hidden />
    </button>
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
  // No ending saved yet: start from the form's title as a slug. It stays editable.
  const startEnding = savedEnding || DEFAULT_ENDING
  const [ending, setEnding] = useState(startEnding)
  const pro = s.plan === 'pro'
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  const cleanEnding = slugify(ending)
  const next = cleanDomain ? `${cleanDomain}/${cleanEnding || FORM_ID}` : `tally.so/r/${FORM_ID}`
  const savedFull = s.shortLink
  const dirty = next !== savedFull
  const hadCustom = !!(s.domain && savedEnding)
  const cancel = () => { setDomain(s.domain); setEnding(startEnding) }
  const save = () => {
    tick('link-ending')
    if (!pro) { s.upgrade(); return }
    s.setDomain(cleanDomain)
    s.setSlug(cleanDomain && cleanEnding ? cleanEnding : FORM_ID)
    s.toast(endingCopy.updated)
  }
  return (
    <div className="stack gap-12">
      {!inModal && <ViewHead view="ending" onBack={onBack} />}
      <div className="stack gap-8">
        <label className="field-label" htmlFor="lt-domain">Custom Domain</label>
        <span className="xs muted">{linkCopy.domainHelp}</span>
        <div className="input-group">
          <span className="prefix">https://</span>
          <input id="lt-domain" aria-label="Custom domain" placeholder="forms.yourdomain.com" value={domain} onChange={(e) => setDomain(e.target.value.trim().toLowerCase())} />
        </div>
      </div>
      {/* The ending lives on your domain, so it only appears once there is one. Focus stays in the domain field. */}
      <Collapse open={!!cleanDomain} gap={12}>
        <div className="stack gap-8">
          <label className="field-label" htmlFor="lt-ending">{endingCopy.label}</label>
          <span className="xs muted">{endingCopy.help.replace('{ending}', DEFAULT_ENDING)}</span>
          <div className="input-group">
            <span className="prefix">{cleanDomain || 'forms.yourdomain.com'}/</span>
            <input id="lt-ending" aria-label="Link ending" placeholder={DEFAULT_ENDING} value={ending} onChange={(e) => setEnding(slugify(e.target.value, true))} />
          </div>
        </div>
      </Collapse>
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
  const imgInput = useRef<HTMLInputElement>(null)
  const replaceBtn = useRef<HTMLButtonElement>(null)
  const dirty = draft.title !== saved.title || draft.desc !== saved.desc || draft.img !== saved.img
  return (
    <div className="stack gap-12">
      {!inModal && <ViewHead view="preview" onBack={onBack} />}
      <PreviewCard img={previewImg(draft)} title={draft.title || FORM_TITLE} desc={draft.desc} />
      <span className="xs muted">{linkCopy.previewHelp}</span>
      {/* Image: a thumbnail, Replace, and once your own image is in, Remove (back to the default). Nothing is saved until Save. */}
      <div className="stack gap-8">
        <span className="field-label" id="lp-img-label">Image</span>
        <div className="row gap-12 lp-img-row">
          <img className="lp-img-thumb" src={previewImg(draft)} alt={draft.img ? 'Your preview image' : 'Default preview image'} />
          <span className="row gap-16">
            <button ref={replaceBtn} type="button" className="text-action" aria-label="Replace preview image" onClick={() => imgInput.current?.click()}>Replace</button>
            {draft.img && <button type="button" className="text-action" aria-label="Remove preview image"
              onClick={() => { setDraft({ ...draft, img: null }); requestAnimationFrame(() => replaceBtn.current?.focus()) }}>Remove</button>}
          </span>
          <input ref={imgInput} type="file" accept="image/*" hidden aria-labelledby="lp-img-label"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setDraft({ ...draft, img: URL.createObjectURL(f) }); e.target.value = '' }} />
        </div>
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

/**
 * Three layouts to pick from (Standard first), Copy code for the one you picked, and Customize embed, which opens
 * Tally's full Embed page with that layout ready: every option Tally has, and a live preview.
 * Embedding is free on Tally, so there is no Pro badge here.
 */
function EmbedPanel({ onPick }: { onPick?: (m: EmbedMode) => void }) {
  const mobile = useIsMobile()
  const s = useStore()
  const [mode, setMode] = useState<EmbedMode>('standard')
  const label = EMBEDS.find((e) => e.id === mode)?.label ?? ''
  return (
    <div className="stack gap-12">
      <p className="small muted" style={{ margin: 0 }}>{embedCopy.intro}{mobile && ` ${embedCopy.desktop}`} <a className="link-btn small inline-link" href={embedCopy.helpUrl} target="_blank" rel="noreferrer">{embedCopy.help}<span className="sr-only"> {embedCopy.newTab}</span></a></p>
      <div className="embed-cards is-sheet" role="group" aria-label={embedCopy.layout}>
        {EMBEDS.map((e) => (
          <button type="button" key={e.id} className="embed-card" data-mode={e.id} aria-pressed={mode === e.id} onClick={() => setMode(e.id)}>
            <EmbedThumb mode={e.id} />
            <span>{e.label}</span>
          </button>
        ))}
      </div>
      {/* A peek at the real snippet for the picked layout. The whole code is on the Customize embed page. */}
      <pre className="code-peek">{embedCode(mode, FORM_ID)}</pre>
      <div className="stack gap-8">
      <div className="embed-actions">
        <CopyButton outline className="btn-sm" label={embedCopy.copyCode} text={embedCode(mode, FORM_ID)} ariaLabel={embedCopy.copyCodeFor(label)} toastText={embedCopy.copied(label)} />
      </div>
      <ActionRow label={embedCopy.customize} haspopup="dialog" dataRow="embed-settings" onClick={() => { s.dismissGroup('qr'); onPick?.(mode) }} />
      </div>
    </div>
  )
}

/* ---------- The QR Code tab's codes ---------- */

/** With only one code, the tab shows the code itself. */
function SingleCode({ pulse }: { pulse: number }) {
  const s = useStore()
  const reduced = useReducedMotion()
  const p = s.placements.find((x) => x.ref === MAIN_QR) ?? s.placements[0]
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
        <span className="single-link">{QR_CAPTION}</span>
      </button>
      <div className="stack gap-8 single-side">
        {/* One code: nothing to tell apart, so no Rename. It comes back on every code once there are two. */}
        <b className="single-name">{p.ref === MAIN_QR && p.label === MAIN_QR_LABEL ? QR_COPY.yourCode : p.label}</b>
        <div className="single-dl"><DownloadSplit refId={p.ref} label={p.label} primaryRef={primary} /></div>
      </div>
    </div>
  )
}

/**
 * One sentence, one code, one row deeper: your form's own code, Download and Customize code.
 * Codes for other places are made on the code's own page, with Add another code.
 */
function QrCodePanel({ pulse }: { pulse: number }) {
  const openCode = useOpenCode()
  return (
    <div className="stack gap-12">
      <p className="small muted" style={{ margin: 0 }}>{QR_COPY.taggedOne} <a className="tag-link" href={INSIGHTS_QR_HREF}>Insights</a></p>
      <SingleCode pulse={pulse} />
      {/* One logo for the whole form, so one Customize code. */}
      <ActionRow label={QR_COPY.customizeCode} pro haspopup="dialog" dataRow="logo" onClick={() => openCode(MAIN_QR, true)} />
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
      <ul className="ch-list" aria-label="Social">
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

/** The last More ways to share tab you used, kept per browser. QR Code until you pick another. */
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
  const tiles = tilesVariant()
  // Switching version from the prototype bar starts the sheet over on its overview.
  const version = tiles ? 'tiles' : entryVariant() ? 'entry' : 'tabs'
  const { reset } = nav
  const firstVersion = useRef(version)
  useEffect(() => { if (firstVersion.current !== version) { firstVersion.current = version; reset() } }, [version, reset])
  // Entry rows and tiles work the same way: an overview, and each way to share as its own subpage.
  const entry = entryVariant() || tiles
  // Desktop Share tab page: everything that opens (custom domain, preview, a code's page, and in Rows and Tiles each
  // way to share) opens in a centred modal instead of inline. A view opened from inside it gets Back in the header.
  const mobile = useIsMobile()
  const pageModal = !inModal && !mobile
  const inPageModal = pageModal && view !== 'main'
  useViewFocus(view, nav.depth, pageModal)
  // A download alert belongs to the place it came from: switching tab or view clears it.
  const { dismissGroup } = s
  useEffect(() => { dismissGroup(QR_ALERT.group) }, [channel, view, dismissGroup])
  const [saved, setSaved] = useState<PreviewDraft>(PREVIEW_DEFAULT)
  const [embed, setEmbed] = useState<EmbedMode | null>(null)
  // Back never saves and never asks: a view starts over from what is saved the next time you open it.
  const [round, setRound] = useState(0)
  const prevView = useRef(view)
  useEffect(() => { if (prevView.current !== view && view === 'main') setRound((n) => n + 1); prevView.current = view }, [view])
  // Customize code under a code in the tab goes straight to the logo section on the code's page; the code itself opens its own page.
  const [logoFocus, setLogoFocus] = useState(false)
  const openCode = useCallback((ref: string, logo = false) => { s.setQrRef(ref); setLogoFocus(logo); nav.go('code') }, [s, nav])
  type Slot = Channel | Exclude<LinkView, 'main'> | 'menu'
  const head = (v: Exclude<LinkView, 'main'>) => (!inModal ? <ViewHead view={v} onBack={nav.back} /> : null)
  const panels: { key: Slot; node: ReactNode }[] = [
    ...(entry
      ? [
        { key: 'menu' as Slot, node: tiles ? <ShareTiles onOpen={(c) => nav.go(`ch-${c}` as ChannelView)} /> : <EntryRows onOpen={(c) => nav.go(`ch-${c}` as ChannelView)} /> },
        ...(pageModal ? [] : CHANNELS.map((c) => ({ key: `ch-${c}` as Slot, node: <div className="stack gap-12">{head(`ch-${c}` as ChannelView)}<ChannelPanel channel={c} onEmbed={setEmbed} /></div> }))),
      ]
      : CHANNELS.map((c) => ({ key: c as Slot, node: <ChannelPanel channel={c} onEmbed={setEmbed} /> }))),
    ...(pageModal ? [] : [
      { key: 'ending' as Slot, node: <EndingView key={`e${round}`} inModal={inModal} onBack={nav.back} /> },
      { key: 'preview' as Slot, node: <PreviewView key={`p${round}`} inModal={inModal} onBack={nav.back} saved={saved} onSave={setSaved} /> },
      { key: 'code' as Slot, node: <div className="stack gap-12">{head('code')}<QrDetail key={`c${round}-${s.qrRef}-${logoFocus}`} refId={s.qrRef} focusLogo={logoFocus} /></div> },
    ]),
  ]
  const overview: Slot = entry ? 'menu' : channel
  const active: Slot = view === 'main' || inPageModal ? overview : view
  // The page modal: the same content as the sheet. Its title and Close sit in the header, plus Back one level down.
  const plainTitle = view === 'main' ? '' : view === 'code' ? qrTitle(s.placements.find((p) => p.ref === s.qrRef)?.label, s.qrRef) : VIEW_TITLE[view]
  const modalTitle = view !== 'main' && nav.depth > 1 ? <ViewHead view={view} onBack={nav.back} as="span" /> : plainTitle
  const modalBody = view === 'preview' ? <PreviewView key={`p${round}`} inModal onBack={nav.back} saved={saved} onSave={setSaved} />
    : view === 'ending' ? <EndingView key={`e${round}`} inModal onBack={nav.back} />
    : view === 'code' ? <QrDetail key={`c${round}-${s.qrRef}-${logoFocus}`} refId={s.qrRef} focusLogo={logoFocus} />
    : view.startsWith('ch-') ? <ChannelPanel channel={view.slice(3) as Channel} onEmbed={setEmbed} /> : null
  return (
    <CompactCtx.Provider value={inModal}>
    <OpenCodeCtx.Provider value={openCode}>
      <SmoothHeight k={`${view}-${channel}`}>
        {/* A detail view hides the link, the card and the tabs. The whole box changes height once (SmoothHeight). */}
        <Collapse open={view === 'main' || inPageModal} instant>
          {/* One rhythm: label 8 content 8 text action, 24 to the next section label. */}
          <div className="stack gap-24 share-sections" style={{ paddingBottom: entry ? 24 : 16 }}>
            <div className="stack gap-8 link-block">
              <LinkBar />
              <TextAction label={s.domain ? shareCopy.editDomain : shareCopy.useDomain} pro dataRow="ending" onClick={() => nav.go('ending')} />
              {/* Share modal: the preview is one quiet row. The Share tab page keeps the bigger card. */}
              {inModal && <div className="preview-row-wrap"><PreviewRow draft={saved} onOpen={() => nav.go('preview')} /></div>}
            </div>
            {!inModal && (
              <div className="stack gap-8">
                <div className="xs muted small-label" id="lp-label">Link preview</div>
                <PreviewStrip draft={saved} />
                <TextAction label={linkCopy.customize} pro dataRow="preview" onClick={() => nav.go('preview')} />
              </div>
            )}
            {!entry && <ChannelPicker value={channel} onChange={setChannel} />}
          </div>
        </Collapse>
        <PanelStack<Slot> active={active} label={shareCopy.moreWays} panels={panels} plain={entry} animate={false} />
      </SmoothHeight>
      {embed && <EmbedPage mode={embed} onClose={() => setEmbed(null)} />}
      {pageModal && (
        <Modal open={inPageModal} onClose={nav.reset} title={modalTitle} width={440} labelledBy="page-detail-title">
          <SmoothHeight k={view}>{modalBody}</SmoothHeight>
        </Modal>
      )}
    </OpenCodeCtx.Provider>
    </CompactCtx.Provider>
  )
}

/** The tiles variant: three quiet tiles side by side, icon on top and label below, each opening its own subpage. */
function ShareTiles({ onOpen }: { onOpen: (c: Channel) => void }) {
  const tiles: { c: Channel; icon: ReactNode; label: string }[] = [
    { c: 'qr', icon: <QrCode />, label: 'QR Code' },
    { c: 'social', icon: <Megaphone />, label: 'Social' },
    { c: 'embed', icon: <Code2 />, label: 'Embed' },
  ]
  return (
    <div className="stack gap-8">
      <div className="xs muted small-label" id="share-to-label">{shareCopy.moreWays}</div>
      <div className="share-tiles" role="list" aria-labelledby="share-to-label">
        {tiles.map((t) => (
          <span role="listitem" key={t.c}>
            <button type="button" className="share-tile" data-row={`ch-${t.c}`} onClick={() => onOpen(t.c)}>
              <span className="share-tile-ic" aria-hidden>{t.icon}</span>
              <span className="share-tile-label">{t.label}</span>
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

/** The entry variant: one row per way to share, each opening its own subpage. */
function EntryRows({ onOpen }: { onOpen: (c: Channel) => void }) {
  return (
    <div className="stack gap-8">
      <div className="xs muted small-label" id="share-to-label-rows">{shareCopy.moreWays}</div>
      <div className="entry-rows" role="list" aria-labelledby="share-to-label-rows">
        <span role="listitem"><ActionRow icon={<QrCode />} label="QR Code" help="Download a code to print" dataRow="ch-qr" onClick={() => onOpen('qr')} /></span>
        <span role="listitem"><ActionRow icon={<Megaphone />} label="Social" help="A tagged link for each app" dataRow="ch-social" onClick={() => onOpen('social')} /></span>
        <span role="listitem"><ActionRow icon={<Code2 />} label="Embed" help="Put the form on your website" dataRow="ch-embed" onClick={() => onOpen('embed')} /></span>
      </div>
    </div>
  )
}

