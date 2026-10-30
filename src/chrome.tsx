import { useState, type ReactNode } from 'react'
import {
  Home, Search, UsersRound, Globe, Settings, CircleArrowUp, PanelsTopLeft, Sparkles, Map, SmilePlus, CircleDollarSign, Trash2, Send, Book, LifeBuoy, MessageCircle, HeartPlus, ChevronDown, ChevronRight, Pencil, PenLine, Ellipsis, Copy, Type, LayoutTemplate, Link,
} from 'lucide-react'
import { FORM_TITLE, copyText, useIsMobile, useStore } from './store'
import { Menu } from './ui'

/** Tally's mark, taken as is from tally-logo.svg (128 x 124, black). */
export const TALLY_PATH = 'M79.9335 17.1445C79.9335 24.2262 77.3191 33.969 73.4647 47.0615L70.7069 57.1173L79.4337 51.4172C96.022 39.7688 106.04 35.397 112.67 35.397C120.212 35.397 128 40.7864 128 51.5052C128 65.1402 113.443 69.0136 85.3379 69.4912L74.8298 69.9849L83.1169 76.5821C102.791 91.747 109.612 99.1764 109.612 108.59C109.612 115.999 102.727 123.715 94.1897 123.715C81.3632 123.715 75.5655 110.387 67.7502 87.7575L63.7662 77.922L60.0183 87.7575C51.2591 113.46 44.5174 123.479 33.343 123.479C24.334 123.479 17.9208 115.289 17.9208 108.354C17.9208 97.9942 27.3369 89.3825 44.6517 76.5821L52.9388 69.9849L42.6666 69.4912C12.8171 69.2501 0 64.957 0 51.2688C0 40.55 8.02804 35.1605 15.4268 35.1605C24.3617 35.1605 34.1064 41.1875 48.5708 51.4172L57.2976 57.1173L54.5398 47.0615C50.3616 33.2597 48.3996 23.1344 48.3996 17.1445C48.3996 7.76783 53.6838 0 64.0023 0C74.5567 1.03096e-07 79.9335 7.76783 79.9335 17.1445Z'

export function TallyMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 124) / 128} viewBox="0 0 128 124" fill="none" aria-hidden style={{ flex: 'none' }}>
      <path d={TALLY_PATH} fill="black" />
    </svg>
  )
}

export function Avatar({ size = 20 }: { size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62}><circle cx="12" cy="9" r="4.2" fill="#fff" /><path d="M3.5 21c1.4-4.2 4.6-6.3 8.5-6.3s7.1 2.1 8.5 6.3" fill="#fff" /></svg>
    </span>
  )
}

function HomeMark() {
  // Same mark as the logo; the sidebar shows it in the icon grey.
  return <svg width="16" height="16" viewBox="0 0 128 124" aria-hidden><path d={TALLY_PATH} fill="currentColor" /></svg>
}

type NavItem = { icon: ReactNode; label: string; tone?: 'upgrade' | 'new' | 'feedback'; dot?: boolean }
const I = (C: typeof Home) => <C aria-hidden />
const NAV1: NavItem[] = [
  { icon: <HomeMark />, label: 'Home' }, { icon: I(Search), label: 'Search' }, { icon: I(UsersRound), label: 'Members' },
  { icon: I(Globe), label: 'Domains' }, { icon: I(Settings), label: 'Settings' }, { icon: I(CircleArrowUp), label: 'Upgrade plan', tone: 'upgrade' },
]
const NAV2: NavItem[] = [
  { icon: I(PanelsTopLeft), label: 'Templates' }, { icon: I(Sparkles), label: "What's new", tone: 'new', dot: true }, { icon: I(Map), label: 'Roadmap' },
  { icon: I(SmilePlus), label: 'Feature requests' }, { icon: I(CircleDollarSign), label: 'Rewards' }, { icon: I(Trash2), label: 'Trash' },
]
const NAV3: NavItem[] = [
  { icon: I(Send), label: 'Get started' }, { icon: I(Book), label: 'How-to guides' }, { icon: I(LifeBuoy), label: 'Help center' }, { icon: I(MessageCircle), label: 'Contact support' },
]
function Item({ n }: { n: NavItem }) {
  return <a className={`side-item ${n.tone ?? ''}`}>{n.icon}<span className="grow">{n.label}</span>{n.dot && <i className="side-dot" />}</a>
}

export function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Workspace">
      <div className="side-user"><Avatar size={20} /> <span>My workspace</span> <ChevronDown aria-hidden /></div>
      {NAV1.map((n) => <Item key={n.label} n={n} />)}
      <div className="side-label">Workspaces</div>
      <a className="side-item"><ChevronRight aria-hidden />My workspace</a>
      <div className="side-label">Product</div>
      {NAV2.map((n) => <Item key={n.label} n={n} />)}
      <div className="side-label">Help</div>
      {NAV3.map((n) => <Item key={n.label} n={n} />)}
      <div className="side-bottom"><Item n={{ icon: I(HeartPlus), label: 'Give Feedback', tone: 'feedback', dot: true }} /></div>
    </nav>
  )
}

export function HelpButton() {
  return <button type="button" className="help-fab" aria-label="Help">?</button>
}

export function DashHeader({ onEdit }: { onEdit: () => void }) {
  const mobile = useIsMobile()
  const { url, toast } = useStore()
  return (
    <header className="dash-header">
      <div className="crumbs">
        <span className="crumb-mark"><HomeMark /></span>
        {!mobile && <><span className="sep">/</span><span>My workspace</span><span className="sep">/</span><span className="cur">{FORM_TITLE}</span></>}
        {mobile && <ChevronDown aria-hidden className="muted" style={{ width: 14 }} />}
      </div>
      <div className="row gap-8">
        <Avatar size={28} />
        <button type="button" className={`btn btn-ghost btn-sm top-copy ${mobile ? 'icon-btn' : ''}`} aria-label="Copy share link"
          onClick={async () => { await copyText(url()); toast('Link copied. Go spread the word.') }}>
          <Link aria-hidden />{!mobile && 'Copy share link'}
        </button>
        <button type="button" className="btn btn-blue btn-sm" onClick={onEdit}><PenLine aria-hidden />Edit</button>
      </div>
    </header>
  )
}

export type Tab = 'insights' | 'submissions' | 'share' | 'integrations' | 'settings'

export function FormTitle({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const [menu, setMenu] = useState(false)
  const tabs: [Tab, string][] = [['insights', 'Insights'], ['submissions', 'Submissions'], ['share', 'Share'], ['integrations', 'Integrations'], ['settings', 'Settings']]
  return (
    <div className="form-head">
      <div className="row gap-8" style={{ position: 'relative' }}>
        <h1>{FORM_TITLE}</h1>
        <button type="button" className="btn btn-ghost btn-sm icon-btn" aria-label="Form options" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><Ellipsis aria-hidden /></button>
        <Menu open={menu} onClose={() => setMenu(false)} style={{ top: 40, left: 'min(100%, 300px)' }}>
          <button role="menuitem" onClick={() => setMenu(false)}><Pencil aria-hidden />Edit</button>
          <button role="menuitem" onClick={() => setMenu(false)}><Type aria-hidden />Rename</button>
          <button role="menuitem" onClick={() => setMenu(false)}><Copy aria-hidden />Duplicate</button>
          <button role="menuitem" onClick={() => setMenu(false)}><LayoutTemplate aria-hidden /><span>Create a template<br /><span className="xs muted">Let others start from a copy</span></span></button>
          <div className="menu-sep" />
          <button role="menuitem" className="danger" onClick={() => setMenu(false)}><Trash2 aria-hidden />Delete</button>
        </Menu>
      </div>
      <div className="tabs" role="tablist" aria-label="Form">
        {tabs.map(([id, l]) => (
          <button key={id} role="tab" aria-selected={tab === id} className="tab" onClick={() => onTab(id)}>{l}</button>
        ))}
      </div>
    </div>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const mobile = useIsMobile()
  return <div className="dash">{!mobile && <Sidebar />}<div className="dash-main">{children}</div>{!mobile && <HelpButton />}</div>
}
