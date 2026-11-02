# Share, redesigned: a QR code for every Tally form

This is my clickable prototype for the Tally designer assignment. Task 1 asked me to simplify the Share tab and add a QR code. Task 2 asked for visuals announcing it.

**Live prototype:** https://paulinetahon.github.io/Tally/
**Announcement visuals:** https://paulinetahon.github.io/Tally/visuals/

## The idea

People don't really want to "share". They want enough of the right responses, fast. So instead of one Copy button surrounded by unrelated cards, I built the Share tab around the link, with the QR code as one more format of that same link.

**Simple is my proposal**, and it's what the prototype opens on: the link with Copy and a QR code button next to it, the link preview, and Embed. **Split** (`?variant=split`) shows how I'd add tracked links on top of it as a next step. I also explored Tabs, Rows, Tiles and Jobs on the way; they stay in my review build.

I started with the quick win, then the bigger bet:

1. **A share sheet right after Publish, the first time.** It has two tabs, Share and Embed, and opens on Share. Share has the link with Copy and the QR code as a square button next to it, Use custom domain under them, then the link preview card with Customize preview. On the Share tab page, Share link and Embed sit one under the other instead of as tabs. On a phone it's a bottom sheet with a Share button that opens the native share sheet. Republishing a form that already has responses shows a short alert with a Share button instead, so the sheet doesn't get in the way.
2. **A calm sheet, actions in context.** Copy is the only black button (on a phone, Share is, and Copy is outlined next to it). Where Copy isn't on screen, like the Embed tab in the sheet, Copy code is the black button. Use custom domain (Edit custom domain once one is saved) opens Link ending and domain, and Customize preview opens the preview editor: title, description and image. Each one takes over the sheet with a Back arrow, and on the desktop Share tab page it opens in a centred modal. Nothing is kept until Save, and Save takes you back to the Share overview, the same way Back does, with the new link or preview card showing there. Back never saves and never asks. On Free, Save reads Upgrade to Save and opens a copy of Tally's plans pop-up; upgrade and you land back in the same view with Save ready. A custom ending lives on your own domain (Pro), as an extra address: tally.so/r/KpYalV always keeps working. The ending opens once you type a domain, filled in with the form's title as a slug, and the view shows the full new link as you type. Change an ending you had already saved and it warns you that links you've shared with it stop working. Embed shows Standard, Popup and Full page, with none picked to start with. Pick one and its real code opens under the cards in a short scrolling box, with Copy code and Customize embed, which opens Tally's full Embed page with that layout chosen and a live preview. Embedding is free, so Customize embed has no Pro badge.
3. **A plain black QR code, print-ready by default.** Round black dots, rounded corner eyes and a white Tally asterisk in the middle, the same on screen, in the PNG, SVG and PDF and in Insights, with the form's link printed under it and error correction level H so it always scans. The one personal touch is a logo (Pro), which you can try on Free before you upgrade to download it. Every code opens the form's ID with a `?ref` tag, on your custom domain once one is on (forms.acme.com/r/KpYalV) and on tally.so/r/ without one, never the custom ending, so printed codes keep working when you change the ending.
4. **One code, ready to go.** The QR code button next to Copy opens your form's code (tagged ?ref=qr) on its own page: the code with its link under it, Download PNG with SVG and PDF in its menu, and Add your logo (Pro) right under it. Download PNG saves at print size (Save image on a phone, which opens the system share sheet).
5. **Sources in Insights.** In Simple, the Sources panel on the Insights tab lists Your QR Code next to Direct / None, with a Submissions column, so you see what your code brings in. In Split, every tagged link and code shows as its own row next to the referrers. This is the part I'd push for most: it turns sharing into a loop.

## What to try

- **Publish** in the editor and watch the share sheet open on Share. Hit Copy and see the alert.
- Click the **QR code** button next to Copy, download your code (SVG or PDF from the menu), add a logo and scan it with your phone.
- Hit **Customize preview**, change the title, Save, and see the card update.
- Hit **Use custom domain**, add a domain and an ending, and watch the new link build as you type. Pick **Custom ending** in the prototype bar to start from a saved one.
- In **Embed**, pick a layout and copy its code, or open Customize embed.
- Open **Simple**, the default: https://paulinetahon.github.io/Tally/
- Switch to **Split** with `?variant=split` (or Version: Split in the prototype bar) to see tracked links.
- Switch the plan between Free and Pro in the prototype bar. On Free you can try a new link ending or a logo, but saving the ending or downloading a code with your logo asks you to upgrade.
- Switch the Publish state in the prototype bar to see republishing with and without responses.
- Follow the **Prototype Guide** card on each screen.
- Go to **Insights** and switch between the example states in the prototype bar.
- Try everything at phone width too.

The demo form uses Tally's default header, a plain off-white band with no cover image. The surrounding Tally UI is static on purpose. Only the share feature changes. Every number on the Insights tab is example data.

The visuals page has the changelog image and GIF, a poster, LinkedIn and X images and a cover for the demo form, every code in them really scans, and layered sources for Figma are in `design-sources/`.

## Built with

Vite, React and TypeScript. `qrcode` for the codes (error correction level H, so a logo in the middle still scans), `jspdf` for vector PDFs and `html-to-image` for the PNG exports. Icons are Lucide, brand marks come from Simple Icons (drawn in the text colour), and the type is Inter, to stay close to Tally's own UI.

```bash
npm install
npm run dev      # local dev server
npm run build    # static build in dist/
```

The site deploys to GitHub Pages through `.github/workflows/pages.yml`.
