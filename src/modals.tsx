import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { FORM_ID, FORM_TITLE, slugify, useIsMobile, useStore } from './store'
import { Dialog, Pro } from './ui'
import { ShareBlock } from './share'
import { TallyMark } from './chrome'

export function LinkEndingModal() {
  const s = useStore()
  const [value, setValue] = useState(s.slug)
  const [confirm, setConfirm] = useState(false)
  useEffect(() => { if (s.endingOpen) { setValue(s.slug === FORM_ID ? 'summer-rsvp' : s.slug); setConfirm(false) } }, [s.endingOpen, s.slug])
  const close = () => s.setEndingOpen(false)
  const dirty = value && value !== s.slug
  const hasPrinted = !!s.downloadedLink
  const save = () => {
    if (!dirty) return close()
    if (hasPrinted && !confirm) return setConfirm(true)
    s.setSlug(value)
    s.toast('Link updated.')
    close()
  }
  const warn = hasPrinted && dirty
  return (
    <Dialog open={s.endingOpen} onClose={close} labelledBy="ending-title"
      title={<span className="row gap-8">Link ending <Pro /></span>}
      footer={warn ? (
        <>
          <button type="button" className="btn btn-secondary" onClick={close}>Keep current link</button>
          <button type="button" className="btn btn-black" onClick={() => { s.setSlug(value); s.toast('Link updated.'); close() }}>Change link anyway</button>
        </>
      ) : (
        <>
          <button type="button" className="btn btn-ghost" onClick={close}>Cancel</button>
          <button type="button" className="btn btn-black" onClick={save} disabled={!value}>Save</button>
        </>
      )}>
      <p style={{ margin: 0 }}>Make it yours, like tally.so/r/summer-rsvp.</p>
      <div className="input-group">
        <span className="prefix">tally.so/r/</span>
        <input aria-label="Link ending" value={value} onChange={(e) => setValue(slugify(e.target.value))} autoFocus />
      </div>
      <div className="callout callout-info xs"><span>Link endings are part of Tally Pro. Try one here, then upgrade to keep it.</span></div>
      {warn && (
        <div className="stack gap-12" role="alert">
          <div className="callout callout-warn">
            <TriangleAlert aria-hidden />
            <span><b>Heads up: your printed QR codes will stop working</b><br />Your QR codes point to your current link. Change it, and every poster you've printed leads nowhere.</span>
          </div>
          <div className="scan-after">
            <div className="phone-mini" aria-hidden>
              <div className="phone-bar">{s.downloadedLink}</div>
              <div className="phone-404"><TallyMark size={18} /><b>This form can't be found</b><span>The link may have changed.</span></div>
            </div>
            <span className="xs muted">What someone sees when they scan an old poster.</span>
          </div>
        </div>
      )}
    </Dialog>
  )
}

export function LinkPreviewModal() {
  const s = useStore()
  const [title, setTitle] = useState(FORM_TITLE)
  const [desc, setDesc] = useState('Bring a blanket, we bring the lemonade. Let us know if you can make it.')
  const close = () => s.setPreviewOpen(false)
  return (
    <Dialog open={s.previewOpen} onClose={close} labelledBy="preview-title"
      title={<span className="row gap-8">Link preview <Pro /></span>}
      footer={<><button type="button" className="btn btn-ghost" onClick={close}>Cancel</button><button type="button" className="btn btn-blue" onClick={close}>Upgrade to apply</button></>}>
      <p style={{ margin: 0 }}>How your link looks in chats and on social. You can try it on the free plan; applying it needs Pro.</p>
      <div className="link-card" aria-label="Preview">
        <div className="link-card-img"><TallyMark size={28} /></div>
        <div className="link-card-text">
          <span className="xs muted">{s.shortLink}</span>
          <b>{title || 'Untitled'}</b>
          <span className="xs">{desc}</span>
        </div>
      </div>
      <label className="field-label" htmlFor="lp-title">Title</label>
      <input id="lp-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label className="field-label" htmlFor="lp-desc">Description</label>
      <input id="lp-desc" className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
    </Dialog>
  )
}

/** Opens right after Publish. No celebration overlay in front of Copy, just a 🎉 in the title. */
export function PublishedSheet({ open, onClose, onOpenShareTab }: { open: boolean; onClose: () => void; onOpenShareTab: () => void }) {
  const mobile = useIsMobile()
  return (
    <Dialog open={open} onClose={onClose} labelledBy="published-title" width={440} snap="auto"
      title={<span className="stack"><span>Your form is live 🎉</span><span className="xs muted" style={{ fontWeight: 400 }}>Now let's get it in front of people.</span></span>}
      footer={mobile ? (
        <button type="button" className="list-row embed-row" onClick={onOpenShareTab}>
          <span className="grow"><span className="title">Embed on a website</span><span className="help" style={{ display: 'block' }}>Works best on desktop</span></span>
          <span className="muted xs">Share tab</span>
        </button>
      ) : (
        <>
          <button type="button" className="btn btn-ghost left" onClick={onOpenShareTab}>Embed and more options</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Done</button>
        </>
      )}>
      <ShareBlock />
    </Dialog>
  )
}
