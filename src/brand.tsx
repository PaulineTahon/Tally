import { siFacebook, siGmail, siInstagram, siWhatsapp, siX, type SimpleIcon } from 'simple-icons'
import { BriefcaseBusiness, Mail } from 'lucide-react'

/** Official marks from Simple Icons, in each brand's own colour. */
function Si({ icon, size = 18 }: { icon: SimpleIcon; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden role="img">
      <path d={icon.path} fill={`#${icon.hex}`} />
    </svg>
  )
}

export const WhatsApp = () => <Si icon={siWhatsapp} />
export const Instagram = () => <Si icon={siInstagram} />
export const Facebook = () => <Si icon={siFacebook} />
export const XLogo = () => <Si icon={siX} />
export const Gmail = () => <Si icon={siGmail} />
/** Simple Icons no longer ships LinkedIn or Outlook marks, so these two use neutral icons. */
export const Linkedin = () => <BriefcaseBusiness aria-hidden className="neutral-brand" />
export const Outlook = () => <Mail aria-hidden className="neutral-brand" />
