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

/** The same marks in one muted color, for lists where every row needs to read as one system. */
export function MonoMark({ brand, size = 14 }: { brand: 'whatsapp' | 'instagram' | 'facebook' | 'x'; size?: number }) {
  const icon = { whatsapp: siWhatsapp, instagram: siInstagram, facebook: siFacebook, x: siX }[brand]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden role="img">
      <path d={icon.path} fill="currentColor" />
    </svg>
  )
}

export const WhatsApp = () => <Si icon={siWhatsapp} />
export const Instagram = () => <Si icon={siInstagram} />
export const Facebook = () => <Si icon={siFacebook} />
export const XLogo = () => <Si icon={siX} />
/** Simple Icons no longer ships a LinkedIn mark, so it uses a neutral icon. */
export const Linkedin = () => <BriefcaseBusiness aria-hidden className="neutral-brand" />
