# Share, redesigned: a QR code for every Tally form

This is my clickable prototype for the Tally designer assignment. Task 1 asked me to simplify the Share tab and add a QR code. Task 2 asked for two visuals announcing it.

**Live prototype:** https://paulinetahon.github.io/Tally/
**Announcement visuals:** https://paulinetahon.github.io/Tally/visuals/

## The idea

People don't really want to "share". They want enough of the right responses, fast. So instead of one Copy button surrounded by unrelated cards, I built the Share tab around the link and the places people share it, with the QR code as one more format of that same link.

I started with the quick win, then the bigger bet:

1. **A share sheet right after Publish.** One link, one Copy, and a "Share to" picker: Link, Social, Email, In person. On a phone it's a bottom sheet with a full-width Share button that opens the native share sheet.
2. **A calmer Share tab.** The share block sits on top. Link ending and link preview are folded underneath with clear Pro labels. Embed moves to "More ways to share", and "Create a template" moves to the form's ··· menu, away from Delete.
3. **A QR panel that's print-ready by default.** Black and SVG out of the box, with Download as the first action. PDF and PNG are one click away. Colour, logo and size stay tucked under Style. The short link is printed under the code, responses are tracked with `?ref=qr`, and you get a warning before changing a link that printed posters depend on.
4. **Tracked links and Responses by source.** One tagged link per place you share (`?ref=instagram`, `?ref=poster-library`), and a small view on the results page that shows where responses came from. This is the part I'd push for most: it turns sharing into a loop.

## What to try

- **Publish** in the editor and watch the share sheet open. Hit Copy and see it confirm in place.
- Open **In person**, then the QR code. Download SVG, PDF or PNG, then scan the code with your phone.
- Change the **link ending** after downloading a code to see the warning.
- Go to **Results** and switch between the example states in the prototype bar.
- Try everything at phone width too.

The surrounding Tally UI is static on purpose. Only the share feature changes. Every number on the results page is example data.

## Built with

Vite, React and TypeScript. `qrcode` for the codes (error correction level H, so a logo in the middle still scans), `jspdf` for vector PDFs and `html-to-image` for the PNG exports. Icons are Lucide and the type is Inter, to stay close to Tally's own UI.

```bash
npm install
npm run dev      # local dev server
npm run build    # static build in dist/
```

The site deploys to GitHub Pages through `.github/workflows/pages.yml`.
