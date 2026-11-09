import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  BufferGeometry,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Quaternion,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  WebGLRenderer,
  CanvasTexture,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createCartridge } from "./cartridge-hero.js";
import { PACK_GAMES } from "./cartridge-catalog.js";

const SEGMENTS = 40;
const smooth = (t) => {
  t = MathUtils.clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};
const released = (u, p) => smooth((p - u) * 10);
function point(u, v, side, p, strip) {
  const loose = released(u, p),
    jagged = Math.round(u * SEGMENTS) % 2 === 0 ? -0.018 : 0.015;
  if (strip) {
    const x = MathUtils.lerp(-0.92, 0.92, u) - loose * 0.1;
    const y =
      MathUtils.lerp(0.94, 1.39, v) +
      jagged * loose * Math.max(0, 1 - v * 6) +
      loose * (0.22 + 0.2 * (1 - u));
    let depth = MathUtils.lerp(0.055 + 0.145 * Math.sin(u * Math.PI), 0.025, v);
    if (v > 0.65) depth += 0.012 * Math.cos(u * Math.PI * SEGMENTS);
    return [
      x,
      y,
      side * depth +
        loose * (0.16 + 0.24 * (1 - u)) -
        Math.sin(v * Math.PI) * loose * 0.12,
    ];
  }
  const y =
    MathUtils.lerp(-1.38, 0.94, v) + jagged * loose * smooth((v - 0.94) / 0.06);
  let depth =
    (0.035 + 0.145 * Math.sin(u * Math.PI)) * smooth((y + 1.38) / 0.2) + 0.018;
  depth += loose * v ** 8 * 0.085;
  if (y < -1.21) depth += 0.008 * Math.cos(u * Math.PI * SEGMENTS);
  return [MathUtils.lerp(-0.92, 0.92, u), y, depth * side];
}
export function createFoilGeometry(strip = false) {
  const rows = strip ? 8 : 16,
    cols = SEGMENTS + 1,
    count = cols * (rows + 1);
  const geometry = new BufferGeometry(),
    indices = [];
  for (let side = 0; side < 2; side++)
    for (let i = 0; i < SEGMENTS; i++)
      for (let j = 0; j < rows; j++) {
        const a = side * count + i * (rows + 1) + j,
          b = a + 1,
          c = a + rows + 2,
          d = a + rows + 1;
        if (side === 0) indices.push(a, c, b, a, d, c);
        else indices.push(a, b, c, a, c, d);
      }
  for (let edge = 0; edge < 2; edge++)
    for (let j = 0; j < rows; j++) {
      const a = edge * SEGMENTS * (rows + 1) + j,
        b = a + 1;
      indices.push(a, b, b + count, a, b + count, a + count);
    }
  for (let i = 0; i < SEGMENTS; i++) {
    const a = i * (rows + 1) + (strip ? rows : 0),
      b = a + rows + 1;
    indices.push(a, a + count, b + count, a, b + count, b);
  }
  geometry.setIndex(indices);
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(new Float32Array(count * 2 * 3), 3).setUsage(
      DynamicDrawUsage,
    ),
  );
  geometry.setAttribute(
    "color",
    new Float32BufferAttribute(new Float32Array(count * 2 * 3), 3),
  );
  geometry.userData = { strip, rows, count };
  updateFoil(geometry, 0);
  return geometry;
}
export function updateFoil(geometry, progress) {
  const { strip, rows, count } = geometry.userData;
  const positions = geometry.attributes.position.array,
    colors = geometry.attributes.color.array;
  const purple = new Color("#8c76db"),
    lime = new Color("#b6d935"),
    silver = new Color("#b8c2d9");
  for (let face = 0; face < 2; face++)
    for (let i = 0; i <= SEGMENTS; i++)
      for (let j = 0; j <= rows; j++) {
        const u = i / SEGMENTS,
          v = j / rows,
          k = (face * count + i * (rows + 1) + j) * 3;
        const p = point(u, v, face === 0 ? 1 : -1, progress, strip);
        positions.set(p, k);
        const crimp = strip ? j >= 6 : j <= 1;
        const color = crimp ? silver : strip && j < 5 ? lime : purple;
        const brightness =
          (face === 0 ? 1 : 0.65) *
          (crimp ? 0.8 + 0.2 * Math.cos(u * Math.PI * SEGMENTS) : 1);
        colors[k] = color.r * brightness;
        colors[k + 1] = color.g * brightness;
        colors[k + 2] = color.b * brightness;
      }
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
}
function print(text, width, height, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = Math.ceil((512 * height) / width);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.font = "500 100px Space Grotesk, sans-serif";
  const fontSize = Math.min(
    canvas.height * 0.84,
    (490 / ctx.measureText(text).width) * 100,
  );
  ctx.font = `500 ${fontSize}px Space Grotesk, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, canvas.height / 2, 490);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return new Mesh(
    new PlaneGeometry(width, height),
    new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
}

export async function mountPackScene(art) {
  const pack = art.querySelector("[data-pack-preview]");
  const holder = art.querySelector("[data-pack-canvas]");
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
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const scene = new Scene(),
    camera = new PerspectiveCamera(32, 1, 0.1, 30);
  camera.position.set(0, 0.4, 7.5);
  camera.lookAt(0, 0.2, 0);
  const studio = new Group();
  scene.add(studio);
  const foil = new MeshPhysicalMaterial({
    vertexColors: true,
    metalness: 0.35,
    roughness: 0.38,
    clearcoat: 0.45,
    envMapIntensity: 0.6,
    clearcoatRoughness: 0.28,
  });
  const body = new Mesh(createFoilGeometry(false), foil),
    strip = new Mesh(createFoilGeometry(true), foil);
  studio.add(body, strip);
  const logo = new Mesh(
    new PlaneGeometry(0.78, 0.78),
    new MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  logo.position.set(0, 0.33, 0.29);
  logo.visible = false;
  studio.add(logo);
  const wordmark = print("plemu", 1.18, 0.42, "#f4f1e8");
  wordmark.position.set(0, -0.38, 0.25);
  studio.add(wordmark);
  const edition = print("FREE PREVIEW", 1.32, 0.17, "#b6d935");
  edition.position.set(0, -0.81, 0.25);
  studio.add(edition);
  const pull = print("PULL >", 0.43, 0.1, "#121418");
  pull.position.set(-0.58, 1.13, 0.21);
  strip.add(pull);
  const cards = PACK_GAMES.map((game) => createCartridge(game));
  cards.forEach(({ group }) => {
    group.scale.setScalar(0.708);
    group.visible = false;
    studio.add(group);
  });
  const key = new DirectionalLight(0xf4f0ff, 1.8);
  key.position.set(-4, 6, 5);
  scene.add(key);
  const rim = new DirectionalLight(0xbfd7ff, 1.2);
  rim.position.set(4, 2, -2);
  scene.add(rim);
  scene.add(new AmbientLight(0xffffff, 0.45));
  const room = new RoomEnvironment(),
    pmrem = new PMREMGenerator(renderer),
    environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController(),
    { signal } = events;
  let mounted = false,
    disposed = false,
    visible = true,
    frame = 0,
    last = 0,
    elapsed = 0,
    tear = 0,
    reveal = 0,
    targetTear = 0,
    targetReveal = 0,
    lastTear = -1,
    selected = 0,
    hoverX = 0,
    hoverY = 0,
    renderCount = 0,
    lastState = null,
    generation = -1,
    cardAttempt = "";
  let observer, resizeObserver;
  const loaded = new Set(),
    textures = new Set();
  const loader = new TextureLoader();
  function loadCard(index) {
    if (loaded.has(index)) return;
    loaded.add(index);
    loader
      .loadAsync(PACK_GAMES[index].cover)
      .then((texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = SRGBColorSpace;
        textures.add(texture);
        const card = cards[index];
        textures.add(card.artMaterial.map);
        card.artMaterial.map = texture;
        const aspect = texture.image.width / texture.image.height;
        card.art.scale.set(
          Math.min(1, aspect / (1.74 / 1.872)),
          Math.min(1, 1.74 / 1.872 / aspect),
          1,
        );
        wake();
      })
      .catch(() => {
        loaded.delete(index);
      });
  }
  function readState() {
    const source = pack.querySelector("[data-pack-cover]").getAttribute("src");
    const index = PACK_GAMES.findIndex((game) => game.cover === source);
    if (index >= 0) selected = index;
    const nextGeneration = Number(pack.dataset.packGeneration || 0);
    if (generation !== -1 && nextGeneration !== generation) {
      tear = 0;
      reveal = 0;
      lastTear = -1;
    }
    generation = nextGeneration;
    const state = pack.dataset.packState;
    if (lastState === "revealed" && state === "sealed") {
      tear = 0;
      reveal = 0;
    }
    lastState = state;
    const open = state === "revealed";
    targetTear = open ? 1 : Number(pack.style.getPropertyValue("--tear") || 0);
    targetReveal = open ? 1 : 0;
    cards.forEach(({ group }, i) => (group.visible = i === selected));
    const attempt = `${generation}:${selected}`;
    if (attempt !== cardAttempt) {
      cardAttempt = attempt;
      loadCard(selected);
    }
    wake();
  }
  const changes = new MutationObserver(readState);
  changes.observe(pack, {
    attributes: true,
    attributeFilter: ["data-pack-state", "data-pack-generation", "style"],
    subtree: false,
  });
  function wake() {
    if (mounted && !frame && !disposed && visible && !document.hidden)
      frame = requestAnimationFrame(draw);
  }
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  }
  const peelRotation = new Quaternion(),
    pivot = new Vector3(0, 1.15, 0),
    shift = new Vector3(),
    axis = new Vector3(0, 0, 1);
  const framingParts = [body, strip, logo, wordmark, edition];
  const bounds = new Box3(),
    fitSize = new Vector3(),
    fitCenter = new Vector3();
  let fitDistance = 7.5,
    fitX = 0,
    fitY = 0.2,
    fittedReveal = -1,
    fittedTear = -1;
  function draw(time) {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    const delta = last ? Math.min((time - last) / 1000, 0.05) : 0.016;
    last = time;
    const paused =
      media.matches ||
      (art.matches(":focus-within") && pack.dataset.packState !== "tearing");
    if (!paused) elapsed += delta;
    key.position.x = -4 + Math.sin(elapsed * 0.35) * 0.65;
    const blend = media.matches || !mounted ? 1 : 1 - Math.exp(-delta * 14);
    tear += (targetTear - tear) * blend;
    reveal += (targetReveal - reveal) * blend;
    if (Math.abs(tear - targetTear) < 0.001) tear = targetTear;
    if (Math.abs(reveal - targetReveal) < 0.001) reveal = targetReveal;
    if (Math.abs(lastTear - tear) > 0.0001) {
      updateFoil(body.geometry, tear);
      updateFoil(strip.geometry, tear);
      lastTear = tear;
    }
    const lift = smooth((reveal - 0.18) / 0.74),
      peel = smooth(reveal / 0.48);
    peelRotation.setFromAxisAngle(axis, -peel * 1.012);
    strip.quaternion.copy(peelRotation);
    shift.copy(pivot).applyQuaternion(peelRotation);
    strip.position.set(
      peel * 0.95 + pivot.x - shift.x,
      peel * 0.25 + pivot.y - shift.y,
      peel * 0.32,
    );
    studio.position.y =
      -lift * 0.34 + (paused ? 0 : Math.sin(elapsed * 0.8) * 0.035);
    studio.rotation.set(
      0.08 + hoverY * 0.07,
      -0.28 + hoverX * 0.1 + (paused ? 0 : Math.sin(elapsed * 0.55) * 0.035),
      -0.087,
    );
    cards[selected].group.position.set(0, -0.08 + lift * 1.7, 0);
    cards[selected].group.rotation.z = lift * 0.07;
    pull.visible = tear < 0.025;
    if (
      Math.abs(fittedReveal - reveal) > 0.001 ||
      Math.abs(fittedTear - tear) > 0.001
    ) {
      studio.updateMatrixWorld(true);
      bounds.makeEmpty();
      for (const part of framingParts) bounds.expandByObject(part);
      bounds.expandByObject(cards[selected].group);
      bounds.getSize(fitSize);
      bounds.getCenter(fitCenter);
      const tan = Math.tan((Math.PI * 32) / 360);
      fitDistance = Math.max(
        7.5,
        bounds.max.z + (fitSize.y * 0.56) / tan,
        bounds.max.z + (fitSize.x * 0.56) / (tan * camera.aspect),
      );
      fitX = fitCenter.x;
      fitY = fitCenter.y;
      fittedReveal = reveal;
      fittedTear = tear;
    }
    camera.position.set(
      fitX,
      fitY,
      Math.max(
        fitDistance,
        MathUtils.lerp(camera.position.z, fitDistance, blend),
      ),
    );
    camera.lookAt(fitX, fitY, 0);
    renderer.render(scene, camera);
    renderCount++;
    const progress = reveal.toFixed(3);
    if (art.dataset.packRevealProgress !== progress)
      art.dataset.packRevealProgress = progress;
    if (!paused || tear !== targetTear || reveal !== targetReveal) wake();
  }
  function size() {
    if (disposed) return;
    const w = holder.clientWidth,
      h = holder.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(
      Math.min(devicePixelRatio || 1, w < 500 ? 1.25 : 1.6),
    );
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    fittedReveal = -1;
    camera.position.z = Math.max(
      7.5,
      3.5 / (2 * Math.tan((Math.PI * 32) / 360) * camera.aspect),
    );
    camera.updateProjectionMatrix();
    wake();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    events.abort();
    stop();
    changes.disconnect();
    observer?.disconnect();
    resizeObserver?.disconnect();
    const geometries = new Set(),
      materials = new Set();
    scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material])
        if (material) {
          materials.add(material);
          if (material.map) textures.add(material.map);
        }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    environment.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    art.dataset.packRender = "fallback";
  }
  try {
    await document.fonts.ready;
    loader
      .loadAsync("/brand/plemu-pack-mark.png")
      .then((texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = SRGBColorSpace;
        textures.add(texture);
        logo.material.map = texture;
        logo.visible = true;
        wake();
      })
      .catch(() => {
        if (disposed) return;
        logo.visible = false;
        art.dataset.packMark = "text";
        wake();
      });
    readState();
    size();
    await renderer.compileAsync(scene, camera);
    if (disposed || !art.isConnected) {
      dispose();
      return;
    }
    readState();
    tear = targetTear;
    reveal = targetReveal;
    draw(performance.now());
    mounted = true;
    holder.append(canvas);
    canvas.setAttribute("aria-hidden", "true");
    art.dataset.packRender = "ready";
    art.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType !== "mouse") return;
        const rect = art.getBoundingClientRect();
        hoverX = (event.clientX - rect.left) / rect.width - 0.5;
        hoverY = (event.clientY - rect.top) / rect.height - 0.5;
        wake();
      },
      { signal },
    );
    art.addEventListener(
      "pointerleave",
      () => {
        hoverX = hoverY = 0;
        wake();
      },
      { signal },
    );
    media.addEventListener("change", wake, { signal });
    art.addEventListener("focusout", wake, { signal });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) stop();
        else wake();
      },
      { signal },
    );
    canvas.addEventListener(
      "webglcontextlost",
      (event) => {
        event.preventDefault();
        dispose();
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
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(size);
      resizeObserver.observe(holder);
    } else window.addEventListener("resize", size, { signal });
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          if (visible) wake();
          else stop();
        },
        { threshold: 0.03 },
      );
      observer.observe(art);
    }
    wake();
    return {
      dispose,
      getState: () => ({
        tear,
        reveal,
        renderCount,
        disposed,
        selected: PACK_GAMES[selected].slug,
      }),
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
