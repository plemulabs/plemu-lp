# Collection and community previews

[src/product-interactions.js](../src/product-interactions.js) handles the collection pack, development map and customization examples. [src/product-story.css](../src/product-story.css) provides their layouts and transitions.

## Pack preview

Swipe horizontally across the pack to peel its seal. Short drags settle back; vertical gestures keep normal page scrolling. Tapping or pressing Enter also opens it. Try another pack cycles through Color Lines, uCity and Helheim in [the shared catalog](../src/cartridge-catalog.js). These games are distinct from the hero’s four games and the collection’s Quartet and Unearthed Zero.

The reveal is a local visual preview. It does not connect a wallet, buy a pack, choose onchain rewards or create an entitlement. The foil uses the native app’s curved pouch, silver crimps, lime pull strip, jagged tear and peel/reveal equations, adapted in [src/pack-scene.js](../src/pack-scene.js). The camera fits the selected cartridge and separated strip through the full reveal. A reset starts a fresh sealed pack. [Pack source hashes](../public/hero/pack-source.json) record the native model and brand source. Native cover artwork and cartridge profile provenance are in [public/hero](../public/hero/).

## Development map

Four numbered islands progress counterclockwise: playable build at bottom-right, community at top-right, milestones at top-left and next chapter at bottom-left. Clicking an island or a stage button updates the caption, progress line and built routes. Idle playback advances every six seconds while visible, until the first manual choice. Hover, focus, reduced motion, data saver and backgrounding pause automatic playback. Shared SVG tile definitions keep the markup small. Rapid changes cancel superseded animation on each affected element; the most recent choice determines the state.

The map illustrates the planned community development model. The section distinguishes current Devnet markets and lifecycle stages from planned creator launches, collaborative development and futarchy tools.

## Customization examples

Six choices change the original pixel-art screen: worlds, rules, characters, multiplayer, quests and accessibility. Worlds add trees, a ringed planet and floating islands; rules show double-jump physics; characters become a robot, mage and slime; multiplayer adds companions and a shared checkpoint; quests show branching doors and an objective; accessibility shows input remapping and clearer cues. These are illustrative ideas, not a running game or released editing tools. No individual game or third-party source project is promoted by this section.

Reduced motion and data saver skip idle animation and JavaScript transitions. The 3D pack loads near the section, pauses offscreen or in the background, and releases its resources on teardown; no WebGL or context loss returns to the lightweight foil preview. Backgrounding the page finishes short interaction animations, and decorative CSS animations pause offscreen. Without JavaScript, the pack is a static illustration and the inactive customization controls are hidden.

## Pixel feedback

[src/pixel-effects.js](../src/pixel-effects.js) adds six sparse drifting pixels to each illustrated section and stepped bursts on clicks, taps, keyboard controls and cartridge gestures. The burst layer is created on the first interaction and reuses 24 decorative elements. Automatic development-map changes do not trigger bursts. The overlay ignores pointer input and is hidden from assistive technology.

[src/pixel-effects.css](../src/pixel-effects.css) pauses decorative animations offscreen, in a background tab, and when the hero or Seeker scene is paused. Reduced motion and data saver skip these effects; changing to reduced motion cancels active bursts. These effects add no animation-frame loop. The pack's foil highlight moves with its existing render loop, and the inserted hero cartridge uses a brighter console glow and larger sparkles while keeping the token stream faint.
