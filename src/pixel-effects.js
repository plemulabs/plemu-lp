const COLORS = ["#c8e759", "#b7a4ed", "#9ad8cf"];
const FIELD_POINTS = [
  [6, 16],
  [92, 12],
  [4, 52],
  [95, 57],
  [12, 84],
  [88, 86],
];

export function mountPixelEffects(motion, saveData) {
  const slots = [];
  let layer;
  let cursor = 0;
  let lastBurst = -Infinity;

  function decorate() {
    if (saveData || motion.matches) return;
    document
      .querySelectorAll(
        "[data-cartridge-hero], [data-seeker-render], .collection-art, .lifecycle-world, .remix-art",
      )
      .forEach((art, index) => {
        if (art.querySelector(":scope > .ambient-pixels")) return;
        const field = document.createElement("div");
        field.className = "ambient-pixels";
        field.setAttribute("aria-hidden", "true");
        FIELD_POINTS.forEach(([x, y], i) => {
          const bit = document.createElement("i");
          bit.style.setProperty("--x", `${x}%`);
          bit.style.setProperty("--y", `${y}%`);
          bit.style.setProperty("--delay", `${-i * 1.7 - index * 0.8}s`);
          bit.style.setProperty("--duration", `${10 + (i % 3) * 2}s`);
          field.append(bit);
        });
        art.append(field);
      });
  }
  function createPool() {
    layer = document.createElement("div");
    layer.className = "pixel-feedback";
    layer.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 24; i++) {
      const node = document.createElement("i");
      node.className = `pixel-feedback-bit pixel-shape-${i % 3}`;
      node.hidden = true;
      layer.append(node);
      slots.push({ node, animation: null });
    }
    document.body.append(layer);
  }
  function clear() {
    for (const slot of slots) {
      slot.animation?.cancel();
      slot.animation = null;
      slot.node.hidden = true;
    }
  }
  function burst(x, y) {
    if (
      saveData ||
      motion.matches ||
      document.hidden ||
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    )
      return;
    const now = performance.now();
    if (now - lastBurst < 90) return;
    lastBurst = now;
    if (!layer) createPool();
    x = Math.round(Math.max(0, Math.min(innerWidth, x)) / 4) * 4;
    y = Math.round(Math.max(0, Math.min(innerHeight, y)) / 4) * 4;
    const paths = [
      [-20, -20],
      [-4, -28],
      [20, -20],
      [-24, 8],
      [24, 8],
      [4, 24],
    ];
    paths.forEach(([dx, dy], i) => {
      const slot = slots[cursor++ % slots.length];
      slot.animation?.cancel();
      slot.node.hidden = false;
      slot.node.style.left = `${x}px`;
      slot.node.style.top = `${y}px`;
      slot.node.style.background = COLORS[i % COLORS.length];
      const animation = slot.node.animate(
        [
          { transform: "translate(-2px, -2px)", opacity: 0.85 },
          { transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
        ],
        { duration: 360 + i * 24, easing: "steps(6,end)" },
      );
      slot.animation = animation;
      animation.onfinish = animation.oncancel = () => {
        if (slot.animation !== animation) return;
        slot.node.hidden = true;
        slot.animation = null;
      };
    });
  }
  function center(control) {
    const box = control.getBoundingClientRect();
    return [box.x + box.width * 0.5, box.y + box.height * 0.5];
  }
  document.addEventListener("click", (event) => {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    const control = event.target.closest(
      "a, button, [role='button'], [data-seeker-render]",
    );
    if (
      !control ||
      control.matches("[disabled], [aria-disabled='true'], [data-pack-seal]")
    )
      return;
    const point =
      event.detail === 0 ? center(control) : [event.clientX, event.clientY];
    burst(...point);
  });
  document.addEventListener("keydown", (event) => {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    if (
      ![
        "Enter",
        " ",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ].includes(event.key)
    )
      return;
    const control = event.target.closest(
      "[role='button'], [data-seeker-render]",
    );
    if (control) burst(...center(control));
  });
  document.addEventListener("plemu:gesture", (event) =>
    burst(event.detail?.x, event.detail?.y),
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clear();
  });
  window.addEventListener("pagehide", clear);
  motion.addEventListener("change", () => {
    if (motion.matches) clear();
    else decorate();
  });
  decorate();
}
