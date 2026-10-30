import { siFacebook, siInstagram, siWhatsapp, siX, type SimpleIcon } from 'simple-icons'
import { BriefcaseBusiness } from 'lucide-react'

/** Official marks from Simple Icons, in each brand's own color. */
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
/** Simple Icons no longer ships a LinkedIn mark, so it uses a neutral icon. */
export const Linkedin = () => <BriefcaseBusiness aria-hidden className="neutral-brand" />
