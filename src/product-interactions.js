import { PACK_GAMES } from "./cartridge-catalog.js";

export function mountProductStories(motion, saveData) {
  const current = new WeakMap();
  const running = new Set();
  function animate(node, frames, duration = 420) {
    current.get(node)?.cancel();
    if (motion.matches || saveData || document.hidden) return;
    const animation = node.animate(frames, {
      duration,
      easing: "cubic-bezier(.16,1,.3,1)",
    });
    current.set(node, animation);
    running.add(animation);
    animation.onfinish = animation.oncancel = () => running.delete(animation);
  }
  function finishMotion() {
    if (motion.matches || document.hidden)
      for (const animation of running) animation.finish();
  }
  motion.addEventListener("change", finishMotion);
  document.addEventListener("visibilitychange", finishMotion);

  const pack = document.querySelector("[data-pack-preview]");
  const seal = pack.querySelector("[data-pack-seal]");
  seal.disabled = false;
  const reset = document.querySelector("[data-pack-reset]");
  const caption = document.querySelector("[data-pack-caption]");
  const reward = pack.querySelector("[data-pack-reward]");
  let gameIndex = 0;
  let drag = null;
  let ignoreClicksUntil = 0;
  function openPack(keyboard = false) {
    if (pack.dataset.packState === "revealed") return;
    const game = PACK_GAMES[gameIndex];
    const cover = pack.querySelector("[data-pack-cover]");
    cover.src = game.cover;
    cover.alt = `${game.title} native cartridge cover`;
    reward.dataset.appSystem = game.code.toLowerCase();
    pack.querySelector("[data-pack-system]").textContent = game.system;
    reward.setAttribute("aria-hidden", "false");
    pack.dataset.packState = "revealed";
    seal.disabled = true;
    caption.textContent = `${game.title} revealed. Just a preview.`;
    reset.hidden = false;
    if (keyboard) reset.focus({ preventScroll: true });
  }
  function cancelDrag() {
    drag = null;
    if (pack.dataset.packState !== "revealed") {
      pack.dataset.packState = "sealed";
      pack.style.setProperty("--tear", "0");
    }
  }
  seal.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) return cancelDrag();
    if (event.button !== 0 || pack.dataset.packState === "revealed") return;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      locked: false,
      travel: 0,
    };
    seal.setPointerCapture(event.pointerId);
  });
  seal.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x,
      dy = event.clientY - drag.y;
    if (!drag.locked && Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx))
      return cancelDrag();
    if (!drag.locked && (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2))
      return;
    drag.locked = true;
    drag.travel = Math.abs(dx);
    pack.dataset.packState = "tearing";
    pack.style.setProperty(
      "--tear",
      String(Math.min(1, drag.travel / seal.clientWidth)),
    );
  });
  seal.addEventListener("pointerup", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const gesture = drag;
    if (gesture.locked) {
      ignoreClicksUntil = performance.now() + 350;
      if (gesture.travel >= Math.min(60, seal.clientWidth * 0.32)) openPack();
    }
    cancelDrag();
  });
  seal.addEventListener("pointercancel", cancelDrag);
  seal.addEventListener("lostpointercapture", cancelDrag);
  seal.addEventListener("click", (event) => {
    if (event.detail > 0 && performance.now() < ignoreClicksUntil) return;
    openPack(event.detail === 0);
  });
  reset.addEventListener("click", () => {
    gameIndex = (gameIndex + 1) % PACK_GAMES.length;
    pack.dataset.packState = "sealed";
    pack.dataset.packGeneration = String(
      Number(pack.dataset.packGeneration || 0) + 1,
    );
    pack.style.setProperty("--tear", "0");
    reward.setAttribute("aria-hidden", "true");
    seal.disabled = false;
    reset.hidden = true;
    caption.textContent = "Swipe across the pack. See what’s inside.";
    seal.focus({ preventScroll: true });
  });

  const stages = [
    [
      "A playable beginning.",
      "A small world becomes something people can explore.",
    ],
    [
      "A community takes shape.",
      "Players, creators and contributors meet around a shared game.",
    ],
    [
      "The next milestone.",
      "Keep improving the game through clear, playable releases.",
    ],
    [
      "Choose the next chapter.",
      "Explore decisions around proposals, participation and shared outcomes.",
    ],
  ];
  const world = document.querySelector("[data-lifecycle-world]");
  const stageButtons = [...document.querySelectorAll("[data-lifecycle-step]")];
  let manualStage = false;
  let autoSelecting = false;
  let mapVisible = false;
  let stageTimer = 0;
  function scheduleStage() {
    clearTimeout(stageTimer);
    if (
      manualStage ||
      !mapVisible ||
      motion.matches ||
      saveData ||
      document.hidden ||
      world.matches(":hover, :focus-within")
    )
      return;
    stageTimer = setTimeout(() => {
      autoSelecting = true;
      stageButtons[(Number(world.dataset.lifecycleWorld) + 1) % 4].click();
      autoSelecting = false;
      scheduleStage();
    }, 6000);
  }
  stageButtons.forEach((button) => {
    button.disabled = false;
    button.addEventListener("click", () => {
      if (!autoSelecting) {
        manualStage = true;
        clearTimeout(stageTimer);
      }
      const stage = Number(button.dataset.lifecycleStep);
      if (world.dataset.lifecycleWorld === String(stage)) return;
      world.dataset.lifecycleWorld = String(stage);
      world.style.setProperty("--world-progress", `${25 + stage * 25}%`);
      world.querySelector("[data-world-word]").textContent = stages[stage][0];
      world.querySelector("[data-world-detail]").textContent = stages[stage][1];
      stageButtons.forEach((other) =>
        other.setAttribute("aria-pressed", String(other === button)),
      );
      world.querySelectorAll("[data-map-layer]").forEach((layer, index) => {
        layer.classList.toggle("is-built", index <= stage);
        layer.classList.toggle("is-current", index === stage);
        layer.setAttribute("aria-pressed", String(index === stage));
        if (index === stage)
          animate(layer, [
            { transform: "translateY(10px)" },
            { transform: "translateY(0)" },
          ]);
      });
      world
        .querySelectorAll("[data-map-route]")
        .forEach((route) =>
          route.classList.toggle(
            "is-built",
            Number(route.dataset.mapRoute) <= stage,
          ),
        );
      animate(
        world.querySelector("figcaption"),
        [
          { opacity: 0.3, transform: "translateY(5px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        280,
      );
    });
  });

  world.querySelectorAll("[data-map-layer]").forEach((layer) => {
    layer.setAttribute("role", "button");
    layer.setAttribute("tabindex", "0");
    const choose = () => stageButtons[Number(layer.dataset.mapLayer)].click();
    layer.addEventListener("click", choose);
    layer.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose();
      }
    });
  });
  if ("IntersectionObserver" in window) {
    const mapObserver = new IntersectionObserver(
      (entries) => {
        mapVisible = entries.some((entry) => entry.isIntersecting);
        scheduleStage();
      },
      { threshold: 0.35 },
    );
    mapObserver.observe(world);
  }
  world.addEventListener("pointerenter", () => clearTimeout(stageTimer));
  world.addEventListener("pointerleave", scheduleStage);
  world.addEventListener("focusin", () => clearTimeout(stageTimer));
  world.addEventListener("focusout", scheduleStage);
  document.addEventListener("visibilitychange", scheduleStage);
  motion.addEventListener("change", scheduleStage);
  window.addEventListener("pagehide", () => clearTimeout(stageTimer));
  window.addEventListener("pageshow", scheduleStage);
  const ideas = {
    world: [
      "Explore a new world",
      "Rebuild the map: new biomes, hidden routes and an entirely different journey.",
    ],
    rules: [
      "A different kind of jump",
      "Change the physics, combat, enemies or challenge. Make familiar mechanics feel new.",
    ],
    characters: [
      "Meet your new hero",
      "Create a new cast, with different abilities, animations and stories to tell.",
    ],
    multiplayer: [
      "Three friends. One adventure.",
      "Imagine co-op adventures, head-to-head challenges or a world your friends can explore together.",
    ],
    quests: [
      "Find the lost signal",
      "Write new quests, branching choices and alternate endings. Give a world another story.",
    ],
    accessibility: [
      "Find your way to play",
      "Add clearer visual cues, remappable controls and adjustable difficulty or pace.",
    ],
  };
  const remix = document.querySelector("[data-remix-art]");
  const choices = [...document.querySelectorAll("[data-remix-choice]")];
  choices.forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.remixChoice;
      remix.dataset.remixArt = choice;
      const labels = {
        world: "A whole new world",
        rules: "Remixed physics",
        characters: "A new cast",
        multiplayer: "Co-op concept",
        quests: "A story with choices",
        accessibility: "Make it your own",
      };
      remix.querySelector("[data-remix-label]").textContent = labels[choice];
      remix.querySelector("[data-remix-caption]").textContent =
        ideas[choice][1];
      remix.querySelector("[data-remix-hud]").textContent = ideas[choice][0];
      choices.forEach((other) =>
        other.setAttribute("aria-pressed", String(other === button)),
      );
      const screen = remix.querySelector(".mini-world-remix");
      animate(
        screen,
        [{ filter: "brightness(.65)" }, { filter: "brightness(1)" }],
        240,
      );
      const targets = {
        world: ".mini-tree, .mini-island",
        rules: ".mini-player:not(.mini-player-two):not(.mini-player-three)",
        characters: ".mini-cast > i",
        multiplayer: ".mini-player",
        quests: ".mini-door",
        accessibility: ".mini-controls, .mini-cue",
      };
      const players = screen.querySelectorAll(targets[choice]);
      players.forEach((player, index) =>
        animate(
          player,
          [
            { transform: `translateY(-${18 + index * 7}px)` },
            { transform: "translateY(0)" },
          ],
          360 + index * 45,
        ),
      );
      animate(screen.querySelector(".mini-mountains"), [
        { transform: "translateX(14px)" },
        { transform: "translateX(0)" },
      ]);
    });
  });
}
