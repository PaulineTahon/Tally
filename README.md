# Share, redesigned: a QR code for every Tally form

This is my clickable prototype for the Tally designer assignment. Task 1 asked me to simplify the Share tab and add a QR code. Task 2 asked for visuals announcing it.

**Live prototype:** https://paulinetahon.github.io/Tally/
**Announcement visuals:** https://paulinetahon.github.io/Tally/visuals/

## The idea

People don't really want to "share". They want enough of the right responses, fast. So instead of one Copy button surrounded by unrelated cards, I built the Share tab around the link and the places people share it, with the QR code as one more format of that same link.

I started with the quick win, then the bigger bet:

1. **A share sheet right after Publish, the first time.** The link first, then Copy, then a QR Code button that jumps to your main code. A "Share To" picker covers Social, Email and QR Code. On a phone it's a bottom sheet with a Share button that opens the native share sheet. Republishing a form that already has responses shows a short toast with a Share button instead, so the sheet doesn't get in the way.
2. **No pop-ups on top of the sheet.** Under the link sits one row with the link preview and Customize, then two quieter links: "More Link Options" (link ending and custom domain, Pro) and "Embed on your site". They open in place. Change the link ending and the old one keeps working: old endings stay reserved for your form and are listed under "Also works", where you can remove them.
3. **A plain black QR code, print-ready by default.** On the free plan the only extra is a small "Made with Tally" line under the short link. One Download button (SVG, PDF or PNG) and Personalize to add your brand color and logo, with error correction level H so it still scans. There's no size to pick: SVG and PDF are vector, and the PNG is over 3000 px wide, sharp enough to print up to A3. Responses from it are always tagged with `?ref=qr`.
4. **One code, ready to go.** The QR Code tab opens with a main code you can download right away. Using it in more than one place? Add another code for each place, for free. Every code can be renamed without changing its link, so printed codes keep working. The Share tab lists your tracked links and extra codes in one place, with the main code kept in the QR Code tab so it only shows once. You only ever see the names; the `?ref` tag stays in the link itself. Your last settings are remembered.
5. **Sources in Insights.** The Sources panel on the Insights tab lists the main QR code and each extra code as its own row, next to the referrers, with a Submissions column. This is the part I'd push for most: it turns sharing into a loop.

## What to try

- **Publish** in the editor and watch the share sheet open. Hit Copy and see it confirm in place.
- Click **QR Code** next to Copy. It jumps to the main code. Download it, then try Personalize from View code. Scan it with your phone.
- Click **Add another code**, add one for a place and download it. Then rename it.
- Open **More Link Options** and change the link ending. The old one shows up under Also works.
- Switch the Publish state in the prototype bar to see republishing with and without responses.
- Follow the **Prototype Guide** card on each screen.
- Go to **Insights** and switch between the example states in the prototype bar.
- Try everything at phone width too.

The surrounding Tally UI is static on purpose. Only the share feature changes. Every number on the Insights tab is example data.

The visuals page has the changelog image, a poster, social images for LinkedIn and X, and a cover for the demo form. Every code in them really scans and is tagged with where it was seen.

## Built with

Vite, React and TypeScript. `qrcode` for the codes (error correction level H, so a logo in the middle still scans), `jspdf` for vector PDFs and `html-to-image` for the PNG exports. Icons are Lucide, brand logos come from Simple Icons, and the type is Inter, to stay close to Tally's own UI.

```bash
npm install
npm run dev      # local dev server
npm run build    # static build in dist/
```

The site deploys to GitHub Pages through `.github/workflows/pages.yml`.
