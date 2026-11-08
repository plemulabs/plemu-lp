# Seeker viewer

[src/seeker-scene.js](../src/seeker-scene.js) builds the handset in Three.js. [src/main.js](../src/main.js) loads it as the section approaches the viewport; [src/seeker.css](../src/seeker.css) controls layout and fallback imagery.

## Controls and rendering

- Discover and Library select the actual Plemu beta screenshots in [public/images](../public/images/). The Library texture loads on first selection and is retained for later switches. A failed load keeps the current screen and can be retried. Late loads never replace a newer selection.
- Turn Seeker shows the front or back; pointer dragging changes orientation.
- The motion button pauses or resumes animation. Reduced motion starts paused.
- Rendering stops when the section leaves the viewport or the document is hidden. Page teardown releases GPU resources.
- Without JavaScript or WebGL, or with data saver enabled, the static app preview remains visible.

The base script is about 3 KB minified. The separately loaded viewer is about 148 KB gzip. Pixel ratio is capped at 1.5 on narrow screens and 1.75 elsewhere.

## Model and image sources

The illustrative model follows the [Solana Mobile Seeker](https://solanamobile.com/seeker) silhouette and approximate 73.5 × 154.8 × 9.3 mm dimensions. It is original procedural geometry rather than manufacturer CAD. Screen textures are unchanged Plemu beta captures with the current brand mark. Three.js uses its [MIT license](../public/licenses/three-MIT.txt).
