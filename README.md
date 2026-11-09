# Plemu landing

Static site for `plemu.xyz`, built with Vite. The Solana Devnet application is maintained in [plemu-web](https://github.com/plemulabs/plemu-web).

## Development

Use Node 22.18 or newer:

```sh
npm ci
npm run dev
npm test
npm run format:check
npm run build
npm run preview
```

Build output is `dist/`. For Vercel, use repository root `.`, `npm ci`, `npm run build`, and output directory `dist`. The host must serve `/toc/index.html` and `/privacy/index.html` at `/toc` and `/privacy`. Keep these directory routes when configuring rewrites.

## Legal documents

[legal/legal-documents.json](legal/legal-documents.json) is an export of the [canonical web policy](https://github.com/plemulabs/plemu-web/blob/main/lib/legal-documents.json). [legal/source.json](legal/source.json) records the source commit, hash and version. Builds check this record and generate both complete policies plus `dist/legal-source.json`.

To import a committed policy revision:

```sh
node scripts/sync-legal.mjs /path/to/plemu-web/lib/legal-documents.json
npm test
npm run build
```

Both projects build independently. `PLEMU_LEGAL_SOURCE` provides an explicit build-time source override. The policy's draft status and effective date are rendered from the document. Final publication requires counsel review and confirmation of contact and provider details.

## Page and interactive previews

The hero's [cartridge carousel](docs/cartridge-hero.md) uses original block-console geometry and four real homebrew games. The collection, development-model and source-project sections explain live features and planned community/remix tools separately. Tokens and publisher-defined play licenses remain distinct.

Primary logos are in [public/brand](public/brand/); app captures are in [public/images](public/images/). Fonts and Three.js retain their [licenses](public/licenses/). Cartridge artwork, credits and notices are in [public/hero](public/hero/).

The separate [Seeker viewer](docs/seeker-showcase.md) supports Discover, Library, Packs and Market views, turning, dragging and motion controls. Both scenes load near their sections, share Three.js, stop rendering offscreen and respect reduced motion. With JavaScript but no WebGL or with data saver, lightweight controls remain usable. Without JavaScript, the complete page, static artwork, source links, screen links and legal pages remain available.

[Source provenance](SOURCE.md) lists the upstream project and asset locations.
