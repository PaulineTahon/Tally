import { Dialog } from './ui'
import { ShareBlock, ViewHead, useViewStack } from './share'
import { useIsMobile } from './store'

/** Opens right after Publish. No celebration overlay in front of Copy, just a 🎉 in the title. */
/** `first` is the first publish of the form: the sheet opens on QR Code. Reopening it keeps your last tab. */
/** A detail view takes over the whole modal: Back and its title move into the header, and there is no Done. */
export function PublishedSheet({ open, first, onClose }: { open: boolean; first: boolean; onClose: () => void }) {
  const mobile = useIsMobile()
  const nav = useViewStack()
  const { view } = nav
  const close = () => { onClose(); nav.reset() }
  return (
    <Dialog open={open} onClose={close} labelledBy="published-title" width={440} snap="auto"
      title={view === 'main'
        ? <span className="stack"><span>Your form is live 🎉</span><span className="xs muted" style={{ fontWeight: 400 }}>Now let's get it in front of people.</span></span>
        : <ViewHead view={view} onBack={nav.back} as="span" />}
      footer={mobile || view !== 'main' ? undefined : <button type="button" className="btn btn-secondary" onClick={close}>Done</button>}>
      <ShareBlock first={first} nav={nav} />
    </Dialog>
  )
}
