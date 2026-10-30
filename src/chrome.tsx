import { useState, type ReactNode } from 'react'
import {
  Home, Search, Users, Globe, Settings, CirclePlus, LayoutTemplate, Sparkles, Map, Lightbulb, Gift, Trash2, Send, BookOpen, LifeBuoy, MessageSquare, ChevronDown, ChevronRight, Link2, Pencil, Ellipsis, Copy, Type, HelpCircle,
} from 'lucide-react'
import { FORM_TITLE, copyText, useIsMobile, useStore } from './store'
import { Menu } from './ui'

export function TallyMark({ size = 16, spin = false }: { size?: number; spin?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={spin ? 'mark-spin' : undefined}>
      <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
        <path d="M12 2.8v18.4" /><path d="M4 7.4l16 9.2" /><path d="M4 16.6l16-9.2" />
      </g>
    </svg>
  )
}

export function Avatar({ size = 20 }: { size?: number }) {
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.5 }} aria-hidden>C</span>
}

const NAV1 = [
  [Home, 'Home'], [Search, 'Search'], [Users, 'Members'], [Globe, 'Domains'], [Settings, 'Settings'],
] as const
const NAV2 = [
  [LayoutTemplate, 'Templates'], [Sparkles, "What's new"], [Map, 'Roadmap'], [Lightbulb, 'Feature requests'], [Gift, 'Rewards'], [Trash2, 'Trash'],
] as const
const NAV3 = [[Send, 'Get started'], [BookOpen, 'How-to guides'], [HelpCircle, 'Help center'], [LifeBuoy, 'Contact support']] as const

export function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Workspace">
      <div className="side-user"><Avatar /> <span>Picnic Club</span> <ChevronDown aria-hidden /></div>
      {NAV1.map(([I, l]) => <a key={l} className="side-item"><I aria-hidden />{l}</a>)}
      <a className="side-item upgrade"><CirclePlus aria-hidden />Upgrade plan</a>
      <div className="side-label">Workspaces</div>
      <a className="side-item"><ChevronRight aria-hidden />My workspace</a>
      <div className="side-label">Product</div>
      {NAV2.map(([I, l]) => <a key={l} className="side-item"><I aria-hidden />{l}</a>)}
      <div className="side-label">Help</div>
      {NAV3.map(([I, l]) => <a key={l} className="side-item"><I aria-hidden />{l}</a>)}
      <a className="side-item side-bottom"><MessageSquare aria-hidden />Give feedback</a>
    </nav>
  )
}

export function DashHeader({ onEdit }: { onEdit: () => void }) {
  const mobile = useIsMobile()
  return (
    <header className="dash-header">
      <div className="crumbs">
        <TallyMark size={16} />
        {!mobile && <><span className="sep">/</span><span>My workspace</span><span className="sep">/</span><span className="cur">{FORM_TITLE}</span></>}
        {mobile && <ChevronDown aria-hidden className="muted" style={{ width: 14 }} />}
      </div>
      <div className="row gap-8">
        <Avatar size={22} />
        <button type="button" className="btn btn-blue btn-sm" onClick={onEdit}><Pencil aria-hidden />Edit</button>
      </div>
    </header>
  )
}

export type Tab = 'insights' | 'submissions' | 'share' | 'integrations' | 'settings'

export function FormTitle({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const [menu, setMenu] = useState(false)
  const { url, toast } = useStore()
  const tabs: [Tab, string][] = [['insights', 'Insights'], ['submissions', 'Submissions'], ['share', 'Share'], ['integrations', 'Integrations'], ['settings', 'Settings']]
  return (
    <div className="form-head">
      <div className="row gap-8" style={{ position: 'relative' }}>
        <h1>{FORM_TITLE}</h1>
        <button type="button" className="btn btn-ghost btn-sm icon-btn" aria-label="Form options" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><Ellipsis aria-hidden /></button>
        <Menu open={menu} onClose={() => setMenu(false)} style={{ top: 40, left: 'min(100%, 300px)' }}>
          <button role="menuitem" onClick={() => setMenu(false)}><Pencil aria-hidden />Edit</button>
          <button role="menuitem" onClick={() => setMenu(false)}><Type aria-hidden />Rename</button>
          <button role="menuitem" onClick={async () => { setMenu(false); await copyText(url()); toast('Link copied. Go spread the word.') }}><Link2 aria-hidden />Copy link</button>
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
  return <div className="dash">{!mobile && <Sidebar />}<div className="dash-main">{children}</div></div>
}
