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

## Assets and Seeker viewer

Primary logos are in [public/brand](public/brand/); app captures are in [public/images](public/images/). The previous mark remains a decorative asset. Fonts and Three.js retain their [licenses](public/licenses/).

The [Seeker viewer](docs/seeker-showcase.md) uses original illustrative geometry and actual Plemu beta screens. It supports turning, dragging, screen selection and motion controls. The viewer loads near its section, stops rendering offscreen, and respects reduced motion. Static app imagery remains available without JavaScript or WebGL and with data saver enabled.

[Source provenance](SOURCE.md) lists the upstream project and asset locations.
