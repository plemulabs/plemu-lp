# Cartridge carousel and block console

[src/cartridge-hero.js](../src/cartridge-hero.js) renders original beveled cartridges and an interlocking block console in Three.js. [src/cartridge-hero.css](../src/cartridge-hero.css) styles the component; [src/main.js](../src/main.js) owns its lightweight fallback and lazy loading.

The featured games are Adjustris, 2048 Advance, Spindown, and Libbet and the Magic Floor. Their unchanged artwork, creator/source records, hashes and applicable notices are in [public/hero](../public/hero/). No ROM, manufacturer model or physical product is supplied by the preview. The console is an illustration; playing opens the separate Plemu app.

## Interaction

- Previous/Next, direct selectors, arrow keys and touch gestures cycle through cartridges. The selected cartridge moves into the foreground while the others idle nearby.
- Insert aligns the cartridge to guide rails, lowers it into the contact slot, seats it and activates the console's front display. Eject reverses the sequence. A new selection during insertion is queued through ejection.
- Reduced motion starts paused. Pausing finishes an active transition without trapping a cartridge halfway through the slot. Explicit Play can enable motion, including when the initial system preference is reduced motion; a later system change to reduced motion pauses it.
- Rendering stops offscreen and when hidden. Teardown releases geometries, materials, textures, observers, events and the renderer. Context loss restores lightweight controls with the current selection.
- The lightweight preview owns controls before enhancement and after renderer failure. The 3D component takes ownership after its first successful render and adopts any intervening selection, seated state and manual motion choice.

With data saver or without WebGL, the page keeps its static cartridge gallery and lightweight selection, insertion, motion and keyboard controls. Without JavaScript, it presents the gallery and working navigation without inactive carousel controls.

The console is original Plemu art built from generic interlocking block shapes. Its main mark uses the supplied Plemu pixel face. Both this scene and the separate Seeker scene reuse the same Three.js bundle.
