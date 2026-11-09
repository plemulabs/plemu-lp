# Seeker viewer

[src/seeker-scene.js](../src/seeker-scene.js) builds the handset in Three.js. [src/main.js](../src/main.js) loads it as the section approaches the viewport; [src/seeker.css](../src/seeker.css) controls layout and fallback imagery.

## Controls and rendering

- Discover, Library, Packs and Market select the actual Plemu beta screenshots in [public/images](../public/images/). Each additional texture loads on first selection and is retained. A failed load keeps the current screen and can be retried. Late loads never replace a newer selection or orientation input. A selection made before the 3D module finishes loading is retained.
- The handset appears in the second section. Pointer dragging changes orientation. Focus the model and use arrow keys to turn or Enter to switch between front and back.
- Tap the model or press Space to pause/resume. Reduced motion starts paused. The separate Turn and motion buttons have been removed.
- Rendering stops when the section leaves the viewport or the document is hidden. Page teardown releases GPU resources.
- Without WebGL, or with data saver enabled, the screen selector works with a static handset. Without JavaScript, static imagery and direct Packs/Market screenshot links remain available. Context loss returns to the static selector.

The Market capture shows Apotris’s individual market, chart and trade panel. It uses validated confirmed Devnet responses captured on November 9, 2026; it is a static historical snapshot, not a live quote. The native app’s account, reserve and event validation ran before the capture, and no balances, prices or fills were invented.

The hero, pack and handset share the dynamically loaded Three.js environment code. Pixel ratio is capped at 1.5 on narrow screens and 1.75 elsewhere. The hero is a separate component; no second handset appears there.

## Model and image sources

The illustrative model follows the [Solana Mobile Seeker](https://solanamobile.com/seeker) silhouette and approximate 73.5 × 154.8 × 9.3 mm dimensions. It is original procedural geometry. Screen textures are unchanged Plemu beta captures with the current brand mark; [source hashes](../public/images/seeker-screen-sources.json) describe all four. Three.js uses its [MIT license](../public/licenses/three-MIT.txt).
