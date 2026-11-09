import "./styles.css";
import "./product-story.css";
import "./cartridge-hero.css";
import "./seeker.css";
import "./landing-motion.css";
import { bindCartridgeInput } from "./cartridge-input.js";
import { mountProductStories } from "./product-interactions.js";

const saveData = navigator.connection?.saveData === true;
document.documentElement.dataset.saveData = String(saveData);
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const arcade = document.querySelector("[data-cartridge-hero]");
if (arcade) {
  const choices = [...arcade.querySelectorAll("[data-static-cartridge]")];
  const stage = arcade.querySelector("[data-cartridge-stage]");
  const pause = arcade.querySelector("[data-cartridge-pause]");
  const status = arcade.querySelector("[data-cartridge-status]");
  const lightOwnsControls = () => arcade.dataset.controlsOwner !== "hero";
  let selected = 0;
  let paused = motion.matches;
  function syncLightState() {
    selected = Math.max(
      0,
      choices.findIndex(
        (choice) => choice.dataset.staticCartridge === arcade.dataset.selected,
      ),
    );
    paused = arcade.dataset.paused === "true";
  }
  function updateLight() {
    const choice = choices[selected];
    arcade.dataset.selected = choice.dataset.staticCartridge;
    arcade.dataset.paused = String(paused);
    choices.forEach((card) =>
      card.classList.toggle("is-selected", card === choice),
    );
    stage.setAttribute(
      "aria-label",
      `${choice.dataset.gameTitle}, ${choice.dataset.gameSystem}. Cartridge carousel.`,
    );
    const label = paused
      ? "Play cartridge animation"
      : "Pause cartridge animation";
    pause.setAttribute("aria-label", label);
    pause.title = label;
    pause.setAttribute("aria-pressed", String(paused));
  }
  function selectLight(index) {
    syncLightState();
    selected = (index + choices.length) % choices.length;
    arcade.dataset.phase = "idle";
    updateLight();
    status.textContent = `${choices[selected].dataset.gameTitle} selected.`;
  }
  function seatLight(seated) {
    syncLightState();
    arcade.dataset.phase = seated ? "ready" : "idle";
    updateLight();
    status.textContent = `${choices[selected].dataset.gameTitle} ${seated ? "inserted" : "ejected"}.`;
  }
  stage.tabIndex = 0;
  stage.setAttribute("role", "group");
  stage.setAttribute("aria-roledescription", "carousel");
  bindCartridgeInput(stage, {
    enabled: lightOwnsControls,
    navigate(delta) {
      syncLightState();
      selectLight(selected + delta);
    },
    insert: () => seatLight(true),
    eject: () => seatLight(false),
    activate(point) {
      syncLightState();
      const card = point?.target.closest("[data-static-cartridge]");
      const index = choices.indexOf(card);
      if (index >= 0 && index !== selected) selectLight(index);
      else seatLight(arcade.dataset.phase !== "ready");
    },
  });
  arcade.dataset.inputReady = "true";
  pause.addEventListener("click", () => {
    if (!lightOwnsControls()) return;
    syncLightState();
    paused = !paused;
    arcade.dataset.manualMotion = "true";
    updateLight();
  });
  motion.addEventListener("change", () => {
    if (!lightOwnsControls()) return;
    if (motion.matches || arcade.dataset.manualMotion !== "true") {
      paused = motion.matches;
      updateLight();
    }
  });
  syncLightState();
  paused = motion.matches;
  updateLight();
}

const screens = {
  discover: {
    src: "/images/seeker-discover-current.png",
    alt: "Plemu installed on Seeker, showing its native beta Discover screen",
  },
  library: {
    src: "/images/seeker-library-current.png",
    alt: "Plemu installed on Seeker, showing its native beta Library screen",
  },
  packs: {
    src: "/images/seeker-packs-current.png",
    alt: "Plemu installed on Seeker, showing its native beta Packs screen",
  },
  market: {
    src: "/images/seeker-market-current.png",
    alt: "Plemu installed on Seeker, showing the native Apotris market detail, chart and trade panel. Captured Devnet snapshot",
  },
};
const showcase = document.querySelector("[data-seeker-showcase]");
const packArt = document.querySelector(".collection-art");
if (showcase) {
  showcase.dataset.screen = "discover";
  showcase.querySelectorAll("[data-seeker-screen]").forEach((button) => {
    button.addEventListener("click", () => {
      if (showcase.dataset.scene === "ready") return;
      const name = button.dataset.seekerScreen;
      if (!screens[name]) return;
      showcase.dataset.screen = name;
      const fallback = showcase.querySelector("[data-seeker-fallback]");
      fallback.src = screens[name].src;
      fallback.alt = screens[name].alt;
      showcase
        .querySelectorAll("[data-seeker-screen]")
        .forEach((other) =>
          other.setAttribute("aria-pressed", String(other === button)),
        );
    });
  });
}
function enhanceNearViewport(node, enhance) {
  if (!node || saveData) return;
  const load = () => {
    const run = () =>
      void enhance().catch(() => {
        if (node === arcade) {
          node.dataset.heroState = "fallback";
          node.dataset.controlsOwner = "light";
        } else if (node === packArt) {
          node.dataset.packRender = "fallback";
        } else {
          node.dataset.scene = "fallback";
          node.querySelector("[data-seeker-hint]").hidden = true;
        }
      });
    if ("requestIdleCallback" in window)
      requestIdleCallback(run, { timeout: 1000 });
    else setTimeout(run, 0);
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          load();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
  } else load();
}
enhanceNearViewport(arcade, async () => {
  const { mountCartridgeHero } = await import("./cartridge-hero.js");
  await mountCartridgeHero(arcade);
});
enhanceNearViewport(packArt, async () => {
  const { mountPackScene } = await import("./pack-scene.js");
  await mountPackScene(packArt);
});
enhanceNearViewport(showcase, async () => {
  const { mountSeeker } = await import("./seeker-scene.js");
  await mountSeeker(showcase);
});

mountProductStories(motion, saveData);
if ("IntersectionObserver" in window) {
  const ambient = new IntersectionObserver(
    (entries) =>
      entries.forEach(
        (entry) =>
          (entry.target.dataset.visible = String(entry.isIntersecting)),
      ),
    { threshold: 0.08 },
  );
  document
    .querySelectorAll("[data-ambient-art]")
    .forEach((node) => ambient.observe(node));
}
function updateBackground() {
  document.documentElement.dataset.background = String(document.hidden);
}
document.addEventListener("visibilitychange", updateBackground);
updateBackground();
