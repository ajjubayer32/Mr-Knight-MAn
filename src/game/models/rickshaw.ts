import * as THREE from 'three';
import { CHARACTER_ROSTER } from '../profile';
import type { ProceduralTexturePack } from '../textures';
import type { DriverCharacterId } from '../types';

export interface RickshawRig {
  group: THREE.Group;
  bodyPivot: THREE.Group;
  passengerMount: THREE.Group;
  frontFork: THREE.Group;
  frontWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  crankPivot: THREE.Group;
  leftThigh: THREE.Group;
  rightThigh: THREE.Group;
  driverTorso: THREE.Group;
  tassels: THREE.Mesh[];
  bellMesh: THREE.Mesh;
  framePaintMat: THREE.MeshStandardMaterial;
  rearArtMat: THREE.MeshStandardMaterial;
  canopyMat: THREE.MeshStandardMaterial;
  rexineMat: THREE.MeshStandardMaterial;
  driverSkinMat: THREE.MeshStandardMaterial;
  driverHairMat: THREE.MeshStandardMaterial;
  driverShirtMat: THREE.MeshStandardMaterial;
  lungiMat: THREE.MeshStandardMaterial;
  gamchaMat: THREE.MeshStandardMaterial;
  driverCapMesh: THREE.Group;
  driverGlassesMesh: THREE.Group;
  hitFlashMaterials: THREE.MeshStandardMaterial[];
}

function createSpokedWheel(
  radius: number,
  tireTube: number,
  spokeCount: number,
  tireMat: THREE.Material,
  chromeMat: THREE.Material,
  hubMat: THREE.Material
): THREE.Group {
  const wheel = new THREE.Group();

  const tireGeo = new THREE.TorusGeometry(radius - tireTube, tireTube, 10, 28);
  tireGeo.rotateY(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  wheel.add(tire);

  const rimGeo = new THREE.TorusGeometry(radius - tireTube * 2.1, tireTube * 0.55, 8, 28);
  rimGeo.rotateY(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, chromeMat);
  wheel.add(rim);

  const hubGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.09, 10);
  hubGeo.rotateZ(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, hubMat);
  wheel.add(hub);

  const spokeGeo = new THREE.CylinderGeometry(0.0045, 0.0045, (radius - tireTube * 2.1) * 2, 4);
  for (let i = 0; i < spokeCount; i++) {
    const spoke = new THREE.Mesh(spokeGeo, chromeMat);
    spoke.rotation.x = (i / spokeCount) * Math.PI;
    wheel.add(spoke);
  }

  return wheel;
}

export function createBangladeshiRickshaw(
  textures: ProceduralTexturePack,
  options: { isPlayer?: boolean; variantIndex?: number; characterId?: DriverCharacterId } = {}
): RickshawRig {
  const isPlayer = options.isPlayer ?? true;
  const variantIdx = options.variantIndex ?? 0;
  const charId = options.characterId ?? 0;
  const charSpec = CHARACTER_ROSTER[charId];

  const group = new THREE.Group();
  const bodyPivot = new THREE.Group();
  group.add(bodyPivot);

  const hitFlashMaterials: THREE.MeshStandardMaterial[] = [];

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1b1c1e,
    roughness: 0.88,
    metalness: 0.05,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.18,
    metalness: 0.92,
  });

  const frameColors = [0x0f766e, 0xb91c1c, 0x1d4ed8, 0x15803d];
  const framePaintMat = new THREE.MeshStandardMaterial({
    color: isPlayer ? charSpec.frameHex : frameColors[variantIdx % frameColors.length],
    roughness: 0.34,
    metalness: 0.42,
  });
  hitFlashMaterials.push(framePaintMat);

  const rexineMat = new THREE.MeshStandardMaterial({
    color: isPlayer ? charSpec.rexineHex : 0x991b1b,
    roughness: 0.46,
    metalness: 0.04,
  });
  hitFlashMaterials.push(rexineMat);

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xf5b700,
    roughness: 0.22,
    metalness: 0.88,
  });

  const woodFloorMat = new THREE.MeshStandardMaterial({
    color: 0x4a3121,
    roughness: 0.82,
    metalness: 0.02,
  });

  const rearArtTex = isPlayer
    ? textures.rickshawArt[charId]
    : textures.rickshawArtAlt[variantIdx % textures.rickshawArtAlt.length];
  const rearArtMat = new THREE.MeshStandardMaterial({
    map: rearArtTex,
    roughness: 0.36,
    metalness: 0.12,
  });
  hitFlashMaterials.push(rearArtMat);

  const canopyTex = isPlayer
    ? textures.canopyPattern[charId]
    : textures.canopyAlt[variantIdx % textures.canopyAlt.length];
  const canopyMat = new THREE.MeshStandardMaterial({
    map: canopyTex,
    roughness: 0.52,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  hitFlashMaterials.push(canopyMat);

  const innerCanopyMat = new THREE.MeshStandardMaterial({
    color: 0xffe4b5,
    roughness: 0.78,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const reflectorMat = new THREE.MeshStandardMaterial({
    color: 0xff2a2a,
    emissive: 0xaa1111,
    emissiveIntensity: 0.65,
    roughness: 0.2,
    metalness: 0.3,
  });

  // Contact shadow grounded flush at Y=0.02
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.62, 2.65),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.02, -0.05);
  group.add(shadowPlane);

  // ============================================================================
  // 1. REAR CARRIAGE CHASSIS & TWIN SPOKED WHEELS
  // ============================================================================
  const rearWheelRadius = 0.39;
  const rearTrackHalf = 0.58;
  const rearAxleZ = 0.42;

  const rearLeftWheel = createSpokedWheel(rearWheelRadius, 0.032, 12, tireMat, chromeMat, brassMat);
  rearLeftWheel.position.set(-rearTrackHalf, rearWheelRadius, rearAxleZ);
  group.add(rearLeftWheel);

  const rearRightWheel = createSpokedWheel(rearWheelRadius, 0.032, 12, tireMat, chromeMat, brassMat);
  rearRightWheel.position.set(rearTrackHalf, rearWheelRadius, rearAxleZ);
  group.add(rearRightWheel);

  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, rearTrackHalf * 2 + 0.06, 8), chromeMat);
  axle.rotation.z = Math.PI / 2;
  axle.position.set(0, rearWheelRadius, rearAxleZ);
  bodyPivot.add(axle);

  const fenderGeo = new THREE.CylinderGeometry(
    rearWheelRadius + 0.045,
    rearWheelRadius + 0.045,
    0.095,
    16,
    1,
    true,
    -Math.PI * 0.45,
    Math.PI * 0.9
  );
  fenderGeo.rotateZ(Math.PI / 2);
  for (const side of [-1, 1]) {
    const fender = new THREE.Mesh(fenderGeo, framePaintMat);
    fender.position.set(side * rearTrackHalf, rearWheelRadius, rearAxleZ);
    fender.castShadow = true;
    bodyPivot.add(fender);

    // Mudguard stay rods
    const stay = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 5), chromeMat);
    stay.position.set(side * rearTrackHalf, rearWheelRadius + 0.06, rearAxleZ + 0.16);
    stay.rotation.x = 0.72;
    bodyPivot.add(stay);

    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.24, 0.54), framePaintMat);
    skirt.position.set(side * (rearTrackHalf - 0.08), rearWheelRadius + 0.2, rearAxleZ - 0.02);
    bodyPivot.add(skirt);
  }

  // Carriage wooden deck & passenger footrest
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.06, 0.86), woodFloorMat);
  deck.position.set(0, 0.43, 0.28);
  deck.castShadow = true;
  deck.receiveShadow = true;
  bodyPivot.add(deck);

  const footrest = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.05, 0.34), framePaintMat);
  footrest.position.set(0, 0.38, -0.14);
  footrest.rotation.x = 0.2;
  bodyPivot.add(footrest);

  // Plush rexine passenger seat & backrest
  const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.14, 0.46), rexineMat);
  seatCushion.position.set(0, 0.53, 0.41);
  seatCushion.castShadow = true;
  bodyPivot.add(seatCushion);

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.44, 0.11), rexineMat);
  backrest.position.set(0, 0.78, 0.62);
  backrest.rotation.x = -0.14;
  backrest.castShadow = true;
  bodyPivot.add(backrest);

  // Passenger seat mount (where animated passenger sits!)
  const passengerMount = new THREE.Group();
  passengerMount.position.set(0, 0.59, 0.34);
  bodyPivot.add(passengerMount);

  for (const side of [-1, 1]) {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.56), framePaintMat);
    sideWall.position.set(side * 0.46, 0.66, 0.38);
    sideWall.castShadow = true;
    bodyPivot.add(sideWall);

    const sideBolster = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.52, 8), rexineMat);
    sideBolster.rotation.x = Math.PI / 2;
    sideBolster.position.set(side * 0.44, 0.85, 0.38);
    bodyPivot.add(sideBolster);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.46, 8), brassMat);
    post.position.set(side * 0.47, 0.86, 0.12);
    bodyPivot.add(post);
  }

  // ============================================================================
  // 2. SIGNATURE REAR RICKSHAW-ART BACKPLATE & TASSELS
  // ============================================================================
  const backFrame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.56, 0.05), framePaintMat);
  backFrame.position.set(0, 0.71, 0.69);
  backFrame.castShadow = true;
  bodyPivot.add(backFrame);

  const artPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.48), rearArtMat);
  artPlate.position.set(0, 0.71, 0.72);
  bodyPivot.add(artPlate);

  const bumper = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.08, 8), chromeMat);
  bumper.rotation.z = Math.PI / 2;
  bumper.position.set(0, 0.41, 0.73);
  bodyPivot.add(bumper);

  for (const side of [-1, 1]) {
    const reflector = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.025, 12), reflectorMat);
    reflector.rotation.x = Math.PI / 2;
    reflector.position.set(side * 0.4, 0.41, 0.745);
    bodyPivot.add(reflector);
  }

  const tassels: THREE.Mesh[] = [];
  const tasselColors = [0xff2e79, 0xffd12a, 0x00c853, 0xffd12a, 0xff2e79];
  for (let i = 0; i < 5; i++) {
    const tMat = new THREE.MeshStandardMaterial({
      color: tasselColors[i],
      roughness: 0.75,
    });
    const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.11, 7), tMat);
    tassel.position.set(-0.32 + i * 0.16, 0.35, 0.71);
    bodyPivot.add(tassel);
    tassels.push(tassel);
  }

  // ============================================================================
  // 3. TRADITIONAL FOLDING BANGLADESHI CANOPY / HOOD
  // ============================================================================
  const hoodPivot = new THREE.Group();
  hoodPivot.position.set(0, 0.96, 0.64);
  bodyPivot.add(hoodPivot);

  const hoodRadius = 0.56;
  const hoodWidth = 0.98;
  const hoodGeo = new THREE.CylinderGeometry(
    hoodRadius,
    hoodRadius,
    hoodWidth,
    18,
    1,
    true,
    -Math.PI * 0.12,
    Math.PI * 0.58
  );
  hoodGeo.rotateZ(Math.PI / 2);
  const hoodMesh = new THREE.Mesh(hoodGeo, canopyMat);
  hoodMesh.position.set(0, 0.04, -0.02);
  hoodMesh.castShadow = true;
  hoodPivot.add(hoodMesh);

  const innerHoodGeo = new THREE.CylinderGeometry(
    hoodRadius - 0.015,
    hoodRadius - 0.015,
    hoodWidth - 0.03,
    16,
    1,
    true,
    -Math.PI * 0.1,
    Math.PI * 0.54
  );
  innerHoodGeo.rotateZ(Math.PI / 2);
  const innerHood = new THREE.Mesh(innerHoodGeo, innerCanopyMat);
  innerHood.position.set(0, 0.04, -0.02);
  hoodPivot.add(innerHood);

  const sideCheekShape = new THREE.Shape();
  sideCheekShape.moveTo(0, 0);
  sideCheekShape.absarc(0, 0, hoodRadius, -Math.PI * 0.05, Math.PI * 0.48, false);
  sideCheekShape.lineTo(0, 0);
  const sideCheekGeo = new THREE.ShapeGeometry(sideCheekShape, 14);
  sideCheekGeo.rotateY(-Math.PI / 2);

  for (const side of [-1, 1]) {
    const cheek = new THREE.Mesh(sideCheekGeo, canopyMat);
    cheek.position.set(side * (hoodWidth / 2), 0.04, -0.02);
    hoodPivot.add(cheek);

    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.54, 6), chromeMat);
    strut.position.set(side * 0.5, 0.24, -0.14);
    strut.rotation.x = 0.55;
    hoodPivot.add(strut);
  }

  const ribGeo = new THREE.TorusGeometry(hoodRadius + 0.008, 0.012, 6, 18, Math.PI * 0.56);
  for (const xOff of [-0.47, 0, 0.47]) {
    const rib = new THREE.Mesh(ribGeo, brassMat);
    rib.rotation.y = Math.PI / 2;
    rib.rotation.z = -Math.PI * 0.1;
    rib.position.set(xOff, 0.04, -0.02);
    hoodPivot.add(rib);
  }

  // ============================================================================
  // 4. FRONT BICYCLE SECTION, CHAIN GUARD, STEERING FORK & HANDLEBARS
  // ============================================================================
  const backbone = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.72, 8), framePaintMat);
  backbone.rotation.x = Math.PI / 2;
  backbone.position.set(0, 0.46, -0.45);
  bodyPivot.add(backbone);

  const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.58, 8), framePaintMat);
  topTube.rotation.x = Math.PI / 2 + 0.25;
  topTube.position.set(0, 0.69, -0.52);
  bodyPivot.add(topTube);

  const seatPostTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.55, 8), framePaintMat);
  seatPostTube.position.set(0, 0.62, -0.26);
  seatPostTube.rotation.x = 0.18;
  bodyPivot.add(seatPostTube);

  // Chain guard running from crank to rear axle
  const chainGuard = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.78), framePaintMat);
  chainGuard.position.set(0.08, 0.41, 0.02);
  bodyPivot.add(chainGuard);

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.24), woodFloorMat);
  saddle.position.set(0, 0.9, -0.22);
  bodyPivot.add(saddle);

  const crankPivot = new THREE.Group();
  crankPivot.position.set(0, 0.42, -0.35);
  bodyPivot.add(crankPivot);

  const chainring = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.015, 14), chromeMat);
  chainring.rotation.z = Math.PI / 2;
  chainring.position.set(0.06, 0, 0);
  crankPivot.add(chainring);

  for (const side of [-1, 1]) {
    const crankArm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.025), chromeMat);
    crankArm.position.set(side * 0.09, side * 0.065, 0);
    crankPivot.add(crankArm);

    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.05), tireMat);
    pedal.position.set(side * 0.13, side * 0.13, 0);
    crankPivot.add(pedal);
  }

  const frontFork = new THREE.Group();
  frontFork.position.set(0, 0.78, -0.82);
  bodyPivot.add(frontFork);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.34, 8), chromeMat);
  stem.position.set(0, 0.12, 0);
  frontFork.add(stem);

  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.56, 8), chromeMat);
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(0, 0.28, 0.02);
  frontFork.add(handleBar);

  for (const side of [-1, 1]) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.12, 8), tireMat);
    grip.rotation.z = Math.PI / 2;
    grip.rotation.y = side * -0.25;
    grip.position.set(side * 0.26, 0.28, 0.05);
    frontFork.add(grip);
  }

  // Side-view mirror on right handlebar
  const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 5), chromeMat);
  mirrorStem.position.set(0.24, 0.34, 0.03);
  mirrorStem.rotation.z = -0.3;
  frontFork.add(mirrorStem);
  const mirrorCap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), chromeMat);
  mirrorCap.position.set(0.27, 0.4, 0.03);
  frontFork.add(mirrorCap);

  // Brass rickshaw bell on right handlebar
  const bellMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.034, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.65),
    brassMat
  );
  bellMesh.position.set(0.17, 0.31, 0.02);
  frontFork.add(bellMesh);

  const lampBody = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.032, 0.08, 10), chromeMat);
  lampBody.rotation.x = Math.PI / 2;
  lampBody.position.set(0, -0.04, -0.09);
  frontFork.add(lampBody);

  const lampLens = new THREE.Mesh(
    new THREE.CircleGeometry(0.038, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff8d6, emissive: 0xffd54f, emissiveIntensity: 0.7 })
  );
  lampLens.rotation.y = Math.PI;
  lampLens.position.set(0, -0.04, -0.132);
  frontFork.add(lampLens);

  for (const side of [-1, 1]) {
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.011, 0.44, 6), framePaintMat);
    blade.position.set(side * 0.055, -0.22, -0.04);
    blade.rotation.x = 0.16;
    frontFork.add(blade);
  }

  const frontWheelRadius = 0.34;
  const frontWheel = createSpokedWheel(frontWheelRadius, 0.028, 12, tireMat, chromeMat, chromeMat);
  frontWheel.position.set(0, -0.44, -0.08);
  frontFork.add(frontWheel);

  // ============================================================================
  // 5. AUTHENTIC BANGLADESHI RICKSHAW PULLER (DRIVER)
  // ============================================================================
  const driverShirtMat = new THREE.MeshStandardMaterial({
    color: isPlayer ? charSpec.shirtHex : [0xeab308, 0x10b981, 0xf97316, 0x6366f1][variantIdx % 4],
    roughness: 0.85,
  });
  const lungiMat = new THREE.MeshStandardMaterial({
    color: isPlayer ? charSpec.lungiHex : 0x3f2e4d,
    roughness: 0.9,
  });
  const driverSkinMat = new THREE.MeshStandardMaterial({
    color: isPlayer ? charSpec.skinHex : 0x9c6b49,
    roughness: 0.78,
    metalness: 0.0,
  });
  const driverHairMat = new THREE.MeshStandardMaterial({
    color: isPlayer ? charSpec.hairHex : 0x1a1817,
    roughness: 0.9,
  });
  const gamchaMat = new THREE.MeshStandardMaterial({
    color: isPlayer ? charSpec.gamchaHex : 0xdc2626,
    roughness: 0.88,
  });

  const driverTorso = new THREE.Group();
  driverTorso.position.set(0, 0.93, -0.24);
  bodyPivot.add(driverTorso);

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.18, 10), lungiMat);
  pelvis.position.set(0, 0.05, 0);
  driverTorso.add(pelvis);

  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.38, 10), driverShirtMat);
  chest.scale.set(1.05, 1, 0.68);
  chest.position.set(0, 0.27, -0.09);
  chest.rotation.x = 0.42;
  chest.castShadow = true;
  driverTorso.add(chest);

  const gamcha = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.032, 6, 12), gamchaMat);
  gamcha.rotation.x = Math.PI / 2 + 0.3;
  gamcha.position.set(0, 0.41, -0.17);
  driverTorso.add(gamcha);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), driverSkinMat);
  head.scale.set(0.9, 1.07, 0.94);
  head.position.set(0, 0.54, -0.22);
  head.castShadow = true;
  driverTorso.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.104, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58),
    driverHairMat
  );
  hair.position.set(0, 0.55, -0.22);
  driverTorso.add(hair);

  // Driver cap (visible for Sadi)
  const driverCapMesh = new THREE.Group();
  driverCapMesh.position.set(0, 0.56, -0.22);
  const capMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.78 });
  const capDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.108, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.5),
    capMat
  );
  driverCapMesh.add(capDome);
  const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.015, 0.09), capMat);
  capBrim.position.set(0, 0.01, -0.095);
  driverCapMesh.add(capBrim);
  driverCapMesh.visible = Boolean(isPlayer && charSpec.hasCap);
  driverTorso.add(driverCapMesh);

  // Driver glasses (visible for Siam)
  const driverGlassesMesh = new THREE.Group();
  driverGlassesMesh.position.set(0, 0.545, -0.31);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.7 });
  for (const side of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, 0.01), glassMat);
    lens.position.x = side * 0.032;
    driverGlassesMesh.add(lens);
  }
  driverGlassesMesh.visible = Boolean(isPlayer && charSpec.hasGlasses);
  driverTorso.add(driverGlassesMesh);

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.026, 0.44, 7), driverSkinMat);
    arm.position.set(side * 0.18, 0.27, -0.31);
    arm.rotation.x = 1.05;
    arm.rotation.z = side * -0.15;
    driverTorso.add(arm);
  }

  const makeLeg = (side: number) => {
    const thighPivot = new THREE.Group();
    thighPivot.position.set(side * 0.11, 0.03, -0.02);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.044, 0.26, 7), lungiMat);
    thigh.position.set(0, -0.12, -0.06);
    thigh.rotation.x = -0.45;
    thighPivot.add(thigh);

    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.028, 0.27, 7), driverSkinMat);
    calf.position.set(0, -0.32, -0.08);
    calf.rotation.x = 0.22;
    thighPivot.add(calf);

    driverTorso.add(thighPivot);
    return thighPivot;
  };

  const leftThigh = makeLeg(-1);
  const rightThigh = makeLeg(1);

  return {
    group,
    bodyPivot,
    passengerMount,
    frontFork,
    frontWheel,
    rearLeftWheel,
    rearRightWheel,
    crankPivot,
    leftThigh,
    rightThigh,
    driverTorso,
    tassels,
    bellMesh,
    framePaintMat,
    rearArtMat,
    canopyMat,
    rexineMat,
    driverSkinMat,
    driverHairMat,
    driverShirtMat,
    lungiMat,
    gamchaMat,
    driverCapMesh,
    driverGlassesMesh,
    hitFlashMaterials,
  };
}

export function applyCharacterAndRickshaw(
  rig: RickshawRig,
  textures: ProceduralTexturePack,
  characterId: DriverCharacterId
): void {
  const spec = CHARACTER_ROSTER[characterId];
  rig.framePaintMat.color.setHex(spec.frameHex);
  rig.rexineMat.color.setHex(spec.rexineHex);
  rig.rearArtMat.map = textures.rickshawArt[characterId];
  rig.rearArtMat.needsUpdate = true;
  rig.canopyMat.map = textures.canopyPattern[characterId];
  rig.canopyMat.needsUpdate = true;

  for (let i = 0; i < rig.tassels.length; i++) {
    (rig.tassels[i].material as THREE.MeshStandardMaterial).color.setHex(
      spec.tasselColors[i % spec.tasselColors.length]
    );
  }

  rig.driverSkinMat.color.setHex(spec.skinHex);
  rig.driverHairMat.color.setHex(spec.hairHex);
  rig.driverShirtMat.color.setHex(spec.shirtHex);
  rig.lungiMat.color.setHex(spec.lungiHex);
  rig.gamchaMat.color.setHex(spec.gamchaHex);
  rig.driverCapMesh.visible = Boolean(spec.hasCap);
  rig.driverGlassesMesh.visible = Boolean(spec.hasGlasses);
}

export function updateRickshawAnimation(
  rig: RickshawRig,
  speedMs: number,
  steerInput: number,
  pedalPhase: number,
  elapsed: number,
  dt: number
): void {
  const rearAngleDelta = (speedMs * dt) / 0.39;
  const frontAngleDelta = (speedMs * dt) / 0.34;
  rig.rearLeftWheel.rotation.x -= rearAngleDelta;
  rig.rearRightWheel.rotation.x -= rearAngleDelta;
  rig.frontWheel.rotation.x -= frontAngleDelta;

  rig.frontFork.rotation.y = THREE.MathUtils.damp(rig.frontFork.rotation.y, -steerInput * 0.36, 12, dt);
  rig.bodyPivot.rotation.z = THREE.MathUtils.damp(rig.bodyPivot.rotation.z, -steerInput * 0.085, 10, dt);

  if (speedMs < 0.25) {
    rig.leftThigh.rotation.x = THREE.MathUtils.damp(rig.leftThigh.rotation.x, 0.15, 8, dt);
    rig.rightThigh.rotation.x = THREE.MathUtils.damp(rig.rightThigh.rotation.x, -0.15, 8, dt);
    rig.driverTorso.rotation.z = THREE.MathUtils.damp(rig.driverTorso.rotation.z, 0, 8, dt);
  } else {
    rig.crankPivot.rotation.x = -pedalPhase;
    rig.leftThigh.rotation.x = Math.sin(pedalPhase) * 0.48;
    rig.rightThigh.rotation.x = Math.sin(pedalPhase + Math.PI) * 0.48;
    rig.driverTorso.rotation.z = Math.sin(pedalPhase) * 0.035 - steerInput * 0.06;
  }

  for (let i = 0; i < rig.tassels.length; i++) {
    rig.tassels[i].rotation.z = Math.sin(elapsed * 7.5 + i * 0.9) * 0.14 - steerInput * 0.2;
    rig.tassels[i].rotation.x = Math.min(speedMs * 0.028, 0.32);
  }
}
