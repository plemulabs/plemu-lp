import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Quaternion,
  Vector3,
} from "three";

function glowTexture(star = false) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const glow = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
  glow.addColorStop(0, "rgba(220,255,155,.85)");
  glow.addColorStop(0.25, "rgba(180,235,95,.22)");
  glow.addColorStop(1, "rgba(180,235,95,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);
  if (star) {
    ctx.fillStyle = "#f4ffda";
    ctx.beginPath();
    ctx.moveTo(32, 4);
    ctx.lineTo(36, 27);
    ctx.lineTo(58, 32);
    ctx.lineTo(36, 36);
    ctx.lineTo(32, 60);
    ctx.lineTo(28, 36);
    ctx.lineTo(6, 32);
    ctx.lineTo(28, 27);
    ctx.closePath();
    ctx.fill();
  }
  return new CanvasTexture(canvas);
}

export function createConsoleEnergy(scene) {
  const group = new Group();
  group.visible = false;
  scene.add(group);
  const light = new PointLight(0xd2f57c, 0, 5.4, 2);
  light.position.set(0, 0.8, 0.2);
  // Keep the light registered at zero intensity so insertion reuses warmed shaders.
  scene.add(light);
  const halo = new Mesh(
    new PlaneGeometry(5.3, 3.1),
    new MeshBasicMaterial({
      map: glowTexture(),
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(0, 0.34, -0.35);
  group.add(halo);
  const coins = new InstancedMesh(
    new CylinderGeometry(0.068, 0.068, 0.018, 12),
    new MeshBasicMaterial({
      color: 0xcfe3a6,
      transparent: true,
      opacity: 0.19,
      depthWrite: false,
      toneMapped: false,
    }),
    18,
  );
  coins.frustumCulled = false;
  group.add(coins);
  const colors = [
    new Color("#c6e760"),
    new Color("#afa0e8"),
    new Color("#99d8d0"),
  ];
  for (let i = 0; i < 18; i++) coins.setColorAt(i, colors[i % 3]);
  const positions = new Float32Array(32 * 3);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  const sparkles = new Points(
    geometry,
    new PointsMaterial({
      map: glowTexture(true),
      color: 0xe2f9b6,
      size: 0.31,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: AdditiveBlending,
      toneMapped: false,
    }),
  );
  sparkles.frustumCulled = false;
  group.add(sparkles);
  const matrix = new Matrix4(),
    position = new Vector3(),
    scale = new Vector3(),
    rotation = new Quaternion(),
    axis = new Vector3(1, 0, 0);
  let strength = 0;
  let wasSeated = false;
  let poweredAt = -10;
  return {
    update(time, delta, seated, paused) {
      if (seated && !wasSeated) poweredAt = time;
      wasSeated = seated;
      const burst = paused ? 0 : Math.max(0, 1 - (time - poweredAt) / 0.9);
      strength = paused
        ? Number(seated)
        : strength + (Number(seated) - strength) * (1 - Math.exp(-delta * 9));
      group.visible = strength > 0.01;
      if (!group.visible) {
        light.intensity = 0;
        return;
      }
      light.intensity = strength * (2.05 + Math.sin(time * 2.2) * 0.28);
      halo.material.opacity = strength * (0.3 + Math.sin(time * 1.6) * 0.04);
      coins.material.opacity = 0.19 * strength;
      for (let i = 0; i < 18; i++) {
        const lane = i % 3,
          up = lane !== 1;
        const progress = (time * 0.31 + Math.floor(i / 3) / 6) % 1;
        const travel = up ? progress : 1 - progress;
        position.set(
          (lane - 1) * 0.44 + Math.sin(travel * 5 + i) * 0.1,
          2.04 + travel * 1.55,
          -0.35 + Math.cos(i * 1.8) * 0.18,
        );
        rotation.setFromAxisAngle(
          axis,
          Math.PI / 2 + Math.sin(time * 0.8 + i) * 0.32,
        );
        const size = Math.sin(progress * Math.PI) * (0.8 + (i % 2) * 0.2);
        scale.setScalar(size);
        matrix.compose(position, rotation, scale);
        coins.setMatrixAt(i, matrix);
      }
      coins.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 32; i++) {
        const angle = i * 2.399,
          pulse = Math.sin(time * 1.4 + i * 2.1);
        positions[i * 3] = Math.cos(angle) * (1.4 + (i % 4) * 0.45);
        positions[i * 3 + 1] = 0.42 + Math.max(0, pulse) * 0.6;
        positions[i * 3 + 2] = Math.sin(angle) * (1 + (i % 3) * 0.2);
      }
      geometry.attributes.position.array.set(positions);
      geometry.attributes.position.needsUpdate = true;
      sparkles.material.opacity =
        strength * (0.44 + burst * 0.24 + Math.sin(time * 2.4) * 0.14);
    },
  };
}
