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
  cover/
    cover-3000x1000.svg             Layered source of the form cover (export at 1x)
    cover-in-context-3000x1500.svg  The cover with the form title under it, to judge the pair
    tally-qr-cover-3000x1000.png    Final PNG, for reference
    qr/qr-cover.svg                 The real code (?ref=qr-cover)
  fonts/
    Inter-Regular, Medium, SemiBold, Bold, ExtraBold (.ttf) and the OFL licence
```

## Layers

- Text is real text, set in Inter, so it stays editable: Headline, Subline, the UI labels in the Share tab mock and the speech bubble words.
- Every QR code is its own group called QR code. If you move or resize one, keep it square and keep the white quiet zone around it.
- Changelog: Background, Tally wordmark, Copy (Headline, Subline), Browser window (Browser bar, Share tab UI, Main code).
- Social: Background, Doodles (Face, Speech bubble, Phone, Yoga club flyer, Accent mark), Copy (Headline).
- Cover: Background, Poster, Hand and phone, Accent marks. It has no text on purpose, so it works behind any title.

## The Form Title

The demo form is called "Scanned your way here". It only lives in one text layer, Form title, in `cover/cover-in-context-3000x1500.svg`. That file is just for judging the cover and the title together; the title isn't part of any exported image, and the live form sets its own title.

## Fonts

Inter 4.1 by Rasmus Andersson, under the SIL Open Font License, so the files are bundled in `fonts/`. Install the five weights before opening the SVGs, or get them from https://rsms.me/inter/ or https://fonts.google.com/specimen/Inter. Weights used: 400, 500, 600, 700 and 800.

## Codes

Codes are always black, with the Tally asterisk on a white rounded square in the middle. Each one opens https://tally.so/r/KpYalV with its own `ref`, so responses show where they came from. If you swap a code, take it from the `qr` folder rather than redrawing it, and scan the export with a phone before publishing.
