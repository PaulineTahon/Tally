# Share, redesigned: a QR code for every Tally form

This is my clickable prototype for the Tally designer assignment. Task 1 asked me to simplify the Share tab and add a QR code. Task 2 asked for visuals announcing it.

**Live prototype:** https://paulinetahon.github.io/Tally/
**Announcement visuals:** https://paulinetahon.github.io/Tally/visuals/

## The idea

People don't really want to "share". They want enough of the right responses, fast. So instead of one Copy button surrounded by unrelated cards, I built the Share tab around the link and the places people share it, with the QR code as one more format of that same link.

I started with the quick win, then the bigger bet:

1. **A share sheet right after Publish, the first time.** The link and Copy always sit on top, with a compact preview card right under them: a small thumbnail, the title and the domain, the way your link shows up in a chat or a post. The card applies to every link and code, whatever the ref. Below it, a "Share to" picker has three tabs: QR Code, Social and Embed. The first publish always opens on QR Code; after that the sheet remembers the tab you used last. The sheet eases to the height of each tab, so short tabs never leave an empty gap and Done glides instead of jumping. On a phone it's a bottom sheet with a Share button that opens the native share sheet, and the card and tabs stay compact so your QR code is in view without scrolling. Republishing a form that already has responses shows a short toast with a Share button instead, so the sheet doesn't get in the way.
2. **A calm sheet, actions in context.** Copy is the only black button. The link options live where they apply: the pencil in the link field opens "Link ending and domain", with one quiet line under the title, "Both are part of Pro." (Pro opens the plans), and Customize, right under the preview card, opens the preview editor. Each one takes over the whole sheet: the link, the card and the tabs step aside, the header shows a Back arrow and the view title, and Back takes you to the tab you came from. Back never saves and never asks: it puts things back the way they were saved. Escape still closes the whole sheet. In a detail view the save button is the one black button (Save on Pro, Upgrade to Save on Free); Copy isn't on screen there. On Free, Save reads Upgrade to Save and opens the upgrade pop-up, a copy of the plans pop-up on Tally today (Pro and Business, pay monthly or yearly, at tally.so/pricing prices). Upgrade there and you land back in the same view, with your values kept and Save ready. Secondary actions share one quiet row pattern (icon, label, chevron): Customize, Personalize and Add another code. A Pro badge sits next to the Customize and Personalize labels only. Looking at your preview is free. Social starts with one line, "We tag each link so you can see where responses come from.", then one row per place: WhatsApp, Instagram, Facebook, LinkedIn, X and Email. Every row says what it does: Copy link copies that place's tagged link and says Copied right in the row, Open opens the app (WhatsApp, or your mail app for Email) with the tagged link ready. Embed shows Standard, Popup and Full page, plus one line linking to Tally's guide on how embedding works. Pick one and Tally's full Embed page opens with that layout already chosen, with its options on the left and a live preview of your form on the right, where the popup really opens. Close brings you back to the Embed tab. A custom ending lives on your own domain (Pro), as an extra address: tally.so/r/KpYalV always keeps working, and every QR code points there, so printed codes never break. As you type, the view shows the full new link. Change a custom ending you had already saved and it tells you the old one stops working.
3. **A plain black QR code, print-ready by default.** Black, with a white Tally asterisk on a small black rounded tile in the middle, on every plan. No other branding. There's no colour picker: codes stay black so they're easy to scan, and the SVG is there for anyone who wants to recolour it. The one personal touch is Add your logo in Personalize, on Pro, which replaces the asterisk tile. One plain line with the form's tally.so link sits under the code, and you can turn it off. Download is one split button, the same in the QR Code tab and on the code's own page: Download PNG at print size on a computer (Save image on a phone, which opens the system share sheet), with SVG and PDF in a menu that opens above the sheet. It's outlined, so the link's Copy (Share on a phone) stays the only black button in the sheet. Error correction is level H, so the mark never stops it scanning. Every code opens tally.so/r/ with the form's ID and a `?ref` tag, never a custom domain or ending, so printed codes keep working whatever you change. When you download, a small alert confirms it just above the sheet (just under its header on a phone), and it clears when you switch tab or view.
4. **One code, ready to go.** With one code, the QR Code tab shows "Your QR Code" itself with Download and Personalize. Click the code to open its own page in the sheet, with Back and its title in the header, a bigger code, the same Download and Personalize, which opens in place. There is nothing to tell apart yet, so there is no Rename. Using it in more than one place? Add another code for each place, for free, and the tab turns into a list where each code shows its own name; click any row to open that code. Once there are two, every code can be renamed without changing its link, so printed codes keep working. The Share tab lists your tracked links and extra codes in one place, with your form's own code kept in the QR Code tab so it only shows once. You only ever see the names; the `?ref` tag stays in the link itself.
5. **Sources in Insights.** The Sources panel on the Insights tab lists your form's QR code and each extra code as its own row, by name, next to the referrers, with a Submissions column. This is the part I'd push for most: it turns sharing into a loop.

## What to try

- **Publish** in the editor and watch the share sheet open. Hit Copy and see it confirm in place.
- The sheet opens on **QR Code**. Download your code, open the format menu for SVG or PDF, then click the code to open its page and try Personalize. Scan it with your phone. Then hit **Customize** on the preview card, change the title, go Back and see the card follow.
- Click **Add another code**, add one for a place and download it. Then rename it.
- In **Social**, copy a link for Instagram or open WhatsApp: each one carries its own tag, so Insights shows where responses came from.
- Tap the **pencil** on the link, add a domain and an ending, and watch the new link build as you type. Pick **Custom ending** in the prototype bar to start from a saved one and try changing it.
- Add `?variant=entry` to the link (like `#/edit?variant=entry`) to try the other layout: three rows, QR Code, Social and Embed, each opening its own page, instead of the tabs.
- Switch the plan between Free and Pro in the prototype bar. On Free you can try a new link ending or a logo, but saving them asks you to upgrade.
- Switch the Publish state in the prototype bar to see republishing with and without responses.
- Follow the **Prototype Guide** card on each screen.
- Go to **Insights** and switch between the example states in the prototype bar.
- Try everything at phone width too.

The surrounding Tally UI is static on purpose. Only the share feature changes. Every number on the Insights tab is example data.

The visuals page has the changelog image, a poster, social images for LinkedIn and X, and a cover for the demo form. Every code in them really scans and is tagged with where it was seen. Editable, layered sources for the changelog, social and cover images are in `design-sources/`, ready to drop into Figma.

## Built with

Vite, React and TypeScript. `qrcode` for the codes (error correction level H, so a logo in the middle still scans), `jspdf` for vector PDFs and `html-to-image` for the PNG exports. Icons are Lucide, brand logos come from Simple Icons, and the type is Inter, to stay close to Tally's own UI.

```bash
npm install
npm run dev      # local dev server
npm run build    # static build in dist/
```

The site deploys to GitHub Pages through `.github/workflows/pages.yml`.
