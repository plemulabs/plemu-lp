# Collection and community previews

[src/product-interactions.js](../src/product-interactions.js) handles the collection pack, development map and customization examples. [src/product-story.css](../src/product-story.css) provides their layouts and transitions.

## Pack preview

Swipe horizontally across the pack to peel its seal. Short drags settle back; vertical gestures keep normal page scrolling. Tapping or pressing Enter also opens it. Try another pack cycles through the four actual app cartridges in [the shared catalog](../src/cartridge-catalog.js).

The reveal is a local visual preview. It does not connect a wallet, buy a pack, choose onchain rewards or create an entitlement. The foil, revealed cartridge and background cartridges keep separate transforms, so interrupting or replaying a reveal does not compound their positions. Native cover artwork and cartridge profile provenance are in [public/hero](../public/hero/).

## Development map

Each of four buttons selects a stage and updates the caption, progress line and built portions of an original isometric map. Shared SVG tile definitions keep the markup small. Rapid changes cancel superseded animation on each affected element; the most recent choice determines the state.

The map illustrates the planned community development model. The section distinguishes current Devnet markets and lifecycle stages from planned creator launches, collaborative development and futarchy tools.

## Customization examples

Six choices change the original pixel-art screen: worlds, rules, characters, multiplayer, quests and accessibility. Multiplayer adds companions; rules add a platform and change the jump; quests add an objective; accessibility shows clearer cues. These are illustrative ideas, not a running game or released editing tools. No individual game or third-party source project is promoted by this section.

Reduced motion and data saver skip JavaScript animation. Backgrounding the page finishes short interaction animations, and decorative CSS animations pause offscreen. Without JavaScript, the pack is a static illustration and the inactive customization controls are hidden.
