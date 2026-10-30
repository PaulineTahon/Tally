import { useState, type ReactNode } from 'react'
import { Facebook, Instagram, Linkedin, XLogo } from './brand'
import {
  ChevronRight, ExternalLink, Link2, Mail, Megaphone, QrCode, Share, Store as StoreIcon, MessageCircle, Plus, Pencil,
} from 'lucide-react'
import { canNativeShare, copyText, FORM_TITLE, slugify, useIsMobile, useStore } from './store'
import { CopyButton, Pro, QrImage, Segmented, SmallCopy } from './ui'

export type Channel = 'link' | 'social' | 'email' | 'inperson'

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

/** Link, single Copy and the QR thumbnail. On mobile: full-width Share with Copy and QR code beside it. */
export function LinkBar({ compactQr = false, hideQr = false }: { compactQr?: boolean; hideQr?: boolean }) {
  const { display, url, setQrOpen, setQrRef, trackQr } = useStore()
  const mobile = useIsMobile()
  const share = useNativeShare()
  const openQr = () => { setQrRef('qr'); setQrOpen(true) }
  const qrUrl = trackQr ? url('qr') : url()
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
          {!hideQr && (
            <button type="button" className="btn btn-secondary btn-lg" style={{ flex: 1 }} onClick={openQr}>
              <QrCode aria-hidden />QR code
            </button>
          )}
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
      {!hideQr && (
        <button type="button" className="qr-thumb" onClick={openQr} aria-label="QR code" title="QR code">
          <QrImage url={qrUrl} size={compactQr ? 26 : 28} label="" />
        </button>
      )}
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
          { value: 'inperson', label: 'In person', icon: <StoreIcon aria-hidden /> },
        ]}
      />
    </div>
  )
}

function Row({ icon, title, help, right, onClick }: { icon?: ReactNode; title: ReactNode; help?: ReactNode; right?: ReactNode; onClick?: () => void }) {
  const inner = (
    <>
      {icon && <span className="row-icon">{icon}</span>}
      <span className="grow"><span className="title row gap-8">{title}</span>{help && <span className="help" style={{ display: 'block' }}>{help}</span>}</span>
      {right}
    </>
  )
  return onClick
    ? <button type="button" className="list-row" onClick={onClick}>{inner}<ChevronRight aria-hidden /></button>
    : <div className="list-row" style={{ cursor: 'default' }}>{inner}</div>
}

const enc = encodeURIComponent
export const SHARE_TEXT = `Quick one: ${FORM_TITLE}. It takes a minute.`

/** Where each network's own share screen lives. Instagram has none on the web, so it's Copy only. */
export const SOCIAL: { ref: string; label: string; icon: ReactNode; action?: string; open?: (link: string) => string }[] = [
  { ref: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle aria-hidden />, action: 'Send', open: (l) => `https://wa.me/?text=${enc(`${SHARE_TEXT} ${l}`)}` },
  { ref: 'instagram', label: 'Instagram', icon: <Instagram /> },
  { ref: 'linkedin', label: 'LinkedIn', icon: <Linkedin />, action: 'Post', open: (l) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(l)}` },
  { ref: 'x', label: 'X', icon: <XLogo />, action: 'Post', open: (l) => `https://x.com/intent/post?text=${enc(SHARE_TEXT)}&url=${enc(l)}` },
  { ref: 'facebook', label: 'Facebook', icon: <Facebook />, action: 'Post', open: (l) => `https://www.facebook.com/sharer/sharer.php?u=${enc(l)}` },
]

export function emailHref(link: string) {
  const body = `Hi!\n\nWe're getting the picnic together and would love to know if you can make it. It takes a minute:\n\n${link}`
  return `mailto:?subject=${enc(`Quick one: ${FORM_TITLE}`)}&body=${enc(body)}`
}

export function ChannelPanel({ channel }: { channel: Channel }) {
  const store = useStore()
  const { url, display, setEndingOpen, setPreviewOpen, setQrOpen, setQrRef, addSource } = store
  const [place, setPlace] = useState('')
  if (channel === 'link') {
    return (
      <div className="stack gap-8" id="panel-link">
        <p className="small muted" style={{ margin: 0 }}>Copy it, paste it anywhere.</p>
        <div className="stack">
          <Row icon={<Pencil aria-hidden />} title={<>Link ending <Pro /></>} help="Make it yours, like tally.so/r/summer-rsvp." onClick={() => setEndingOpen(true)} />
          <Row icon={<Link2 aria-hidden />} title="Link preview" help="How your link looks in chats and on social." onClick={() => setPreviewOpen(true)}
            right={<span className="row gap-4"><span className="customize-link">Customize</span><Pro /></span>} />
        </div>
      </div>
    )
  }
  if (channel === 'social') {
    return (
      <div className="stack gap-8">
        <p className="small muted" style={{ margin: 0 }}>Post it where your people are.</p>
        <div className="stack">
          {SOCIAL.map((s) => (
            <Row key={s.ref} icon={s.icon} title={s.label} help={<span className="mono">{display(s.ref)}</span>}
              right={<span className="row gap-4">
                {s.open && <a className="btn btn-secondary btn-sm" href={s.open(url(s.ref))} target="_blank" rel="noreferrer" aria-label={`${s.action} on ${s.label}`}><ExternalLink aria-hidden />{s.action}</a>}
                <SmallCopy text={url(s.ref)} />
              </span>} />
          ))}
        </div>
        <p className="xs muted" style={{ margin: 0 }}>Each link is tagged, so you'll know which post worked.</p>
      </div>
    )
  }
  if (channel === 'email') {
    const href = emailHref(url('email'))
    return (
      <div className="stack gap-8">
        <p className="small muted" style={{ margin: 0 }}>Drop it in your newsletter or inbox.</p>
        <Row icon={<Mail aria-hidden />} title="Email link" help={<span className="mono">{display('email')}</span>} right={<SmallCopy text={url('email')} />} />
        <div className="row gap-8">
          <a className="btn btn-secondary btn-sm" href={href} style={{ textDecoration: 'none' }}><Mail aria-hidden />Write an email</a>
        </div>
        <p className="xs muted" style={{ margin: 0 }}>Tagged with ?ref=email, so email responses show up on their own.</p>
      </div>
    )
  }
  const openFor = (ref: string) => { setQrRef(ref); setQrOpen(true) }
  return (
    <div className="stack gap-12">
      <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
        <span className="qr-thumb qr-thumb-lg" aria-hidden>
          <QrImage url={store.trackQr ? url('qr') : url()} size={64} label="" />
        </span>
        <div className="stack gap-8" style={{ flex: 1 }}>
          <p className="small muted" style={{ margin: 0 }}>Posters, slides, flyers, name badges. Anyone can scan it to open your form.</p>
          <div><button type="button" className="btn btn-black btn-sm" onClick={() => openFor('qr')}><QrCode aria-hidden />Get QR code</button></div>
        </div>
      </div>
      <form className="stack gap-4" onSubmit={(e) => { e.preventDefault(); if (!place.trim()) return; const s = addSource(`poster ${place}`); setPlace(''); openFor(s.ref) }}>
        <label className="xs" htmlFor="place" style={{ fontWeight: 600 }}>Putting up more than one? Name the spot</label>
        <div className="row gap-8">
          <div className="input-group" style={{ flex: 1 }}>
            <span className="prefix">?ref=poster-</span>
            <input id="place" placeholder="library" value={place} onChange={(e) => setPlace(slugify(e.target.value))} />
          </div>
          <button type="submit" className="btn btn-secondary" disabled={!place}><Plus aria-hidden />Add</button>
        </div>
        <span className="xs muted">Each spot gets its own code, so you can compare responses per poster.</span>
      </form>
    </div>
  )
}

export function ShareBlock({ initial = 'link' }: { initial?: Channel }) {
  const [channel, setChannel] = useState<Channel>(initial)
  return (
    <div className="stack gap-16">
      <div className="stack gap-8">
        <LinkBar hideQr={channel === 'inperson'} />
        <div className="row gap-4"><a className="custom-domain" href="#/share">Use custom domain</a><Pro /></div>
      </div>
      <ChannelPicker value={channel} onChange={setChannel} />
      <div role="tabpanel"><ChannelPanel channel={channel} /></div>
    </div>
  )
}
