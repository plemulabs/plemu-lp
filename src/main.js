import "./styles.css";

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
