import { chromium } from 'playwright-core'
const pages = {
  typeform: 'https://help.typeform.com/hc/en-us/articles/360029252892-Share-your-form',
  gforms: 'https://www.officedemy.com/how-to-share-google-form/',
  canva: 'https://www.canva.com/help/share-on-socials-and-messaging/',
  notion: 'https://www.notion.com/help/sharing-and-permissions',
  linear: 'https://linear.app/docs/invite-members',
  figma: 'https://help.figma.com/hc/en-us/articles/1500007609322-Guide-to-sharing-and-permissions',
}
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] })
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' })
for (const [k, u] of Object.entries(pages)) {
  const p = await ctx.newPage()
  try {
    await p.goto(u, { waitUntil: 'domcontentloaded', timeout: 30000 }); await p.waitForTimeout(5000)
    const imgs = await p.evaluate(() => [...document.images].filter((i) => i.naturalWidth > 300).map((i) => ({ src: i.currentSrc, alt: i.alt, w: i.naturalWidth })))
    console.log('==', k, await p.title(), imgs.length); for (const i of imgs.slice(0, 25)) console.log('  ', i.w, i.alt.slice(0, 80), i.src.slice(0, 160))
  } catch (e) { console.log('==', k, 'ERR', String(e).slice(0, 100)) }
  await p.close()
}
await b.close()
