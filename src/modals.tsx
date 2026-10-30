import { Dialog } from './ui'
import { ShareBlock } from './share'
import { useIsMobile } from './store'

/** Opens right after Publish. No celebration overlay in front of Copy, just a 🎉 in the title. */
export function PublishedSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mobile = useIsMobile()
  return (
    <Dialog open={open} onClose={onClose} labelledBy="published-title" width={440} snap="auto"
      title={<span className="stack"><span>Your form is live 🎉</span><span className="xs muted" style={{ fontWeight: 400 }}>Now let's get it in front of people.</span></span>}
      footer={mobile ? undefined : <button type="button" className="btn btn-secondary" onClick={onClose}>Done</button>}>
      <ShareBlock />
    </Dialog>
  )
}
