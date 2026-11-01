import { useState } from 'react'
import { Dialog } from './ui'
import { ShareBlock, ViewHead, type LinkView } from './share'
import { useIsMobile } from './store'

/** Opens right after Publish. No celebration overlay in front of Copy, just a 🎉 in the title. */
/** `first` is the first publish of the form: the sheet opens on Link. Reopening it keeps your last tab. */
/** A detail view (Link ending and domain, Link preview) takes over the whole modal: Back and its title move into the header. */
export function PublishedSheet({ open, first, onClose }: { open: boolean; first: boolean; onClose: () => void }) {
  const mobile = useIsMobile()
  const [view, setView] = useState<LinkView>('main')
  const close = () => { onClose(); setView('main') }
  return (
    <Dialog open={open} onClose={close} labelledBy="published-title" width={440} snap="auto"
      title={view === 'main'
        ? <span className="stack"><span>Your form is live 🎉</span><span className="xs muted" style={{ fontWeight: 400 }}>Now let's get it in front of people.</span></span>
        : <ViewHead view={view} onBack={() => setView('main')} as="span" />}
      footer={mobile ? undefined : <button type="button" className="btn btn-secondary" onClick={close}>Done</button>}>
      <ShareBlock first={first} view={view} setView={setView} />
    </Dialog>
  )
}
