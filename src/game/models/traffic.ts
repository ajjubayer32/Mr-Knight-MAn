import * as THREE from 'three';
import type { ProceduralTexturePack } from '../textures';
import type { TrafficKind } from '../types';
import { createRealisticHuman, type RealisticHumanRig } from './human';
import { createBangladeshiRickshaw, updateRickshawAnimation, type RickshawRig } from './rickshaw';

export interface TrafficActor {
  kind: TrafficKind;
  group: THREE.Group;
  wheels: THREE.Object3D[];
  bicycleCrank?: THREE.Group;
  rickshawRig?: RickshawRig;
  cyclistRig?: RealisticHumanRig;
  halfWidth: number;
  halfLength: number;
  baseSpeedMs: number;
  currentSpeedMs: number;
  laneX: number;
  targetLaneX: number;
  direction: 1 | -1; // -1 = forward (-Z), 1 = oncoming (+Z)
  // Open connected city graph navigation state
  segmentId: string;
  segProgress: number; // 0..1 along current segment
  segDir: 1 | -1; // +1 = start->end, -1 = end->start
  laneOffset: number;
  targetLaneOffset: number;
  currentYaw: number;
  targetYaw: number;
  pedalPhase: number;
  passed: boolean;
  nearMissed: boolean;
  honked: boolean;
  active: boolean;
}

function makeCarWheel(radius: number, width: number, tireMat: THREE.Material, rimMat: THREE.Material): THREE.Group {
  const w = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 16), tireMat);
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  w.add(tire);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.56, radius * 0.56, width + 0.012, 12), rimMat);
  hub.rotation.z = Math.PI / 2;
  w.add(hub);
  return w;
}

function addContactShadow(
  parent: THREE.Group,
  textures: ProceduralTexturePack,
  width: number,
  length: number
): void {
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  parent.add(shadow);
}

export function createCngAuto(textures: ProceduralTexturePack): {
  group: THREE.Group;
  wheels: THREE.Object3D[];
} {
  const group = new THREE.Group();
  const wheels: THREE.Object3D[] = [];

  const greenBodyMat = new THREE.MeshStandardMaterial({ color: 0x0c6b3d, roughness: 0.36, metalness: 0.38 });
  const yellowCageMat = new THREE.MeshStandardMaterial({ color: 0xf4b400, roughness: 0.35, metalness: 0.55 });
  const blackHoodMat = new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.85, metalness: 0.04 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x90caf9,
    roughness: 0.12,
    metalness: 0.35,
    transparent: true,
    opacity: 0.65,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x191a1c, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.25, metalness: 0.85 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2b2b, emissive: 0xaa1111, emissiveIntensity: 0.8 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfff8dc, emissive: 0xffd54f, emissiveIntensity: 0.8 });

  addContactShadow(group, textures, 1.55, 2.55);

  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.52, 2.05), greenBodyMat);
  lowerBody.position.set(0, 0.44, 0.05);
  lowerBody.castShadow = true;
  group.add(lowerBody);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.62, 0.55), greenBodyMat);
  nose.position.set(0, 0.52, -0.96);
  nose.rotation.x = 0.14;
  nose.castShadow = true;
  group.add(nose);

  const frontFender = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.45), greenBodyMat);
  frontFender.position.set(0, 0.39, -1.04);
  group.add(frontFender);

  const fw = makeCarWheel(0.22, 0.14, tireMat, rimMat);
  fw.position.set(0, 0.22, -1.02);
  group.add(fw);
  wheels.push(fw);

  for (const side of [-1, 1]) {
    const rw = makeCarWheel(0.23, 0.16, tireMat, rimMat);
    rw.position.set(side * 0.56, 0.23, 0.72);
    group.add(rw);
    wheels.push(rw);
  }

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.54, 0.05), glassMat);
  windshield.position.set(0, 1.04, -0.76);
  windshield.rotation.x = -0.22;
  group.add(windshield);

  for (const side of [-1, 1]) {
    const cageFrame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.58, 0.88), yellowCageMat);
    cageFrame.position.set(side * 0.59, 0.96, 0.16);
    group.add(cageFrame);

    const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.48, 6), yellowCageMat);
    topRail.rotation.x = Math.PI / 2;
    topRail.position.set(side * 0.57, 1.32, 0.1);
    group.add(topRail);
  }

  const roof = new THREE.Mesh(
    new THREE.CylinderGeometry(0.61, 0.61, 1.72, 14, 1, false, -Math.PI * 0.5, Math.PI),
    blackHoodMat
  );
  roof.rotation.z = Math.PI / 2;
  roof.rotation.y = Math.PI / 2;
  roof.scale.set(1, 0.52, 1);
  roof.position.set(0, 1.36, 0.06);
  roof.castShadow = true;
  group.add(roof);

  const backFlap = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.68, 0.08), blackHoodMat);
  backFlap.position.set(0, 1.02, 0.98);
  backFlap.castShadow = true;
  group.add(backFlap);

  const rearWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.22), glassMat);
  rearWindow.position.set(0, 1.08, 1.025);
  group.add(rearWindow);

  const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.1, 0.08), yellowCageMat);
  bumper.position.set(0, 0.28, 1.07);
  group.add(bumper);

  for (const side of [-1, 1]) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.04), tailMat);
    tail.position.set(side * 0.44, 0.56, 1.08);
    group.add(tail);
  }

  const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 10), headMat);
  headlight.rotation.x = Math.PI / 2;
  headlight.position.set(0, 0.68, -1.24);
  group.add(headlight);

  return { group, wheels };
}

export function createBangladeshiBus(
  textures: ProceduralTexturePack,
  variant: number
): { group: THREE.Group; wheels: THREE.Object3D[] } {
  const group = new THREE.Group();
  const wheels: THREE.Object3D[] = [];

  const sideTex = textures.busSide[variant % textures.busSide.length];
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.44, metalness: 0.2 });
  const frontMat = new THREE.MeshStandardMaterial({ map: textures.busFront, roughness: 0.35, metalness: 0.25 });
  const bodyColors = [0x1b6e3c, 0xb82925, 0x15549a];
  const paintMat = new THREE.MeshStandardMaterial({
    color: bodyColors[variant % bodyColors.length],
    roughness: 0.45,
    metalness: 0.22,
  });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xd6d3cd, roughness: 0.72, metalness: 0.1 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.28, metalness: 0.8 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.9 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0x991111, emissiveIntensity: 0.9 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfff8dc, emissive: 0xffd54f, emissiveIntensity: 0.9 });

  addContactShadow(group, textures, 2.75, 7.9);

  const hullGeo = new THREE.BoxGeometry(2.38, 2.55, 7.2);
  const hullMats = [sideMat, sideMat, roofMat, paintMat, paintMat, frontMat];
  const hull = new THREE.Mesh(hullGeo, hullMats);
  hull.position.set(0, 1.72, 0);
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  const rearGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 0.78),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.18, metalness: 0.4 })
  );
  rearGlass.position.set(0, 2.25, 3.61);
  group.add(rearGlass);

  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.22, 0.14), chromeMat);
  rearBumper.position.set(0, 0.52, 3.63);
  group.add(rearBumper);

  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.24, 0.14), chromeMat);
  frontBumper.position.set(0, 0.52, -3.63);
  group.add(frontBumper);

  for (const side of [-1, 1]) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.06), tailMat);
    tail.position.set(side * 0.9, 0.84, 3.62);
    group.add(tail);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.06), headMat);
    head.position.set(side * 0.85, 0.84, -3.62);
    group.add(head);
  }

  const rack = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.16, 5.2), chromeMat);
  rack.position.set(0, 3.08, 0.2);
  group.add(rack);

  for (const zPos of [-2.15, 2.15]) {
    for (const side of [-1, 1]) {
      const bw = makeCarWheel(0.46, 0.28, tireMat, chromeMat);
      bw.position.set(side * 1.12, 0.46, zPos);
      group.add(bw);
      wheels.push(bw);
    }
  }

  return { group, wheels };
}

export function createMotorcycle(
  textures: ProceduralTexturePack,
  variant: number
): { group: THREE.Group; wheels: THREE.Object3D[] } {
  const group = new THREE.Group();
  const wheels: THREE.Object3D[] = [];

  const tankColors = [0xdc2626, 0x1d4ed8, 0x111827, 0x047857];
  const tankMat = new THREE.MeshStandardMaterial({
    color: tankColors[variant % tankColors.length],
    roughness: 0.25,
    metalness: 0.65,
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.35, metalness: 0.8 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x161718, roughness: 0.9 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.9 });
  const jacketMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.75 });
  const helmetMat = new THREE.MeshStandardMaterial({
    color: variant % 2 === 0 ? 0xf8fafc : 0xb91c1c,
    roughness: 0.25,
    metalness: 0.4,
  });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xaa1111, emissiveIntensity: 0.9 });

  addContactShadow(group, textures, 0.9, 2.0);

  for (const zPos of [-0.66, 0.66]) {
    const w = makeCarWheel(0.28, 0.11, tireMat, chromeMat);
    w.position.set(0, 0.28, zPos);
    group.add(w);
    wheels.push(w);
  }

  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.56), metalMat);
  engine.position.set(0, 0.42, 0.02);
  engine.castShadow = true;
  group.add(engine);

  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.54), tankMat);
  tank.position.set(0, 0.74, -0.22);
  tank.castShadow = true;
  group.add(tank);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.66), tireMat);
  seat.position.set(0, 0.72, 0.28);
  group.add(seat);

  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.85, 8), chromeMat);
  exhaust.rotation.x = Math.PI / 2;
  exhaust.position.set(0.18, 0.34, 0.34);
  group.add(exhaust);

  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 6), chromeMat);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 0.96, -0.46);
  group.add(handlebar);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.06), tailMat);
  tail.position.set(0, 0.76, 0.72);
  group.add(tail);

  // Proportional motorcycle rider
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.46, 10), jacketMat);
  torso.scale.set(1.05, 1, 0.72);
  torso.position.set(0, 1.04, 0.14);
  torso.rotation.x = 0.28;
  torso.castShadow = true;
  group.add(torso);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), helmetMat);
  helmet.position.set(0, 1.38, 0.03);
  helmet.castShadow = true;
  group.add(helmet);

  return { group, wheels };
}

export function createBicycle(
  textures: ProceduralTexturePack,
  variant: number
): {
  group: THREE.Group;
  wheels: THREE.Object3D[];
  bicycleCrank: THREE.Group;
  cyclistRig: RealisticHumanRig;
} {
  const group = new THREE.Group();
  const wheels: THREE.Object3D[] = [];

  const frameMat = new THREE.MeshStandardMaterial({
    color: variant % 2 === 0 ? 0x1e293b : 0x7f1d1d,
    roughness: 0.35,
    metalness: 0.65,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.88 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 });
  const saddleMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.78 });

  addContactShadow(group, textures, 0.75, 1.8);

  for (const zPos of [-0.56, 0.56]) {
    const bw = makeCarWheel(0.32, 0.05, tireMat, chromeMat);
    bw.position.set(0, 0.32, zPos);
    group.add(bw);
    wheels.push(bw);
  }

  const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 6), frameMat);
  topTube.rotation.x = Math.PI / 2;
  topTube.position.set(0, 0.76, -0.05);
  group.add(topTube);

  const downTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 6), frameMat);
  downTube.position.set(0, 0.55, -0.22);
  downTube.rotation.x = 0.82;
  group.add(downTube);

  const seatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.54, 6), frameMat);
  seatTube.position.set(0, 0.61, 0.14);
  seatTube.rotation.x = 0.25;
  group.add(seatTube);

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.22), saddleMat);
  saddle.position.set(0, 0.88, 0.21);
  group.add(saddle);

  const forkTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.58, 6), frameMat);
  forkTube.position.set(0, 0.65, -0.44);
  forkTube.rotation.x = -0.25;
  group.add(forkTube);

  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.52, 6), chromeMat);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 0.96, -0.36);
  group.add(handlebar);

  // Rotating Crankset + Left/Right Pedals at bottom bracket (0, 0.36, 0.02)
  const bicycleCrank = new THREE.Group();
  bicycleCrank.position.set(0, 0.36, 0.02);
  group.add(bicycleCrank);

  const chainring = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.014, 14), chromeMat);
  chainring.rotation.z = Math.PI / 2;
  chainring.position.set(0.045, 0, 0);
  bicycleCrank.add(chainring);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.14, 0.022), chromeMat);
    arm.position.set(side * 0.075, side * 0.07, 0);
    bicycleCrank.add(arm);

    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.022, 0.05), tireMat);
    pedal.position.set(side * 0.11, side * 0.14, 0);
    bicycleCrank.add(pedal);
  }

  // Cyclist seated firmly on saddle, leaning forward gripping handlebars
  const cyclistRig = createRealisticHuman(variant + 11, { archetype: 'man' });
  cyclistRig.hips.position.set(0, 0.94, 0.21);
  cyclistRig.torso.rotation.x = 0.48;
  cyclistRig.leftShoulder.rotation.x = 1.05;
  cyclistRig.rightShoulder.rotation.x = 1.05;
  cyclistRig.leftElbow.rotation.x = 0.28;
  cyclistRig.rightElbow.rotation.x = 0.28;
  group.add(cyclistRig.group);

  return { group, wheels, bicycleCrank, cyclistRig };
}

export function createSedanCar(
  textures: ProceduralTexturePack,
  variant: number
): { group: THREE.Group; wheels: THREE.Object3D[] } {
  const group = new THREE.Group();
  const wheels: THREE.Object3D[] = [];

  const paintPalette = [0xe5e7eb, 0x94a3b8, 0x1e293b, 0x7f1d1d, 0x1e3a8a];
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: paintPalette[variant % paintPalette.length],
    roughness: 0.24,
    metalness: 0.7,
    clearcoat: 0.8,
  });
  const cabinGlassMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.12,
    metalness: 0.55,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.2, metalness: 0.9 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2626, emissive: 0xaa1111, emissiveIntensity: 0.85 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfff8dc, emissive: 0xffe082, emissiveIntensity: 0.8 });

  addContactShadow(group, textures, 2.05, 4.4);

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.62, 4.05), paintMat);
  chassis.position.set(0, 0.56, 0);
  chassis.castShadow = true;
  group.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.54, 2.05), cabinGlassMat);
  cabin.position.set(0, 1.12, 0.14);
  cabin.castShadow = true;
  group.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.07, 1.85), paintMat);
  roof.position.set(0, 1.4, 0.15);
  group.add(roof);

  for (const side of [-1, 1]) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.13, 0.05), tailMat);
    tail.position.set(side * 0.62, 0.68, 2.03);
    group.add(tail);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.13, 0.05), headMat);
    head.position.set(side * 0.62, 0.62, -2.03);
    group.add(head);

    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.12), paintMat);
    mirror.position.set(side * 0.94, 0.96, -0.55);
    group.add(mirror);
  }

  for (const zPos of [-1.25, 1.25]) {
    for (const side of [-1, 1]) {
      const cw = makeCarWheel(0.31, 0.2, tireMat, rimMat);
      cw.position.set(side * 0.86, 0.31, zPos);
      group.add(cw);
      wheels.push(cw);
    }
  }

  return { group, wheels };
}

export function spawnTrafficActor(
  kind: TrafficKind,
  textures: ProceduralTexturePack,
  variant: number
): TrafficActor {
  let group: THREE.Group;
  let wheels: THREE.Object3D[] = [];
  let bicycleCrank: THREE.Group | undefined;
  let rickshawRig: RickshawRig | undefined;
  let cyclistRig: RealisticHumanRig | undefined;
  let halfWidth = 0.7;
  let halfLength = 1.2;
  let baseSpeedMs = 6;

  if (kind === 'rickshaw') {
    rickshawRig = createBangladeshiRickshaw(textures, { isPlayer: false, variantIndex: variant });
    group = rickshawRig.group;
    halfWidth = 0.62;
    halfLength = 1.18;
    baseSpeedMs = 4.6 + (variant % 3) * 0.5;
  } else if (kind === 'bicycle') {
    const bike = createBicycle(textures, variant);
    group = bike.group;
    wheels = bike.wheels;
    bicycleCrank = bike.bicycleCrank;
    cyclistRig = bike.cyclistRig;
    halfWidth = 0.36;
    halfLength = 0.92;
    baseSpeedMs = 5.4 + (variant % 3) * 0.6;
  } else if (kind === 'cng') {
    const cng = createCngAuto(textures);
    group = cng.group;
    wheels = cng.wheels;
    halfWidth = 0.66;
    halfLength = 1.22;
    baseSpeedMs = 8.6 + (variant % 3) * 1.0;
  } else if (kind === 'bus') {
    const bus = createBangladeshiBus(textures, variant);
    group = bus.group;
    wheels = bus.wheels;
    halfWidth = 1.24;
    halfLength = 3.65;
    baseSpeedMs = 7.8 + (variant % 2) * 1.0;
  } else if (kind === 'moto') {
    const moto = createMotorcycle(textures, variant);
    group = moto.group;
    wheels = moto.wheels;
    halfWidth = 0.38;
    halfLength = 0.95;
    baseSpeedMs = 10.6 + (variant % 3) * 1.1;
  } else {
    const car = createSedanCar(textures, variant);
    group = car.group;
    wheels = car.wheels;
    halfWidth = 0.95;
    halfLength = 2.08;
    baseSpeedMs = 9.8 + (variant % 3) * 1.0;
  }

  return {
    kind,
    group,
    wheels,
    bicycleCrank,
    rickshawRig,
    cyclistRig,
    halfWidth,
    halfLength,
    baseSpeedMs,
    currentSpeedMs: baseSpeedMs,
    laneX: 0,
    targetLaneX: 0,
    direction: -1,
    segmentId: '',
    segProgress: 0,
    segDir: 1,
    laneOffset: 2.2,
    targetLaneOffset: 2.2,
    currentYaw: 0,
    targetYaw: 0,
    pedalPhase: variant * 0.9,
    passed: false,
    nearMissed: false,
    honked: false,
    active: false,
  };
}

function solveCyclistPedalIK(
  hip: THREE.Group,
  knee: THREE.Group,
  pedalAngle: number
): void {
  const hipY = 0.89;
  const hipZ = 0.21;
  const crankY = 0.36;
  const crankZ = 0.02;
  const crankR = 0.14;
  const L1 = 0.42;
  const L2 = 0.41;

  const py = crankY + Math.sin(pedalAngle) * crankR;
  const pz = crankZ - Math.cos(pedalAngle) * crankR;
  const dy = py - hipY;
  const dz = pz - hipZ;
  const dist = THREE.MathUtils.clamp(Math.hypot(dy, dz), 0.18, L1 + L2 - 0.02);

  const cosKnee = THREE.MathUtils.clamp(
    (L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2),
    -0.98,
    0.98
  );
  const alphaKnee = Math.acos(cosKnee);
  const kneeRot = -(Math.PI - alphaKnee);

  const targetAngle = Math.atan2(-dz, -dy);
  const cosHipOff = THREE.MathUtils.clamp(
    (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist),
    -0.98,
    0.98
  );
  const hipRot = targetAngle + Math.acos(cosHipOff);

  hip.rotation.x = hipRot;
  knee.rotation.x = kneeRot;
}

export function updateTrafficActorAnimation(
  actor: TrafficActor,
  elapsed: number,
  dt: number
): void {
  actor.pedalPhase += actor.currentSpeedMs * 1.65 * dt;

  if (actor.rickshawRig) {
    const steerDelta = THREE.MathUtils.clamp(actor.targetYaw - actor.currentYaw, -0.5, 0.5);
    updateRickshawAnimation(
      actor.rickshawRig,
      actor.currentSpeedMs,
      steerDelta,
      actor.pedalPhase,
      elapsed,
      dt
    );
    return;
  }

  if (actor.cyclistRig && actor.bicycleCrank) {
    actor.bicycleCrank.rotation.x = -actor.pedalPhase;
    // Left and right pedals are 180 degrees (Math.PI) apart
    solveCyclistPedalIK(actor.cyclistRig.leftHip, actor.cyclistRig.leftKnee, actor.pedalPhase + Math.PI);
    solveCyclistPedalIK(actor.cyclistRig.rightHip, actor.cyclistRig.rightKnee, actor.pedalPhase);

    // Subtle natural upper-body pedaling cadence & balance lean
    actor.cyclistRig.torso.rotation.x = 0.48 + Math.sin(actor.pedalPhase * 2) * 0.025;
    actor.cyclistRig.torso.rotation.z = Math.sin(actor.pedalPhase) * 0.05;
    actor.cyclistRig.head.rotation.x = -0.28;
    actor.cyclistRig.head.rotation.y = Math.sin(elapsed * 0.9) * 0.08;
    actor.group.rotation.z = THREE.MathUtils.damp(
      actor.group.rotation.z,
      Math.sin(actor.pedalPhase) * 0.032,
      8,
      dt
    );
  }

  const wheelRadius =
    actor.kind === 'bus'
      ? 0.46
      : actor.kind === 'car'
        ? 0.31
        : actor.kind === 'bicycle'
          ? 0.32
          : actor.kind === 'moto'
            ? 0.28
            : 0.22;
  const dAngle = -(actor.currentSpeedMs * dt) / wheelRadius;
  for (const w of actor.wheels) {
    w.rotation.x += dAngle;
  }
}
