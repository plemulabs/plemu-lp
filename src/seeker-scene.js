import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const FRONT = -0.32;
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

function outline(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  return new Shape()
    .moveTo(x + radius, y)
    .lineTo(x + width - radius, y)
    .quadraticCurveTo(x + width, y, x + width, y + radius)
    .lineTo(x + width, y + height - radius)
    .quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    .lineTo(x + radius, y + height)
    .quadraticCurveTo(x, y + height, x, y + height - radius)
    .lineTo(x, y + radius)
    .quadraticCurveTo(x, y, x + radius, y);
}

function panel(width, height, radius, material) {
  const geometry = new ShapeGeometry(outline(width, height, radius), 18);
  const positions = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(
      i,
      (positions.getX(i) + width / 2) / width,
      (positions.getY(i) + height / 2) / height,
    );
  }
  return new Mesh(geometry, material);
}

function chassis(width, height, radius, depth, material) {
  const geometry = new ExtrudeGeometry(outline(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    curveSegments: 16,
  });
  geometry.translate(0, 0, -depth / 2);
  return new Mesh(geometry, material);
}

function createPhone(screenTexture) {
  const phone = new Group();
  const graphite = new MeshPhysicalMaterial({
    color: 0x263035,
    metalness: 0.78,
    roughness: 0.3,
    clearcoat: 0.8,
    clearcoatRoughness: 0.25,
  });
  const glass = new MeshPhysicalMaterial({
    color: 0x080b10,
    metalness: 0.35,
    roughness: 0.16,
    clearcoat: 1,
  });
  const rearMaterial = new MeshStandardMaterial({
    color: 0x202b2e,
    metalness: 0.62,
    roughness: 0.43,
  });
  const black = new MeshBasicMaterial({ color: 0x020408 });
  const metal = new MeshStandardMaterial({
    color: 0x839092,
    metalness: 0.95,
    roughness: 0.22,
  });
  const lensGlass = new MeshPhysicalMaterial({
    color: 0x0c171f,
    metalness: 0.4,
    roughness: 0.08,
    clearcoat: 1,
  });
  const body = chassis(2.85, 6, 0.31, 0.31, graphite);
  phone.add(body);
  const bezel = panel(2.81, 5.98, 0.3, glass);
  bezel.position.z = 0.185;
  phone.add(bezel);
  const screenMaterial = new MeshBasicMaterial({
    map: screenTexture,
    toneMapped: false,
  });
  const display = panel(2.65, 5.88, 0.235, screenMaterial);
  display.position.z = 0.192;
  phone.add(display);
  const selfie = new Mesh(new CircleGeometry(0.036, 24), black);
  selfie.position.set(0, 2.825, 0.2);
  phone.add(selfie);
  const earpiece = panel(0.36, 0.017, 0.008, black);
  earpiece.position.set(0, 2.985, 0.19);
  phone.add(earpiece);
  const back = new Group();
  back.rotation.y = Math.PI;
  back.position.z = -0.185;
  phone.add(back);
  back.add(panel(2.81, 5.98, 0.3, rearMaterial));
  const cameraPill = chassis(0.68, 1.5, 0.32, 0.065, glass);
  cameraPill.position.set(-0.85, 1.98, 0.034);
  back.add(cameraPill);
  for (const [x, y] of [
    [-0.85, 2.34],
    [-0.85, 1.62],
    [-0.02, 2.34],
  ]) {
    const housing = new Mesh(
      new CylinderGeometry(0.286, 0.286, 0.09, 48),
      graphite,
    );
    housing.rotation.x = Math.PI / 2;
    housing.position.set(x, y, 0.09);
    back.add(housing);
    const ring = new Mesh(new TorusGeometry(0.247, 0.014, 8, 48), metal);
    ring.position.set(x, y, 0.143);
    back.add(ring);
    const face = new Mesh(new CircleGeometry(0.235, 48), black);
    face.position.set(x, y, 0.145);
    back.add(face);
    const lens = new Mesh(new CircleGeometry(0.113, 32), lensGlass);
    lens.position.set(x, y, 0.147);
    back.add(lens);
    const sensor = new Mesh(
      new CircleGeometry(0.055, 24),
      new MeshBasicMaterial({ color: 0x152c39 }),
    );
    sensor.position.set(x, y, 0.15);
    back.add(sensor);
    const glint = new Mesh(
      new CircleGeometry(0.016, 16),
      new MeshBasicMaterial({ color: 0x8098a4 }),
    );
    glint.position.set(x - 0.027, y + 0.029, 0.152);
    back.add(glint);
  }
  const flash = new Mesh(
    new CircleGeometry(0.09, 24),
    new MeshStandardMaterial({ color: 0xc7cec9, roughness: 0.2 }),
  );
  flash.position.set(-0.02, 1.62, 0.015);
  back.add(flash);
  const vault = chassis(0.35, 1.45, 0.15, 0.018, glass);
  vault.position.set(-1.15, 0.37, 0.025);
  back.add(vault);
  const lettering = document.createElement("canvas");
  lettering.width = 768;
  lettering.height = 160;
  const context = lettering.getContext("2d");
  if (context) {
    context.fillStyle = "#8c9a9e";
    context.font = '500 100px "Space Grotesk", sans-serif';
    context.textAlign = "center";
    context.fillText("seeker", 384, 117);
    const texture = new CanvasTexture(lettering);
    texture.colorSpace = SRGBColorSpace;
    const label = panel(
      1.25,
      0.26,
      0,
      new MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    label.position.set(0, -0.8, 0.008);
    back.add(label);
  }
  for (const [height, y] of [
    [0.71, 1.5],
    [0.53, 0.36],
  ]) {
    const button = new Mesh(new BoxGeometry(0.075, height, 0.15), metal);
    button.position.set(1.45, y, 0.015);
    phone.add(button);
  }
  const usb = new Mesh(new BoxGeometry(0.43, 0.013, 0.13), black);
  usb.position.set(0, -3.025, 0);
  phone.add(usb);
  for (let i = 0; i < 5; i++) {
    const grille = new Mesh(new BoxGeometry(0.037, 0.013, 0.074), black);
    grille.position.set(0.66 + i * 0.09, -3.025, 0);
    phone.add(grille);
  }
  for (const y of [-2.56, 2.56]) {
    for (const x of [-1.452, 1.452]) {
      const antenna = new Mesh(
        new BoxGeometry(0.008, 0.045, 0.28),
        new MeshStandardMaterial({ color: 0x535b5c, roughness: 0.65 }),
      );
      antenna.position.set(x, y, 0);
      phone.add(antenna);
    }
  }
  return { phone, screenMaterial };
}

export async function mountSeeker(root) {
  const holder = root.querySelector("[data-seeker-canvas]");
  const renderArea = root.querySelector("[data-seeker-render]");
  const controls = root.querySelector("[data-seeker-controls]");
  const fallback = root.querySelector("[data-seeker-fallback]");
  if (!holder || !renderArea || !controls || !fallback) return;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  if (!gl) return;
  const renderer = new WebGLRenderer({
    canvas,
    context: gl,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      window.innerWidth < 800 ? 1.5 : 1.75,
    ),
  );
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.55;
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(31, 1, 0.1, 60);
  camera.position.set(0, 0, 13.4);
  const environmentScene = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(environmentScene, 0.03);
  scene.environment = environment.texture;
  environmentScene.dispose();
  pmrem.dispose();
  const key = new DirectionalLight(0xffffff, 3.6);
  key.position.set(-4, 5, 6);
  scene.add(key);
  const fill = new DirectionalLight(0xbbb0e9, 2);
  fill.position.set(4, 1, -3);
  scene.add(fill);
  const rim = new DirectionalLight(0xd4e3ad, 1.5);
  rim.position.set(-4, -1, -5);
  scene.add(rim);
  scene.add(new AmbientLight(0xffffff, 0.5));
  const textures = {};
  const pendingTextures = new Map();
  let phone;
  let environmentDisposed = false;
  const controller = new AbortController();
  const { signal } = controller;
  let disposed = false;
  let frame = 0;
  let visible = false;
  let last = 0;
  let elapsed = 0;
  let targetYaw = FRONT;
  let targetPitch = 0.1;
  let backShown = false;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = motion.matches;
  let manualMotionChoice = false;
  let drag = null;
  let observer;
  let resize;
  let screenSelection = 0;
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    controller.abort();
    stop();
    observer?.disconnect();
    resize?.disconnect();
    const geometries = new Set();
    const materials = new Set();
    scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) {
      if (material.map && !Object.values(textures).includes(material.map))
        material.map.dispose();
      material.dispose();
    }
    Object.values(textures).forEach((texture) => texture.dispose());
    if (!environmentDisposed) {
      environment.dispose();
      environmentDisposed = true;
    }
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    root.dataset.scene = "fallback";
    controls.removeAttribute("aria-busy");
    renderArea.removeAttribute("tabindex");
    renderArea.removeAttribute("role");
    renderArea.removeAttribute("aria-label");
    root.querySelector("[data-seeker-hint]").hidden = true;
  }
  try {
    const loader = new TextureLoader();
    function loadScreen(name) {
      if (textures[name]) return Promise.resolve(textures[name]);
      if (!pendingTextures.has(name)) {
        const pending = loader
          .loadAsync(screens[name].src)
          .then((texture) => {
            texture.colorSpace = SRGBColorSpace;
            texture.anisotropy = Math.min(
              4,
              renderer.capabilities.getMaxAnisotropy(),
            );
            if (disposed) texture.dispose();
            else textures[name] = texture;
            return texture;
          })
          .finally(() => pendingTextures.delete(name));
        pendingTextures.set(name, pending);
      }
      return pendingTextures.get(name);
    }
    let initialScreen = screens[root.dataset.screen]
      ? root.dataset.screen
      : "discover";
    await loadScreen(initialScreen);
    await document.fonts.ready;
    while (
      !disposed &&
      screens[root.dataset.screen] &&
      root.dataset.screen !== initialScreen
    ) {
      initialScreen = root.dataset.screen;
      await loadScreen(initialScreen);
    }
    if (disposed || !root.isConnected) {
      dispose();
      return;
    }
    const model = createPhone(textures[initialScreen]);
    phone = model.phone;
    phone.rotation.set(0.1, paused ? FRONT : 0.95, -0.105);
    scene.add(phone);
    function draw(time) {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const delta = last ? Math.min((time - last) / 1000, 0.05) : 0.016;
      last = time;
      if (!paused) elapsed += delta;
      const smoothing = paused ? 1 : 1 - Math.exp(-delta * 5);
      const idleYaw = paused || drag ? 0 : Math.sin(elapsed * 0.55) * 0.075;
      phone.rotation.y = MathUtils.lerp(
        phone.rotation.y,
        targetYaw + idleYaw,
        smoothing,
      );
      phone.rotation.x = MathUtils.lerp(
        phone.rotation.x,
        targetPitch + (paused || drag ? 0 : Math.sin(elapsed * 0.43) * 0.035),
        smoothing,
      );
      phone.position.y = paused ? 0 : Math.sin(elapsed * 0.9) * 0.075;
      renderer.render(scene, camera);
      if (!paused) wake();
    }
    function wake() {
      if (!frame && !disposed && visible && !document.hidden)
        frame = requestAnimationFrame(draw);
    }
    function setSize() {
      const width = renderArea.clientWidth;
      const height = renderArea.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = camera.aspect < 0.6 ? 14 : 13.4;
      camera.updateProjectionMatrix();
      wake();
    }
    function updateMotionControl() {
      root.dataset.motion = paused ? "paused" : "playing";
      renderArea.setAttribute(
        "aria-label",
        `Interactive Seeker model. Drag or use arrow keys to turn. Press Enter to show the other side. Tap or press Space to ${paused ? "resume" : "pause"} animation.`,
      );
      root.querySelector("[data-seeker-hint]").textContent = paused
        ? " Drag to turn. Tap to resume."
        : " Drag to turn. Tap to pause.";
    }
    function toggleMotion() {
      manualMotionChoice = true;
      paused = !paused;
      updateMotionControl();
      wake();
    }
    root.querySelectorAll("[data-seeker-screen]").forEach((button) => {
      button.addEventListener(
        "click",
        async () => {
          if (root.dataset.scene !== "ready") return;
          const name = button.dataset.seekerScreen;
          if (!screens[name]) return;
          const selection = ++screenSelection;
          backShown = false;
          targetYaw = FRONT;
          wake();
          controls.setAttribute("aria-busy", "true");
          const hint = root.querySelector("[data-seeker-hint]");
          if (!textures[name]) hint.textContent = " Loading preview…";
          try {
            const texture = await loadScreen(name);
            if (disposed || selection !== screenSelection) return;
            model.screenMaterial.map = texture;
            root.dataset.screen = name;
            fallback.src = screens[name].src;
            fallback.alt = screens[name].alt;
            root
              .querySelectorAll("[data-seeker-screen]")
              .forEach((other) =>
                other.setAttribute("aria-pressed", String(other === button)),
              );
            updateMotionControl();
            wake();
          } catch {
            if (!disposed && selection === screenSelection)
              hint.textContent =
                " Preview unavailable. Choose the screen to try again.";
          } finally {
            if (!disposed && selection === screenSelection)
              controls.removeAttribute("aria-busy");
          }
        },
        { signal },
      );
    });
    renderArea.addEventListener(
      "keydown",
      (event) => {
        if (event.target !== renderArea) return;
        if (
          [
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Enter",
            " ",
          ].includes(event.key)
        )
          event.preventDefault();
        if (event.key === "ArrowLeft") targetYaw -= 0.5;
        else if (event.key === "ArrowRight") targetYaw += 0.5;
        else if (event.key === "ArrowUp")
          targetPitch = MathUtils.clamp(targetPitch - 0.08, -0.35, 0.35);
        else if (event.key === "ArrowDown")
          targetPitch = MathUtils.clamp(targetPitch + 0.08, -0.35, 0.35);
        else if (event.key === "Enter" && !event.repeat) {
          backShown = !backShown;
          targetYaw = backShown ? Math.PI - 0.3 : FRONT;
        } else if (event.key === " " && !event.repeat) toggleMotion();
        wake();
      },
      { signal },
    );
    motion.addEventListener(
      "change",
      () => {
        if (motion.matches || !manualMotionChoice) {
          paused = motion.matches;
          updateMotionControl();
          wake();
        }
      },
      { signal },
    );
    canvas.addEventListener(
      "pointerdown",
      (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        drag = {
          x: event.clientX,
          y: event.clientY,
          yaw: targetYaw,
          pitch: targetPitch,
          pointer: event.pointerId,
        };
        canvas.setPointerCapture(event.pointerId);
      },
      { signal },
    );
    canvas.addEventListener(
      "pointermove",
      (event) => {
        if (!drag || drag.pointer !== event.pointerId) return;
        targetYaw = drag.yaw + (event.clientX - drag.x) * 0.009;
        targetPitch = MathUtils.clamp(
          drag.pitch + (event.clientY - drag.y) * 0.003,
          -0.35,
          0.35,
        );
        wake();
      },
      { signal },
    );
    const release = (event) => {
      if (!drag || drag.pointer !== event.pointerId) return;
      const tap =
        event.type === "pointerup" &&
        Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 8;
      drag = null;
      if (tap) toggleMotion();
    };
    canvas.addEventListener("pointerup", release, { signal });
    canvas.addEventListener("pointercancel", release, { signal });
    canvas.addEventListener("lostpointercapture", release, { signal });
    canvas.addEventListener(
      "webglcontextlost",
      (event) => {
        event.preventDefault();
        dispose();
      },
      { signal },
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) stop();
        else wake();
      },
      { signal },
    );
    window.addEventListener(
      "pagehide",
      (event) => {
        if (event.persisted) stop();
        else dispose();
      },
      { signal },
    );
    window.addEventListener("pageshow", wake, { signal });
    resize = new ResizeObserver(setSize);
    resize.observe(renderArea);
    observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) wake();
        else stop();
      },
      { threshold: 0.05 },
    );
    observer.observe(renderArea);
    setSize();
    await renderer.compileAsync(scene, camera);
    if (disposed) return;
    while (
      screens[root.dataset.screen] &&
      root.dataset.screen !== initialScreen
    ) {
      initialScreen = root.dataset.screen;
      model.screenMaterial.map = await loadScreen(initialScreen);
      if (disposed) return;
    }
    canvas.setAttribute("aria-hidden", "true");
    holder.append(canvas);
    root.dataset.scene = "ready";
    controls.hidden = false;
    renderArea.tabIndex = 0;
    renderArea.setAttribute("role", "group");
    root.querySelector("[data-seeker-hint]").hidden = false;
    updateMotionControl();
    wake();
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
