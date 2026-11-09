import "./styles.css";
import "./product-story.css";
import "./cartridge-hero.css";
import "./seeker.css";

const saveData = navigator.connection?.saveData === true;
document.documentElement.dataset.saveData = String(saveData);
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const arcade = document.querySelector("[data-cartridge-hero]");
if (arcade) {
  const choices = [...arcade.querySelectorAll("[data-cartridge-select]")];
  let selected = Math.max(
    0,
    choices.findIndex(
      (button) => button.dataset.cartridgeSelect === arcade.dataset.selected,
    ),
  );
  let paused = motion.matches;
  const pause = arcade.querySelector("[data-cartridge-pause]");
  const status = arcade.querySelector("[data-cartridge-status]");
  const lightOwnsControls = () => arcade.dataset.controlsOwner !== "hero";
  function syncLightState() {
    selected = Math.max(
      0,
      choices.findIndex(
        (button) => button.dataset.cartridgeSelect === arcade.dataset.selected,
      ),
    );
    paused = arcade.dataset.paused === "true";
  }
  function updateLight() {
    const choice = choices[selected];
    arcade.dataset.selected = choice.dataset.cartridgeSelect;
    arcade.dataset.paused = String(paused);
    choices.forEach((button) =>
      button.setAttribute("aria-pressed", String(button === choice)),
    );
    arcade.querySelector("[data-cartridge-title]").textContent =
      choice.dataset.gameTitle;
    arcade.querySelector("[data-cartridge-system]").textContent =
      choice.dataset.gameSystem;
    arcade.querySelector("[data-cartridge-insert]").textContent =
      arcade.dataset.phase === "ready" ? "Eject cartridge" : "Insert cartridge";
    pause.textContent = paused ? "Play motion" : "Pause motion";
    pause.removeAttribute("aria-label");
    pause.setAttribute("aria-pressed", String(paused));
  }
  function selectLight(index) {
    if (!lightOwnsControls()) return;
    paused = arcade.dataset.paused === "true";
    selected = (index + choices.length) % choices.length;
    arcade.dataset.phase = "idle";
    updateLight();
    status.textContent = `${choices[selected].dataset.gameTitle} selected. Insert a cartridge to explore the console concept.`;
  }
  choices.forEach((button, index) =>
    button.addEventListener("click", () => selectLight(index)),
  );
  arcade
    .querySelector("[data-cartridge-prev]")
    .addEventListener("click", () => {
      syncLightState();
      selectLight(selected - 1);
    });
  arcade
    .querySelector("[data-cartridge-next]")
    .addEventListener("click", () => {
      syncLightState();
      selectLight(selected + 1);
    });
  arcade
    .querySelector("[data-cartridge-insert]")
    .addEventListener("click", () => {
      if (!lightOwnsControls()) return;
      syncLightState();
      arcade.dataset.phase =
        arcade.dataset.phase === "ready" ? "idle" : "ready";
      updateLight();
      status.textContent =
        arcade.dataset.phase === "ready"
          ? `${choices[selected].dataset.gameTitle} is seated. Open Plemu to play.`
          : "Choose a cartridge. There’s a world inside.";
    });
  pause.addEventListener("click", () => {
    if (!lightOwnsControls()) return;
    syncLightState();
    paused = !paused;
    arcade.dataset.manualMotion = "true";
    updateLight();
  });
  motion.addEventListener("change", () => {
    if (!lightOwnsControls() || arcade.dataset.manualMotion === "true") return;
    paused = motion.matches;
    updateLight();
  });
  const stage = arcade.querySelector("[data-cartridge-stage]");
  stage.tabIndex = 0;
  stage.setAttribute("role", "group");
  stage.setAttribute(
    "aria-label",
    "Cartridge carousel. Use the left and right arrow keys to choose a game. Press Enter to insert or eject.",
  );
  arcade.addEventListener("keydown", (event) => {
    if (
      !lightOwnsControls() ||
      (!event.target.closest("[data-cartridge-picker]") &&
        event.target !== stage)
    )
      return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      syncLightState();
      selectLight(selected + (event.key === "ArrowLeft" ? -1 : 1));
    } else if (
      (event.key === "Enter" || event.key === " ") &&
      event.target === stage
    ) {
      event.preventDefault();
      arcade.querySelector("[data-cartridge-insert]").click();
    }
  });
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
    alt: "Plemu installed on Seeker, showing its native beta Market screen",
  },
};
const showcase = document.querySelector("[data-seeker-showcase]");
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
        } else {
          node.dataset.scene = "fallback";
          node.querySelector("[data-seeker-turn]").hidden = true;
          node.querySelector("[data-seeker-motion]").hidden = true;
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
enhanceNearViewport(showcase, async () => {
  const { mountSeeker } = await import("./seeker-scene.js");
  await mountSeeker(showcase);
});

const worldWords = [
  "A first build.",
  "A community takes shape.",
  "A world grows.",
  "The next chapter.",
];
const world = document.querySelector("[data-lifecycle-world]");
document.querySelectorAll("[data-lifecycle-step]").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll("[data-lifecycle-step]")
      .forEach((other) =>
        other.setAttribute("aria-pressed", String(other === button)),
      );
    world.dataset.lifecycleWorld = button.dataset.lifecycleStep;
    world.querySelector("[data-world-word]").textContent =
      worldWords[Number(button.dataset.lifecycleStep)];
  });
});
const remixCaptions = {
  world:
    "Reimagine a level, a setting or an entire journey. An illustration of remix possibilities.",
  rules:
    "Change the challenge, the pace or how a world works. An illustration of remix possibilities.",
  characters:
    "Bring a new cast, a different look and your own story. An illustration of remix possibilities.",
};
const remix = document.querySelector("[data-remix-art]");
document.querySelectorAll("[data-remix-choice]").forEach((button) => {
  button.addEventListener("click", () => {
    const choice = button.dataset.remixChoice;
    if (!remixCaptions[choice]) return;
    remix.dataset.remixArt = choice;
    remix.querySelector("[data-remix-caption]").textContent =
      remixCaptions[choice];
    document
      .querySelectorAll("[data-remix-choice]")
      .forEach((other) =>
        other.setAttribute("aria-pressed", String(other === button)),
      );
  });
});
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
