# Share, redesigned: a QR code for every Tally form

This is my clickable prototype for the Tally designer assignment. Task 1 asked me to simplify the Share tab and add a QR code. Task 2 asked for visuals announcing it.

**Live prototype:** https://paulinetahon.github.io/Tally/
**Announcement visuals:** https://paulinetahon.github.io/Tally/visuals/

## The idea

People don't really want to "share". They want enough of the right responses, fast. So instead of one Copy button surrounded by unrelated cards, I built the Share tab around the link and the places people share it, with the QR code as one more format of that same link.

I started with the quick win, then the bigger bet:

1. **A share sheet right after Publish.** One link, one Copy and the QR code in a fixed place next to it. A "Share to" picker covers Link, Social, Email and In person, with "Embed on your site" as a quieter link underneath. On a phone it's a bottom sheet with a full-width Share button that opens the native share sheet.
2. **No pop-ups on top of the sheet.** Link ending, link preview and custom domain open in place, with clear Pro labels. Changing the link ending warns you first that printed codes and shared links still point to the old one.
3. **A plain black QR code, print-ready by default.** On the free plan the only extra is a small "Made with Tally" line under the short link. One Download button (SVG, PDF or PNG) and Personalize to add your brand color and logo, with error correction level H so it still scans. Responses from it are always tagged with `?ref=qr`.
4. **One code per place.** Under In person you can make a code for the poster, the flyer, the slides or the newspaper (`?ref=qr-poster`, `?ref=qr-flyer`), and re-download any of them from the list. Your last settings are remembered.
5. **Sources in Insights.** The Sources panel on the Insights tab lists `?ref` values next to the referrers, with a Submissions column and a QR icon for each code. This is the part I'd push for most: it turns sharing into a loop.

## What to try

- **Publish** in the editor and watch the share sheet open. Hit Copy and see it confirm in place.
- Click the QR code next to the link. Download it, then try Personalize. Scan it with your phone.
- Open **In person**, add another code and download it.
- Open **Link ending** and type a new one to see the warning.
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
