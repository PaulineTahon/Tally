import { currentVariant } from './params'
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { MonoMark } from './brand'
import {
  ArrowLeft, Code2, Download, Copy, Check, Mail, Megaphone, QrCode, Share, Plus,
  ChartNoAxesColumn, EllipsisVertical, Trash2, ChevronRight, Link2, Link as LinkIcon,
} from 'lucide-react'
import { type Source, canNativeShare, copyText, DEFAULT_ENDING, FORM_ID, FORM_TITLE, MAIN_QR, MAIN_QR_LABEL, slugify, useIsMobile, useStore } from './store'
import { ActionRow, Modal, PopMenu, SmoothHeight, TextAction, UpgradeButton, Collapse, CopyButton, PanelStack, Segmented } from './ui'
import { AddPlace, SUGGESTED, insightsQrHref, useQrFiles, QR_ALERT, QR_COPY, QrDetail, qrTitle } from './qrpanel'
import { ENDING_GONE_NOTE, OLD_LINK_NOTE, embedCopy, jobsCopy, endingCopy, linkCopy, planCopy, shareCopy, splitCopy } from './copy'
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
export function LinkBar({ extra }: { extra?: (big: boolean) => ReactNode } = {}) {
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
          {extra?.(true)}
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
      {extra?.(false)}
    </div>
  )
}

export function ChannelPicker({ value, onChange }: { value: Channel; onChange: (c: Channel) => void }) {
  return (
    <div className="stack gap-8 share-to">
      <div className="section-label">{shareCopy.moreWays}</div>
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


/** Each item copies just its own tagged link, with its ref. None of them opens an app or a website. Email is last, on its own.
 * The marks are drawn in the text colour, like Tally's own icons, never in brand colours. */
export const SOCIAL: { ref: string; label: string; icon: ReactNode }[] = [
  { ref: 'whatsapp', label: 'WhatsApp', icon: <MonoMark brand="whatsapp" size={18} /> },
  { ref: 'instagram', label: 'Instagram', icon: <MonoMark brand="instagram" size={18} /> },
  { ref: 'facebook', label: 'Facebook', icon: <MonoMark brand="facebook" size={18} /> },
  { ref: 'linkedin', label: 'LinkedIn', icon: <MonoMark brand="linkedin" size={18} /> },
  { ref: 'x', label: 'X', icon: <MonoMark brand="x" size={18} /> },
]


/** Email copies its own tagged link too (ref=email), like the socials. */
const EMAIL = { ref: 'email', label: 'Email', icon: <Mail aria-hidden /> }

/* ---------- Link ---------- */

const PREVIEW_DESC = 'Made with Tally, the simplest way to create forms.'

export type ChannelView = 'ch-qr' | 'ch-social' | 'ch-embed'
export type LinkView = 'main' | 'ending' | 'preview' | 'code' | 'track' | 'track-link' | ChannelView

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
export const entryVariant = () => currentVariant() === 'entry'
/** `?variant=tiles`: a "Link preview" label over the card, and three tiles instead of the tabs, each opening its own subpage. */
export const tilesVariant = () => currentVariant() === 'tiles'
/** Jobs: get responses fast on top (link, preview, QR code and Embed), then track where they come from. */
/** `?social=rows|icons|strip`: how the social links show. Without it, Icons in Split and Rows everywhere else. */
export const socialVariant = (): 'rows' | 'icons' | 'strip' => { const m = /[?&]social=(rows|icons|strip)\b/.exec(window.location.hash + window.location.search); return m ? (m[1] as 'rows' | 'icons' | 'strip') : splitVariant() ? 'icons' : 'rows' }
export const jobsVariant = () => currentVariant() === 'jobs'
/** `?variant=split`: Share and Embed as tabs, with one row to see where responses come from. Extra links and extra codes share one pattern, since both only add a ref to the same link. */
/** `?variant=simple`: Share and Embed as tabs: the link, one QR code and Embed. No tracking. */
/** Simple is the default: no ?variant= means Simple, the changelog demo included. */
export const simpleVariant = () => currentVariant() === 'simple'
/** `?variant=split`: how I'd add tracked links on top of Simple. */
export const splitVariant = () => currentVariant() === 'split'

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
  ending: linkCopy.endingRow, preview: linkCopy.previewRow, 'ch-qr': 'QR Code', 'ch-social': 'Social', 'ch-embed': 'Embed', track: jobsCopy.track, 'track-link': splitCopy.track,
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
 * Three layouts to pick from, none picked to start with. Once you pick one, its code, Copy code and Customize embed
 * (which opens Tally's full Embed page with that layout ready: every option Tally has, and a live preview) open under them.
 * Embedding is free on Tally, so there is no Pro badge here.
 */
/** `primary`: Copy code is the black button, where Copy link isn't on screen (an Embed tab or view of its own). */
function EmbedPanel({ onPick, primary = false, gap = 12 }: { onPick?: (m: EmbedMode) => void; primary?: boolean; gap?: number }) {
  const mobile = useIsMobile()
  const s = useStore()
  const [picked, setPicked] = useState<EmbedMode | null>(null)
  // While nothing is picked the code part is closed (and inert), so what it holds never shows.
  const mode: EmbedMode = picked ?? 'standard'
  const label = EMBEDS.find((e) => e.id === mode)?.label ?? ''
  const codeId = `embed-code-${useId().replace(/:/g, '')}`
  return (
    <div className="stack" style={{ gap }}>
      <p className="small muted" style={{ margin: 0 }}>{embedCopy.intro}{mobile && ` ${embedCopy.desktop}`} <a className="link-btn small inline-link" href={embedCopy.helpUrl} target="_blank" rel="noreferrer">{embedCopy.help}<span className="sr-only"> {embedCopy.newTab}</span></a></p>
      <div className="embed-cards is-sheet" role="group" aria-label={embedCopy.layout}>
        {EMBEDS.map((e) => (
          <button type="button" key={e.id} className="embed-card" data-mode={e.id} aria-pressed={picked === e.id} aria-controls={codeId} onClick={() => setPicked(e.id)}>
            <EmbedThumb mode={e.id} />
            <span>{e.label}</span>
          </button>
        ))}
      </div>
      {/* Opens under the layouts once one is picked, so they never move. */}
      <Collapse open={picked !== null} id={codeId} gap={gap}>
        <div className="stack" style={{ gap }}>
          {/* The whole real snippet for the picked layout, in a short box that scrolls (wheel, trackpad, touch, or arrow keys once focused). */}
          <pre className="code-peek" tabIndex={0} role="region" aria-label={embedCopy.codeLabel}>{embedCode(mode, FORM_ID)}</pre>
          {/* Customize embed sits right of Copy code, on the same line. Copy code is black only where Copy link isn't on screen. */}
          <div className="embed-actions">
            <CopyButton outline={!primary} big={mobile} label={embedCopy.copyCode} text={embedCode(mode, FORM_ID)} ariaLabel={embedCopy.copyCodeFor(label)} toastText={embedCopy.copied(label)} />
            <TextAction label={embedCopy.customize} haspopup="dialog" dataRow="embed-settings" onClick={() => { s.dismissGroup('qr'); onPick?.(mode) }} />
          </div>
        </div>
      </Collapse>
    </div>
  )
}

/* ---------- The QR Code tab's codes ---------- */


/**
 * Your form's own code as a thumbnail with Download, then each code you added the same way, one Customize QR code
 * under the codes, then Add another code. The tagging is said once, in Your QR Code's description.
 */
function QrCodePanel({ desc = true, help = true }: { pulse: number; desc?: boolean; help?: boolean }) {
  const s = useStore()
  const openCode = useOpenCode()
  const codes = [...s.placements.filter((p) => p.ref === MAIN_QR), ...s.placements.filter((p) => p.ref !== MAIN_QR)]
  return (
    <div className="stack gap-12 qr-list-scope">
      <div className="stack gap-8">
        {desc && <p className="small muted" style={{ margin: 0 }}>{QR_COPY.singleDesc} <a className="tag-link" href={insightsQrHref()}>Insights</a>.</p>}
        {/* Your QR Code first, then each code you made, as list items. New ones show right away, and only the new row appears. */}
        <ul className="code-rows" aria-label={QR_COPY.yourCode}>
          {codes.map((p) => <CodeRow key={p.ref} p={p} name={p.ref === MAIN_QR && p.label === MAIN_QR_LABEL ? QR_COPY.yourCode : undefined} />)}
        </ul>
        {/* One logo for the whole form, so one Customize QR code under the codes: the same text button as Customize preview. */}
        <div className="text-actions"><TextAction label={QR_COPY.customizeCode} pro haspopup="dialog" dataRow="logo" onClick={() => openCode(MAIN_QR, true)} /></div>
      </div>
      <AddCodeBlock help={help} />
    </div>
  )
}

/** Add another code: a code for another place, with its own ref (qr-poster). It shows right away. */
function AddCodeBlock({ help = true }: { help?: boolean }) {
  const s = useStore()
  const id = `add-code-${useId().replace(/:/g, '')}`
  const mobile = useIsMobile()
  const [adding, setAdding] = useState(false)
  const add = (label: string) => {
    const p = s.addPlacement(label)
    s.toast(`Code added for ${p.label}`)
  }
  const taken = new Set(s.placements.map((p) => p.label.toLowerCase()))
  const missing = SUGGESTED.filter((l) => !taken.has(l.toLowerCase()))
  // One left edge for the + icon, the helper, the field and the chips, 8px apart: row, helper, field, chips.
  return (
    <div className="stack gap-8 add-code">
      <ActionRow icon={<Plus />} label={QR_COPY.addAnother} chevron={false} expanded={adding} controls={id} onClick={() => setAdding((v) => !v)} />
      {help && <span className="xs muted add-code-help">{mobile ? 'Give each place its own code to see which one works.' : 'Using it in more than one place? Give each place its own code to see which one brings in responses.'}</span>}
      <Collapse open={adding} id={id} gap={8}>
        <div className="stack gap-8">
          <AddPlace label={QR_COPY.addAnother} placeholder={mobile ? 'Like Poster or Slides' : 'Where will it go? Like Poster or Slides'} onAdd={add} />
          {missing.length > 0 && (
            <div className="chips">
              {missing.map((l) => <button key={l} type="button" className="chip" onClick={() => add(l)}><Plus aria-hidden />{l}</button>)}
            </div>
          )}
        </div>
      </Collapse>
    </div>
  )
}

/* ---------- Panels ---------- */

/** One channel row: the whole row is the tap target. Every row copies its tagged link, says Copied in place and shows the alert at the bottom. */
function ChannelRow({ icon, label, text, aria, refName, copied: copiedText = shareCopy.copiedFor }: { icon: ReactNode; label: string; text: string; aria: string; refName?: string; copied?: (label: string) => string }) {
  const s = useStore()
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>()
  const copy = async () => {
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
    await copyText(text)
    s.toast(copiedText(label))
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const body = <>
    <span className="row-icon">{icon}</span>
    {refName
      ? <span className="code-row-text grow"><span className="title">{label}</span><span className="code-row-ref">?ref={refName}</span></span>
      : <span className="title grow">{label}</span>}
    <span className="ch-trail" data-on={copied} aria-hidden>
      <span className="ch-a"><Copy />{shareCopy.copyLink}</span><span className="ch-b"><Check />{shareCopy.copiedInline}</span>
    </span>
  </>
  return (
    <li>
      <button type="button" className={`ch-row ${copied ? 'is-copied' : ''}`} data-row={`soc-${refName ?? label.toLowerCase()}`} aria-label={aria} onClick={copy}>{body}<span className="sr-only" aria-live="polite">{copied ? shareCopy.copiedInline : ''}</span></button>
    </li>
  )
}

/** One borderless row per place, each with its own tagged link. */
/** `showRef` (Split): each row shows its ref under the name, like code rows. Icons and Strip keep one line and show it as a tooltip. */
/** `split`: the Split copy ("LinkedIn link copied") and the ref under each name. */
function SocialList({ split = false }: { split?: boolean }) {
  const s = useStore()
  const layout = socialVariant()
  const showRef = split
  const copied = split ? splitCopy.copied : shareCopy.copiedFor
  if (layout !== 'rows') return <SocialIcons strip={layout === 'strip'} showRef={showRef} copied={copied} />
  return (
    <ul className="ch-list" aria-label="Social">
      {[...SOCIAL, EMAIL].map((x) => <ChannelRow key={x.ref} icon={x.icon} label={x.label} aria={shareCopy.copyFor(x.label)} text={s.url(x.ref)} refName={showRef ? x.ref : undefined} copied={copied} />)}
    </ul>
  )
}

/**
 * `?social=icons` and `?social=strip`: the same tagged links as round buttons with a label under each, in a wrapping
 * grid or in one row that scrolls sideways (a fade on the right while there's more). Copy shows an alert at the bottom.
 */
function SocialIcons({ strip, showRef = false, copied = shareCopy.copiedFor }: { strip: boolean; showRef?: boolean; copied?: (label: string) => string }) {
  const s = useStore()
  const list = useRef<HTMLUListElement>(null)
  const [more, setMore] = useState(false)
  const check = useCallback(() => {
    const el = list.current
    if (el && strip) setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [strip])
  useEffect(() => {
    check()
    const el = list.current
    if (!el || !strip) return
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [check, strip])
  const copy = async (place: string, ref: string) => {
    await copyText(s.url(ref))
    s.toast(copied(place))
  }
  const face = (icon: ReactNode, label: string) => <><span className="soc-circle" aria-hidden>{icon}</span><span className="soc-label" aria-hidden>{label}</span></>
  const items = (
    <ul ref={list} className={strip ? 'soc-strip' : 'soc-grid'} aria-label="Social" onScroll={strip ? check : undefined}>
      {[...SOCIAL, EMAIL].map((x) => (
        <li key={x.ref}>
          <button type="button" className="soc-btn" data-row={`soc-${x.ref}`} aria-label={shareCopy.copyFor(x.label)} title={showRef ? `?ref=${x.ref}` : undefined} onClick={() => copy(x.label, x.ref)}>{face(x.icon, x.label)}</button>
        </li>
      ))}
    </ul>
  )
  return strip ? <div className={`soc-strip-wrap ${more ? 'has-more' : ''}`}>{items}</div> : items
}

function SocialPanel() {
  return (
    <div className="stack gap-8">
      <p className="small muted" style={{ margin: 0 }}>{shareCopy.tagLine}</p>
      <SocialList />
    </div>
  )
}

/**
 * Jobs version, under the link and its preview: Embed as a text link, then one row that opens the tracking page
 * (a tagged link for each social and a code for each place). The QR code button sits next to Copy.
 */
function JobsMenu({ onEmbed, onTrack }: { onEmbed: () => void; onTrack: () => void }) {
  return (
    <div className="stack gap-24">
      <TextAction label={jobsCopy.embedLink} haspopup="dialog" dataRow="ch-embed" onClick={onEmbed} />
      <div className="jobs-track-row">
        <ActionRow icon={<ChartNoAxesColumn />} label={jobsCopy.track} help={jobsCopy.trackHelp} dataRow="track" onClick={onTrack} />
      </div>
    </div>
  )
}

/** Jobs version, next to Copy: a square outlined button with the QR icon that opens your form's code page. */
function JobsQrButton({ big = false }: { big?: boolean }) {
  const openCode = useOpenCode()
  return (
    <button type="button" className={`btn btn-secondary jobs-qr-btn ${big ? 'is-big' : ''}`} data-row="jobs-qr" aria-label={jobsCopy.qr} title={jobsCopy.qr} aria-haspopup="dialog" onClick={() => openCode(MAIN_QR)}>
      <QrCode aria-hidden />
    </button>
  )
}

export type TrackTab = 'social' | 'qr'

/** Jobs version, the tracking page: one line, then Social and QR codes as tabs. */
function JobsTracking({ tab, onTab }: { tab: TrackTab; onTab: (t: TrackTab) => void }) {
  return (
    <div className="stack gap-24 jobs-track">
      <div className="stack gap-8 share-to">
        <p className="small muted" style={{ margin: 0 }}>{jobsCopy.trackLine} <a className="tag-link" href={insightsQrHref()}>Insights</a>.</p>
        <Segmented<TrackTab>
          label={jobsCopy.track} value={tab} onChange={onTab}
          options={[
            { value: 'social', label: 'Social', icon: <Megaphone aria-hidden /> },
            { value: 'qr', label: 'QR codes', icon: <QrCode aria-hidden /> },
          ]}
        />
      </div>
      {tab === 'social' ? <SocialList /> : <QrCodePanel pulse={0} desc={false} help={false} />}
    </div>
  )
}

/**
 * A code as a list item, like Tally's list rows: the QR code icon (no tile), its name in bold and its ref in grey under it.
 * The whole row opens the code's page (a stretched button); Download and More options sit above it, so they never open the page.
 */
export function CodeRow({ p, name, removedText }: { p: Source; name?: string; removedText?: (name: string) => string }) {
  const s = useStore()
  const openCode = useOpenCode()
  const label = name ?? p.label
  const more = useRef<HTMLButtonElement>(null)
  const row = useRef<HTMLLIElement>(null)
  const files = useQrFiles(p.ref)
  const [menu, setMenu] = useState(false)
  const remove = () => {
    setMenu(false)
    // Focus moves to the next code, or the one before, or Add another code. The list can re-render, so find it again by ref.
    const li = row.current
    const nextRef = ((li?.nextElementSibling ?? li?.previousElementSibling) as HTMLElement | null)?.dataset.ref
    const scope = li?.closest('.qr-list-scope')
    s.removePlacement(p.ref)
    s.toast(removedText ? removedText(label) : QR_COPY.removed, { action: { label: 'Undo', onClick: () => s.restorePlacement(p.ref) } })
    // After the menu has closed and handed focus back.
    window.setTimeout(() => {
      const target = (nextRef && scope?.querySelector<HTMLElement>(`[data-ref="${nextRef}"] .code-row-open`)) || scope?.querySelector<HTMLElement>('.add-code .act-row')
      target?.focus()
    }, 60)
  }
  return (
    <li ref={row} className="code-row" data-ref={p.ref}>
      <button type="button" className="code-row-open" aria-label={QR_COPY.openFor(label)} onClick={() => openCode(p.ref)}>
        <span className="row-lead"><QrCode className="row-type-ic" aria-hidden /><span className="code-row-text"><span className="code-row-name">{label}</span><span className="code-row-ref">?ref={p.ref}</span></span></span>
      </button>
      {/* Download PNG, an outlined button with its icon and label like a link row's Copy, then More options with SVG, PDF and, on codes you made, Remove. */}
      <span className="row-actions">
      <button type="button" className="btn btn-secondary btn-sm code-row-dl" aria-label={QR_COPY.downloadPngFor(label)} title={QR_COPY.downloadPng}
        onClick={(e) => { e.stopPropagation(); files.get('png') }}><Download aria-hidden /><span>{QR_COPY.download}</span></button>
      <button ref={more} type="button" className="btn btn-ghost btn-sm code-row-more" aria-label={QR_COPY.moreFor(label)} title={QR_COPY.moreFor(label)} aria-haspopup="menu" aria-expanded={menu}
        onClick={(e) => { e.stopPropagation(); setMenu((m) => !m) }}><EllipsisVertical aria-hidden /></button>
      </span>
      <PopMenu open={menu} anchor={more} onClose={() => setMenu(false)} label={QR_COPY.moreFor(label)} width={200}>
        <button type="button" role="menuitem" onClick={() => { setMenu(false); files.get('svg') }}><Download aria-hidden /><span>{QR_COPY.downloadAs('SVG')}</span></button>
        <button type="button" role="menuitem" onClick={() => { setMenu(false); files.get('pdf') }}><Download aria-hidden /><span>{QR_COPY.downloadAs('PDF')}</span></button>
        {p.ref !== MAIN_QR && <>
          <div className="menu-sep" role="separator" />
          <button type="button" role="menuitem" onClick={remove}><Trash2 aria-hidden /><span>{QR_COPY.remove}</span></button>
        </>}
      </PopMenu>
    </li>
  )
}

export function ChannelPanel({ channel, pulse = 0, onEmbed, alone = false }: { channel: Channel; pulse?: number; onEmbed?: (m: EmbedMode) => void; alone?: boolean }) {
  if (channel === 'qr') return <QrCodePanel pulse={pulse} />
  if (channel === 'social') return <SocialPanel />
  return <EmbedPanel onPick={onEmbed} primary={alone} />
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
  const jobs = jobsVariant()
  const split = splitVariant()
  const simple = simpleVariant()
  const version = simple ? 'simple' : split ? 'split' : jobs ? 'jobs' : tiles ? 'tiles' : entryVariant() ? 'entry' : 'tabs'
  const { reset } = nav
  const firstVersion = useRef(version)
  useEffect(() => { if (firstVersion.current !== version) { firstVersion.current = version; reset() } }, [version, reset])
  // Entry rows and tiles work the same way: an overview, and each way to share as its own subpage.
  const entry = entryVariant() || tiles || jobs
  // Split and Simple: two tabs, Share and Embed. Split's full-width Share tab page stacks them instead.
  const tabbed = split || simple
  // Split's and Simple's Share tab page stack Share link and Embed as sections, one below the other, at every width.
  const stacked = tabbed && !inModal
  // Desktop Share tab page: everything that opens (custom domain, preview, a code's page, and in Rows and Tiles each
  // way to share) opens in a centred modal instead of inline. A view opened from inside it gets Back in the header.
  const mobile = useIsMobile()
  const pageModal = !inModal && !mobile
  const inPageModal = pageModal && view !== 'main'
  useViewFocus(view, nav.depth, pageModal)
  // A download alert belongs to the place it came from: switching tab or view clears it.
  const { dismissGroup } = s
  const [splitTab, setSplitTab] = useState<SplitTab>('share')
  useEffect(() => { dismissGroup(QR_ALERT.group) }, [channel, splitTab, view, dismissGroup])
  // A code removed while its page is open: back to the list it was in.
  const codeGone = view === 'code' && !s.placements.some((p) => p.ref === s.qrRef)
  useEffect(() => { if (codeGone) nav.back() }, [codeGone, nav])
  const [saved, setSaved] = useState<PreviewDraft>(PREVIEW_DEFAULT)
  const [embed, setEmbed] = useState<EmbedMode | null>(null)
  // Back never saves and never asks: a view starts over from what is saved the next time you open it.
  const [round, setRound] = useState(0)
  const prevView = useRef(view)
  useEffect(() => { if (prevView.current !== view && view === 'main') setRound((n) => n + 1); prevView.current = view }, [view])
  // Customize QR code under the code in the tab goes straight to the logo section on the code's page; the code itself opens its own page.
  const [logoFocus, setLogoFocus] = useState(false)
  const [trackTab, setTrackTab] = useState<TrackTab>('social')
  const openCode = useCallback((ref: string, logo = false) => { s.setQrRef(ref); setLogoFocus(logo); nav.go('code') }, [s, nav])
  type Slot = Channel | Exclude<LinkView, 'main'> | 'menu' | `s-${SplitTab}` | 's-stack'
  const head = (v: Exclude<LinkView, 'main'>) => (!inModal ? <ViewHead view={v} onBack={nav.back} /> : null)
  const linkTop = (
    <>
      <div className="stack gap-8 link-block">
        {inModal && <h3 className="section-label" id="share-link-label">{shareCopy.linkTitle}</h3>}
        <LinkBar extra={jobs || tabbed ? (big) => <JobsQrButton big={big} /> : undefined} />
        <TextAction label={s.domain ? shareCopy.editDomain : shareCopy.useDomain} pro dataRow="ending" onClick={() => nav.go('ending')} />
      </div>
      <div className="stack gap-8">
        <div className="section-label" id="lp-label">Link preview</div>
        <PreviewStrip draft={saved} />
        <TextAction label={linkCopy.customize} pro dataRow="preview" onClick={() => nav.go('preview')} />
      </div>
    </>
  )
  const shareTab = <div className="stack gap-24">{linkTop}{split && <SplitTrackRow onOpen={() => nav.go('track-link')} />}</div>
  // The same Embed as Tabs and Jobs: Standard, Popup or Full page, the code for it, then Copy code and Customize embed.
  const embedTab = <div className="split-embed"><EmbedPanel onPick={setEmbed} primary={!stacked} gap={8} /></div>
  const panels: { key: Slot; node: ReactNode }[] = tabbed ? [
    // Split's Share tab page has the room: no tabs, Share then Embed as sections.
    ...(stacked ? [{ key: 's-stack' as Slot, node: (
      <div className="stack gap-24 split-stack">
        {/* The page's own Share link title heads this section. */}
        <section className="stack gap-8" aria-labelledby="share-h">{shareTab}</section>
        <section className="stack gap-8" aria-labelledby="split-sec-embed"><h3 className="section-label" id="split-sec-embed">{splitCopy.embed}</h3>{embedTab}</section>
      </div>
    ) }] : [
      { key: 's-share' as Slot, node: shareTab },
      { key: 's-embed' as Slot, node: embedTab },
    ]),
    ...(pageModal ? [] : [
      { key: 'ending' as Slot, node: <EndingView key={`e${round}`} inModal={inModal} onBack={nav.back} /> },
      { key: 'preview' as Slot, node: <PreviewView key={`p${round}`} inModal={inModal} onBack={nav.back} saved={saved} onSave={setSaved} /> },
      { key: 'track-link' as Slot, node: <div className="stack gap-12">{head('track-link')}<SplitTrackPage tab={trackTab} onTab={setTrackTab} /></div> },
      { key: 'code' as Slot, node: <div className="stack gap-12">{head('code')}<QrDetail key={`c${round}-${s.qrRef}-${logoFocus}`} refId={s.qrRef} focusLogo={logoFocus} /></div> },
    ]),
  ] : [
    ...(entry
      ? [
        { key: 'menu' as Slot, node: jobs ? <JobsMenu onEmbed={() => nav.go('ch-embed')} onTrack={() => nav.go('track')} /> : tiles ? <ShareTiles onOpen={(c) => nav.go(`ch-${c}` as ChannelView)} /> : <EntryRows onOpen={(c) => nav.go(`ch-${c}` as ChannelView)} /> },
        ...(pageModal ? [] : CHANNELS.map((c) => ({ key: `ch-${c}` as Slot, node: <div className="stack gap-12">{head(`ch-${c}` as ChannelView)}<ChannelPanel channel={c} onEmbed={setEmbed} alone /></div> }))),
      ]
      : CHANNELS.map((c) => ({ key: c as Slot, node: <ChannelPanel channel={c} onEmbed={setEmbed} /> }))),
    ...(pageModal ? [] : [
      { key: 'ending' as Slot, node: <EndingView key={`e${round}`} inModal={inModal} onBack={nav.back} /> },
      { key: 'preview' as Slot, node: <PreviewView key={`p${round}`} inModal={inModal} onBack={nav.back} saved={saved} onSave={setSaved} /> },
      { key: 'track' as Slot, node: <div className="stack gap-12">{head('track')}<JobsTracking tab={trackTab} onTab={setTrackTab} /></div> },
      { key: 'code' as Slot, node: <div className="stack gap-12">{head('code')}<QrDetail key={`c${round}-${s.qrRef}-${logoFocus}`} refId={s.qrRef} focusLogo={logoFocus} /></div> },
    ]),
  ]
  const overview: Slot = stacked ? 's-stack' : tabbed ? `s-${splitTab}` : entry ? 'menu' : channel
  const active: Slot = view === 'main' || inPageModal ? overview : view
  // The page modal: the same content as the sheet. Its title and Close sit in the header, plus Back one level down.
  const plainTitle = view === 'main' ? '' : view === 'code' ? qrTitle(s.placements.find((p) => p.ref === s.qrRef)?.label, s.qrRef) : VIEW_TITLE[view]
  const modalTitle = view !== 'main' && nav.depth > 1 ? <ViewHead view={view} onBack={nav.back} as="span" /> : plainTitle
  const modalBody = view === 'preview' ? <PreviewView key={`p${round}`} inModal onBack={nav.back} saved={saved} onSave={setSaved} />
    : view === 'ending' ? <EndingView key={`e${round}`} inModal onBack={nav.back} />
    : view === 'code' ? <QrDetail key={`c${round}-${s.qrRef}-${logoFocus}`} refId={s.qrRef} focusLogo={logoFocus} />
    : view === 'track' ? <JobsTracking tab={trackTab} onTab={setTrackTab} />
    : view === 'track-link' ? <SplitTrackPage tab={trackTab} onTab={setTrackTab} />
    : view.startsWith('ch-') ? <ChannelPanel channel={view.slice(3) as Channel} onEmbed={setEmbed} alone /> : null
  return (
    <CompactCtx.Provider value={inModal}>
    <OpenCodeCtx.Provider value={openCode}>
      <SmoothHeight k={`${view}-${channel}-${trackTab}-${splitTab}`}>
        {/* A detail view hides the link, the card and the tabs. The whole box changes height once (SmoothHeight). */}
        <Collapse open={view === 'main' || inPageModal} instant>
          {stacked ? null : tabbed
            ? (
              /* Split and Simple: the tabs come first, the link lives in the Share tab. */
              <div className="share-to split-tabs">
                <Segmented<SplitTab>
                  label={splitCopy.tabs} value={splitTab} onChange={setSplitTab}
                  options={[
                    { value: 'share', label: splitCopy.share, icon: <Link2 aria-hidden /> },
                    { value: 'embed', label: splitCopy.embed, icon: <Code2 aria-hidden /> },
                  ]}
                />
              </div>
            )
            : (
              /* One rhythm: label 8 content 8 text action, 24 to the next section label. */
              <div className="stack gap-24 share-sections" style={{ paddingBottom: entry ? 24 : 16 }}>
                {linkTop}
                {!entry && <ChannelPicker value={channel} onChange={setChannel} />}
              </div>
            )}
        </Collapse>
        <PanelStack<Slot> active={active} label={tabbed ? splitCopy.tabs : shareCopy.moreWays} panels={panels} plain={entry || stacked} animate={false} />
      </SmoothHeight>
      {embed && <EmbedPage mode={embed} onClose={() => setEmbed(null)} />}
      {pageModal && (
        <Modal open={inPageModal} onClose={nav.reset} title={modalTitle} width={440} labelledBy="page-detail-title">
          <SmoothHeight k={`${view}-${trackTab}`}>{modalBody}</SmoothHeight>
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
      <div className="section-label" id="share-to-label">{shareCopy.moreWays}</div>
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
      <div className="section-label" id="share-to-label-rows">{shareCopy.moreWays}</div>
      <div className="entry-rows" role="list" aria-labelledby="share-to-label-rows">
        <span role="listitem"><ActionRow icon={<QrCode />} label="QR Code" help="Download a code to print" dataRow="ch-qr" onClick={() => onOpen('qr')} /></span>
        <span role="listitem"><ActionRow icon={<Megaphone />} label="Social" help="A tagged link for each app" dataRow="ch-social" onClick={() => onOpen('social')} /></span>
        <span role="listitem"><ActionRow icon={<Code2 />} label="Embed" help="Put the form on your website" dataRow="ch-embed" onClick={() => onOpen('embed')} /></span>
      </div>
    </div>
  )
}


/* ---------- Split version ---------- */

export type SplitTab = 'share' | 'embed'

/** Extra links you made, the link version of extra codes. */
function useExtraLinks() {
  const s = useStore()
  return s.sources.filter((x) => x.kind === 'custom' && !x.hidden)
}

/**
 * The one row in the Share tab: a ref for each place, links and codes alike. Quiet, full width, with a count once
 * you have made some ("2 links, 1 code"). It opens its own page, so the tab stays short.
 */
function SplitTrackRow({ onOpen }: { onOpen: () => void }) {
  const s = useStore()
  const links = useExtraLinks().length
  const codes = s.placements.filter((p) => p.ref !== MAIN_QR).length
  const count = [links ? splitCopy.links(links) : '', codes ? splitCopy.codes(codes) : ''].filter(Boolean).join(', ')
  return (
    <div className="split-track">
      <button type="button" className="act-row has-help" data-row="track-link" onClick={onOpen}>
        <span className="act-ic" aria-hidden><ChartNoAxesColumn /></span>
        <span className="act-text">
          <span className="act-label">{splitCopy.track}</span>
          <span className="act-help-line">{splitCopy.linkHelp}</span>
        </span>
        {count && <span className="split-count">{count}</span>}
        <ChevronRight className="act-chev" aria-hidden />
      </button>
    </div>
  )
}

const REF_TIP_CODE = '?ref=anything'

/**
 * A link you made, as a row like a preset: the link icon, name and ref, then Copy and More options, in the same order as a code row's Download and More options.
 * `rowCopy`: a click anywhere on the row copies too, except on Copy and More options.
 */
function LinkRow({ p, rowCopy = false }: { p: Source; rowCopy?: boolean }) {
  const s = useStore()
  const more = useRef<HTMLButtonElement>(null)
  const row = useRef<HTMLLIElement>(null)
  const [menu, setMenu] = useState(false)
  const remove = () => {
    setMenu(false)
    const li = row.current
    const nextRef = ((li?.nextElementSibling ?? li?.previousElementSibling) as HTMLElement | null)?.dataset.ref
    const scope = li?.closest('.qr-list-scope')
    s.removePlacement(p.ref)
    s.toast(splitCopy.removedLink(p.label), { action: { label: 'Undo', onClick: () => s.restorePlacement(p.ref) } })
    window.setTimeout(() => {
      const target = (nextRef && scope?.querySelector<HTMLElement>(`[data-ref="${nextRef}"] .link-row-copy`)) || scope?.querySelector<HTMLElement>('.add-code .act-row')
      target?.focus()
    }, 60)
  }
  return (
    <li ref={row} className={`code-row link-row ${rowCopy ? 'is-row-copy' : ''}`} data-ref={p.ref} onClick={rowCopy ? rowCopyClick(() => copyLink(s, p.label, p.ref)) : undefined}>
      <span className="row-lead grow"><LinkIcon className="row-type-ic" aria-hidden /><span className="code-row-text"><span className="code-row-name">{p.label}</span><span className="code-row-ref">?ref={p.ref}</span></span></span>
      <span className="row-actions">
        <CopyButton outline className="btn-sm link-row-copy" text={s.url(p.ref)} ariaLabel={shareCopy.copyFor(p.label)} toastText={splitCopy.copied(p.label)} />
        <button ref={more} type="button" className="btn btn-ghost btn-sm code-row-more" aria-label={splitCopy.moreForLink(p.label)} title={splitCopy.moreForLink(p.label)} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><EllipsisVertical aria-hidden /></button>
      </span>
      <PopMenu open={menu} anchor={more} onClose={() => setMenu(false)} label={splitCopy.moreForLink(p.label)} width={180}>
        <button type="button" role="menuitem" onClick={remove}><Trash2 aria-hidden /><span>{QR_COPY.remove}</span></button>
      </PopMenu>
    </li>
  )
}

/** Add another link, the same block as Add another code: a place name, never a ref. */
function AddLinkBlock() {
  const s = useStore()
  const links = useExtraLinks()
  const id = `add-link-${useId().replace(/:/g, '')}`
  const mobile = useIsMobile()
  const [adding, setAdding] = useState(false)
  const add = (label: string) => { const p = s.addLink(label); s.toast(splitCopy.linkAdded(p.label)) }
  const taken = new Set(links.map((p) => p.label.toLowerCase()))
  const missing = splitCopy.suggestedLinks.filter((l) => !taken.has(l.toLowerCase()))
  return (
    <div className="stack gap-8 add-code">
      <ActionRow icon={<Plus />} label={splitCopy.addLink} chevron={false} expanded={adding} controls={id} onClick={() => setAdding((v) => !v)} />
      <Collapse open={adding} id={id} gap={8}>
        <div className="stack gap-8">
          <AddPlace label={splitCopy.addLink} placeholder={mobile ? splitCopy.linkPlaceholderShort : splitCopy.linkPlaceholder} onAdd={add} />
          {missing.length > 0 && (
            <div className="chips">
              {missing.map((l) => <button key={l} type="button" className="chip" onClick={() => add(l)}><Plus aria-hidden />{l}</button>)}
            </div>
          )}
        </div>
      </Collapse>
    </div>
  )
}

/**
 * See where responses come from, with the Jobs page's structure: one line, then Links and QR codes as tabs.
 * Both tabs use the same rows (code-row): icon, name over ?ref=, then the actions, and an Add another row under them.
 * The sheet and the Share tab page both show this page.
 */
function SplitTrackPage({ tab, onTab }: { tab: TrackTab; onTab: (t: TrackTab) => void }) {
  const s = useStore()
  const links = useExtraLinks()
  const codes = [...s.placements.filter((p) => p.ref === MAIN_QR), ...s.placements.filter((p) => p.ref !== MAIN_QR)]
  const [before, after] = splitCopy.pageLine.split('Insights')
  const [tipBefore, tipAfter] = splitCopy.refTip.split(REF_TIP_CODE)
  return (
    <div className="stack split-page split-track-tabs qr-list-scope">
      <div className="stack share-to split-track-head">
        <p className="small muted" style={{ margin: 0 }}>{before}<a className="tag-link" href={insightsQrHref()}>Insights</a>{after}</p>
        <Segmented<TrackTab>
          label={splitCopy.track} value={tab} onChange={onTab}
          options={[
            { value: 'social', label: splitCopy.linksLabel, icon: <Link2 aria-hidden /> },
            { value: 'qr', label: splitCopy.codesLabel, icon: <QrCode aria-hidden /> },
          ]}
        />
      </div>
      {tab === 'social' ? (
        <div className="stack gap-8">
          {/* A plain list: adding a link only adds its row. Keying the list by its length remounted and faded every row. */}
          <ul className="code-rows" aria-label={splitCopy.linksLabel}>
            {[...SOCIAL, EMAIL].map((x) => <SocialSourceRow key={x.ref} icon={x.icon} label={x.label} refName={x.ref} />)}
            {links.map((p) => <LinkRow key={p.ref} p={p} rowCopy />)}
          </ul>
          <AddLinkBlock />
          {/* Any ?ref= works, not only the ones listed here. */}
          <p className="small muted ref-tip" style={{ margin: 0 }}>{tipBefore}<code>{REF_TIP_CODE}</code>{tipAfter}</p>
        </div>
      ) : (
        <div className="stack gap-8">
          <ul className="code-rows" aria-label={splitCopy.codesLabel}>
            {codes.map((p) => <CodeRow key={p.ref} p={p} removedText={splitCopy.removedCode} name={p.ref === MAIN_QR && p.label === MAIN_QR_LABEL ? QR_COPY.yourCode : undefined} />)}
          </ul>
          <AddCodeBlock help={false} />
        </div>
      )}
    </div>
  )
}

/* ---------- Split tracking page rows ---------- */

type Store = ReturnType<typeof useStore>
async function copyLink(s: Store, label: string, ref: string) {
  await copyText(s.url(ref))
  s.toast(splitCopy.copied(label))
}
/** A click on the row itself runs `fn`; clicks on its buttons, or in its menu (a portal), don't. */
const rowCopyClick = (fn: () => void) => (e: MouseEvent<HTMLElement>) => {
  const t = e.target as HTMLElement
  if (!e.currentTarget.contains(t) || t.closest('.row-actions, button, a, input')) return
  fn()
}

/** A social or Email as a list row: its own mark, name and ref, and Copy. The whole row copies. */
function SocialSourceRow({ icon, label, refName }: { icon: ReactNode; label: string; refName: string }) {
  const s = useStore()
  return (
    <li className="code-row link-row is-row-copy" data-ref={refName} data-row={`soc-${refName}`} onClick={rowCopyClick(() => copyLink(s, label, refName))}>
      <span className="row-lead grow"><span className="row-type-ic" aria-hidden>{icon}</span><span className="code-row-text"><span className="code-row-name">{label}</span><span className="code-row-ref">?ref={refName}</span></span></span>
      <span className="row-actions">
        <CopyButton outline className="btn-sm link-row-copy" text={s.url(refName)} ariaLabel={shareCopy.copyFor(label)} toastText={splitCopy.copied(label)} />
      </span>
    </li>
  )
}

