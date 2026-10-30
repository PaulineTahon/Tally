import { siFacebook, siInstagram, siWhatsapp, siX, type SimpleIcon } from 'simple-icons'

/** Simple Icons dropped LinkedIn, so its "in" glyph is drawn here in the same 24px format. */
const siLinkedin = {
  hex: '0A66C2',
  path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
} as SimpleIcon

/** Official marks from Simple Icons, in each brand's own color. */
function Si({ icon, size = 18 }: { icon: SimpleIcon; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden role="img">
      <path d={icon.path} fill={`#${icon.hex}`} />
    </svg>
  )
}

/** The same marks in one muted color, for lists where every row needs to read as one system. */
export function MonoMark({ brand, size = 14 }: { brand: 'whatsapp' | 'instagram' | 'facebook' | 'x' | 'linkedin'; size?: number }) {
  const icon = { whatsapp: siWhatsapp, instagram: siInstagram, facebook: siFacebook, x: siX, linkedin: siLinkedin }[brand]
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
export const Linkedin = () => <Si icon={siLinkedin} />
