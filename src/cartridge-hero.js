import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Raycaster,
  Scene,
  Shape,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createConsoleEnergy } from "./console-energy.js";
import { bindCartridgeInput } from "./cartridge-input.js";

import { HERO_GAMES } from "./cartridge-catalog.js";
export { HERO_GAMES } from "./cartridge-catalog.js";

const SLOT = new Vector3(0, 0.76, -0.35);
const ALIGN = new Vector3(0, 3.4, -0.35);
const INSERT_SECONDS = 1.15;
const EJECT_SECONDS = 0.48;
const smooth = (t) => t * t * (3 - 2 * t);
const clamp = (t) => MathUtils.clamp(t, 0, 1);

function roundedShape(width, height, radius) {
  const x = -width / 2,
    y = -height / 2;
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

function slab(width, height, depth, radius, material) {
  const geometry = new ExtrudeGeometry(roundedShape(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -depth / 2);
  return new Mesh(geometry, material);
}

function box(parent, x, y, z, width, height, depth, material) {
  const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function repeatedBoxes(parent, dimensions, material) {
  const mesh = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    material,
    dimensions.length,
  );
  const matrix = new Matrix4();
  dimensions.forEach(([x, y, z, width, height, depth], index) => {
    matrix.makeScale(width, height, depth);
    matrix.setPosition(x, y, z);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}

function canvasMap(width, height, paint) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  paint(context, width, height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function wordMap(
  text,
  color = "#e5e6d8",
  background = "#21262a",
  width = 512,
  height = 96,
) {
  return canvasMap(width, height, (context) => {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    context.fillStyle = color;
    context.font = "600 42px Space Grotesk, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, width / 2, height / 2 + 1, width - 32);
  });
}

function textPlate(parent, text, x, y, z, width, height, color, background) {
  const material = new MeshBasicMaterial({
    map: wordMap(text, color, background),
    transparent: background === "#00000000",
    depthWrite: background !== "#00000000",
    toneMapped: false,
  });
  const plate = new Mesh(new PlaneGeometry(width, height), material);
  plate.position.set(x, y, z);
  parent.add(plate);
  return plate;
}

function pieceShape(cells, unit) {
  const edges = new Map();
  for (const [x, y] of cells) {
    const corners = [
      [x, y],
      [x + 1, y],
      [x + 1, y + 1],
      [x, y + 1],
    ];
    for (let i = 0; i < 4; i++) {
      const a = corners[i],
        b = corners[(i + 1) % 4];
      const reverse = `${b[0]},${b[1]}:${a[0]},${a[1]}`;
      if (edges.has(reverse)) edges.delete(reverse);
      else edges.set(`${a[0]},${a[1]}:${b[0]},${b[1]}`, [a, b]);
    }
  }
  const boundary = Array.from(edges.values());
  const vertices = [boundary[0][0]];
  let next = boundary[0][1];
  while (
    vertices.length <= boundary.length &&
    (next[0] !== vertices[0][0] || next[1] !== vertices[0][1])
  ) {
    vertices.push(next);
    const edge = boundary.find(([a]) => a[0] === next[0] && a[1] === next[1]);
    next = edge[1];
  }
  const centerX = 5,
    centerY = 2;
  const shape = new Shape();
  vertices.forEach(([x, y], index) => {
    const px = (x - centerX) * unit,
      py = (centerY - y) * unit;
    if (!index) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  });
  shape.closePath();
  return shape;
}

function createConsole() {
  const group = new Group();
  const carbon = new MeshPhysicalMaterial({
    color: 0x292e32,
    roughness: 0.42,
    metalness: 0.38,
    clearcoat: 0.35,
  });
  const graphite = new MeshStandardMaterial({
    color: 0x171c20,
    metalness: 0.5,
    roughness: 0.45,
  });
  const ivory = new MeshPhysicalMaterial({
    color: 0xd5dbc6,
    metalness: 0.14,
    roughness: 0.44,
    clearcoat: 0.3,
  });
  const lime = new MeshPhysicalMaterial({
    color: 0xb7d638,
    metalness: 0.13,
    roughness: 0.35,
    clearcoat: 0.45,
  });
  const violet = new MeshPhysicalMaterial({
    color: 0x8b79ba,
    metalness: 0.26,
    roughness: 0.43,
    clearcoat: 0.4,
  });
  const metal = new MeshStandardMaterial({
    color: 0x838d8a,
    metalness: 0.92,
    roughness: 0.29,
  });
  const gold = new MeshStandardMaterial({
    color: 0xc5aa62,
    metalness: 0.88,
    roughness: 0.31,
  });
  const black = new MeshBasicMaterial({ color: 0x070b0d });
  const base = slab(7.02, 2.92, 0.69, 0.16, graphite);
  base.rotation.x = -Math.PI / 2;
  base.position.y = -0.59;
  group.add(base);
  const seam = slab(6.99, 2.9, 0.038, 0.15, metal);
  seam.rotation.x = -Math.PI / 2;
  seam.position.y = -0.18;
  group.add(seam);

  const pieces = [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
    ],
    [
      [6, 0],
      [7, 0],
      [7, 1],
      [8, 1],
    ],
    [
      [8, 0],
      [9, 0],
      [9, 1],
      [9, 2],
    ],
    [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 3],
    ],
    [
      [1, 2],
      [2, 2],
      [2, 3],
      [3, 3],
    ],
    [
      [3, 2],
      [4, 2],
      [4, 3],
      [5, 2],
    ],
    [
      [5, 3],
      [6, 2],
      [6, 3],
      [7, 2],
    ],
    [
      [7, 3],
      [8, 2],
      [8, 3],
      [9, 3],
    ],
  ];
  const materials = [
    carbon,
    graphite,
    ivory,
    carbon,
    lime,
    carbon,
    ivory,
    graphite,
    violet,
  ];
  pieces.forEach((cells, index) => {
    const geometry = new ExtrudeGeometry(pieceShape(cells, 0.7), {
      depth: 0.35,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 2,
      curveSegments: 2,
      steps: 1,
    });
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new Vector3());
    geometry.translate(-center.x, -center.y, 0);
    geometry.scale(0.975, 0.975, 1);
    const mesh = new Mesh(geometry, materials[index]);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(center.x, -0.11 + (index === 4 ? 0.025 : 0), -center.y);
    group.add(mesh);
  });

  box(group, 0, 0.274, -0.35, 2.77, 0.045, 0.56, black);
  box(group, 0, 0.305, -0.69, 2.91, 0.09, 0.11, graphite);
  box(group, 0, 0.305, -0.01, 2.91, 0.09, 0.11, graphite);
  const railLeft = box(group, -1.405, 0.31, -0.35, 0.075, 0.12, 0.65, metal);
  const railRight = box(group, 1.405, 0.31, -0.35, 0.075, 0.12, 0.65, metal);
  repeatedBoxes(
    group,
    Array.from({ length: 12 }, (_, i) => [
      -1.08 + i * 0.196,
      0.309,
      -0.35,
      0.055,
      0.024,
      0.25,
    ]),
    gold,
  );
  const latchMaterial = new MeshStandardMaterial({
    color: 0xb7d638,
    emissive: 0x88b72d,
    emissiveIntensity: 0.1,
    metalness: 0.35,
    roughness: 0.4,
  });
  const latch = box(group, 1.63, 0.272, -0.35, 0.17, 0.06, 0.35, latchMaterial);

  const displayFrame = slab(2.65, 0.61, 0.065, 0.07, metal);
  displayFrame.position.set(0, -0.51, 1.486);
  group.add(displayFrame);
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 768;
  screenCanvas.height = 160;
  const screenContext = screenCanvas.getContext("2d");
  const screenTexture = new CanvasTexture(screenCanvas);
  screenTexture.colorSpace = SRGBColorSpace;
  const screen = new Mesh(
    new PlaneGeometry(2.46, 0.46),
    new MeshBasicMaterial({ map: screenTexture, toneMapped: false }),
  );
  screen.position.set(0, -0.51, 1.552);
  group.add(screen);
  let screenKey = "";
  function display(title, state, progress = 0) {
    const key = title + state + Math.floor(progress * 18);
    if (key === screenKey) return;
    screenKey = key;
    const context = screenContext;
    context.fillStyle = "#0b1413";
    context.fillRect(0, 0, 768, 160);
    context.fillStyle = state === "ready" ? "#c1e644" : "#82968d";
    context.font = "500 31px Space Grotesk, sans-serif";
    context.textBaseline = "middle";
    context.textAlign = "center";
    context.fillText(
      state === "ready"
        ? title
        : state === "booting"
          ? "Reading cartridge"
          : "plemu",
      384,
      64,
      690,
    );
    if (state === "booting") {
      for (let i = 0; i < 18; i++) {
        context.fillStyle = i < progress * 18 ? "#c1e644" : "#25362d";
        context.fillRect(174 + i * 24, 111, 16, 6);
      }
    } else {
      context.fillStyle = "#64816e";
      context.font = "20px DM Sans, sans-serif";
      context.fillText(
        state === "ready"
          ? "Ready for a little escape"
          : "A new life for your next game",
        384,
        116,
        690,
      );
    }
    screenTexture.needsUpdate = true;
  }
  display("", "idle");

  const lightMaterial = new MeshStandardMaterial({
    color: 0x9cab7b,
    emissive: 0xaed839,
    emissiveIntensity: 0.08,
    roughness: 0.3,
  });
  const power = new Mesh(
    new CylinderGeometry(0.17, 0.17, 0.05, 24),
    lightMaterial,
  );
  power.rotation.x = Math.PI / 2;
  power.position.set(2.77, -0.48, 1.5);
  group.add(power);
  const powerRim = new Mesh(new TorusGeometry(0.21, 0.018, 5, 24), metal);
  powerRim.position.set(2.77, -0.48, 1.53);
  group.add(powerRim);
  const logoMaterial = new MeshBasicMaterial({
    map: wordMap("p", "#c1de3a", "#20282b", 96, 96),
    toneMapped: false,
  });
  const logo = new Mesh(new PlaneGeometry(0.42, 0.42), logoMaterial);
  logo.position.set(-2.83, -0.47, 1.526);
  group.add(logo);
  repeatedBoxes(
    group,
    [
      ...Array.from({ length: 5 }, (_, i) => [
        -2.08 + i * 0.115,
        -0.51,
        1.505,
        0.025,
        0.16,
        0.025,
      ]),
      ...Array.from({ length: 6 }, (_, i) => [
        3.525,
        -0.49,
        -0.9 + i * 0.22,
        0.022,
        0.14,
        0.09,
      ]),
    ],
    black,
  );
  box(group, -3.535, -0.51, 0.4, 0.025, 0.13, 0.34, black);
  box(group, -3.55, -0.51, 0.4, 0.026, 0.04, 0.22, metal);
  for (const x of [-2.7, 2.7])
    for (const z of [-0.95, 0.95]) {
      const foot = new Mesh(
        new CylinderGeometry(0.17, 0.15, 0.14, 16),
        graphite,
      );
      foot.position.set(x, -1.01, z);
      group.add(foot);
    }
  const shadowMap = canvasMap(128, 128, (context) => {
    const gradient = context.createRadialGradient(64, 64, 5, 64, 64, 63);
    gradient.addColorStop(0, "rgba(0,0,0,.65)");
    gradient.addColorStop(0.55, "rgba(0,0,0,.32)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  });
  const shadow = new Mesh(
    new PlaneGeometry(10.5, 6),
    new MeshBasicMaterial({
      map: shadowMap,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.095;
  group.add(shadow);
  return {
    group,
    display,
    lightMaterial,
    latchMaterial,
    latch,
    railLeft,
    railRight,
    logoMaterial,
  };
}

export function createCartridge(game, index = 0) {
  const group = new Group();
  group.userData.gameIndex = index;
  const shell = new MeshPhysicalMaterial({
    color: game.shell,
    metalness: 0.12,
    roughness: 0.4,
    clearcoat: 0.3,
  });
  const trim = new MeshStandardMaterial({ color: game.trim, roughness: 0.45 });
  const gold = new MeshStandardMaterial({
    color: 0xb3974a,
    metalness: 0.65,
    roughness: 0.4,
  });
  const outline = [
    [0, 0.04],
    [0, 0.96],
    [0.04, 1],
    [0.96, 1],
    [1, 0.96],
    [1, 0.04],
    [0.96, 0],
    [0.04, 0],
  ];
  const shape = new Shape();
  outline.forEach(([x, y], i) => {
    const px = (x - 0.5) * 1.928,
      py = (y - 0.5) * 2.328;
    if (i === 0) shape.moveTo(px, py);
    else shape.lineTo(px, py);
  });
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.124,
    bevelEnabled: true,
    bevelSize: 0.036,
    bevelThickness: 0.028,
    bevelSegments: 1,
    steps: 1,
  });
  geometry.translate(0, 0, -0.062);
  group.add(new Mesh(geometry, [shell, trim]));
  const labelBase = box(group, 0, 0.024, 0.096, 1.812, 1.944, 0.012, trim);
  labelBase.name = "Native cover recess";
  const artMaterial = new MeshBasicMaterial({
    map: wordMap(game.short, game.accent, "#171d22", 320, 384),
    toneMapped: false,
  });
  const art = new Mesh(new PlaneGeometry(1.74, 1.872), artMaterial);
  art.position.set(0, 0.024, 0.119);
  group.add(art);
  textPlate(
    group,
    game.system,
    0,
    1.073,
    0.122,
    1.66,
    0.12,
    game.accent,
    "#00000000",
  );
  repeatedBoxes(
    group,
    Array.from({ length: 9 }, (_, i) => [
      -0.6 + i * 0.138,
      -1.044,
      0.101,
      0.076,
      0.144,
      0.008,
    ]),
    gold,
  );
  repeatedBoxes(
    group,
    (game.code === "SNES" ? [-1, 1] : [-1]).flatMap((side) =>
      Array.from({ length: game.code === "SNES" ? 4 : 3 }, (_, i) => [
        side * 0.938,
        (-0.24 + i * 0.12) * 2.4,
        0.101,
        0.044,
        0.06,
        0.008,
      ]),
    ),
    trim,
  );
  const back = box(group, 0, 0, -0.103, 1.76, 1.92, 0.014, trim);
  back.name = "Native metadata back";
  const print = textPlate(
    group,
    game.short,
    0,
    0,
    -0.119,
    1.5,
    0.3,
    "#e8e9ed",
    "#292e4f",
  );
  print.rotation.y = Math.PI;
  return { group, art, artMaterial };
}

function carouselPose(index, selected, elapsed = 0) {
  let offset = index - selected;
  if (offset > HERO_GAMES.length / 2) offset -= HERO_GAMES.length;
  if (offset < -HERO_GAMES.length / 2) offset += HERO_GAMES.length;
  const angle = offset * 0.84;
  return {
    x: Math.sin(angle) * 4.15,
    y:
      2.58 +
      Math.cos(angle) * 0.34 +
      Math.sin(elapsed * 1.1 + index * 1.7) * 0.065,
    z: Math.cos(angle) * 1.8 - 0.32,
    rx: -0.075 + Math.sin(elapsed * 0.64 + index) * 0.023,
    ry: -angle * 0.5 + 0.18,
    rz: -angle * 0.065 + Math.sin(elapsed * 0.73 + index) * 0.015,
    scale: offset === 0 ? 1 : 0.77,
  };
}

function applyPose(group, pose, blend = 1) {
  group.position.x = MathUtils.lerp(group.position.x, pose.x, blend);
  group.position.y = MathUtils.lerp(group.position.y, pose.y, blend);
  group.position.z = MathUtils.lerp(group.position.z, pose.z, blend);
  group.rotation.x = MathUtils.lerp(group.rotation.x, pose.rx || 0, blend);
  group.rotation.y = MathUtils.lerp(group.rotation.y, pose.ry || 0, blend);
  group.rotation.z = MathUtils.lerp(group.rotation.z, pose.rz || 0, blend);
  group.scale.setScalar(MathUtils.lerp(group.scale.x, pose.scale ?? 1, blend));
}

function poseOf(group) {
  return {
    x: group.position.x,
    y: group.position.y,
    z: group.position.z,
    rx: group.rotation.x,
    ry: group.rotation.y,
    rz: group.rotation.z,
    scale: group.scale.x,
  };
}

function curve(a, b, c, d, t) {
  const inverse = 1 - t;
  return (
    inverse ** 3 * a +
    3 * inverse ** 2 * t * b +
    3 * inverse * t ** 2 * c +
    t ** 3 * d
  );
}

export function insertionPose(start, progress) {
  if (progress < 0.36) {
    const t = smooth(clamp(progress / 0.36));
    return {
      x: curve(start.x, start.x + 0.55, -0.18, ALIGN.x, t),
      y: curve(start.y, start.y + 1.05, ALIGN.y + 0.5, ALIGN.y, t),
      z: curve(start.z, start.z + 0.15, ALIGN.z, ALIGN.z, t),
      rx: MathUtils.lerp(start.rx, 0, t),
      ry: MathUtils.lerp(start.ry, 0, t),
      rz: MathUtils.lerp(start.rz, 0, t) + Math.sin(t * Math.PI) * 0.06,
      scale: MathUtils.lerp(start.scale ?? 1, 1, t),
    };
  }
  if (progress < 0.78) {
    const t = clamp((progress - 0.36) / 0.42);
    return {
      x: 0,
      y: MathUtils.lerp(ALIGN.y, SLOT.y + 0.16, smooth(t)),
      z: SLOT.z,
      scale: 1,
    };
  }
  const t = clamp((progress - 0.78) / 0.11);
  return {
    x: 0,
    y: SLOT.y + 0.16 * (1 - smooth(t)) - Math.sin(t * Math.PI) * 0.022,
    z: SLOT.z,
    scale: 1,
  };
}

export async function mountCartridgeHero(root) {
  if (!root) return;
  const stage = root.querySelector("[data-cartridge-stage]");
  const status = root.querySelector("[data-cartridge-status]");
  const pauseButton = root.querySelector("[data-cartridge-pause]");
  const staticCards = root.querySelectorAll("[data-static-cartridge]");
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const readMotionChoice = () =>
    root.dataset.manualMotion === "true"
      ? root.dataset.paused === "true"
      : root.dataset.paused === "true" || media.matches;
  let selected = Math.max(
    0,
    HERO_GAMES.findIndex((game) => game.slug === root.dataset.selected),
  );
  let paused = readMotionChoice(),
    manualMotion = root.dataset.manualMotion === "true",
    disposed = false,
    seated = root.dataset.phase === "ready";
  let frame = 0,
    visible = true,
    lastTime = 0,
    elapsed = 0,
    renderCount = 0;
  let pendingSelection = null,
    action = null,
    pendingInsert = false;
  let renderer,
    environment,
    cards = [],
    consoleModel,
    energy,
    observer,
    resizeObserver;
  const textures = new Set();
  const events = new AbortController();
  const { signal } = events;
  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 80);
  const raycaster = new Raycaster();
  const pointerVector = new Vector2();
  const viewDirection = new Vector3(4.0, 4.4, 11.4).normalize();
  const target = new Vector3(0.4, 1.3, 0.2);
  const fallback = root.querySelector("[data-cartridge-static]");
  const api = {
    select,
    insert,
    eject,
    pause,
    dispose,
    getState: () => ({
      selected: HERO_GAMES[selected].slug,
      paused,
      seated,
      phase: root.dataset.phase,
      busy: !!action,
      renderCount,
      drawCalls: renderer?.info.render.calls ?? 0,
      triangles: renderer?.info.render.triangles ?? 0,
      disposed,
    }),
  };

  function phase(name) {
    if (root.dataset.phase !== name) root.dataset.phase = name;
  }
  function announce(text) {
    if (status.textContent !== text) status.textContent = text;
  }
  function update() {
    const game = HERO_GAMES[selected];
    root.dataset.selected = game.slug;
    root.dataset.motion = paused ? "paused" : "playing";
    root.dataset.paused = String(paused);
    root.dataset.energy = seated ? (paused ? "steady" : "flowing") : "off";
    staticCards.forEach((card) =>
      card.classList.toggle(
        "is-selected",
        card.dataset.staticCartridge === game.slug,
      ),
    );
    stage.setAttribute(
      "aria-label",
      `${game.title}, ${game.system}. Cartridge carousel.`,
    );
    pauseButton.setAttribute("aria-pressed", String(paused));
    const label = paused
      ? "Play cartridge animation"
      : "Pause cartridge animation";
    pauseButton.setAttribute("aria-label", label);
    pauseButton.title = label;
    stage.setAttribute("aria-busy", String(!!action));
  }
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }
  function wake() {
    if (!frame && !disposed && renderer && visible && !document.hidden)
      frame = requestAnimationFrame(draw);
  }
  function select(value) {
    const index =
      typeof value === "string"
        ? HERO_GAMES.findIndex((game) => game.slug === value)
        : ((value % HERO_GAMES.length) + HERO_GAMES.length) % HERO_GAMES.length;
    if (!Number.isInteger(index) || index < 0 || disposed) return;
    if (index === selected && pendingSelection === null) return;
    if (action || seated) {
      pendingSelection = index;
      pendingInsert = false;
      if (action?.kind !== "eject") eject();
      return;
    }
    selected = index;
    phase("idle");
    update();
    announce(`${HERO_GAMES[selected].title} selected.`);
    if (paused) placeCards(true);
    wake();
  }
  function navigate(delta) {
    select((pendingSelection ?? selected) + delta);
  }
  function insert() {
    if (disposed || action?.kind === "insert" || seated) return;
    if (action?.kind === "eject") {
      pendingInsert = true;
      return;
    }
    pendingInsert = false;
    if (!cards.length) {
      seated = true;
      phase("ready");
      update();
      announce(`${HERO_GAMES[selected].title} is seated. Open Plemu to play.`);
      return;
    }
    action = { kind: "insert", time: 0, start: poseOf(cards[selected].group) };
    phase("aligning");
    update();
    announce(`Inserting ${HERO_GAMES[selected].title}.`);
    if (paused) finishAction();
    wake();
  }
  function eject() {
    pendingInsert = false;
    if (disposed || action?.kind === "eject" || (!seated && !action)) return;
    if (!cards.length) {
      seated = false;
      if (pendingSelection !== null) {
        selected = pendingSelection;
        pendingSelection = null;
      }
      phase("idle");
      update();
      return;
    }
    action = { kind: "eject", time: 0, start: poseOf(cards[selected].group) };
    seated = false;
    phase("ejecting");
    update();
    announce("Releasing the cartridge.");
    if (paused) finishAction();
    wake();
  }
  function activate(point) {
    if (point) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerVector.set(
        ((point.x - rect.left) / rect.width) * 2 - 1,
        (-(point.y - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointerVector, camera);
      const hit = raycaster.intersectObjects(
        cards.map((card) => card.group),
        true,
      )[0];
      let object = hit?.object;
      while (object && object.userData.gameIndex === undefined)
        object = object.parent;
      if (object && object.userData.gameIndex !== selected) {
        select(object.userData.gameIndex);
        return;
      }
    }
    if (seated || action?.kind === "insert") eject();
    else insert();
  }
  function finishAction() {
    if (!action) return;
    const inserted = action.kind === "insert";
    action = null;
    seated = inserted;
    if (inserted) {
      phase("ready");
      consoleModel?.display(HERO_GAMES[selected].short, "ready");
      pendingSelection = null;
      announce(`${HERO_GAMES[selected].title} is seated. Open Plemu to play.`);
    } else {
      if (pendingSelection !== null) {
        selected = pendingSelection;
        pendingSelection = null;
      }
      phase("idle");
      consoleModel?.display("", "idle");
      announce(`${HERO_GAMES[selected].title} selected.`);
    }
    placeCards(paused);
    update();
    if (!inserted && pendingInsert) insert();
    wake();
  }
  function pause(value = !paused) {
    if (disposed) return;
    manualMotion = true;
    root.dataset.manualMotion = "true";
    paused = Boolean(value);
    if (paused && action) finishAction();
    if (paused) placeCards(true);
    update();
    wake();
  }
  function placeCards(instant = false, delta = 0) {
    const blend = instant || paused ? 1 : 1 - Math.exp(-delta * 19);
    cards.forEach((card, index) => {
      if (action && index === selected) return;
      const pose =
        index === selected && seated
          ? { x: SLOT.x, y: SLOT.y, z: SLOT.z, scale: 1 }
          : carouselPose(index, selected, paused ? 0 : elapsed);
      applyPose(card.group, pose, blend);
      card.group.visible = !(
        seated &&
        index !== selected &&
        Math.abs(card.group.position.x) < 0.7
      );
    });
  }
  function advance(delta) {
    if (!action) return;
    action.time += delta;
    if (action.kind === "insert") {
      const progress = clamp(action.time / INSERT_SECONDS);
      phase(
        progress < 0.36
          ? "aligning"
          : progress < 0.78
            ? "inserting"
            : progress < 0.89
              ? "seating"
              : "booting",
      );
      applyPose(cards[selected].group, insertionPose(action.start, progress));
      if (progress >= 0.89)
        consoleModel.display(
          HERO_GAMES[selected].short,
          "booting",
          (progress - 0.89) / 0.11,
        );
      if (progress >= 1) finishAction();
    } else {
      const progress = clamp(action.time / EJECT_SECONDS);
      const end = carouselPose(selected, selected, paused ? 0 : elapsed);
      let pose;
      if (progress < 0.62) {
        const t = smooth(progress / 0.62);
        const start = action.start;
        pose = {
          x: MathUtils.lerp(start.x, 0, t),
          y: MathUtils.lerp(start.y, Math.max(ALIGN.y, start.y), t),
          z: MathUtils.lerp(start.z, SLOT.z, t),
          rx: start.rx * (1 - t),
          ry: start.ry * (1 - t),
          rz: start.rz * (1 - t),
          scale: MathUtils.lerp(start.scale, 1, t),
        };
      } else {
        const t = smooth((progress - 0.62) / 0.38);
        pose = {
          x: MathUtils.lerp(0, end.x, t),
          y: MathUtils.lerp(Math.max(ALIGN.y, action.start.y), end.y, t),
          z: MathUtils.lerp(SLOT.z, end.z, t),
          rx: end.rx * t,
          ry: end.ry * t,
          rz: end.rz * t,
          scale: 1,
        };
      }
      applyPose(cards[selected].group, pose);
      if (progress >= 1) finishAction();
    }
  }
  function draw(time) {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0.016;
    lastTime = time;
    if (!paused) elapsed += delta;
    if (action && !paused) advance(delta);
    placeCards(false, delta);
    const glow =
      seated || root.dataset.phase === "booting" ? 1 : action ? 0.35 : 0.08;
    consoleModel.lightMaterial.emissiveIntensity = glow;
    consoleModel.latchMaterial.emissiveIntensity = glow * 0.6;
    consoleModel.latch.position.y = 0.272 - (seated ? 0.04 : 0);
    energy?.update(elapsed, delta, seated, paused);
    renderer.render(scene, camera);
    renderCount++;
    if (!paused || action) wake();
  }
  function setSize() {
    if (!renderer || disposed) return;
    const width = stage.clientWidth,
      height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, width < 500 ? 1.35 : 1.65),
    );
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const distance =
      Math.max(10.4 / camera.aspect, 7.5) /
      (2 * Math.tan(MathUtils.degToRad(camera.fov / 2)));
    camera.position.copy(target).addScaledVector(viewDirection, distance);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    wake();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    events.abort();
    stop();
    observer?.disconnect();
    resizeObserver?.disconnect();
    const geometries = new Set(),
      materials = new Set();
    scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      const list = Array.isArray(object.material)
        ? object.material
        : [object.material];
      list.filter(Boolean).forEach((material) => {
        materials.add(material);
        if (material.map) textures.add(material.map);
      });
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    environment?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer?.domElement.remove();
    root.dataset.heroState = "fallback";
    root.dataset.controlsOwner = "light";
    if (action) seated = false;
    action = null;
    if (pendingSelection !== null) {
      selected = pendingSelection;
      pendingSelection = null;
      seated = false;
    }
    phase(seated ? "ready" : "idle");
    update();
  }
  phase(seated ? "ready" : "idle");
  update();
  if (navigator.connection?.saveData) {
    root.dataset.heroState = "fallback";
    return api;
  }
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    if (!gl) {
      root.dataset.heroState = "fallback";
      return api;
    }
    renderer = new WebGLRenderer({
      canvas,
      context: gl,
      alpha: true,
      antialias: true,
    });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    const room = new RoomEnvironment();
    const generator = new PMREMGenerator(renderer);
    environment = generator.fromScene(room, 0.035);
    scene.environment = environment.texture;
    room.dispose();
    generator.dispose();
    const key = new DirectionalLight(0xfff4de, 3.1);
    key.position.set(-4, 8, 6);
    scene.add(key);
    const fill = new DirectionalLight(0xd4cafa, 1.5);
    fill.position.set(5, 3, -3);
    scene.add(fill);
    const rim = new DirectionalLight(0xe6f0d5, 1.8);
    rim.position.set(-5, 1, -5);
    scene.add(rim);
    scene.add(new AmbientLight(0xffffff, 0.5));
    consoleModel = createConsole();
    scene.add(consoleModel.group);
    energy = createConsoleEnergy(scene);
    cards = HERO_GAMES.map((game, index) => createCartridge(game, index));
    cards.forEach((card) => scene.add(card.group));
    placeCards(true);
    if (seated) consoleModel.display(HERO_GAMES[selected].short, "ready");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "ph-canvas";
    setSize();
    await renderer.compileAsync(scene, camera);
    if (disposed || !root.isConnected) {
      dispose();
      return api;
    }
    const handoffIndex = HERO_GAMES.findIndex(
      (game) => game.slug === root.dataset.selected,
    );
    if (handoffIndex >= 0) selected = handoffIndex;
    seated = root.dataset.phase === "ready";
    paused = readMotionChoice();
    manualMotion = root.dataset.manualMotion === "true";
    phase(seated ? "ready" : "idle");
    placeCards(true);
    consoleModel.display(
      seated ? HERO_GAMES[selected].short : "",
      seated ? "ready" : "idle",
    );
    update();
    renderer.render(scene, camera);
    renderCount++;
    stage.append(canvas);
    root.dataset.heroState = "ready";
    root.dataset.controlsOwner = "hero";
    announce(
      seated
        ? `${HERO_GAMES[selected].title} is seated. Open Plemu to play.`
        : "Choose a cartridge. Make a little room for play.",
    );

    const loader = new TextureLoader();
    loader
      .loadAsync("/brand/plemu-pixel-face.png")
      .then((texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = SRGBColorSpace;
        texture.repeat.set(0.65, 0.65);
        texture.offset.set(0.18, 0.18);
        textures.add(texture);
        textures.add(consoleModel.logoMaterial.map);
        consoleModel.logoMaterial.map = texture;
        consoleModel.logoMaterial.needsUpdate = true;
        wake();
      })
      .catch(() => {});
    HERO_GAMES.forEach((game, index) => {
      loader
        .loadAsync(game.cover)
        .then((texture) => {
          if (disposed) {
            texture.dispose();
            return;
          }
          texture.colorSpace = SRGBColorSpace;
          texture.anisotropy = Math.min(
            4,
            renderer.capabilities.getMaxAnisotropy(),
          );
          textures.add(texture);
          const card = cards[index];
          const previous = card.artMaterial.map;
          card.artMaterial.map = texture;
          textures.add(previous);
          const ratio = texture.image.width / texture.image.height;
          card.art.scale.x = Math.min(1, ratio / (1.74 / 1.872));
          card.art.scale.y = Math.min(1, 1.74 / 1.872 / ratio);
          wake();
        })
        .catch(() => {
          if (!disposed) wake();
        });
    });
    pauseButton.addEventListener("click", () => pause(), { signal });
    bindCartridgeInput(stage, { navigate, insert, eject, activate, signal });
    canvas.addEventListener(
      "webglcontextlost",
      (event) => {
        event.preventDefault();
        dispose();
      },
      { signal },
    );
    media.addEventListener(
      "change",
      () => {
        if (media.matches || !manualMotion) {
          paused = media.matches;
          if (paused && action) finishAction();
          update();
          placeCards(true);
          wake();
        }
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
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(setSize);
      resizeObserver.observe(stage);
    } else window.addEventListener("resize", setSize, { signal });
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          if (visible) wake();
          else stop();
        },
        { threshold: 0.025 },
      );
      observer.observe(stage);
    }
    wake();
    return api;
  } catch (error) {
    dispose();
    if (fallback) fallback.hidden = false;
    throw error;
  }
}
