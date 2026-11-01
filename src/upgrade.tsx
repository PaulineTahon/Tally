import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, CircleDashed, Code2, Globe, ListChecks, MailCheck, Palette, PenLine, ShieldCheck, Users, X } from 'lucide-react'
import { useStore } from './store'
import { upgradeCopy as C } from './copy'

/**
 * A copy of Tally's own upgrade screen: full screen, Back top left, close top right,
 * monthly or yearly, Pro and Business. Prices are Tally's euro prices.
 * In the prototype, either Upgrade button is a pretend upgrade: the plan turns Pro and you land back where you were.
 */
export function UpgradeOverlay() {
  const s = useStore()
  const [yearly, setYearly] = useState(false)
  const head = useRef<HTMLHeadingElement>(null)
  // Where focus goes back to: the same Save button, which is a new element once you're on Pro.
  const back = useRef<{ el: Element | null; index: number }>({ el: null, index: -1 })
  const open = s.upgradeOpen
  useEffect(() => {
    if (!open) return
    const el = document.activeElement
    const saves = [...document.querySelectorAll('.save-btn')]
    back.current = { el, index: el ? saves.indexOf(el) : -1 }
    requestAnimationFrame(() => head.current?.focus())
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); close() } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const restore = () => requestAnimationFrame(() => {
    const { el, index } = back.current
    if (el instanceof HTMLElement && el.isConnected) { el.focus(); return }
    const next = document.querySelectorAll<HTMLElement>('.save-btn')[index]
    next?.focus()
  })
  const close = () => { s.closeUpgrade(); restore() }
  const upgrade = () => { s.setPlan('pro'); s.closeUpgrade(); restore() }
  if (!open) return null
  const pro = yearly ? C.pro.year : C.pro.month
  const biz = yearly ? C.business.year : C.business.month
  return createPortal(
    <div className="up-screen" role="dialog" aria-modal="true" aria-labelledby="up-title">
      <div className="up-bar">
        <button type="button" className="up-back" onClick={close}><ArrowLeft aria-hidden />{C.back}</button>
        <button type="button" className="up-x" aria-label={C.close} onClick={close}><X aria-hidden /></button>
      </div>
      <div className="up-inner">
        <div className="up-top">
          <div className="up-intro">
            <h2 id="up-title" ref={head} tabIndex={-1}>Do <span className="up-more">more</span> with Tally</h2>
            <p>{C.sub}</p>
            <div className="up-toggle">
              <span className={yearly ? '' : 'is-on'}>{C.monthly}</span>
              <button type="button" role="switch" aria-checked={yearly} aria-label={C.yearly} className="switch" onClick={() => setYearly((v) => !v)} />
              <span className={yearly ? 'is-on' : ''}>{C.yearly}</span>
              <span className="up-pill">{C.off}</span>
            </div>
          </div>
          <img className="up-doodle" src={`${import.meta.env.BASE_URL}upgrade-doodle.png`} alt="" />
        </div>
        <div className="up-cards">
          <section className="up-card" aria-labelledby="up-pro">
            <div className="up-card-head">
              <h3 id="up-pro">Pro</h3>
              <div className="up-price"><span className="up-cur">€</span><b>{pro.price}</b><span className="up-per">{C.perMonth}</span></div>
            </div>
            <button type="button" className="up-btn is-pro" onClick={upgrade}>{C.upgradePro}</button>
            <p className="up-pay">{pro.pay}</p>
            <ul className="up-feats is-pro">
              {C.proFeats.map(([lead, rest], i) => <li key={lead}>{PRO_ICONS[i]}<span><b>{lead}</b> {rest}</span></li>)}
            </ul>
          </section>
          <section className="up-card" aria-labelledby="up-biz">
            <div className="up-card-head">
              <h3 id="up-biz">Business</h3>
              <div className="up-price"><span className="up-cur">€</span><b>{biz.price}</b><span className="up-per">{C.perMonth}</span></div>
            </div>
            <button type="button" className="up-btn is-biz" onClick={upgrade}>{C.upgradeBusiness}</button>
            <p className="up-pay">{biz.pay}</p>
            <ul className="up-feats is-biz">
              {C.bizFeats.map(([lead, rest], i) => <li key={lead}>{BIZ_ICONS[i]}<span><b>{lead}</b> {rest}</span></li>)}
            </ul>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}

const PRO_ICONS = [<PenLine key="a" aria-hidden />, <Globe key="b" aria-hidden />, <Users key="c" aria-hidden />, <CircleDashed key="d" aria-hidden />, <Palette key="e" aria-hidden />, <Code2 key="f" aria-hidden />]
const BIZ_ICONS = [<ListChecks key="a" aria-hidden />, <ShieldCheck key="b" aria-hidden />, <MailCheck key="c" aria-hidden />]
