import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from './audio';
import {
  buildCityWorld,
  CITY_NODES,
  CITY_SEGMENTS,
  CITY_STOPS,
  clampAndSlideOnRoad,
  computeTurnInstruction,
  findRouteBetween,
  getClosestSegmentAt,
  getSegmentWorldPoint,
  LANE_OFFSET,
  NODE_CONNECTIONS,
  pickPassengerIdentity,
  SEGMENT_MAP,
  updateCityPedestrians,
  type CityStop,
  type PedestrianAgent,
} from './cityNetwork';
import {
  animateRealisticHuman,
  createPlayableCharacterRig,
  createRealisticHuman,
  type RealisticHumanRig,
} from './models/human';
import {
  applyCharacterAndRickshaw,
  createBangladeshiRickshaw,
  type RickshawRig,
  updateRickshawAnimation,
} from './models/rickshaw';
import {
  spawnTrafficActor,
  type TrafficActor,
  updateTrafficActorAnimation,
} from './models/traffic';
import { CITY_ZONES_CATALOG } from './profile';
import { createProceduralTextures, type ProceduralTexturePack } from './textures';
import type {
  CollectibleKind,
  DriverCharacterId,
  GamePhase,
  GameSummary,
  GraphicsQuality,
  HudState,
  MapBlip,
  MymensinghZoneId,
  PassengerTripState,
  PlayerProfile,
  TrafficKind,
} from './types';

interface CollectibleItem {
  kind: CollectibleKind;
  group: THREE.Group;
  x: number;
  z: number;
  active: boolean;
}

interface BurstParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

export interface TripCompletionEvent {
  destinationZoneId: MymensinghZoneId;
  elapsedSec: number;
  isSpecial: boolean;
  rewardTaka: number;
}

const _camPosTarget = new THREE.Vector3();
const _camLookTarget = new THREE.Vector3();
const _transStartPos = new THREE.Vector3();
const _transStartLook = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

function wrapAngle(a: number): number {
  let out = a;
  while (out > Math.PI) out -= Math.PI * 2;
  while (out < -Math.PI) out += Math.PI * 2;
  return out;
}

function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  const diff = wrapAngle(target - current);
  return wrapAngle(current + diff * (1 - Math.exp(-lambda * dt)));
}

export class RickshawEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private sunLight: THREE.DirectionalLight;
  private textures: ProceduralTexturePack;
  private isSoftwareGl: boolean;
  private graphicsQuality: GraphicsQuality = 'high';
  private vfxEnabled = true;

  // Player & Showcase
  private playerRig: RickshawRig;
  private showcaseRig: RealisticHumanRig;
  private characterId: DriverCharacterId = 0;
  private showcaseSlideOffset = 0;
  private showcaseSlideVel = 0;
  private showcaseZoomPulse = 0;
  private transitionTimer = 0;

  private speedLevel = 1;
  private brakeLevel = 1;
  private durabilityLevel = 1;

  // Connected City World & Entities
  private pedestrians: PedestrianAgent[] = [];
  private trafficPool: TrafficActor[] = [];
  private collectibles: CollectibleItem[] = [];
  private particles: BurstParticle[] = [];
  private horizonSun: THREE.Mesh;

  // Multi-Road Passenger Mission State
  private pickupBeacon: THREE.Group;
  private waitingPassengerRig: RealisticHumanRig | null = null;
  private activePickupStop: CityStop | null = null;
  private activePickupGender: 'male' | 'female' = 'male';
  private activePickupSeed = 1;
  private activeDestStop: CityStop | null = null;
  private passengerRig: RealisticHumanRig | null = null;
  private passengerAnimTimer = 0;
  private missionCooldown = 0.8;
  private dropoffBeacon: THREE.Group;
  private autoBrakingHint: string | null = null;
  private routePoints: Array<{ x: number; z: number }> = [];

  private passengerTrip: PassengerTripState = {
    status: 'none',
    passengerName: '',
    passengerGender: 'male',
    pickupZone: '',
    pickupRoadName: '',
    destinationZone: '',
    destinationZoneId: 'townhall',
    destinationRoadName: '',
    remainingMeters: 0,
    rewardTaka: 0,
    elapsedTripSec: 0,
    turnHint: '',
    isSpecial: false,
  };

  // Callbacks to React UI
  private onHudUpdate: (hud: HudState) => void;
  private onGameOver: (summary: GameSummary) => void;
  private onTripCompleted?: (evt: TripCompletionEvent) => void;
  private onZoneDiscovered?: (zoneId: MymensinghZoneId) => void;
  private onContextLostChange?: (lost: boolean) => void;

  // Simulation state (Full 2D Open City)
  private phase: GamePhase = 'title';
  private playerX = 0;
  private playerZ = 28;
  private playerYaw = 0;
  private camYaw = 0;
  private speedMs = 0;
  private pedalPhase = 0;
  private distanceMeters = 0;
  private fareTaka = 0;
  private walletTaka = 180;
  private coinsCollected = 0;
  private passengersServed = 0;
  private hearts = 3;
  private maxHearts = 3;
  private stamina = 100;
  private combo = 1;
  private comboTimer = 0;
  private nearMisses = 0;
  private topSpeedKmh = 0;
  private invulnTimer = 0;
  private hitstopTimer = 0;
  private cameraShake = 0;
  private bellCooldown = 0;
  private bellAnimTimer = 0;
  private eventBanner: string | null = null;
  private eventBannerTimer = 0;
  private bestFare = 0;
  private bestDistance = 0;
  private lastZoneId: MymensinghZoneId = 'ganginarpar';
  private pendingZoneStart: MymensinghZoneId = 'ganginarpar';

  // Input state
  private heldKeys = new Set<string>();
  private touchSteer = 0;
  private touchBoost = false;
  private touchBrake = false;
  private lastHudEmit = 0;
  private elapsed = 0;
  private lastFrameMs = 0;
  private frameId = 0;
  private disposed = false;

  constructor(
    container: HTMLElement,
    initialProfile: PlayerProfile,
    callbacks: {
      onHudUpdate: (hud: HudState) => void;
      onGameOver: (summary: GameSummary) => void;
      onTripCompleted?: (evt: TripCompletionEvent) => void;
      onZoneDiscovered?: (zoneId: MymensinghZoneId) => void;
      onContextLostChange?: (lost: boolean) => void;
    }
  ) {
    this.container = container;
    this.onHudUpdate = callbacks.onHudUpdate;
    this.onGameOver = callbacks.onGameOver;
    this.onTripCompleted = callbacks.onTripCompleted;
    this.onZoneDiscovered = callbacks.onZoneDiscovered;
    this.onContextLostChange = callbacks.onContextLostChange;

    this.isSoftwareGl = detectSoftwareWebGL();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color(0xdbe8ef);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.Fog(0xdbe8ef, 55, 195);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const aspect =
      (container.clientWidth || window.innerWidth) /
      (container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(56, aspect, 0.15, 280);

    const hemi = new THREE.HemisphereLight(0xaad8f5, 0x8d6e53, 0.95);
    this.scene.add(hemi);

    this.sunLight = new THREE.DirectionalLight(0xfff1d0, 2.15);
    this.sunLight.position.set(20, 32, 16);
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 2;
    this.sunLight.shadow.camera.far = 110;
    const d = 28;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.horizonSun = new THREE.Mesh(
      new THREE.CircleGeometry(14, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff5cf, fog: false })
    );
    this.horizonSun.position.set(90, 34, -200);
    this.scene.add(this.horizonSun);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);

    // Build Connected City Road Network
    const cityWorld = buildCityWorld(this.textures);
    this.scene.add(cityWorld.group);
    this.pedestrians = cityWorld.pedestrians;

    // Build Player Rickshaw + Showcase Character Rig
    this.characterId = initialProfile.characterId;
    this.playerRig = createBangladeshiRickshaw(this.textures, {
      isPlayer: true,
      characterId: this.characterId,
    });
    this.scene.add(this.playerRig.group);

    this.showcaseRig = createPlayableCharacterRig(this.characterId);
    this.scene.add(this.showcaseRig.group);

    // Pickup & Dropoff Beacons
    this.pickupBeacon = this.createBeacon(0x10b981);
    this.scene.add(this.pickupBeacon);

    this.dropoffBeacon = this.createBeacon(0xf59e0b);
    this.scene.add(this.dropoffBeacon);

    this.initTrafficPool();
    this.initCollectiblePool();

    this.positionShowcaseScene();
    this.syncProfile(initialProfile);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);

    this.emitHud(true);
    this.lastFrameMs = performance.now();
    this.scheduleNextFrame();
  }

  private createBeacon(colorHex: number): THREE.Group {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.55, 28),
      new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    g.add(ring);

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.44, 3.6, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    pillar.position.y = 1.8;
    g.add(pillar);
    g.visible = false;
    return g;
  }

  private positionShowcaseScene(): void {
    // Frame Character + Custom Rickshaw together near Ganginarpar avenue
    this.playerX = 0.55;
    this.playerZ = 22;
    this.playerYaw = -0.35;
    this.camYaw = 0;

    this.playerRig.group.position.set(this.playerX, 0, this.playerZ);
    this.playerRig.group.rotation.y = this.playerYaw;
    this.playerRig.group.visible = true;

    this.showcaseRig.group.position.set(-0.95, 0, 21.4);
    this.showcaseRig.group.rotation.y = -0.2;
    this.showcaseRig.group.visible = true;

    this.camera.position.set(-1.35, 1.72, 17.8);
    this.camera.lookAt(-0.15, 1.12, 22.1);
  }

  public previewCharacterSwipe(direction: -1 | 1, newCharId: DriverCharacterId): void {
    this.characterId = newCharId;
    applyCharacterAndRickshaw(this.playerRig, this.textures, newCharId);

    const prevPos = this.showcaseRig.group.position.clone();
    const prevRot = this.showcaseRig.group.rotation.y;
    const prevVis = this.showcaseRig.group.visible;
    this.scene.remove(this.showcaseRig.group);
    this.showcaseRig = createPlayableCharacterRig(newCharId);
    this.showcaseRig.group.position.copy(prevPos);
    this.showcaseRig.group.rotation.y = prevRot;
    this.showcaseRig.group.visible = prevVis;
    this.scene.add(this.showcaseRig.group);

    this.showcaseSlideOffset = direction * 2.4;
    this.showcaseSlideVel = 0;
    this.showcaseZoomPulse = 0.42;
    soundEngine.playSwipe();
  }

  public syncProfile(profile: PlayerProfile): void {
    this.walletTaka = profile.walletTaka;
    this.bestFare = profile.bestFare;
    this.bestDistance = profile.bestDistance;
    this.pendingZoneStart = profile.selectedZone;
    this.speedLevel = profile.upgrades.speedLevel;
    this.brakeLevel = profile.upgrades.brakeLevel;
    this.durabilityLevel = profile.upgrades.durabilityLevel;
    this.maxHearts = 2 + this.durabilityLevel;
    this.vfxEnabled = profile.settings.vfxEnabled;

    if (this.characterId !== profile.characterId) {
      this.characterId = profile.characterId;
      applyCharacterAndRickshaw(this.playerRig, this.textures, this.characterId);
      const prevVis = this.showcaseRig.group.visible;
      this.scene.remove(this.showcaseRig.group);
      this.showcaseRig = createPlayableCharacterRig(this.characterId);
      this.showcaseRig.group.position.set(-0.95, 0, 21.4);
      this.showcaseRig.group.rotation.y = -0.2;
      this.showcaseRig.group.visible = prevVis;
      this.scene.add(this.showcaseRig.group);
    } else {
      applyCharacterAndRickshaw(this.playerRig, this.textures, this.characterId);
    }

    this.applyGraphicsQuality(profile.settings.graphicsQuality);
    soundEngine.setSoundEnabled(profile.settings.soundEnabled);
    soundEngine.setAmbientEnabled(profile.settings.ambientEnabled);
    soundEngine.setMusicEnabled(profile.settings.musicEnabled);
    soundEngine.setVibrationEnabled(profile.settings.vibrationEnabled);

    this.emitHud(true);
  }

  private applyGraphicsQuality(quality: GraphicsQuality): void {
    this.graphicsQuality = quality;
    if (this.isSoftwareGl) {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
      this.scene.fog = new THREE.Fog(0xdbe8ef, 50, 165);
      return;
    }

    if (quality === 'low') {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
      this.scene.fog = new THREE.Fog(0xdbe8ef, 45, 155);
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      this.renderer.shadowMap.enabled = true;
      this.sunLight.castShadow = true;
      this.scene.fog = new THREE.Fog(0xdbe8ef, 52, 185);
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.sunLight.castShadow = true;
      this.scene.fog = new THREE.Fog(0xdbe8ef, 58, 210);
    }
  }

  private initTrafficPool(): void {
    const templateList: TrafficKind[] = [
      'rickshaw',
      'rickshaw',
      'rickshaw',
      'rickshaw',
      'cng',
      'cng',
      'cng',
      'cng',
      'bus',
      'bus',
      'moto',
      'moto',
      'moto',
      'bicycle',
      'bicycle',
      'bicycle',
      'car',
      'car',
    ];
    templateList.forEach((kind, idx) => {
      const actor = spawnTrafficActor(kind, this.textures, idx);
      actor.group.visible = false;
      this.scene.add(actor.group);
      this.trafficPool.push(actor);
    });
  }

  private initCollectiblePool(): void {
    const coinGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 16);
    coinGeo.rotateX(Math.PI / 2);
    const coinEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.8,
    });
    const coinFaceMat = new THREE.MeshStandardMaterial({
      map: this.textures.takaCoin,
      roughness: 0.3,
      metalness: 0.45,
    });

    const cupGeo = new THREE.CylinderGeometry(0.24, 0.17, 0.42, 12);
    const cupMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.35 });
    const teaGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.04, 12);
    const teaMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.25 });
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.7,
    });

    for (let i = 0; i < 18; i++) {
      const isTea = i % 6 === 5;
      const g = new THREE.Group();
      if (!isTea) {
        const coin = new THREE.Mesh(coinGeo, [coinEdgeMat, coinFaceMat, coinFaceMat]);
        coin.position.y = 0.85;
        coin.castShadow = true;
        g.add(coin);
      } else {
        const cup = new THREE.Mesh(cupGeo, cupMat);
        cup.position.y = 0.88;
        cup.castShadow = true;
        g.add(cup);

        const tea = new THREE.Mesh(teaGeo, teaMat);
        tea.position.y = 1.07;
        g.add(tea);

        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 6, 18), ringMat);
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 0.68;
        g.add(halo);
      }
      g.visible = false;
      this.scene.add(g);
      this.collectibles.push({
        kind: isTea ? 'tea' : 'taka',
        group: g,
        x: 0,
        z: 0,
        active: false,
      });
    }
  }

  public startGame(profile: PlayerProfile): void {
    this.syncProfile(profile);
    soundEngine.unlock();
    soundEngine.playUiClick();

    // Smooth cinematic camera glide from showcase into driving position
    _transStartPos.copy(this.camera.position);
    _transStartLook.set(0, 1.15, 22);

    this.resetRunState(profile.selectedZone);
    this.populateCityTraffic();
    this.populateCityCollectibles();

    if (profile.selectedZone === 'ganginarpar') {
      // Smooth glide transition from showcase to Ganginarpar start
      this.phase = 'transition';
      this.transitionTimer = 0.8;
      this.showcaseRig.group.visible = true;
    } else {
      this.showcaseRig.group.visible = false;
      this.phase = 'playing';
      soundEngine.setAmbience(true);
      soundEngine.setMusicActive(true);
      this.activateNextPassengerMission();
    }
    this.emitHud(true);
  }

  public returnToMenu(): void {
    this.phase = 'title';
    this.heldKeys.clear();
    this.touchSteer = 0;
    this.touchBoost = false;
    this.touchBrake = false;
    soundEngine.setAmbience(false);
    soundEngine.setMusicActive(false);
    soundEngine.playUiClick();

    this.clearPassengerFromSeat();
    this.deactivatePickupStop();
    for (const actor of this.trafficPool) {
      actor.active = false;
      actor.group.visible = false;
    }
    for (const item of this.collectibles) {
      item.active = false;
      item.group.visible = false;
    }
    this.positionShowcaseScene();
    this.emitHud(true);
  }

  public togglePause(): void {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.heldKeys.clear();
      this.touchSteer = 0;
      this.touchBoost = false;
      this.touchBrake = false;
      soundEngine.setAmbience(false);
      soundEngine.setMusicActive(false);
      soundEngine.playUiClick();
      this.emitHud(true);
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.lastFrameMs = performance.now();
      soundEngine.setAmbience(true);
      soundEngine.setMusicActive(true);
      soundEngine.playUiClick();
      this.emitHud(true);
    }
  }

  public setTouchSteer(val: number): void {
    this.touchSteer = THREE.MathUtils.clamp(val, -1, 1);
  }

  public setTouchBoost(active: boolean): void {
    this.touchBoost = active;
  }

  public setTouchBrake(active: boolean): void {
    this.touchBrake = active;
  }

  public ringBell(): void {
    if (this.phase !== 'playing' || this.bellCooldown > 0) return;
    soundEngine.unlock();
    soundEngine.playBell();
    this.bellCooldown = 1.05;
    this.bellAnimTimer = 0.35;

    let nudged = 0;
    const fx = -Math.sin(this.playerYaw);
    const fz = -Math.cos(this.playerYaw);
    for (const actor of this.trafficPool) {
      if (!actor.active || (actor.kind !== 'rickshaw' && actor.kind !== 'bicycle')) continue;
      const dx = actor.group.position.x - this.playerX;
      const dz = actor.group.position.z - this.playerZ;
      const dist = Math.hypot(dx, dz);
      const aheadDot = (dx * fx + dz * fz) / Math.max(dist, 0.01);
      if (dist > 2 && dist < 20 && aheadDot > 0.65) {
        actor.targetLaneOffset = THREE.MathUtils.clamp(actor.laneOffset + 1.35, 1.4, 4.4);
        nudged++;
      }
    }
    if (nudged > 0) {
      const bonus = 15 * nudged;
      this.fareTaka += bonus;
      this.walletTaka += bonus;
      this.showEvent(`PATH CLEARED +৳${bonus}`);
    }
  }

  private getZoneStartPose(zoneId: MymensinghZoneId): { x: number; z: number; yaw: number } {
    if (zoneId === 'townhall') return { x: -45, z: -2.6, yaw: -Math.PI / 2 };
    if (zoneId === 'charpara') return { x: -2.6, z: 45, yaw: 0 };
    if (zoneId === 'bridge') return { x: 108, z: -2.6, yaw: -Math.PI / 2 };
    return { x: -2.4, z: 24, yaw: 0 }; // Ganginarpar approach toward main '+' intersection
  }

  private resetRunState(startZone: MymensinghZoneId): void {
    const pose = this.getZoneStartPose(startZone);
    this.playerX = pose.x;
    this.playerZ = pose.z;
    this.playerYaw = pose.yaw;
    this.camYaw = pose.yaw;
    this.speedMs = startZone === 'ganginarpar' ? 0 : 4.5;
    this.pedalPhase = 0;
    this.distanceMeters = 0;
    this.fareTaka = 0;
    this.coinsCollected = 0;
    this.passengersServed = 0;
    this.hearts = this.maxHearts;
    this.stamina = 100;
    this.combo = 1;
    this.comboTimer = 0;
    this.nearMisses = 0;
    this.topSpeedKmh = 18;
    this.invulnTimer = 0;
    this.hitstopTimer = 0;
    this.cameraShake = 0;
    this.bellCooldown = 0;
    this.bellAnimTimer = 0;
    this.eventBanner = null;
    this.eventBannerTimer = 0;
    this.missionCooldown = 0.5;
    this.autoBrakingHint = null;
    this.routePoints = [];
    this.lastZoneId = startZone;

    this.clearPassengerFromSeat();
    this.deactivatePickupStop();

    this.heldKeys.clear();
    this.touchSteer = 0;
    this.touchBoost = false;
    this.touchBrake = false;

    this.playerRig.group.position.set(this.playerX, 0, this.playerZ);
    this.playerRig.group.rotation.y = this.playerYaw;
    this.playerRig.group.visible = true;
  }

  private populateCityTraffic(): void {
    this.trafficPool.forEach((actor, i) => {
      const seg = CITY_SEGMENTS[(i * 3) % CITY_SEGMENTS.length];
      const segDir: 1 | -1 = i % 2 === 0 ? 1 : -1;
      const segProgress = 0.2 + ((i * 19) % 60) / 100;
      const laneOffset = actor.kind === 'bus' ? 2.1 : LANE_OFFSET + ((i % 3) - 1) * 0.65;
      const pos = getSegmentWorldPoint(seg, segProgress, segDir, laneOffset);

      actor.segmentId = seg.id;
      actor.segDir = segDir;
      actor.segProgress = segProgress;
      actor.laneOffset = laneOffset;
      actor.targetLaneOffset = laneOffset;
      actor.currentYaw = segDir === 1 ? seg.yawAB : seg.yawBA;
      actor.targetYaw = actor.currentYaw;
      actor.currentSpeedMs = actor.baseSpeedMs;
      actor.nearMissed = false;
      actor.honked = false;
      actor.active = true;

      actor.group.position.set(pos.x, 0, pos.z);
      actor.group.rotation.y = actor.currentYaw;
      actor.group.visible = true;
    });
  }

  private populateCityCollectibles(): void {
    this.collectibles.forEach((item, idx) => {
      const seg = CITY_SEGMENTS[(idx * 2 + 1) % CITY_SEGMENTS.length];
      const t = 0.25 + ((idx % 3) * 0.22);
      const pos = getSegmentWorldPoint(seg, t, idx % 2 === 0 ? 1 : -1, 1.9);
      item.x = pos.x;
      item.z = pos.z;
      item.active = true;
      item.group.position.set(pos.x, 0, pos.z);
      item.group.visible = true;
    });
  }

  private deactivatePickupStop(): void {
    if (this.waitingPassengerRig) {
      this.scene.remove(this.waitingPassengerRig.group);
      this.waitingPassengerRig = null;
    }
    this.pickupBeacon.visible = false;
    this.activePickupStop = null;
  }

  private activateNextPassengerMission(): void {
    if (this.passengerTrip.status !== 'none' || this.activePickupStop) return;

    // Pick a stop between 35m and 130m away on the connected graph
    const candidates = CITY_STOPS.filter((s) => {
      const d = Math.hypot(s.x - this.playerX, s.z - this.playerZ);
      return d > 32 && d < 145;
    });
    const pool = candidates.length > 0 ? candidates : CITY_STOPS;
    const stop = pool[Math.floor(Math.random() * pool.length)];

    const identity = pickPassengerIdentity();
    const seed = Math.floor(Math.random() * 500) + 1;
    const waiting = createRealisticHuman(seed, {
      archetype: identity.gender === 'female' ? 'woman' : 'man',
      hasBag: true,
    });
    waiting.group.position.set(stop.curbX, 0.14, stop.curbZ);
    waiting.group.rotation.y = stop.curbYaw;
    this.scene.add(waiting.group);

    this.waitingPassengerRig = waiting;
    this.activePickupStop = stop;
    this.activePickupGender = identity.gender;
    this.activePickupSeed = seed;

    this.pickupBeacon.position.set(stop.x, 0, stop.z);
    this.pickupBeacon.visible = true;

    const route = findRouteBetween(this.playerX, this.playerZ, stop.segmentId, stop.x, stop.z);
    this.routePoints = route.points;
    const turnHint = computeTurnInstruction(
      this.playerX,
      this.playerZ,
      this.playerYaw,
      route.points,
      stop.roadName
    );

    const reward = 110 + Math.round(route.distanceMeters * 0.85);
    this.passengerTrip = {
      status: 'waiting',
      passengerName: identity.name,
      passengerGender: identity.gender,
      pickupZone: stop.zoneLabel,
      pickupRoadName: stop.roadName,
      destinationZone: '',
      destinationZoneId: stop.zoneId,
      destinationRoadName: '',
      remainingMeters: route.distanceMeters,
      rewardTaka: reward,
      elapsedTripSec: 0,
      turnHint,
      isSpecial: false,
    };
    this.showEvent(`PASSENGER AT ${stop.roadName.toUpperCase()}`);
    this.emitHud(true);
  }

  private clearPassengerFromSeat(): void {
    if (this.passengerRig) {
      this.passengerRig.group.parent?.remove(this.passengerRig.group);
      this.passengerRig = null;
    }
    this.dropoffBeacon.visible = false;
    this.activeDestStop = null;
    this.routePoints = [];
    this.passengerTrip = {
      status: 'none',
      passengerName: '',
      passengerGender: 'male',
      pickupZone: '',
      pickupRoadName: '',
      destinationZone: '',
      destinationZoneId: 'townhall',
      destinationRoadName: '',
      remainingMeters: 0,
      rewardTaka: 0,
      elapsedTripSec: 0,
      turnHint: '',
      isSpecial: false,
    };
  }

  private beginPassengerBoarding(stop: CityStop): void {
    const pName = this.passengerTrip.passengerName;
    const pGender = this.activePickupGender;
    const pSeed = this.activePickupSeed;
    this.deactivatePickupStop();

    // Choose a destination stop on a DIFFERENT road segment!
    const destCandidates = CITY_STOPS.filter(
      (s) => s.segmentId !== stop.segmentId && Math.hypot(s.x - stop.x, s.z - stop.z) > 70
    );
    const destStop =
      destCandidates[Math.floor(Math.random() * destCandidates.length)] ||
      CITY_STOPS.find((s) => s.id !== stop.id) ||
      CITY_STOPS[0];

    this.clearPassengerFromSeat();
    this.activeDestStop = destStop;

    const rider = createRealisticHuman(pSeed, {
      archetype: pGender === 'female' ? 'woman' : 'man',
      hasBag: true,
    });
    rider.group.position.set(0.82, 0.1, 0.14);
    rider.group.rotation.y = 0;
    this.playerRig.passengerMount.add(rider.group);
    this.passengerRig = rider;
    this.passengerAnimTimer = 0.8;
    this.speedMs = 0;

    const route = findRouteBetween(
      this.playerX,
      this.playerZ,
      destStop.segmentId,
      destStop.x,
      destStop.z
    );
    this.routePoints = route.points;
    const isSpecial = Boolean(destStop.isSpecial || destStop.zoneId === 'bridge');
    const reward = 130 + Math.round(route.distanceMeters * 1.1) + (isSpecial ? 90 : 0);

    this.passengerTrip = {
      status: 'boarding',
      passengerName: pName,
      passengerGender: pGender,
      pickupZone: stop.zoneLabel,
      pickupRoadName: stop.roadName,
      destinationZone: destStop.zoneLabel,
      destinationZoneId: destStop.zoneId,
      destinationRoadName: destStop.roadName,
      remainingMeters: route.distanceMeters,
      rewardTaka: reward,
      elapsedTripSec: 0,
      turnHint: computeTurnInstruction(
        this.playerX,
        this.playerZ,
        this.playerYaw,
        route.points,
        destStop.roadName
      ),
      isSpecial,
    };

    this.dropoffBeacon.position.set(destStop.x, 0, destStop.z);
    this.dropoffBeacon.visible = true;

    soundEngine.playPassengerPickup();
    this.showEvent(
      `${isSpecial ? 'SPECIAL TRIP: ' : ''}${pName.split(' ')[0]} → ${destStop.roadName.toUpperCase()}`
    );
    this.emitHud(true);
  }

  private completePassengerTrip(): void {
    if (this.passengerTrip.status !== 'riding') return;
    const reward = this.passengerTrip.rewardTaka;
    const destZoneId = this.passengerTrip.destinationZoneId;
    const elapsedSec = this.passengerTrip.elapsedTripSec;
    const isSpecial = this.passengerTrip.isSpecial;

    this.fareTaka += reward;
    this.walletTaka += reward;
    this.passengersServed += 1;
    this.passengerTrip.status = 'alighting';
    this.passengerAnimTimer = 0.72;
    this.speedMs = 0;
    this.dropoffBeacon.visible = false;
    this.routePoints = [];
    this.missionCooldown = 1.4;

    soundEngine.playPassengerDropoff();
    this.spawnBurst(this.playerX + 0.5, 1.0, this.playerZ, 0x10b981, 14);
    this.showEvent(`DROPPED AT ${this.passengerTrip.destinationRoadName.toUpperCase()} +৳${reward}`);

    this.onTripCompleted?.({
      destinationZoneId: destZoneId,
      elapsedSec,
      isSpecial,
      rewardTaka: reward,
    });
    this.emitHud(true);
  }

  private spawnBurst(x: number, y: number, z: number, colorHex: number, count: number): void {
    if (!this.vfxEnabled) return;
    const geo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      this.scene.add(m);
      this.particles.push({
        mesh: m,
        vx: (Math.random() - 0.5) * 5.4,
        vy: 1.9 + Math.random() * 4.2,
        vz: (Math.random() - 0.5) * 4.5,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.25,
      });
    }
  }

  private showEvent(label: string): void {
    this.eventBanner = label;
    this.eventBannerTimer = 2.0;
  }

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    this.onContextLostChange?.(true);
  };

  private handleContextRestored = (): void => {
    this.onContextLostChange?.(false);
    this.lastFrameMs = performance.now();
    this.scheduleNextFrame();
  };

  private handleResize = (): void => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.applyGraphicsQuality(this.graphicsQuality);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat && (e.code === 'Space' || e.code === 'Escape' || e.code === 'Enter')) return;

    if (e.code === 'Escape') {
      if (this.phase === 'playing' || this.phase === 'paused') {
        e.preventDefault();
        this.togglePause();
      }
      return;
    }

    if (this.phase === 'playing' && (e.code === 'Space' || e.code === 'KeyB')) {
      e.preventDefault();
      this.ringBell();
      return;
    }

    this.heldKeys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.code);
  };

  private handleWindowBlur = (): void => {
    this.heldKeys.clear();
    this.touchSteer = 0;
    this.touchBoost = false;
    this.touchBrake = false;
  };

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(() => this.tick());
    } else {
      this.frameId = requestAnimationFrame(() => this.tick());
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick(): void {
    if (this.disposed) return;
    const now = performance.now();
    const rawDt = (now - this.lastFrameMs) / 1000;
    this.lastFrameMs = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    if (this.phase === 'title') {
      this.updateTitleShowcase(dt);
    } else if (this.phase === 'transition') {
      this.updateStartTransition(dt);
    } else if (this.phase === 'playing') {
      this.updateGameplay(dt);
    }

    this.renderer.render(this.scene, this.camera);
    this.scheduleNextFrame();
  }

  private updateTitleShowcase(dt: number): void {
    this.elapsed += dt;

    // Smooth spring slide on character swipe
    const k = 120;
    const d = 16;
    const accel = -k * this.showcaseSlideOffset - d * this.showcaseSlideVel;
    this.showcaseSlideVel += accel * dt;
    this.showcaseSlideOffset += this.showcaseSlideVel * dt;
    this.showcaseZoomPulse = THREE.MathUtils.damp(this.showcaseZoomPulse, 0, 5.5, dt);

    const breatheY = Math.sin(this.elapsed * 1.8) * 0.005;
    this.playerRig.group.position.set(0.55 + this.showcaseSlideOffset, 0, 22);
    this.playerRig.group.rotation.y = -0.35 + Math.sin(this.elapsed * 0.4) * 0.05;
    updateRickshawAnimation(this.playerRig, 0, 0, this.pedalPhase, this.elapsed, dt);

    this.showcaseRig.group.position.set(-0.95 + this.showcaseSlideOffset * 0.85, breatheY, 21.4);
    this.showcaseRig.group.rotation.y = Math.PI - 0.32 + Math.sin(this.elapsed * 0.5) * 0.05;
    animateRealisticHuman(this.showcaseRig, 'showcase', this.elapsed, 0.2);

    updateCityPedestrians(this.pedestrians, this.elapsed, dt, 999, 999);
    this.sunLight.position.set(20, 32, 26);
    this.sunLight.target.position.set(0, 0, 21);

    const sway = Math.sin(this.elapsed * 0.45) * 0.22;
    _camPosTarget.set(-1.35 + sway, 1.66, 17.55 + this.showcaseZoomPulse);
    _camLookTarget.set(-0.15, 1.08, 21.9);
    this.camera.position.lerp(_camPosTarget, 1 - Math.exp(-6 * dt));
    this.camera.lookAt(_camLookTarget);
  }

  private updateStartTransition(dt: number): void {
    this.elapsed += dt;
    this.transitionTimer -= dt;
    const p = 1 - Math.max(0, this.transitionTimer / 0.8);
    const smooth = p * p * (3 - 2 * p);

    // Roll rickshaw gently onto the Ganginarpar road start pose
    const pose = this.getZoneStartPose('ganginarpar');
    this.playerX = THREE.MathUtils.lerp(0.55, pose.x, smooth);
    this.playerZ = THREE.MathUtils.lerp(22, pose.z, smooth);
    this.playerYaw = wrapAngle(THREE.MathUtils.lerp(-0.35, pose.yaw, smooth));
    this.playerRig.group.position.set(this.playerX, 0, this.playerZ);
    this.playerRig.group.rotation.y = this.playerYaw;

    this.showcaseRig.group.position.y = -smooth * 0.2;
    if (p > 0.55) {
      this.showcaseRig.group.visible = false;
    }

    const fx = -Math.sin(this.playerYaw);
    const fz = -Math.cos(this.playerYaw);
    const endCamPos = new THREE.Vector3(this.playerX - fx * 3.55, 2.02, this.playerZ - fz * 3.55);
    const endLook = new THREE.Vector3(this.playerX + fx * 24, 1.08, this.playerZ + fz * 24);

    this.camera.position.lerpVectors(_transStartPos, endCamPos, smooth);
    _camLookTarget.lerpVectors(_transStartLook, endLook, smooth);
    this.camera.lookAt(_camLookTarget);

    if (this.transitionTimer <= 0) {
      this.showcaseRig.group.visible = false;
      this.speedMs = 4.2;
      this.phase = 'playing';
      soundEngine.setAmbience(true);
      soundEngine.setMusicActive(true);
      this.activateNextPassengerMission();
      this.emitHud(true);
    }
  }

  private updateGameplay(dt: number): void {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    this.elapsed += dt;
    soundEngine.updateRollingAmbience(this.speedMs);

    if (this.invulnTimer > 0) {
      this.invulnTimer = Math.max(0, this.invulnTimer - dt);
      this.playerRig.group.visible = Math.floor(this.invulnTimer * 16) % 2 === 0;
    } else {
      this.playerRig.group.visible = true;
    }

    if (this.bellCooldown > 0) this.bellCooldown = Math.max(0, this.bellCooldown - dt);
    if (this.bellAnimTimer > 0) {
      this.bellAnimTimer = Math.max(0, this.bellAnimTimer - dt);
      this.playerRig.bellMesh.rotation.z = Math.sin(this.bellAnimTimer * 55) * 0.35;
    }
    if (this.eventBannerTimer > 0) {
      this.eventBannerTimer -= dt;
      if (this.eventBannerTimer <= 0) this.eventBanner = null;
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        this.comboTimer = 0;
      }
    }

    const isLocked =
      this.passengerTrip.status === 'boarding' || this.passengerTrip.status === 'alighting';

    let steerInput = this.touchSteer;
    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) steerInput -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) steerInput += 1;
    steerInput = isLocked ? 0 : THREE.MathUtils.clamp(steerInput, -1, 1);

    const wantsAccel =
      !isLocked && (this.touchBoost || this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp'));
    const wantsBrake =
      !isLocked && (this.touchBrake || this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown'));

    const maxSpeedMs = 12.6 + (this.speedLevel - 1) * 1.35;
    const accelRate = 4.9 + (this.speedLevel - 1) * 0.75;
    const brakeRate = 8.4 + (this.brakeLevel - 1) * 1.45;
    const coastDrag = 0.85;

    // Auto-slow & smooth stop near pickup / dropoff
    this.autoBrakingHint = null;
    let autoSlowTarget: number | null = null;

    if (this.passengerTrip.status === 'waiting' && this.activePickupStop) {
      const dist = Math.hypot(
        this.activePickupStop.x - this.playerX,
        this.activePickupStop.z - this.playerZ
      );
      if (dist < 14) {
        this.autoBrakingHint = 'Slowing for Passenger Pickup';
        autoSlowTarget = dist < 3.6 ? 0 : THREE.MathUtils.clamp((dist / 14) * 7.5, 2.0, 7.5);
        if (dist < 4.3 && this.speedMs < 3.6) {
          this.beginPassengerBoarding(this.activePickupStop);
        }
      }
    } else if (this.passengerTrip.status === 'riding' && this.activeDestStop) {
      const dist = Math.hypot(
        this.activeDestStop.x - this.playerX,
        this.activeDestStop.z - this.playerZ
      );
      if (dist < 15) {
        this.autoBrakingHint = `Arriving at ${this.activeDestStop.roadName}`;
        autoSlowTarget = dist < 3.8 ? 0 : THREE.MathUtils.clamp((dist / 15) * 7.5, 2.0, 7.5);
        if (dist < 4.7 && this.speedMs < 3.8) {
          this.completePassengerTrip();
        }
      }
    }

    if (isLocked) {
      this.speedMs = THREE.MathUtils.damp(this.speedMs, 0, 12, dt);
    } else if (autoSlowTarget !== null && !wantsAccel) {
      this.speedMs = THREE.MathUtils.damp(this.speedMs, autoSlowTarget, 4.5, dt);
    } else if (wantsBrake) {
      this.speedMs = Math.max(0, this.speedMs - brakeRate * dt);
    } else if (wantsAccel) {
      const effectiveMax = this.stamina > 5 ? maxSpeedMs : maxSpeedMs * 0.78;
      this.speedMs = Math.min(effectiveMax, this.speedMs + accelRate * dt);
      if (this.speedMs > 9.5) {
        this.stamina = Math.max(0, this.stamina - 14 * dt);
      }
    } else {
      this.speedMs = Math.max(0, this.speedMs - coastDrag * dt);
      this.stamina = Math.min(100, this.stamina + 12 * dt);
    }

    if (!wantsAccel && this.speedMs < 9.5) {
      this.stamina = Math.min(100, this.stamina + 12 * dt);
    }

    const speedKmh = Math.round(this.speedMs * 3.6);
    if (speedKmh > this.topSpeedKmh) this.topSpeedKmh = speedKmh;

    // 2D Steering & Full Turning / U-Turns
    const turnRate = (1.55 + (this.brakeLevel - 1) * 0.14) * THREE.MathUtils.clamp(0.42 + this.speedMs / 5.5, 0.42, 1.35);
    this.playerYaw = wrapAngle(this.playerYaw - steerInput * turnRate * dt);

    const fx = -Math.sin(this.playerYaw);
    const fz = -Math.cos(this.playerYaw);
    const step = this.speedMs * dt;
    const nextX = this.playerX + fx * step;
    const nextZ = this.playerZ + fz * step;

    const clamped = clampAndSlideOnRoad(nextX, nextZ);
    if (clamped.hitCurb && this.speedMs > 5.0) {
      this.speedMs *= 0.94;
    }
    const actualMoved = Math.hypot(clamped.x - this.playerX, clamped.z - this.playerZ);
    this.playerX = clamped.x;
    this.playerZ = clamped.z;
    this.distanceMeters += actualMoved;
    this.pedalPhase += this.speedMs * 1.65 * dt;

    soundEngine.tickPedal(this.speedMs / maxSpeedMs);

    const seg = getClosestSegmentAt(this.playerX, this.playerZ);
    if (seg.zoneId !== this.lastZoneId) {
      this.lastZoneId = seg.zoneId;
      this.onZoneDiscovered?.(seg.zoneId);
      this.showEvent(`ENTERING ${seg.zoneLabel.toUpperCase()}`);
    }

    const roadMicroBounce = this.speedMs > 0.4 ? Math.sin(this.distanceMeters * 2.2) * 0.008 : 0;
    this.playerRig.group.position.set(this.playerX, roadMicroBounce, this.playerZ);
    this.playerRig.group.rotation.y = this.playerYaw;
    updateRickshawAnimation(this.playerRig, this.speedMs, steerInput, this.pedalPhase, this.elapsed, dt);

    this.updatePassengerSystem(dt);
    updateCityPedestrians(this.pedestrians, this.elapsed, dt, this.playerX, this.playerZ);
    this.updateLightsAndHorizon();
    this.updateTrafficGraph(dt);
    this.updateCollectibles(dt);
    this.updateParticles(dt);

    // Smooth third-person behind-the-rickshaw camera aligned to playerYaw
    this.camYaw = dampAngle(this.camYaw, this.playerYaw, 6.2, dt);
    const cfx = -Math.sin(this.camYaw);
    const cfz = -Math.cos(this.camYaw);

    const speedFactor = THREE.MathUtils.clamp((this.speedMs - 5) / 12, 0, 1);
    const desiredFov = 56 + speedFactor * 6.5;
    if (Math.abs(this.camera.fov - desiredFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, desiredFov, 6, dt);
      this.camera.updateProjectionMatrix();
    }

    this.cameraShake = Math.max(0, this.cameraShake - dt * 2.8);
    const shakeX = (Math.random() - 0.5) * this.cameraShake * 0.28;
    const shakeY = (Math.random() - 0.5) * this.cameraShake * 0.18;

    _camPosTarget.set(
      this.playerX - cfx * 3.55 + shakeX,
      2.02 + (this.speedMs > 0.5 ? Math.sin(this.distanceMeters * 1.8) * 0.01 : 0) + shakeY,
      this.playerZ - cfz * 3.55
    );
    this.camera.position.lerp(_camPosTarget, 1 - Math.exp(-12 * dt));
    _camLookTarget.set(this.playerX + cfx * 22, 1.08, this.playerZ + cfz * 22);
    this.camera.lookAt(_camLookTarget);
    this.camera.rotation.z = THREE.MathUtils.damp(this.camera.rotation.z, -steerInput * 0.022, 8, dt);

    if (performance.now() - this.lastHudEmit > 66) {
      this.emitHud(false);
    }
  }

  private updatePassengerSystem(dt: number): void {
    if (this.passengerTrip.status === 'none') {
      if (this.missionCooldown > 0) {
        this.missionCooldown -= dt;
      } else {
        this.activateNextPassengerMission();
      }
      return;
    }

    if (this.passengerTrip.status === 'waiting' && this.activePickupStop) {
      if (this.waitingPassengerRig) {
        animateRealisticHuman(this.waitingPassengerRig, 'waving', this.elapsed, 0.5);
      }
      const route = findRouteBetween(
        this.playerX,
        this.playerZ,
        this.activePickupStop.segmentId,
        this.activePickupStop.x,
        this.activePickupStop.z
      );
      this.routePoints = route.points;
      this.passengerTrip.remainingMeters = route.distanceMeters;
      this.passengerTrip.turnHint = computeTurnInstruction(
        this.playerX,
        this.playerZ,
        this.playerYaw,
        route.points,
        this.activePickupStop.roadName
      );
      return;
    }

    if (this.passengerTrip.status === 'boarding' && this.passengerRig) {
      this.passengerAnimTimer -= dt;
      const p = 1 - Math.max(0, this.passengerAnimTimer / 0.8);
      this.passengerRig.group.position.x = THREE.MathUtils.lerp(0.82, 0, p);
      this.passengerRig.group.position.y = Math.sin(p * Math.PI) * 0.2 - 0.56 * p;
      this.passengerRig.group.position.z = THREE.MathUtils.lerp(0.14, 0.04, p);
      animateRealisticHuman(this.passengerRig, p < 0.72 ? 'walking' : 'sitting', this.elapsed, 0.3, 1.5);
      if (this.passengerAnimTimer <= 0) {
        this.passengerTrip.status = 'riding';
        this.passengerRig.group.position.set(0, -0.56, 0.04);
        this.showEvent(`HOLD W TO DRIVE → ${this.passengerTrip.destinationRoadName.toUpperCase()}`);
        this.emitHud(true);
      }
    } else if (this.passengerTrip.status === 'riding' && this.passengerRig && this.activeDestStop) {
      this.passengerTrip.elapsedTripSec += dt;
      animateRealisticHuman(this.passengerRig, 'sitting', this.elapsed, 0.3);
      const route = findRouteBetween(
        this.playerX,
        this.playerZ,
        this.activeDestStop.segmentId,
        this.activeDestStop.x,
        this.activeDestStop.z
      );
      this.routePoints = route.points;
      this.passengerTrip.remainingMeters = route.distanceMeters;
      this.passengerTrip.turnHint = computeTurnInstruction(
        this.playerX,
        this.playerZ,
        this.playerYaw,
        route.points,
        this.activeDestStop.roadName
      );
    } else if (this.passengerTrip.status === 'alighting' && this.passengerRig) {
      this.passengerAnimTimer -= dt;
      const p = 1 - Math.max(0, this.passengerAnimTimer / 0.72);
      this.passengerRig.group.position.x = THREE.MathUtils.lerp(0, 1.15, p);
      this.passengerRig.group.position.y = THREE.MathUtils.lerp(-0.56, -0.25, p);
      animateRealisticHuman(this.passengerRig, 'walking', this.elapsed, 0.5, 1.6);
      if (this.passengerAnimTimer <= 0) {
        this.clearPassengerFromSeat();
      }
    }
  }

  private updateLightsAndHorizon(): void {
    this.sunLight.position.set(this.playerX + 20, 32, this.playerZ + 16);
    this.sunLight.target.position.set(this.playerX, 0, this.playerZ);
  }

  private updateTrafficGraph(dt: number): void {
    // 1. Advance vehicles along connected road segments & turn at intersections
    for (let i = 0; i < this.trafficPool.length; i++) {
      const a = this.trafficPool[i];
      if (!a.active) continue;
      const seg = SEGMENT_MAP[a.segmentId];
      if (!seg) continue;

      let desiredSpeed = a.baseSpeedMs;

      // Check ahead on same segment & same direction for safe spacing
      for (let j = 0; j < this.trafficPool.length; j++) {
        if (i === j) continue;
        const b = this.trafficPool[j];
        if (!b.active) continue;

        const dx = b.group.position.x - a.group.position.x;
        const dz = b.group.position.z - a.group.position.z;
        const dist = Math.hypot(dx, dz);
        const fx = -Math.sin(a.currentYaw);
        const fz = -Math.cos(a.currentYaw);
        const ahead = (dx * fx + dz * fz);
        const lateral = Math.abs(-dx * fz + dz * fx);
        const minGap = a.halfLength + b.halfLength + 3.2;

        if (ahead > 0 && ahead < minGap + 5 && lateral < a.halfWidth + b.halfWidth + 0.45) {
          desiredSpeed = Math.min(desiredSpeed, b.currentSpeedMs * 0.75);
          if (ahead < minGap) desiredSpeed = 0.2;
        } else if (dist < a.halfLength + b.halfLength + 0.5 && ahead > 0) {
          desiredSpeed = Math.min(desiredSpeed, 1.0);
        }
      }

      a.currentSpeedMs = THREE.MathUtils.damp(a.currentSpeedMs, desiredSpeed, 4.5, dt);
      a.laneOffset = THREE.MathUtils.damp(a.laneOffset, a.targetLaneOffset, 3.5, dt);

      const dProgress = (a.currentSpeedMs * dt) / seg.length;
      a.segProgress += a.segDir * dProgress;

      if (a.segProgress >= 0.96 && a.segDir === 1) {
        this.transitionTrafficAtNode(a, seg.nodeB, seg.id);
      } else if (a.segProgress <= 0.04 && a.segDir === -1) {
        this.transitionTrafficAtNode(a, seg.nodeA, seg.id);
      }

      const activeSeg = SEGMENT_MAP[a.segmentId];
      const clampedT = THREE.MathUtils.clamp(a.segProgress, 0.02, 0.98);
      const worldPos = getSegmentWorldPoint(activeSeg, clampedT, a.segDir, a.laneOffset);
      a.targetYaw = a.segDir === 1 ? activeSeg.yawAB : activeSeg.yawBA;
      a.currentYaw = dampAngle(a.currentYaw, a.targetYaw, 6.5, dt);

      a.group.position.set(worldPos.x, 0, worldPos.z);
      a.group.rotation.y = a.currentYaw;
      updateTrafficActorAnimation(a, this.elapsed, dt);
    }

    // 2. Pairwise XZ separation pass so traffic vehicles NEVER clip through each other
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < this.trafficPool.length; i++) {
        const a = this.trafficPool[i];
        if (!a.active) continue;
        const rA = Math.max(a.halfWidth, a.halfLength * 0.65);
        for (let j = i + 1; j < this.trafficPool.length; j++) {
          const b = this.trafficPool[j];
          if (!b.active) continue;
          const rB = Math.max(b.halfWidth, b.halfLength * 0.65);
          const dx = b.group.position.x - a.group.position.x;
          const dz = b.group.position.z - a.group.position.z;
          const dist = Math.hypot(dx, dz);
          const minDist = rA + rB + 0.35;
          if (dist < minDist && dist > 0.001) {
            const push = (minDist - dist) * 0.5;
            const nx = dx / dist;
            const nz = dz / dist;
            a.group.position.x -= nx * push;
            a.group.position.z -= nz * push;
            b.group.position.x += nx * push;
            b.group.position.z += nz * push;
          }
        }
      }
    }

    // 3. Player collision & near-miss check
    const playerRadius = 0.78;
    for (const actor of this.trafficPool) {
      if (!actor.active) continue;
      const ax = actor.group.position.x;
      const az = actor.group.position.z;
      const dx = this.playerX - ax;
      const dz = this.playerZ - az;
      const dist = Math.hypot(dx, dz);

      if (
        !actor.honked &&
        (actor.kind === 'bus' || actor.kind === 'cng' || actor.kind === 'moto') &&
        dist < 14 &&
        dist > 6
      ) {
        actor.honked = true;
        if (Math.random() < 0.35) soundEngine.playHorn(actor.kind);
      } else if (dist > 22) {
        actor.honked = false;
        actor.nearMissed = false;
      }

      const actorRadius = (actor.halfWidth + actor.halfLength) * 0.48;
      const hitDist = playerRadius + actorRadius;
      if (dist < hitDist && dist > 0.001) {
        const push = hitDist - dist + 0.25;
        const nx = dx / dist;
        const nz = dz / dist;
        const pushed = clampAndSlideOnRoad(this.playerX + nx * push, this.playerZ + nz * push);
        this.playerX = pushed.x;
        this.playerZ = pushed.z;

        if (this.invulnTimer <= 0) {
          this.handleCollision();
        }
        continue;
      }

      if (!actor.nearMissed && dist < hitDist + 0.95 && dist >= hitDist && this.speedMs > 5.2) {
        actor.nearMissed = true;
        this.nearMisses++;
        this.combo = Math.min(8, this.combo + 1);
        this.comboTimer = 3.8;
        const bonus = 30 * this.combo;
        this.fareTaka += bonus;
        this.walletTaka += bonus;
        soundEngine.playNearMiss();
        this.showEvent(`NEAR MISS ×${this.combo} +৳${bonus}`);
        this.emitHud(true);
      }
    }
  }

  private transitionTrafficAtNode(
    actor: TrafficActor,
    nodeId: string,
    cameFromSegId: string
  ): void {
    const node = CITY_NODES[nodeId];
    const conns = NODE_CONNECTIONS[nodeId] || [];
    const options = conns.filter((c) => c.segment.id !== cameFromSegId);

    // Pick another connected road at intersections, or U-turn at dead-ends
    if (options.length > 0 && !(node?.isTurnaround)) {
      const chosen = options[Math.floor(Math.random() * options.length)];
      actor.segmentId = chosen.segment.id;
      actor.segDir = chosen.entersAsDir;
      actor.segProgress = chosen.entersAsDir === 1 ? 0.05 : 0.95;
    } else {
      // U-turn back along the same road
      actor.segDir = actor.segDir === 1 ? -1 : 1;
      actor.segProgress = actor.segDir === 1 ? 0.05 : 0.95;
    }
    actor.targetLaneOffset = actor.kind === 'bus' ? 2.1 : LANE_OFFSET;
  }

  private handleCollision(): void {
    this.hearts -= 1;
    this.combo = 1;
    this.comboTimer = 0;
    this.invulnTimer = 1.5;
    this.hitstopTimer = 0.055;
    this.cameraShake = 0.85;
    this.speedMs = Math.max(1.8, this.speedMs * 0.45);

    soundEngine.playCrash();
    this.spawnBurst(this.playerX, 0.75, this.playerZ, 0xf59e0b, 12);

    if (this.hearts <= 0) {
      this.finishRun();
    } else {
      this.showEvent('COLLISION! WATCH TRAFFIC');
      this.emitHud(true);
    }
  }

  private updateCollectibles(dt: number): void {
    for (let i = 0; i < this.collectibles.length; i++) {
      const item = this.collectibles[i];
      if (!item.active) continue;
      item.group.rotation.y += 2.8 * dt;
      item.group.position.y = Math.sin(this.elapsed * 4.5 + i) * 0.09;

      const dist = Math.hypot(this.playerX - item.x, this.playerZ - item.z);
      if (dist < 1.35) {
        if (item.kind === 'taka') {
          const gain = 20 * this.combo;
          this.fareTaka += gain;
          this.walletTaka += gain;
          this.coinsCollected += 1;
          this.comboTimer = Math.max(this.comboTimer, 2.5);
          soundEngine.playCoin(this.combo);
          this.spawnBurst(item.x, 0.95, item.z, 0xfacc15, 11);
        } else {
          this.stamina = Math.min(100, this.stamina + 48);
          this.speedMs = Math.min(18.0, this.speedMs + 2.4);
          this.fareTaka += 25;
          this.walletTaka += 25;
          soundEngine.playTeaBoost();
          this.showEvent('GARAM CHA BOOST! +STAMINA');
          this.spawnBurst(item.x, 0.95, item.z, 0x34d399, 10);
        }

        // Respawn collectible on a different road far away
        const seg = CITY_SEGMENTS[Math.floor(Math.random() * CITY_SEGMENTS.length)];
        const pos = getSegmentWorldPoint(seg, 0.2 + Math.random() * 0.6, Math.random() < 0.5 ? 1 : -1, 1.9);
        item.x = pos.x;
        item.z = pos.z;
        item.group.position.set(pos.x, 0, pos.z);
        this.emitHud(true);
      }
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }
      p.vy -= 12 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      const s = 1 - p.life / p.maxLife;
      p.mesh.scale.setScalar(Math.max(0.05, s));
    }
  }

  private finishRun(): void {
    this.phase = 'gameover';
    this.heldKeys.clear();
    this.touchSteer = 0;
    this.touchBoost = false;
    this.touchBrake = false;
    soundEngine.setAmbience(false);
    soundEngine.setMusicActive(false);

    const dist = Math.round(this.distanceMeters);
    const isNewBest = this.fareTaka > this.bestFare || dist > this.bestDistance;
    if (this.fareTaka > this.bestFare) this.bestFare = this.fareTaka;
    if (dist > this.bestDistance) this.bestDistance = dist;

    const xpEarned = Math.round(dist * 0.08) + this.passengersServed * 35 + this.nearMisses * 10;

    this.emitHud(true);
    this.onGameOver({
      distanceMeters: dist,
      fareTaka: this.fareTaka,
      coinsCollected: this.coinsCollected,
      passengersServed: this.passengersServed,
      nearMisses: this.nearMisses,
      topSpeedKmh: this.topSpeedKmh,
      isNewBest,
      bestFare: this.bestFare,
      bestDistance: this.bestDistance,
      walletTaka: this.walletTaka,
      xpEarned,
    });
  }

  private emitHud(force: boolean): void {
    const now = performance.now();
    if (!force && now - this.lastHudEmit < 60) return;
    this.lastHudEmit = now;

    const currentSeg = getClosestSegmentAt(this.playerX, this.playerZ);

    let activeBlip: MapBlip | null = null;
    if (this.passengerTrip.status === 'waiting' && this.activePickupStop) {
      activeBlip = {
        kind: 'pickup',
        label: this.activePickupStop.zoneLabel,
        roadName: this.activePickupStop.roadName,
        x: this.activePickupStop.x,
        z: this.activePickupStop.z,
        distanceMeters: this.passengerTrip.remainingMeters,
      };
    } else if (this.passengerTrip.status === 'riding' && this.activeDestStop) {
      activeBlip = {
        kind: 'dropoff',
        label: this.activeDestStop.zoneLabel,
        roadName: this.activeDestStop.roadName,
        x: this.activeDestStop.x,
        z: this.activeDestStop.z,
        distanceMeters: this.passengerTrip.remainingMeters,
      };
    }

    const startZoneInfo =
      CITY_ZONES_CATALOG.find((z) => z.id === this.pendingZoneStart) || CITY_ZONES_CATALOG[0];

    this.onHudUpdate({
      phase: this.phase,
      distanceMeters: Math.round(this.distanceMeters),
      speedKmh: Math.round(this.speedMs * 3.6),
      fareTaka: this.fareTaka,
      walletTaka: this.walletTaka,
      coinsCollected: this.coinsCollected,
      passengersServed: this.passengersServed,
      hearts: this.hearts,
      maxHearts: this.maxHearts,
      stamina: Math.round(this.stamina),
      combo: this.combo,
      comboTimer: this.comboTimer / 3.8,
      nearMisses: this.nearMisses,
      bellCooldown: this.bellCooldown / 1.05,
      eventBanner: this.eventBanner,
      bestFare: this.bestFare,
      bestDistance: this.bestDistance,
      currentZoneId: this.phase === 'title' ? startZoneInfo.id : currentSeg.zoneId,
      currentZoneLabel: this.phase === 'title' ? startZoneInfo.name : currentSeg.zoneLabel,
      currentZoneBangla: this.phase === 'title' ? startZoneInfo.bangla : currentSeg.zoneBangla,
      currentRoadName: currentSeg.roadName,
      playerX: this.playerX,
      playerZ: this.playerZ,
      playerYaw: this.playerYaw,
      passengerTrip: { ...this.passengerTrip },
      activeBlip,
      routePoints: this.routePoints,
      autoBrakingHint: this.autoBrakingHint,
      characterId: this.characterId,
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    soundEngine.setAmbience(false);
    soundEngine.setMusicActive(false);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);

    const canvas = this.renderer.domElement;
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });

    this.textures.dispose();
    this.renderer.dispose();
    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
