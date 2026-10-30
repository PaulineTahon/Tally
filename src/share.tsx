import { useState, type ReactNode } from 'react'
import { Facebook, Gmail, Instagram, Linkedin, Outlook, WhatsApp, XLogo } from './brand'
import {
  ArrowUpRight, Code, Download, FolderDown, Globe, Link2, Mail, Megaphone, Pencil, Plus, QrCode, Share, Store as StoreIcon, TriangleAlert, Image as ImageIcon,
} from 'lucide-react'
import { canNativeShare, copyText, FORM_ID, FORM_TITLE, slugify, useIsMobile, useStore } from './store'
import { CopyButton, Expand, Pro, QrImage, Segmented, SmallCopy } from './ui'
import { TallyMark } from './chrome'
import { download, fileFor } from './qr'
import { FORMATS, fileName, safeStyle } from './qrpanel'

export type Channel = 'link' | 'social' | 'email' | 'embed' | 'inperson'

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

/** Link, single Copy and the QR code. The QR stays in this spot whatever channel is open. */
export function LinkBar() {
  const { display, url, setQrOpen, setQrRef, settings } = useStore()
  const mobile = useIsMobile()
  const share = useNativeShare()
  const openQr = () => { setQrRef('qr'); setQrOpen(true) }
  const style = safeStyle(settings.style)
  if (mobile) {
    return (
      <div className="stack gap-8">
        <div className="input-group" style={{ height: 44 }}>
          <span className="prefix">https://</span>
          <input readOnly value={display()} aria-label="Form link" onFocus={(e) => e.currentTarget.select()} />
        </div>
        <button type="button" className="btn btn-black btn-lg btn-block" onClick={() => share(url())}>
          <Share aria-hidden />Share
        </button>
        <div className="row gap-8">
          <CopyButton text={url()} className="btn-secondary" big />
          <button type="button" className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={openQr}>
            <QrCode aria-hidden />QR code
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="row gap-8">
      <div className="input-group" style={{ flex: 1 }}>
        <span className="prefix">https://</span>
        <input readOnly value={display()} aria-label="Form link" onFocus={(e) => e.currentTarget.select()} />
      </div>
      <CopyButton text={url()} />
      <button type="button" className="qr-thumb" onClick={openQr} aria-label="QR code" title="QR code">
        <QrImage url={url('qr')} style={style} size={30} label="" />
      </button>
    </div>
  )
}

export function ChannelPicker({ value, onChange }: { value: Channel; onChange: (c: Channel) => void }) {
  return (
    <div className="stack gap-8">
      <div className="xs muted" style={{ fontWeight: 600 }}>Share to</div>
      <Segmented<Channel>
        label="Share to" value={value} onChange={onChange}
        options={[
          { value: 'link', label: 'Link', icon: <Link2 aria-hidden /> },
          { value: 'social', label: 'Social', icon: <Megaphone aria-hidden /> },
          { value: 'email', label: 'Email', icon: <Mail aria-hidden /> },
          { value: 'embed', label: 'Embed', icon: <Code aria-hidden /> },
          { value: 'inperson', label: 'In person', icon: <StoreIcon aria-hidden /> },
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

/** A whole row that opens somewhere else. */
function LinkRow({ icon, title, href }: { icon: ReactNode; title: string; href: string }) {
  const external = href.startsWith('http')
  return (
    <a className="list-row" href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      <span className="row-icon">{icon}</span>
      <span className="grow"><span className="title">{title}</span></span>
      <ArrowUpRight aria-hidden />
    </a>
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
export const gmailHref = (link: string) => `https://mail.google.com/mail/?view=cm&fs=1&su=${enc(EMAIL_SUBJECT)}&body=${enc(emailBody(link))}`
export const outlookHref = (link: string) => `https://outlook.live.com/mail/0/deeplink/compose?subject=${enc(EMAIL_SUBJECT)}&body=${enc(emailBody(link))}`

/* ---------- Link ---------- */

const PREVIEW_DESC = 'Made with Tally, the simplest way to create forms.'

export function LinkPreviewCard({ title, desc, img }: { title: string; desc: string; img: string }) {
  return (
    <div className="lp" aria-label="Link preview">
      <div className="lp-site"><TallyMark size={12} />Tally Forms</div>
      <div className="lp-title">{title || FORM_TITLE}</div>
      <div className="lp-desc">{desc}</div>
      <img className="lp-img" src={img} alt="" />
    </div>
  )
}

function LinkPanel() {
  const s = useStore()
  const [open, setOpen] = useState<null | 'ending' | 'preview' | 'domain'>(null)
  const toggle = (k: 'ending' | 'preview' | 'domain') => setOpen((o) => (o === k ? null : k))
  const [ending, setEnding] = useState('')
  const [customize, setCustomize] = useState(false)
  const [lpTitle, setLpTitle] = useState(FORM_TITLE)
  const [lpDesc, setLpDesc] = useState(PREVIEW_DESC)
  const [lpImg, setLpImg] = useState<string | null>(null)
  const defaultImg = `${import.meta.env.BASE_URL}link-preview.jpg`
  const value = ending || s.slug
  const dirty = value !== s.slug
  const openEnding = () => { setEnding(s.slug === FORM_ID ? 'summer-rsvp' : s.slug); toggle('ending') }
  const save = () => { s.setSlug(value); s.toast('Link updated.'); setOpen(null) }
  return (
    <div className="stack gap-8" id="panel-link">
      <p className="small muted" style={{ margin: 0 }}>Copy it, paste it anywhere.</p>
      <div className="stack">
        <Expand id="ending" icon={<Pencil aria-hidden />} title={<>Link ending <Pro /></>} help="Make it yours, like tally.so/r/summer-rsvp."
          open={open === 'ending'} onToggle={openEnding}>
          <div className="input-group">
            <span className="prefix">tally.so/r/</span>
            <input aria-label="Link ending" value={value} onChange={(e) => setEnding(slugify(e.target.value))} />
          </div>
          {dirty && (
            <div className="callout callout-warn xs" role="alert">
              <TriangleAlert aria-hidden />
              <span>Printed QR codes and links you've already shared point to <b>{s.shortLink}</b>. They stop working once you change it.</span>
            </div>
          )}
          <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(null)}>Cancel</button>
            <button type="button" className="btn btn-black btn-sm" disabled={!dirty || !value} onClick={save}>{dirty ? 'Change link' : 'Save'}</button>
          </div>
        </Expand>

        <Expand id="preview" icon={<ImageIcon aria-hidden />} title="Link preview" help="How your link looks in chats and on social."
          open={open === 'preview'} onToggle={() => toggle('preview')}>
          <LinkPreviewCard title={customize ? lpTitle : FORM_TITLE} desc={customize ? lpDesc : PREVIEW_DESC} img={(customize && lpImg) || defaultImg} />
          {!customize ? (
            <div className="row gap-4"><button type="button" className="customize-link link-btn" onClick={() => setCustomize(true)}>Customize</button><Pro /></div>
          ) : (
            <div className="stack gap-8">
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
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setCustomize(false); setLpTitle(FORM_TITLE); setLpDesc(PREVIEW_DESC); setLpImg(null) }}>Cancel</button>
                <button type="button" className="btn btn-blue btn-sm">Upgrade to apply</button>
              </div>
            </div>
          )}
        </Expand>

        <Expand id="domain" icon={<Globe aria-hidden />} title={<>Custom domain <Pro /></>} help="Use your own, like forms.yourdomain.com."
          open={open === 'domain'} onToggle={() => toggle('domain')}>
          <div className="input-group is-disabled">
            <span className="prefix">https://</span>
            <input aria-label="Custom domain" placeholder="forms.yourdomain.com" disabled />
          </div>
          <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-blue btn-sm">Upgrade plan</button>
          </div>
        </Expand>
      </div>
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

/* ---------- In person ---------- */

const SUGGESTED = ['Poster', 'Flyer', 'Slides', 'Newspaper']

function InPersonPanel() {
  const s = useStore()
  const { settings, setSettings, placements } = s
  const [other, setOther] = useState('')
  const [busy, setBusy] = useState(false)
  const style = safeStyle(settings.style)
  const opts = (ref: string) => ({ url: s.url(ref), shortLink: s.shortLink, style, madeWithTally: true })
  const one = async (ref: string) => {
    download(await fileFor(opts(ref), settings.format, settings.size), fileName(ref, settings.format))
    s.markDownloaded()
  }
  const all = async (zip: boolean) => {
    if (!placements.length) return
    setBusy(true)
    try {
      if (zip) {
        const { default: JSZip } = await import('jszip')
        const z = new JSZip()
        for (const p of placements) z.file(fileName(p.ref, settings.format), await fileFor(opts(p.ref), settings.format, settings.size))
        download(await z.generateAsync({ type: 'blob' }), `${slugify(FORM_TITLE)}-qr-codes.zip`)
      } else {
        for (const p of placements) { await one(p.ref); await new Promise((r) => setTimeout(r, 250)) }
      }
      s.markDownloaded()
      s.toast(`${placements.length} QR codes downloaded. Time to print!`)
    } finally { setBusy(false) }
  }
  const add = (label: string) => {
    const p = s.addPlacement(label)
    s.toast(`Code added: ${p.ref}`)
  }
  const missing = SUGGESTED.filter((l) => !placements.some((p) => p.ref === `qr-${slugify(l)}`))
  return (
    <div className="stack gap-12">
      <p className="small muted" style={{ margin: 0 }}>One code per spot, so you can see which one brings responses.</p>
      {placements.length > 0 && (
        <ul className="placements" aria-label="Your QR codes">
          {placements.map((p) => (
            <li key={p.ref}>
              <span className="qr-thumb is-static" aria-hidden><QrImage url={s.url(p.ref)} style={style} size={30} label="" /></span>
              <span className="grow stack">
                <span className="title">{p.label}</span>
                <span className="xs muted mono">{p.ref}</span>
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { s.setQrRef(p.ref); s.setQrOpen(true) }}>Open</button>
              <button type="button" className="btn btn-secondary btn-sm icon-btn" aria-label={`Download ${p.label}`} title={`Download ${settings.format.toUpperCase()}`} onClick={() => one(p.ref)}><Download aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="stack gap-8">
        <span className="xs" style={{ fontWeight: 600 }}>Add a spot</span>
        <div className="chips">
          {missing.map((l) => <button key={l} type="button" className="chip" onClick={() => add(l)}><Plus aria-hidden />{l}</button>)}
        </div>
        <form className="row gap-8" onSubmit={(e) => { e.preventDefault(); if (!other.trim()) return; add(other); setOther('') }}>
          <div className="input-group" style={{ flex: 1 }}>
            <span className="prefix">qr-</span>
            <input aria-label="Other spot" placeholder="library" value={other} onChange={(e) => setOther(slugify(e.target.value))} />
          </div>
          <button type="submit" className="btn btn-secondary" disabled={!other}><Plus aria-hidden />Add</button>
        </form>
      </div>
      {placements.length > 1 && (
        <div className="download-all">
          <Segmented label="Format" value={settings.format} onChange={(f) => setSettings({ ...settings, format: f })}
            options={FORMATS.map((f) => ({ value: f.id, label: f.label }))} />
          <div className="row gap-8">
            <button type="button" className="btn btn-black" style={{ flex: 1 }} disabled={busy} onClick={() => all(true)}><FolderDown aria-hidden />Download all (.zip)</button>
            <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => all(false)}>One file each</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Panels ---------- */

export function ChannelPanel({ channel }: { channel: Channel }) {
  const { url } = useStore()
  if (channel === 'link') return <LinkPanel />
  if (channel === 'embed') return <EmbedPanel />
  if (channel === 'inperson') return <InPersonPanel />
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
      <div className="stack">
        <LinkRow icon={<Gmail />} title="Gmail" href={gmailHref(link)} />
        <LinkRow icon={<Outlook />} title="Outlook" href={outlookHref(link)} />
        <LinkRow icon={<Mail aria-hidden />} title="Mail app" href={emailHref(link)} />
        <Row icon={<Link2 aria-hidden />} title="Email link" right={<SmallCopy text={link} />} />
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
  return (
    <div className="stack gap-16">
      <LinkBar />
      <ChannelPicker value={channel} onChange={setChannel} />
      <div role="tabpanel"><ChannelPanel channel={channel} /></div>
    </div>
  )
}

