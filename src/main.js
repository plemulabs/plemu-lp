import "./styles.css";
import "./seeker.css";

const preview = document.querySelector("#app-preview");
const caption = document.querySelector("#preview-caption");
const screens = {
  discover: {
    src: "/images/seeker-discover-current.png",
    alt: "Plemu Seeker beta Discover screen with retro-game library and welcome pack",
  },
  library: {
    src: "/images/seeker-library-current.png",
    alt: "Plemu Seeker beta Library screen with system filters, local imports and saved games",
  },
};

document.querySelectorAll("[data-screen]").forEach((button) => {
  button.addEventListener("click", () => {
    const screen = screens[button.dataset.screen];
    if (!screen || !preview) return;
    preview.src = screen.src;
    preview.alt = screen.alt;
    document.querySelectorAll("[data-screen]").forEach((other) => {
      other.setAttribute("aria-pressed", String(other === button));
    });
    caption.textContent = `Seeker beta app preview — ${button.textContent}`;
  });
});

const showcase = document.querySelector("[data-seeker-showcase]");
if (showcase && !navigator.connection?.saveData) {
  const loadShowcase = async () => {
    try {
      const { mountSeeker } = await import("./seeker-scene.js");
      await mountSeeker(showcase);
    } catch {
      showcase.dataset.scene = "fallback";
    }
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void loadShowcase();
        }
      },
      { rootMargin: "250px" },
    );
    observer.observe(showcase);
  } else void loadShowcase();
}
