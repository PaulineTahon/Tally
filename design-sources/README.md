# Design Sources

The editable sources for the announcement images, so I can fine-tune them in Figma. Drag any SVG onto a Figma canvas and it comes in as a frame with named layers.

## What's Here

```
design-sources/
  changelog/
    changelog-1200x630.svg          Layered source of the changelog image, also the link preview image (export at 2x)
    tally-qr-changelog-2400x1260.png Final PNG, for reference
    tally-wordmark.png              Tally wordmark used top left (also embedded in the SVG)
    qr/qr-changelog.svg             The real code in the image (?ref=qr-changelog)
  social/
    social-linkedin-1200x630.svg    Layered source of the LinkedIn image (export at 2x)
    social-x-1200x630.svg           Layered source of the X image (export at 2x)
    tally-qr-social-linkedin-2400x1260.png
    tally-qr-social-x-2400x1260.png Final PNGs, for reference
    qr/qr-linkedin.svg, qr/qr-x.svg The real codes (?ref=qr-linkedin, ?ref=qr-x)
  fonts/
    Inter-Regular, Medium, SemiBold, Bold, ExtraBold (.ttf) and the OFL licence
```

## Layers

- Text is real text, set in Inter, so it stays editable: Headline, Subline and the UI labels in the Share tab mock.
- Every QR code is its own group called QR code, in the rounded style: separate round dots and rounded corner eyes. If you move or resize one, keep it square and keep white space around it.
- Changelog: Background, Tally wordmark, Copy (Headline, Subline), Browser window (Browser bar, Share tab UI with the Link preview card and the QR code button).
- Social: Background, Illustration (Drawing, the white Patches that tidy the drawn code's edges, QR code), Headline, Underline, Subline, Tally wordmark. The drawing and the pink underline are images, as in my Figma frame.

## Fonts

Inter 4.1 by Rasmus Andersson, under the SIL Open Font License, so the files are bundled in `fonts/`. Install the five weights before opening the SVGs, or get them from https://rsms.me/inter/ or https://fonts.google.com/specimen/Inter. Weights used: 400, 500, 600, 700 and 800.

## Codes

Codes are always black, with a white Tally asterisk on a black rounded tile in the middle, inside a thin white margin. The tile is its own group, QR logo, inside each QR code group. Each one opens https://tally.so/r/KpYalV with its own `ref`, so responses show where they came from. If you swap a code, take it from the `qr` folder rather than redrawing it, and scan the export with a phone before publishing.
