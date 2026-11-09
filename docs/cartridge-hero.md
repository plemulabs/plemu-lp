# Cartridge carousel and block console

[src/cartridge-hero.js](../src/cartridge-hero.js) renders original beveled cartridges and an interlocking block console in Three.js. [src/cartridge-hero.css](../src/cartridge-hero.css) styles the component; [src/main.js](../src/main.js) owns its lightweight fallback and lazy loading. Both use [src/cartridge-input.js](../src/cartridge-input.js) for pointer gestures and keyboard input.

The featured games are Adjustris, 2048 Advance, Spindown, and Libbet and the Magic Floor. Their unchanged artwork, creator/source records, hashes and applicable notices are in [public/hero](../public/hero/). No ROM, manufacturer model or physical product is supplied by the preview. The console is an illustration; playing opens the separate Plemu app.

## Interaction

- Swipe or drag left/right to cycle through cartridges, down to insert and up to eject. Gestures commit during the drag, once a direction is clear. Each gesture performs one action; cancellation and additional touch points do not activate a tap. Vertical gestures belong to the scene, while the surrounding page scrolls normally and pinch zoom remains available.
- Tap another cartridge to select it, or tap the selected cartridge or console area to insert/eject. Focus the scene to use Left/Right to choose, Down to insert, Up to eject, and Enter/Space to toggle. Current selection and instructions are available to assistive technology. A small pause/play icon sits inside the scene; the old caption and control strip are removed.
- Insertion aligns the cartridge to guide rails, lowers it into the contact slot, seats it and activates the front display in 1.15 seconds. Ejection takes 0.48 seconds. Swiping up or selecting another game interrupts insertion from the current pose. Repeated selections preserve the latest requested game; swiping down during ejection queues insertion after it clears the slot.
- After insertion, the console gains a soft light, a brief sparkle burst and a faint stream of token-shaped particles moving both up and down from the cartridge’s top edge. [src/console-energy.js](../src/console-energy.js) renders these in the existing scene loop; they are illustrative, not a live trading feed. Ejection switches the effect off.
- Reduced motion starts paused. Pausing finishes an active transition without trapping a cartridge halfway through the slot. Explicit Play can enable motion, including when the initial system preference is reduced motion; a later system change to reduced motion pauses it.
- Rendering stops offscreen and when hidden. Teardown releases geometries, materials, textures, observers, events and the renderer. Context loss restores lightweight controls with the current selection.
- The lightweight preview owns controls before enhancement and after renderer failure. The 3D component takes ownership after its first successful render and adopts any intervening selection, seated state and manual motion choice.

With data saver or without WebGL, the page keeps its static cartridge gallery and lightweight selection, insertion, motion and keyboard controls. Without JavaScript, it presents the gallery and working navigation without inactive carousel controls.

Cartridges use the native app’s 1 × 1.2 × 0.09 profile, eight-point outline, system palette, label rectangle and nine inset contacts. The shared game metadata is in [src/cartridge-catalog.js](../src/cartridge-catalog.js); [profile provenance](../public/hero/cartridge-profiles.json) pins the native profile and mesh source hashes. The Libbet image is the unchanged native presentation cover, with its AI-assisted-art provenance preserved.

The console is original Plemu art built from generic interlocking block shapes. Its main mark uses the supplied Plemu pixel face. Both this scene and the separate Seeker scene reuse the same Three.js bundle.
