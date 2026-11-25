import * as THREE from 'three';
import { CHARACTER_ROSTER } from '../profile';
import type { DriverCharacterId } from '../types';

export type HumanArchetype = 'man' | 'woman' | 'elder' | 'youth';

export type HumanActivity =
  | 'walking'
  | 'crossing'
  | 'standing'
  | 'talking'
  | 'usingPhone'
  | 'waving'
  | 'sitting'
  | 'showcase';

export interface RealisticHumanRig {
  group: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftShoulder: THREE.Group;
  rightShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  rightHip: THREE.Group;
  leftKnee: THREE.Group;
  rightKnee: THREE.Group;
  phoneMesh?: THREE.Mesh;
  archetype: HumanArchetype;
  heightMeters: number;
}

const SKIN_TONES = [0x9e6c4b, 0x8b593c, 0xa97855, 0x7c4f35, 0xb58564, 0x956343];
const SHIRT_COLORS = [
  0xf1f5f9, 0x1d4ed8, 0x0f766e, 0xb45309, 0x475569, 0x1e3a8a,
  0x3f6212, 0x9f1239, 0x0369a1, 0x7c2d12, 0x4338ca, 0x065f46,
];
const PANT_COLORS = [0x1e293b, 0x334155, 0x292524, 0x172554, 0x3f3f46, 0x365314];
const SAREE_COLORS = [
  0xb91c1c, 0x047857, 0x6d28d9, 0xc2410c, 0x0369a1, 0xbe185d,
  0x0f766e, 0x9a3412, 0x4338ca, 0x86198f,
];
const HAIR_COLORS = [0x18181b, 0x27272a, 0x1c1917, 0x2e231c];

interface BuildHumanParams {
  seed: number;
  archetype: HumanArchetype;
  skinHex: number;
  hairHex: number;
  topHex: number;
  bottomHex: number;
  accentHex: number;
  hairStyle: 'wavy' | 'spiky' | 'curly' | 'crop_cap' | 'parted' | 'bun' | 'hijab' | 'tupi';
  facialHair?: 'stubble' | 'none' | 'goatee' | 'clean' | 'mustache';
  hasGlasses?: boolean;
  hasCap?: boolean;
  capHex?: number;
  hasPhone?: boolean;
  hasBag?: boolean;
  hasStripes?: boolean;
  hasCollar?: boolean;
  isDressOrSaree?: boolean;
  isSalwarKameez?: boolean;
}

function buildSculptedHuman(params: BuildHumanParams): RealisticHumanRig {
  const { archetype, seed } = params;
  const group = new THREE.Group();

  // Natural height variation so crowd never looks cloned
  const heightJitter = 0.96 + ((seed % 7) * 0.014);
  const scale =
    archetype === 'youth'
      ? 0.86
      : archetype === 'woman'
        ? 0.93 * heightJitter
        : archetype === 'elder'
          ? 0.96 * heightJitter
          : 1.0 * heightJitter;

  // Matte natural skin (zero plastic shine)
  const skinMat = new THREE.MeshStandardMaterial({
    color: params.skinHex,
    roughness: 0.78,
    metalness: 0.0,
  });
  const topMat = new THREE.MeshStandardMaterial({
    color: params.topHex,
    roughness: 0.86,
    metalness: 0.02,
  });
  const bottomMat = new THREE.MeshStandardMaterial({
    color: params.bottomHex,
    roughness: 0.88,
    metalness: 0.02,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: params.accentHex,
    roughness: 0.85,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: params.hairHex,
    roughness: 0.9,
    metalness: 0.02,
  });
  const shoeMat = new THREE.MeshStandardMaterial({
    color: seed % 3 === 0 ? 0x3f2e22 : 0x1c1917,
    roughness: 0.88,
  });

  // Pelvis / Hips root (~0.92m above ground at scale 1.0)
  const hips = new THREE.Group();
  hips.position.y = 0.92 * scale;
  hips.scale.setScalar(scale);
  group.add(hips);

  const pelvisMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.138, 0.148, 0.17, 10),
    bottomMat
  );
  pelvisMesh.scale.set(1.1, 1, 0.76);
  pelvisMesh.castShadow = true;
  hips.add(pelvisMesh);

  // Upper torso (realistic tapered athletic/natural proportions)
  const torso = new THREE.Group();
  torso.position.y = 0.085;
  hips.add(torso);

  const chestWTop = archetype === 'woman' ? 0.165 : 0.19;
  const chestWBot = archetype === 'woman' ? 0.145 : 0.142;
  const chestMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(chestWTop, chestWBot, 0.44, 10),
    topMat
  );
  chestMesh.scale.set(1.06, 1, 0.66);
  chestMesh.position.y = 0.22;
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Optional shirt collar / stripe / pocket details
  if (params.hasCollar) {
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.068, 0.015, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 })
    );
    collar.rotation.x = Math.PI / 2 + 0.15;
    collar.position.set(0, 0.435, -0.01);
    torso.add(collar);
  }
  if (params.hasStripes) {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(chestWTop * 0.92, chestWTop * 0.88, 0.09, 10),
      accentMat
    );
    band.scale.set(1.07, 1, 0.68);
    band.position.y = 0.25;
    torso.add(band);
  }

  // Cultural Bangladeshi clothing details
  if (archetype === 'woman') {
    if (params.isSalwarKameez) {
      // Long kameez tunic + draped orna scarf
      const kameezHem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.148, 0.178, 0.42, 10),
        topMat
      );
      kameezHem.position.y = -0.18;
      kameezHem.scale.set(1.06, 1, 0.82);
      kameezHem.castShadow = true;
      hips.add(kameezHem);

      const orna = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.46, 0.22), accentMat);
      orna.position.set(0.08, 0.22, 0.01);
      orna.rotation.z = 0.28;
      torso.add(orna);
    } else {
      // Draped saree anchol & pleated lower wrap
      const anchol = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.47, 0.22), accentMat);
      anchol.position.set(-0.08, 0.22, 0.015);
      anchol.rotation.z = -0.34;
      torso.add(anchol);

      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.175, 0.58, 10), topMat);
      skirt.position.y = -0.32;
      skirt.scale.set(1.06, 1, 0.82);
      skirt.castShadow = true;
      hips.add(skirt);
    }
  } else if (archetype === 'elder') {
    const panjabiHem = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.175, 0.34, 10), topMat);
    panjabiHem.position.y = -0.14;
    panjabiHem.scale.set(1.06, 1, 0.8);
    hips.add(panjabiHem);
  }

  // Optional backpack / shoulder bag
  if (params.hasBag) {
    const bagColor = seed % 2 === 0 ? 0x292524 : 0x475569;
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.28, 0.1),
      new THREE.MeshStandardMaterial({ color: bagColor, roughness: 0.78 })
    );
    bag.position.set(0, 0.23, 0.135);
    bag.castShadow = true;
    torso.add(bag);
  }

  // Realistic Neck & Sculpted Oval Head (~1:7.5 proportion, never oversized!)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.054, 0.095, 8), skinMat);
  neck.position.y = 0.465;
  torso.add(neck);

  const head = new THREE.Group();
  head.position.y = 0.58;
  torso.add(head);

  // Subtle oval face & jaw (not a giant round ball)
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.098, 14, 12), skinMat);
  cranium.scale.set(0.88, 1.09, 0.94);
  cranium.castShadow = true;
  head.add(cranium);

  // Facial features facing -Z (eyes, brows, nose bridge, subtle mouth)
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
  const browMat = new THREE.MeshStandardMaterial({ color: params.hairHex, roughness: 0.9 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 6), eyeMat);
    eye.position.set(side * 0.032, 0.012, -0.086);
    head.add(eye);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.006, 0.008), browMat);
    brow.position.set(side * 0.032, 0.028, -0.088);
    head.add(brow);
  }
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.028, 0.018), skinMat);
  nose.position.set(0, -0.004, -0.094);
  head.add(nose);

  if (params.hasGlasses) {
    const glassFrameMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.25,
      metalness: 0.6,
    });
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.02, 0.008), glassFrameMat);
      lens.position.set(side * 0.032, 0.012, -0.095);
      head.add(lens);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.005, 0.006), glassFrameMat);
    bridge.position.set(0, 0.015, -0.096);
    head.add(bridge);
  }

  if (params.facialHair === 'stubble' || params.facialHair === 'goatee') {
    const beard = new THREE.Mesh(
      new THREE.SphereGeometry(0.072, 10, 8, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45),
      hairMat
    );
    beard.scale.set(0.86, 0.95, 0.92);
    beard.position.set(0, -0.018, -0.014);
    head.add(beard);
  } else if (params.facialHair === 'mustache') {
    const stache = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.01, 0.012), hairMat);
    stache.position.set(0, -0.024, -0.088);
    head.add(stache);
  }

  // Varied Hairstyles / Headgear
  if (params.hairStyle === 'hijab') {
    const hijab = new THREE.Mesh(
      new THREE.SphereGeometry(0.106, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.72),
      accentMat
    );
    hijab.scale.set(0.92, 1.08, 0.98);
    hijab.position.y = 0.008;
    head.add(hijab);
  } else {
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.102, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.56),
      hairMat
    );
    hairCap.scale.set(0.9, 1.06, 0.96);
    hairCap.position.y = 0.012;
    head.add(hairCap);

    if (params.hairStyle === 'wavy') {
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.042, 0.12), hairMat);
      crest.position.set(-0.01, 0.092, -0.015);
      crest.rotation.z = 0.14;
      head.add(crest);
    } else if (params.hairStyle === 'spiky') {
      for (let s = -2; s <= 2; s++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.055, 5), hairMat);
        spike.position.set(s * 0.026, 0.105, -0.02);
        spike.rotation.x = -0.22;
        head.add(spike);
      }
    } else if (params.hairStyle === 'curly') {
      for (let c = 0; c < 6; c++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.036, 7, 7), hairMat);
        const a = (c / 6) * Math.PI * 2;
        puff.position.set(Math.cos(a) * 0.058, 0.075, Math.sin(a) * 0.058);
        head.add(puff);
      }
    } else if (params.hairStyle === 'parted') {
      const sideLock = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.038, 0.14), hairMat);
      sideLock.position.set(0.012, 0.082, 0.0);
      sideLock.rotation.z = -0.18;
      head.add(sideLock);
    } else if (params.hairStyle === 'bun') {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), hairMat);
      bun.position.set(0, -0.018, 0.098);
      head.add(bun);
    } else if (params.hairStyle === 'tupi') {
      const tupi = new THREE.Mesh(
        new THREE.CylinderGeometry(0.082, 0.092, 0.065, 10),
        new THREE.MeshStandardMaterial({ color: 0xfafaf9, roughness: 0.84 })
      );
      tupi.position.y = 0.078;
      head.add(tupi);
    }

    if (params.hasCap) {
      const capMat = new THREE.MeshStandardMaterial({
        color: params.capHex ?? 0xf8fafc,
        roughness: 0.75,
      });
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.105, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.5),
        capMat
      );
      crown.position.y = 0.018;
      head.add(crown);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.014, 0.095), capMat);
      brim.position.set(0, 0.032, -0.1);
      brim.rotation.x = 0.12;
      head.add(brim);
    }
  }

  // Articulated Arms
  const buildArm = (side: number) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * (chestWTop + 0.038), 0.39, 0);
    torso.add(shoulder);

    const upperArmMat = archetype === 'man' && seed % 2 === 0 ? skinMat : topMat;
    const upperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.041, 0.034, 0.27, 8),
      upperArmMat
    );
    upperArm.position.y = -0.135;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.y = -0.27;
    shoulder.add(elbow);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.025, 0.25, 8), skinMat);
    forearm.position.y = -0.125;
    forearm.castShadow = true;
    elbow.add(forearm);

    return { shoulder, elbow };
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  let phoneMesh: THREE.Mesh | undefined;
  if (params.hasPhone) {
    phoneMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.095, 0.012),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.65,
      })
    );
    phoneMesh.position.set(0, -0.24, -0.035);
    phoneMesh.rotation.x = -0.6;
    rightArm.elbow.add(phoneMesh);
  }

  // Articulated Legs
  const buildLeg = (side: number) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.088, -0.05, 0);
    hips.add(hip);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.047, 0.42, 8), bottomMat);
    thigh.position.y = -0.21;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.42;
    hip.add(knee);

    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.033, 0.41, 8), bottomMat);
    calf.position.y = -0.205;
    calf.castShadow = true;
    knee.add(calf);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.055, 0.17), shoeMat);
    shoe.position.set(0, -0.42, -0.038);
    shoe.castShadow = true;
    knee.add(shoe);

    return { hip, knee };
  };

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  return {
    group,
    hips,
    torso,
    head,
    leftShoulder: leftArm.shoulder,
    rightShoulder: rightArm.shoulder,
    leftElbow: leftArm.elbow,
    rightElbow: rightArm.elbow,
    leftHip: leftLeg.hip,
    rightHip: rightLeg.hip,
    leftKnee: leftLeg.knee,
    rightKnee: rightLeg.knee,
    phoneMesh,
    archetype,
    heightMeters: 1.68 * scale,
  };
}

export function createRealisticHuman(
  seed: number,
  options: { archetype?: HumanArchetype; hasPhone?: boolean; hasBag?: boolean } = {}
): RealisticHumanRig {
  const archetypes: HumanArchetype[] = ['man', 'woman', 'man', 'elder', 'woman', 'youth'];
  const archetype = options.archetype ?? archetypes[seed % archetypes.length];

  const hairChoices: Array<BuildHumanParams['hairStyle']> =
    archetype === 'woman'
      ? ['bun', 'hijab', 'bun', 'parted']
      : archetype === 'elder'
        ? ['tupi', 'parted']
        : ['wavy', 'spiky', 'curly', 'parted', 'crop_cap'];

  const hairStyle = hairChoices[seed % hairChoices.length];

  const topHex =
    archetype === 'woman'
      ? SAREE_COLORS[seed % SAREE_COLORS.length]
      : archetype === 'elder'
        ? (seed % 2 === 0 ? 0xf5f5f4 : 0xe2e8f0)
        : SHIRT_COLORS[seed % SHIRT_COLORS.length];

  const bottomHex =
    archetype === 'woman'
      ? SAREE_COLORS[(seed + 3) % SAREE_COLORS.length]
      : archetype === 'elder'
        ? 0xe7e5e4
        : PANT_COLORS[(seed + 2) % PANT_COLORS.length];

  const accentHex =
    archetype === 'woman'
      ? SAREE_COLORS[(seed + 5) % SAREE_COLORS.length]
      : SHIRT_COLORS[(seed + 4) % SHIRT_COLORS.length];

  return buildSculptedHuman({
    seed,
    archetype,
    skinHex: SKIN_TONES[seed % SKIN_TONES.length],
    hairHex: archetype === 'elder' ? 0xd4d4d8 : HAIR_COLORS[seed % HAIR_COLORS.length],
    topHex,
    bottomHex,
    accentHex,
    hairStyle,
    facialHair: archetype === 'man' && seed % 3 === 0 ? 'stubble' : 'none',
    hasGlasses: seed % 7 === 2,
    hasCap: archetype === 'man' && hairStyle === 'crop_cap',
    capHex: seed % 2 === 0 ? 0x1e293b : 0xb91c1c,
    hasPhone: options.hasPhone,
    hasBag: options.hasBag ?? seed % 3 === 1,
    hasStripes: archetype !== 'woman' && seed % 3 === 0,
    hasCollar: archetype === 'man' && seed % 2 === 1,
    isSalwarKameez: archetype === 'woman' && seed % 2 === 1,
  });
}

export function createPlayableCharacterRig(characterId: DriverCharacterId): RealisticHumanRig {
  const c = CHARACTER_ROSTER[characterId];
  return buildSculptedHuman({
    seed: characterId * 11 + 3,
    archetype: 'man',
    skinHex: c.skinHex,
    hairHex: c.hairHex,
    topHex: c.shirtHex,
    bottomHex: c.lungiHex,
    accentHex: c.gamchaHex,
    hairStyle: c.hairStyle,
    facialHair: c.facialHair,
    hasGlasses: c.hasGlasses,
    hasCap: c.hasCap,
    capHex: c.capHex,
    hasStripes: c.shirtStyle === 'vest' || c.shirtStyle === 'hoodie',
    hasCollar: c.shirtStyle === 'collar' || c.shirtStyle === 'vest',
  });
}

export function animateRealisticHuman(
  rig: RealisticHumanRig,
  activity: HumanActivity,
  elapsed: number,
  phaseOffset: number,
  speed = 1.35
): void {
  const t = elapsed * speed * 2.8 + phaseOffset;

  if (activity === 'walking' || activity === 'crossing') {
    const swing = Math.sin(t);
    const kneeBendL = Math.max(0, -Math.cos(t)) * 0.52;
    const kneeBendR = Math.max(0, Math.cos(t)) * 0.52;

    rig.leftHip.rotation.x = swing * 0.44;
    rig.rightHip.rotation.x = -swing * 0.44;
    rig.leftKnee.rotation.x = -kneeBendL;
    rig.rightKnee.rotation.x = -kneeBendR;

    rig.leftShoulder.rotation.x = -swing * 0.32;
    rig.rightShoulder.rotation.x = swing * 0.32;
    rig.leftElbow.rotation.x = 0.24;
    rig.rightElbow.rotation.x = 0.24;

    rig.torso.rotation.x = 0.05;
    rig.torso.rotation.y = 0;
    rig.head.rotation.x = 0;
    rig.head.rotation.y = Math.sin(elapsed * 0.7 + phaseOffset) * 0.12;
    rig.hips.position.y = (rig.archetype === 'youth' ? 0.79 : 0.9) + Math.abs(Math.sin(t)) * 0.022;
  } else if (activity === 'usingPhone') {
    rig.leftHip.rotation.x = 0;
    rig.rightHip.rotation.x = 0;
    rig.leftKnee.rotation.x = 0;
    rig.rightKnee.rotation.x = 0;

    rig.leftShoulder.rotation.x = 0.1;
    rig.leftElbow.rotation.x = 0.2;
    rig.rightShoulder.rotation.x = 0.75;
    rig.rightElbow.rotation.x = 0.85;
    rig.head.rotation.x = 0.32;
    rig.head.rotation.y = Math.sin(elapsed * 0.5 + phaseOffset) * 0.08;
    rig.torso.rotation.x = 0.04;
  } else if (activity === 'talking') {
    rig.leftHip.rotation.x = 0;
    rig.rightHip.rotation.x = 0;
    rig.leftKnee.rotation.x = 0;
    rig.rightKnee.rotation.x = 0;

    rig.rightShoulder.rotation.x = 0.35 + Math.sin(elapsed * 3.1 + phaseOffset) * 0.22;
    rig.rightElbow.rotation.x = 0.75 + Math.cos(elapsed * 2.7 + phaseOffset) * 0.2;
    rig.leftShoulder.rotation.x = 0.15;
    rig.leftElbow.rotation.x = 0.3;
    rig.head.rotation.y = Math.sin(elapsed * 1.4 + phaseOffset) * 0.22;
    rig.torso.rotation.y = Math.sin(elapsed * 0.9 + phaseOffset) * 0.08;
  } else if (activity === 'waving') {
    rig.leftHip.rotation.x = 0;
    rig.rightHip.rotation.x = 0;
    rig.leftKnee.rotation.x = 0;
    rig.rightKnee.rotation.x = 0;

    rig.rightShoulder.rotation.x = 1.9 + Math.sin(elapsed * 6.5) * 0.25;
    rig.rightShoulder.rotation.z = -0.32;
    rig.rightElbow.rotation.x = 0.45 + Math.cos(elapsed * 6.5) * 0.2;
    rig.leftShoulder.rotation.x = 0.1;
    rig.head.rotation.y = Math.sin(elapsed * 1.8) * 0.16;
  } else if (activity === 'sitting') {
    rig.leftHip.rotation.x = 1.48;
    rig.rightHip.rotation.x = 1.48;
    rig.leftKnee.rotation.x = -1.45;
    rig.rightKnee.rotation.x = -1.45;
    rig.leftShoulder.rotation.x = 0.45;
    rig.rightShoulder.rotation.x = 0.45;
    rig.leftElbow.rotation.x = 0.55;
    rig.rightElbow.rotation.x = 0.55;
    rig.torso.rotation.x = -0.06;
    rig.head.rotation.y = Math.sin(elapsed * 0.8 + phaseOffset) * 0.18;
  } else if (activity === 'showcase') {
    // Relaxed heroic stance next to the rickshaw
    rig.leftHip.rotation.x = 0.05;
    rig.rightHip.rotation.x = -0.05;
    rig.leftKnee.rotation.x = -0.05;
    rig.rightKnee.rotation.x = 0;
    rig.leftShoulder.rotation.x = 0.08 + Math.sin(elapsed * 1.5) * 0.04;
    rig.leftElbow.rotation.x = 0.35;
    rig.rightShoulder.rotation.x = 0.35 + Math.sin(elapsed * 2.1 + phaseOffset) * 0.14;
    rig.rightShoulder.rotation.z = -0.15;
    rig.rightElbow.rotation.x = 0.65;
    rig.torso.rotation.x = -0.02;
    rig.torso.rotation.y = Math.sin(elapsed * 0.8) * 0.06;
    rig.head.rotation.y = Math.sin(elapsed * 1.1) * 0.14;
  } else {
    rig.leftHip.rotation.x = 0.03;
    rig.rightHip.rotation.x = -0.03;
    rig.leftKnee.rotation.x = 0;
    rig.rightKnee.rotation.x = 0;
    rig.leftShoulder.rotation.x = Math.sin(elapsed * 1.1 + phaseOffset) * 0.04;
    rig.rightShoulder.rotation.x = -Math.sin(elapsed * 1.1 + phaseOffset) * 0.04;
    rig.head.rotation.y = Math.sin(elapsed * 0.65 + phaseOffset) * 0.18;
  }
}
