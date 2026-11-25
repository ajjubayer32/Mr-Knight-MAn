import * as THREE from 'three';
import {
  animateRealisticHuman,
  createRealisticHuman,
  type HumanActivity,
  type RealisticHumanRig,
} from './models/human';
import type { ProceduralTexturePack } from './textures';
import type { MiniMapRoad, MymensinghZoneId } from './types';

export const ROAD_WIDTH = 12.4;
export const ROAD_HALF = ROAD_WIDTH / 2; // 6.2m
export const ROAD_DRIVE_HALF = 5.35;
export const LANE_OFFSET = 2.65; // Left-hand driving lane center offset

export interface CityNode {
  id: string;
  x: number;
  z: number;
  isTurnaround?: boolean;
  isBridgeEnd?: boolean;
}

export interface CitySegment {
  id: string;
  nodeA: string;
  nodeB: string;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  length: number;
  dirX: number; // unit vector A -> B
  dirZ: number;
  yawAB: number; // THREE rotation.y when moving A -> B (local forward is -Z)
  yawBA: number;
  roadName: string;
  banglaRoadName: string;
  zoneId: MymensinghZoneId;
  zoneLabel: string;
  zoneBangla: string;
  isBridge?: boolean;
}

export interface CityStop {
  id: string;
  segmentId: string;
  t: number; // 0.25..0.75 along segment
  x: number; // road stop center x
  z: number; // road stop center z
  curbX: number;
  curbZ: number;
  curbYaw: number;
  roadName: string;
  zoneId: MymensinghZoneId;
  zoneLabel: string;
  isSpecial?: boolean;
}

export interface PedestrianAgent {
  rig: RealisticHumanRig;
  activity: HumanActivity;
  baseX: number;
  baseZ: number;
  axis: 'x' | 'z';
  walkDir: number;
  walkSpeed: number;
  minLimit: number;
  maxLimit: number;
  phaseOffset: number;
  isCrossing?: boolean;
}

export interface CityWorldData {
  group: THREE.Group;
  pedestrians: PedestrianAgent[];
}

export const CITY_NODES: Record<string, CityNode> = {
  n_branch_w: { id: 'n_branch_w', x: -140, z: 0, isTurnaround: true },
  n_cw: { id: 'n_cw', x: -90, z: 0 },
  n_cc: { id: 'n_cc', x: 0, z: 0 },
  n_ce: { id: 'n_ce', x: 90, z: 0 },
  n_bridge_end: { id: 'n_bridge_end', x: 175, z: 0, isTurnaround: true, isBridgeEnd: true },

  n_nw: { id: 'n_nw', x: -90, z: -80 },
  n_nc: { id: 'n_nc', x: 0, z: -80 },
  n_ne: { id: 'n_ne', x: 90, z: -80 },

  n_sw: { id: 'n_sw', x: -90, z: 80 },
  n_sc: { id: 'n_sc', x: 0, z: 80 },
  n_se: { id: 'n_se', x: 90, z: 80 },
  n_branch_s: { id: 'n_branch_s', x: 0, z: 128, isTurnaround: true },
};

interface SegmentSeed {
  id: string;
  nodeA: string;
  nodeB: string;
  roadName: string;
  banglaRoadName: string;
  zoneId: MymensinghZoneId;
  zoneLabel: string;
  zoneBangla: string;
  isBridge?: boolean;
}

const SEGMENT_SEEDS: SegmentSeed[] = [
  {
    id: 'seg_townhall_branch',
    nodeA: 'n_branch_w',
    nodeB: 'n_cw',
    roadName: 'Museum Side Lane',
    banglaRoadName: 'জাদুঘর লেন',
    zoneId: 'townhall',
    zoneLabel: 'Town Hall Road',
    zoneBangla: 'টাউন হল রোড',
  },
  {
    id: 'seg_townhall_ave',
    nodeA: 'n_cw',
    nodeB: 'n_cc',
    roadName: 'Town Hall Heritage Ave',
    banglaRoadName: 'টাউন হল রোড',
    zoneId: 'townhall',
    zoneLabel: 'Town Hall Road',
    zoneBangla: 'টাউন হল রোড',
  },
  {
    id: 'seg_ganginarpar_main',
    nodeA: 'n_cc',
    nodeB: 'n_ce',
    roadName: 'Ganginarpar Main Road',
    banglaRoadName: 'গাঙ্গিনারপাড় মোড়',
    zoneId: 'ganginarpar',
    zoneLabel: 'Ganginarpar',
    zoneBangla: 'গাঙ্গিনারপাড় মোড়',
  },
  {
    id: 'seg_shambhuganj_bridge',
    nodeA: 'n_ce',
    nodeB: 'n_bridge_end',
    roadName: 'Shambhuganj Bridge Rd',
    banglaRoadName: 'শম্ভুগঞ্জ ব্রিজ',
    zoneId: 'bridge',
    zoneLabel: 'Shambhuganj Bridge',
    zoneBangla: 'শম্ভুগঞ্জ ব্রিজ',
    isBridge: true,
  },
  {
    id: 'seg_charpara_central',
    nodeA: 'n_cc',
    nodeB: 'n_sc',
    roadName: 'Charpara Central Road',
    banglaRoadName: 'চরপাড়া রোড',
    zoneId: 'charpara',
    zoneLabel: 'Charpara · Station Rd',
    zoneBangla: 'চরপাড়া ও স্টেশন রোড',
  },
  {
    id: 'seg_medical_more',
    nodeA: 'n_nc',
    nodeB: 'n_cc',
    roadName: 'Medical More Cross Rd',
    banglaRoadName: 'মেডিকেল মোড় রোড',
    zoneId: 'charpara',
    zoneLabel: 'Charpara · Station Rd',
    zoneBangla: 'চরপাড়া ও স্টেশন রোড',
  },
  {
    id: 'seg_station_bazaar',
    nodeA: 'n_sc',
    nodeB: 'n_branch_s',
    roadName: 'Station Bazaar Branch',
    banglaRoadName: 'স্টেশন বাজার লেন',
    zoneId: 'charpara',
    zoneLabel: 'Charpara · Station Rd',
    zoneBangla: 'চরপাড়া ও স্টেশন রোড',
  },
  {
    id: 'seg_zila_school',
    nodeA: 'n_sw',
    nodeB: 'n_sc',
    roadName: 'Zila School South Rd',
    banglaRoadName: 'জিলা স্কুল রোড',
    zoneId: 'townhall',
    zoneLabel: 'Town Hall Road',
    zoneBangla: 'টাউন হল রোড',
  },
  {
    id: 'seg_charpara_station',
    nodeA: 'n_sc',
    nodeB: 'n_se',
    roadName: 'Charpara Station Road',
    banglaRoadName: 'চরপাড়া স্টেশন রোড',
    zoneId: 'charpara',
    zoneLabel: 'Charpara · Station Rd',
    zoneBangla: 'চরপাড়া ও স্টেশন রোড',
  },
  {
    id: 'seg_circuit_house',
    nodeA: 'n_cw',
    nodeB: 'n_sw',
    roadName: 'Circuit House Road',
    banglaRoadName: 'সার্কিট হাউস রোড',
    zoneId: 'townhall',
    zoneLabel: 'Town Hall Road',
    zoneBangla: 'টাউন হল রোড',
  },
  {
    id: 'seg_townhall_north',
    nodeA: 'n_nw',
    nodeB: 'n_cw',
    roadName: 'Town Hall North Ave',
    banglaRoadName: 'টাউন হল উত্তর',
    zoneId: 'townhall',
    zoneLabel: 'Town Hall Road',
    zoneBangla: 'টাউন হল রোড',
  },
  {
    id: 'seg_kachari_park',
    nodeA: 'n_nw',
    nodeB: 'n_nc',
    roadName: 'Kachari Park Road',
    banglaRoadName: 'কাচারি পার্ক রোড',
    zoneId: 'ganginarpar',
    zoneLabel: 'Ganginarpar',
    zoneBangla: 'গাঙ্গিনারপাড় মোড়',
  },
  {
    id: 'seg_brahmaputra_bund',
    nodeA: 'n_nc',
    nodeB: 'n_ne',
    roadName: 'Brahmaputra Bund Rd',
    banglaRoadName: 'ব্রহ্মপুত্র পাড় রোড',
    zoneId: 'ganginarpar',
    zoneLabel: 'Ganginarpar',
    zoneBangla: 'গাঙ্গিনারপাড় মোড়',
  },
  {
    id: 'seg_kachari_bazar',
    nodeA: 'n_ne',
    nodeB: 'n_ce',
    roadName: 'Kachari Bazar Road',
    banglaRoadName: 'কাচারি বাজার রোড',
    zoneId: 'ganginarpar',
    zoneLabel: 'Ganginarpar',
    zoneBangla: 'গাঙ্গিনারপাড় মোড়',
  },
  {
    id: 'seg_swadeshi_bazar',
    nodeA: 'n_ce',
    nodeB: 'n_se',
    roadName: 'Swadeshi Bazar Rd',
    banglaRoadName: 'স্বদেশী বাজার রোড',
    zoneId: 'ganginarpar',
    zoneLabel: 'Ganginarpar',
    zoneBangla: 'গাঙ্গিনারপাড় মোড়',
  },
];

export const CITY_SEGMENTS: CitySegment[] = SEGMENT_SEEDS.map((seed) => {
  const a = CITY_NODES[seed.nodeA];
  const b = CITY_NODES[seed.nodeB];
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const length = Math.hypot(dx, dz);
  const dirX = dx / length;
  const dirZ = dz / length;
  // Forward vector of yaw is (-sin(yaw), 0, -cos(yaw))
  const yawAB = Math.atan2(-dirX, -dirZ);
  const yawBA = Math.atan2(dirX, dirZ);
  return {
    ...seed,
    x1: a.x,
    z1: a.z,
    x2: b.x,
    z2: b.z,
    length,
    dirX,
    dirZ,
    yawAB,
    yawBA,
  };
});

export const SEGMENT_MAP: Record<string, CitySegment> = Object.fromEntries(
  CITY_SEGMENTS.map((s) => [s.id, s])
);

export const MINI_MAP_ROADS: MiniMapRoad[] = CITY_SEGMENTS.map((s) => ({
  x1: s.x1,
  z1: s.z1,
  x2: s.x2,
  z2: s.z2,
  isBridge: s.isBridge,
}));

// Adjacency map: nodeId -> list of { segment, endAtNode: 'A' | 'B' }
export const NODE_CONNECTIONS: Record<
  string,
  Array<{ segment: CitySegment; entersAsDir: 1 | -1 }>
> = {};

for (const nodeId of Object.keys(CITY_NODES)) {
  NODE_CONNECTIONS[nodeId] = [];
}
for (const seg of CITY_SEGMENTS) {
  NODE_CONNECTIONS[seg.nodeA].push({ segment: seg, entersAsDir: 1 });
  NODE_CONNECTIONS[seg.nodeB].push({ segment: seg, entersAsDir: -1 });
}

function makeStop(
  id: string,
  segmentId: string,
  t: number,
  sideSign: 1 | -1 = 1,
  isSpecial = false
): CityStop {
  const seg = SEGMENT_MAP[segmentId];
  const x = THREE.MathUtils.lerp(seg.x1, seg.x2, t);
  const z = THREE.MathUtils.lerp(seg.z1, seg.z2, t);
  // Right perpendicular of dir(A->B) is (-dirZ, dirX)
  const perpX = -seg.dirZ * sideSign;
  const perpZ = seg.dirX * sideSign;
  const stopX = x + perpX * (ROAD_HALF - 1.55);
  const stopZ = z + perpZ * (ROAD_HALF - 1.55);
  const curbX = x + perpX * (ROAD_HALF + 0.85);
  const curbZ = z + perpZ * (ROAD_HALF + 0.85);
  // Facing toward the road (-perpX, -perpZ) since human forward is -Z
  const curbYaw = Math.atan2(perpX, perpZ);
  return {
    id,
    segmentId,
    t,
    x: stopX,
    z: stopZ,
    curbX,
    curbZ,
    curbYaw,
    roadName: seg.roadName,
    zoneId: seg.zoneId,
    zoneLabel: seg.zoneLabel,
    isSpecial,
  };
}

export const CITY_STOPS: CityStop[] = [
  makeStop('stop_ganginarpar', 'seg_ganginarpar_main', 0.45, 1),
  makeStop('stop_townhall', 'seg_townhall_ave', 0.55, -1),
  makeStop('stop_townhall_lane', 'seg_townhall_branch', 0.5, 1),
  makeStop('stop_charpara_central', 'seg_charpara_central', 0.48, 1),
  makeStop('stop_charpara_station', 'seg_charpara_station', 0.52, -1),
  makeStop('stop_station_bazaar', 'seg_station_bazaar', 0.55, 1),
  makeStop('stop_medical_more', 'seg_medical_more', 0.42, -1),
  makeStop('stop_zila_school', 'seg_zila_school', 0.5, 1),
  makeStop('stop_kachari_bazar', 'seg_kachari_bazar', 0.45, -1),
  makeStop('stop_swadeshi_bazar', 'seg_swadeshi_bazar', 0.52, 1),
  makeStop('stop_brahmaputra_bund', 'seg_brahmaputra_bund', 0.55, -1),
  makeStop('stop_bridge_east', 'seg_shambhuganj_bridge', 0.72, 1, true),
];

// ============================================================================
// LARGE GENDER-MATCHED BENGALI PASSENGER NAME POOL (NON-REPEATING SHUFFLE BAG)
// ============================================================================
const MALE_PASSENGER_NAMES = [
  'রাকিব (Rakib)',
  'সোহেল (Sohail)',
  'হাসান (Hasan)',
  'নাঈম (Naim)',
  'রিফাত (Rifat)',
  'তানভীর (Tanvir)',
  'ইমরান (Imran)',
  'মাহমুদ (Mahmud)',
  'আশিক (Ashik)',
  'রাশেদ (Rashed)',
  'কামরুল (Kamrul)',
  'জাহিদ (Jahid)',
  'সাগর (Sagor)',
  'নাহিদ (Nahid)',
  'রহিম (Rahim)',
  'ফারুক (Faruk)',
  'শফিক (Shafiq)',
  'তৌহিদ (Towhid)',
  'আরিফ (Arif)',
  'মামুন (Mamun)',
  'সবুজ (Sabuj)',
  'হৃদয় (Hridoy)',
  'শাওন (Shaon)',
  'রানা (Rana)',
];

const FEMALE_PASSENGER_NAMES = [
  'মিম (Mim)',
  'তানিয়া (Tania)',
  'সুমাইয়া (Sumaiya)',
  'নুসরাত (Nusrat)',
  'জুঁই (Jui)',
  'ফারহানা (Farhana)',
  'শায়লা (Shayla)',
  'মেহজাবীন (Mehjabin)',
  'আফসানা (Afsana)',
  'সাদিয়া (Sadia)',
  'লামিয়া (Lamia)',
  'নাদিয়া (Nadia)',
  'রুবিনা (Rubina)',
  'সালমা (Salma)',
  'তাসনিম (Tasnim)',
  'জান্নাত (Jannat)',
  'মিতু (Mitu)',
  'রিয়া (Riya)',
  'নাসরিন (Nasrin)',
  'শারমিন (Sharmin)',
  'অর্পিতা (Orpita)',
  'বৃষ্টি (Brishti)',
  'মৌসুমী (Mousumi)',
  'আনিকা (Anika)',
];

let maleBag: string[] = [];
let femaleBag: string[] = [];
let lastMaleName = '';
let lastFemaleName = '';

function refillBag(pool: string[], last: string): string[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  if (copy[0] === last && copy.length > 1) {
    [copy[0], copy[copy.length - 1]] = [copy[copy.length - 1], copy[0]];
  }
  return copy;
}

export function pickPassengerIdentity(forcedGender?: 'male' | 'female'): {
  gender: 'male' | 'female';
  name: string;
} {
  const gender = forcedGender ?? (Math.random() < 0.5 ? 'male' : 'female');
  if (gender === 'male') {
    if (maleBag.length === 0) maleBag = refillBag(MALE_PASSENGER_NAMES, lastMaleName);
    const name = maleBag.pop()!;
    lastMaleName = name;
    return { gender, name };
  } else {
    if (femaleBag.length === 0) femaleBag = refillBag(FEMALE_PASSENGER_NAMES, lastFemaleName);
    const name = femaleBag.pop()!;
    lastFemaleName = name;
    return { gender, name };
  }
}

// ============================================================================
// SPATIAL QUERIES, COLLISION SLIDING & ROUTE FINDER
// ============================================================================

export function getSegmentWorldPoint(
  seg: CitySegment,
  t: number,
  segDir: 1 | -1,
  laneOffset: number
): { x: number; z: number } {
  const cx = THREE.MathUtils.lerp(seg.x1, seg.x2, t);
  const cz = THREE.MathUtils.lerp(seg.z1, seg.z2, t);
  // Forward is dir * segDir; left-side driving offset in local right-normal
  const fx = seg.dirX * segDir;
  const fz = seg.dirZ * segDir;
  // Right-hand perpendicular of forward (fx, fz) is (-fz, fx)
  const rx = -fz;
  const rz = fx;
  // Left lane = -rx * laneOffset (Bangladesh left-hand traffic!)
  return {
    x: cx - rx * laneOffset,
    z: cz - rz * laneOffset,
  };
}

export function getClosestSegmentAt(x: number, z: number): CitySegment {
  let bestSeg = CITY_SEGMENTS[0];
  let bestDistSq = Infinity;
  for (const seg of CITY_SEGMENTS) {
    const t = THREE.MathUtils.clamp(
      ((x - seg.x1) * seg.dirX + (z - seg.z1) * seg.dirZ) / seg.length,
      0,
      1
    );
    const px = seg.x1 + seg.dirX * t * seg.length;
    const pz = seg.z1 + seg.dirZ * t * seg.length;
    const dSq = (x - px) * (x - px) + (z - pz) * (z - pz);
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestSeg = seg;
    }
  }
  return bestSeg;
}

export function clampAndSlideOnRoad(
  x: number,
  z: number
): { x: number; z: number; hitCurb: boolean } {
  let bestX = x;
  let bestZ = z;
  let bestDistSq = Infinity;

  // Check axis-aligned segment capsules + intersection squares
  for (const seg of CITY_SEGMENTS) {
    const minX = Math.min(seg.x1, seg.x2) - ROAD_DRIVE_HALF;
    const maxX = Math.max(seg.x1, seg.x2) + ROAD_DRIVE_HALF;
    const minZ = Math.min(seg.z1, seg.z2) - ROAD_DRIVE_HALF;
    const maxZ = Math.max(seg.z1, seg.z2) + ROAD_DRIVE_HALF;

    if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
      return { x, z, hitCurb: false };
    }

    const cx = THREE.MathUtils.clamp(x, minX, maxX);
    const cz = THREE.MathUtils.clamp(z, minZ, maxZ);
    const dSq = (x - cx) * (x - cx) + (z - cz) * (z - cz);
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestX = cx;
      bestZ = cz;
    }
  }

  // Also check U-turn turnaround plazas at dead-end branches
  for (const node of Object.values(CITY_NODES)) {
    if (!node.isTurnaround) continue;
    const rad = 8.4;
    const dx = x - node.x;
    const dz = z - node.z;
    const dist = Math.hypot(dx, dz);
    if (dist <= rad) {
      return { x, z, hitCurb: false };
    }
    const cx = node.x + (dx / dist) * rad;
    const cz = node.z + (dz / dist) * rad;
    const dSq = (x - cx) * (x - cx) + (z - cz) * (z - cz);
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestX = cx;
      bestZ = cz;
    }
  }

  return { x: bestX, z: bestZ, hitCurb: bestDistSq > 0.0001 };
}

export function findRouteBetween(
  fromX: number,
  fromZ: number,
  toSegId: string,
  toX: number,
  toZ: number
): { points: Array<{ x: number; z: number }>; distanceMeters: number } {
  const startSeg = getClosestSegmentAt(fromX, fromZ);
  if (startSeg.id === toSegId) {
    return {
      points: [
        { x: fromX, z: fromZ },
        { x: toX, z: toZ },
      ],
      distanceMeters: Math.round(Math.hypot(toX - fromX, toZ - fromZ)),
    };
  }

  // BFS on nodes starting from startSeg's two endpoints
  const visitedNodes = new Set<string>();
  const parent = new Map<string, string | null>();
  const queue: string[] = [];

  for (const nId of [startSeg.nodeA, startSeg.nodeB]) {
    visitedNodes.add(nId);
    parent.set(nId, null);
    queue.push(nId);
  }

  const targetSeg = SEGMENT_MAP[toSegId];
  let reachedNode: string | null = null;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === targetSeg.nodeA || curr === targetSeg.nodeB) {
      reachedNode = curr;
      break;
    }
    for (const conn of NODE_CONNECTIONS[curr]) {
      const nextNode =
        conn.segment.nodeA === curr ? conn.segment.nodeB : conn.segment.nodeA;
      if (!visitedNodes.has(nextNode)) {
        visitedNodes.add(nextNode);
        parent.set(nextNode, curr);
        queue.push(nextNode);
      }
    }
  }

  const nodePath: string[] = [];
  let cursor = reachedNode;
  while (cursor) {
    nodePath.unshift(cursor);
    cursor = parent.get(cursor) ?? null;
  }

  // Prune redundant first node if player is closer to second node or segment crosses
  const rawPoints: Array<{ x: number; z: number }> = [{ x: fromX, z: fromZ }];
  for (const nId of nodePath) {
    const n = CITY_NODES[nId];
    rawPoints.push({ x: n.x, z: n.z });
  }
  rawPoints.push({ x: toX, z: toZ });

  // Clean tiny duplicate segments
  const points: Array<{ x: number; z: number }> = [rawPoints[0]];
  for (let i = 1; i < rawPoints.length; i++) {
    const prev = points[points.length - 1];
    if (Math.hypot(rawPoints[i].x - prev.x, rawPoints[i].z - prev.z) > 2.5) {
      points.push(rawPoints[i]);
    }
  }
  if (points.length === 1) points.push({ x: toX, z: toZ });

  let totalDist = 0;
  for (let i = 1; i < points.length; i++) {
    totalDist += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
  }

  return { points, distanceMeters: Math.max(1, Math.round(totalDist)) };
}

export function computeTurnInstruction(
  playerX: number,
  playerZ: number,
  playerYaw: number,
  routePoints: Array<{ x: number; z: number }>,
  destRoadName: string
): string {
  if (routePoints.length < 2) return `Ahead on ${destRoadName}`;
  const target = routePoints[1];
  const dx = target.x - playerX;
  const dz = target.z - playerZ;
  const dist = Math.hypot(dx, dz);
  const fx = -Math.sin(playerYaw);
  const fz = -Math.cos(playerYaw);
  const rx = Math.cos(playerYaw);
  const rz = -Math.sin(playerYaw);

  const forwardDot = (dx / Math.max(dist, 0.01)) * fx + (dz / Math.max(dist, 0.01)) * fz;
  const rightDot = (dx / Math.max(dist, 0.01)) * rx + (dz / Math.max(dist, 0.01)) * rz;

  if (forwardDot < -0.55) {
    return 'Make a U-Turn';
  }
  if (Math.abs(rightDot) > 0.48 && dist < 42) {
    return rightDot > 0 ? 'Turn Right ahead' : 'Turn Left ahead';
  }
  if (routePoints.length >= 3 && dist < 35) {
    const nextSeg = routePoints[2];
    const ndx = nextSeg.x - target.x;
    const ndz = nextSeg.z - target.z;
    const nLen = Math.hypot(ndx, ndz) || 1;
    const nextRight = (ndx / nLen) * rx + (ndz / nLen) * rz;
    if (nextRight > 0.45) return `Turn Right (${Math.round(dist)}m)`;
    if (nextRight < -0.45) return `Turn Left (${Math.round(dist)}m)`;
  }
  return `Continue Straight (${Math.round(dist)}m)`;
}

// ============================================================================
// 3D CITY BUILDER (OPEN CONNECTED ROADS, LANDMARKS, SHOPS, PALMS, RIVER)
// ============================================================================

function createCoconutPalm(seed: number): THREE.Group {
  const palm = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b513e, roughness: 0.92 });
  const frondMat = new THREE.MeshStandardMaterial({
    color: seed % 2 === 0 ? 0x2f7d32 : 0x3a8d38,
    roughness: 0.72,
    side: THREE.DoubleSide,
  });

  const height = 6.2 + (seed % 3) * 0.8;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3((seed % 2 === 0 ? 1 : -1) * 0.25, height * 0.45, 0.1),
    new THREE.Vector3((seed % 2 === 0 ? 1 : -1) * 0.52, height, 0.2),
  ]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.16, 7, false), trunkMat);
  trunk.castShadow = true;
  palm.add(trunk);

  const topPos = curve.getPoint(1);
  const frondGeo = new THREE.ConeGeometry(0.42, 2.5, 5);
  frondGeo.scale(1, 1, 0.16);
  frondGeo.translate(0, 1.15, 0);
  frondGeo.rotateX(Math.PI * 0.38);

  for (let i = 0; i < 6; i++) {
    const frond = new THREE.Mesh(frondGeo, frondMat);
    frond.position.copy(topPos);
    frond.rotation.y = (i / 6) * Math.PI * 2 + seed * 0.4;
    frond.rotation.z = 0.14;
    frond.castShadow = true;
    palm.add(frond);
  }
  return palm;
}

function createRainTree(seed: number): THREE.Group {
  const tree = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x544032, roughness: 0.92 });
  const foliageMat = new THREE.MeshStandardMaterial({
    color: seed % 2 === 0 ? 0x2e6f34 : 0x397c36,
    roughness: 0.86,
  });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.36, 3.2, 8), trunkMat);
  trunk.position.y = 1.6;
  trunk.castShadow = true;
  tree.add(trunk);

  const puffs: Array<[number, number, number, number]> = [
    [0, 4.0, 0, 1.85],
    [-1.15, 3.55, 0.55, 1.3],
    [1.1, 3.65, -0.45, 1.35],
  ];
  for (const [px, py, pz, r] of puffs) {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), foliageMat);
    crown.position.set(px, py, pz);
    crown.scale.y = 0.72;
    crown.castShadow = true;
    tree.add(crown);
  }
  return tree;
}

function createElectricPole(): THREE.Group {
  const poleGroup = new THREE.Group();
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.88 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.5, metalness: 0.7 });
  const lampGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfff3c4,
    emissive: 0xffc107,
    emissiveIntensity: 0.35,
  });

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 7.2, 8), concreteMat);
  mast.position.y = 3.6;
  mast.castShadow = true;
  poleGroup.add(mast);

  const crossArm = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.1, 0.1), steelMat);
  crossArm.position.y = 6.8;
  poleGroup.add(crossArm);

  const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.22), lampGlowMat);
  lampHead.position.set(-0.65, 6.2, 0);
  poleGroup.add(lampHead);

  return poleGroup;
}

function createRoadsideBuilding(
  textures: ProceduralTexturePack,
  seed: number,
  zoneId: MymensinghZoneId
): THREE.Group {
  const bldg = new THREE.Group();
  const facadeIndex =
    zoneId === 'townhall' && seed % 2 === 0 ? 4 : seed % textures.buildingFacades.length;
  const facadeTex = textures.buildingFacades[facadeIndex];
  const signTex = textures.shopSigns[seed % textures.shopSigns.length];

  const isSmallShop = seed % 4 === 0;
  const width = isSmallShop ? 5.6 : 7.8 + (seed % 3) * 1.4;
  const height = isSmallShop ? 3.9 : 7.2 + (seed % 4) * 2.1;
  const depth = isSmallShop ? 5.0 : 7.2;

  const facadeMat = new THREE.MeshStandardMaterial({ map: facadeTex, roughness: 0.84 });
  const sideWallMat = new THREE.MeshStandardMaterial({
    color: [0xc58b71, 0xb8c2ae, 0xd4b98d, 0xa8bac7, 0x9f4a3c][facadeIndex],
    roughness: 0.9,
  });

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    [sideWallMat, sideWallMat, sideWallMat, sideWallMat, facadeMat, facadeMat]
  );
  box.position.y = height / 2;
  box.castShadow = true;
  box.receiveShadow = true;
  bldg.add(box);

  // Shop awning + Bangla signboard on front (+Z & -Z)
  const awningColor = [0x1565c0, 0xb91c1c, 0x0f766e, 0xd97706][seed % 4];
  const awningMat = new THREE.MeshStandardMaterial({ color: awningColor, roughness: 0.55 });
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 });
  for (const s of [-1, 1]) {
    const awning = new THREE.Mesh(new THREE.BoxGeometry(width - 0.5, 0.1, 1.5), awningMat);
    awning.position.set(0, 3.1, s * (depth / 2 + 0.65));
    awning.rotation.x = s * 0.24;
    bldg.add(awning);

    const sign = new THREE.Mesh(new THREE.BoxGeometry(Math.min(width - 0.8, 5.0), 1.3, 0.14), signMat);
    sign.position.set(0, 3.95, s * (depth / 2 + 0.12));
    bldg.add(sign);
  }

  return bldg;
}

function createLandmarkGantry(textures: ProceduralTexturePack, zoneId: MymensinghZoneId): THREE.Group {
  const gantry = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.45, metalness: 0.72 });

  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 6.0, 8), steelMat);
    pillar.position.set(side * (ROAD_HALF + 0.45), 3.0, 0);
    pillar.castShadow = true;
    gantry.add(pillar);
  }

  const beam = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH + 1.2, 0.22, 0.22), steelMat);
  beam.position.set(0, 5.8, 0);
  gantry.add(beam);

  const signTex = textures.landmarkSigns[zoneId];
  const boardMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.35 });
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(6.6, 1.95, 0.16),
    [steelMat, steelMat, steelMat, steelMat, boardMat, boardMat]
  );
  board.position.set(0, 5.25, 0.1);
  board.castShadow = true;
  gantry.add(board);

  return gantry;
}

function isNearAnyRoad(x: number, z: number, pad: number): boolean {
  for (const seg of CITY_SEGMENTS) {
    const minX = Math.min(seg.x1, seg.x2) - ROAD_HALF - pad;
    const maxX = Math.max(seg.x1, seg.x2) + ROAD_HALF + pad;
    const minZ = Math.min(seg.z1, seg.z2) - ROAD_HALF - pad;
    const maxZ = Math.max(seg.z1, seg.z2) + ROAD_HALF + pad;
    if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) return true;
  }
  return false;
}

export function buildCityWorld(textures: ProceduralTexturePack): CityWorldData {
  const group = new THREE.Group();
  const pedestrians: PedestrianAgent[] = [];

  // 1. Base Earth Ground (covering West/Central/South/North city, stopping before Brahmaputra river X=105)
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x6f684e, roughness: 0.96 });
  const cityGround = new THREE.Mesh(new THREE.PlaneGeometry(290, 290), soilMat);
  cityGround.rotation.x = -Math.PI / 2;
  cityGround.position.set(-40, -0.04, 10);
  cityGround.receiveShadow = true;
  group.add(cityGround);

  // 2. Brahmaputra River on East side (under & around Shambhuganj Bridge X=105..240)
  const riverMat = new THREE.MeshStandardMaterial({
    map: textures.waterRipples,
    roughness: 0.28,
    metalness: 0.35,
  });
  const river = new THREE.Mesh(new THREE.PlaneGeometry(140, 280), riverMat);
  river.rotation.x = -Math.PI / 2;
  river.position.set(175, -2.2, 0);
  group.add(river);

  const curbMat = new THREE.MeshStandardMaterial({ map: textures.curb, roughness: 0.85 });
  const sidewalkMat = new THREE.MeshStandardMaterial({ map: textures.sidewalk, roughness: 0.9 });
  const roadMat = new THREE.MeshStandardMaterial({ map: textures.road, roughness: 0.88, metalness: 0.04 });
  const interMat = new THREE.MeshStandardMaterial({
    map: textures.intersectionRoad,
    roughness: 0.88,
    metalness: 0.04,
  });
  const zebraMat = new THREE.MeshBasicMaterial({
    map: textures.zebraCrossing,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  const bridgeConcreteMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.85 });
  const bridgeRailMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45, metalness: 0.5 });

  // 3. Build Each Intersection Pad & U-Turn Plaza
  for (const node of Object.values(CITY_NODES)) {
    if (node.isTurnaround) {
      const plaza = new THREE.Mesh(new THREE.CircleGeometry(9.4, 28), interMat);
      plaza.rotation.x = -Math.PI / 2;
      plaza.position.set(node.x, 0.004, node.z);
      plaza.receiveShadow = true;
      group.add(plaza);

      // U-turn ring marking
      const uRing = new THREE.Mesh(
        new THREE.RingGeometry(4.8, 5.25, 28),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
      );
      uRing.rotation.x = -Math.PI / 2;
      uRing.position.set(node.x, 0.015, node.z);
      group.add(uRing);
    } else {
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_WIDTH), interMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(node.x, 0.003, node.z);
      pad.receiveShadow = true;
      group.add(pad);
    }
  }

  // 4. Build Road Segments Between Intersections
  CITY_SEGMENTS.forEach((seg, segIdx) => {
    const startTrim = ROAD_HALF;
    const endTrim = ROAD_HALF;
    const pavedLen = Math.max(8, seg.length - startTrim - endTrim);
    const midX = (seg.x1 + seg.x2) / 2;
    const midZ = (seg.z1 + seg.z2) / 2;

    // Tiled 24m road texture strips so markings look crisp at any segment length
    const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH, pavedLen), roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.rotation.z = seg.yawAB;
    roadMesh.position.set(midX, 0.001, midZ);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // Zebra crossings at intersection entries
    if (!seg.isBridge) {
      for (const offsetDist of [ROAD_HALF + 2.2, seg.length - ROAD_HALF - 2.2]) {
        const zx = seg.x1 + seg.dirX * offsetDist;
        const zz = seg.z1 + seg.dirZ * offsetDist;
        const zebra = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_WIDTH - 0.8, 2.8), zebraMat);
        zebra.rotation.x = -Math.PI / 2;
        zebra.rotation.z = seg.yawAB;
        zebra.position.set(zx, 0.014, zz);
        group.add(zebra);
      }
    }

    // Bridge Parapets & Railings or Urban Curbs + Sidewalks + Poles
    const perpX = -seg.dirZ;
    const perpZ = seg.dirX;

    if (seg.isBridge) {
      for (const s of [-1, 1]) {
        const parapet = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.72, pavedLen), bridgeConcreteMat);
        parapet.position.set(midX + perpX * s * (ROAD_HALF + 0.45), 0.36, midZ + perpZ * s * (ROAD_HALF + 0.45));
        parapet.rotation.y = seg.yawAB;
        group.add(parapet);

        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, pavedLen), bridgeRailMat);
        rail.position.set(midX + perpX * s * (ROAD_HALF + 0.45), 1.18, midZ + perpZ * s * (ROAD_HALF + 0.45));
        rail.rotation.y = seg.yawAB;
        group.add(rail);
      }
    } else {
      for (const s of [-1, 1]) {
        const curb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, pavedLen), curbMat);
        curb.position.set(midX + perpX * s * (ROAD_HALF + 0.16), 0.08, midZ + perpZ * s * (ROAD_HALF + 0.16));
        curb.rotation.y = seg.yawAB;
        group.add(curb);

        const sw = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, pavedLen), sidewalkMat);
        sw.position.set(midX + perpX * s * (ROAD_HALF + 1.62), 0.07, midZ + perpZ * s * (ROAD_HALF + 1.62));
        sw.rotation.y = seg.yawAB;
        sw.receiveShadow = true;
        group.add(sw);
      }

      // Electric poles & trees along segment margins
      const numSlots = Math.floor(pavedLen / 22);
      for (let k = 0; k < numSlots; k++) {
        const distAlong = ROAD_HALF + 8 + k * 21;
        const px = seg.x1 + seg.dirX * distAlong;
        const pz = seg.z1 + seg.dirZ * distAlong;
        const side = (k + segIdx) % 2 === 0 ? 1 : -1;

        const pole = createElectricPole();
        pole.position.set(px + perpX * side * (ROAD_HALF + 0.65), 0, pz + perpZ * side * (ROAD_HALF + 0.65));
        pole.rotation.y = seg.yawAB + (side > 0 ? 0 : Math.PI);
        group.add(pole);

        // Roadside tree or building set cleanly back inside the city block
        const bldgX = px + perpX * side * (ROAD_HALF + 7.4);
        const bldgZ = pz + perpZ * side * (ROAD_HALF + 7.4);
        if (!isNearAnyRoad(bldgX, bldgZ, 2.2)) {
          const seed = segIdx * 13 + k * 5;
          if ((seed % 3 === 0) || (seg.zoneId === 'townhall' && k % 2 === 1)) {
            const tree = seed % 2 === 0 ? createCoconutPalm(seed) : createRainTree(seed);
            tree.position.set(
              px + perpX * side * (ROAD_HALF + 4.2),
              0,
              pz + perpZ * side * (ROAD_HALF + 4.2)
            );
            group.add(tree);
          } else {
            const bldg = createRoadsideBuilding(textures, seed, seg.zoneId);
            bldg.position.set(bldgX, 0, bldgZ);
            bldg.rotation.y = seg.yawAB + Math.PI / 2;
            group.add(bldg);
          }
        }
      }
    }

    // Add iconic Mymensingh Landmark Gantries at key avenues
    if (
      seg.id === 'seg_ganginarpar_main' ||
      seg.id === 'seg_townhall_ave' ||
      seg.id === 'seg_charpara_central' ||
      seg.id === 'seg_shambhuganj_bridge'
    ) {
      const gantry = createLandmarkGantry(textures, seg.zoneId);
      const gx = seg.x1 + seg.dirX * (seg.length * 0.34);
      const gz = seg.z1 + seg.dirZ * (seg.length * 0.34);
      gantry.position.set(gx, 0, gz);
      gantry.rotation.y = seg.yawAB;
      group.add(gantry);
    }

    // Add Diverse Realistic Pedestrians along sidewalks
    if (!seg.isBridge) {
      const activities: HumanActivity[] = ['walking', 'usingPhone', 'talking', 'standing'];
      for (let p = 0; p < 3; p++) {
        const s = p % 2 === 0 ? 1 : -1;
        const seed = segIdx * 17 + p * 7;
        const act = activities[(segIdx + p) % activities.length];
        const rig = createRealisticHuman(seed, {
          hasPhone: act === 'usingPhone',
          hasBag: p === 1,
        });
        const tPos = 0.25 + p * 0.24;
        const sx = THREE.MathUtils.lerp(seg.x1, seg.x2, tPos) + perpX * s * (ROAD_HALF + 1.45);
        const sz = THREE.MathUtils.lerp(seg.z1, seg.z2, tPos) + perpZ * s * (ROAD_HALF + 1.45);
        rig.group.position.set(sx, 0.14, sz);
        rig.group.rotation.y = s > 0 ? seg.yawAB : seg.yawBA;
        group.add(rig.group);

        const alongX = Math.abs(seg.dirX) > 0.5;
        pedestrians.push({
          rig,
          activity: act,
          baseX: sx,
          baseZ: sz,
          axis: alongX ? 'x' : 'z',
          walkDir: s > 0 ? 1 : -1,
          walkSpeed: act === 'walking' ? 1.15 + (p % 2) * 0.25 : 0,
          minLimit: (alongX ? sx : sz) - 9,
          maxLimit: (alongX ? sx : sz) + 9,
          phaseOffset: seed * 0.85,
        });
      }
    }
  });

  // Add Zebra Crossing Pedestrians at central Ganginarpar & Charpara
  const crossConfigs: Array<{ x: number; z: number; axis: 'x' | 'z'; seed: number }> = [
    { x: 0, z: 11, axis: 'x', seed: 41 },
    { x: 11, z: 0, axis: 'z', seed: 52 },
    { x: -11, z: 0, axis: 'z', seed: 63 },
  ];
  for (const cc of crossConfigs) {
    const crosser = createRealisticHuman(cc.seed, { archetype: cc.seed % 2 === 0 ? 'woman' : 'man' });
    const startPos = -ROAD_HALF - 0.8;
    if (cc.axis === 'x') {
      crosser.group.position.set(cc.x + startPos, 0.04, cc.z);
      crosser.group.rotation.y = -Math.PI / 2;
    } else {
      crosser.group.position.set(cc.x, 0.04, cc.z + startPos);
      crosser.group.rotation.y = Math.PI;
    }
    group.add(crosser.group);
    pedestrians.push({
      rig: crosser,
      activity: 'crossing',
      baseX: cc.x,
      baseZ: cc.z,
      axis: cc.axis,
      walkDir: 1,
      walkSpeed: 1.4,
      minLimit: (cc.axis === 'x' ? cc.x : cc.z) - ROAD_HALF - 0.8,
      maxLimit: (cc.axis === 'x' ? cc.x : cc.z) + ROAD_HALF + 0.8,
      phaseOffset: cc.seed * 0.7,
      isCrossing: true,
    });
  }

  return { group, pedestrians };
}

export function updateCityPedestrians(
  pedestrians: PedestrianAgent[],
  elapsed: number,
  dt: number,
  playerX: number,
  playerZ: number
): void {
  for (const ped of pedestrians) {
    if (ped.isCrossing) {
      const distPlayer = Math.hypot(ped.rig.group.position.x - playerX, ped.rig.group.position.z - playerZ);
      const onCurb =
        ped.axis === 'x'
          ? Math.abs(ped.rig.group.position.x - ped.baseX) > ROAD_HALF - 0.2
          : Math.abs(ped.rig.group.position.z - ped.baseZ) > ROAD_HALF - 0.2;
      if (onCurb && distPlayer < 16) {
        animateRealisticHuman(ped.rig, 'standing', elapsed, ped.phaseOffset, 1.0);
        continue;
      }

      if (ped.axis === 'x') {
        ped.rig.group.position.x += ped.walkDir * ped.walkSpeed * dt;
        if (ped.rig.group.position.x > ped.maxLimit) {
          ped.walkDir = -1;
          ped.rig.group.rotation.y = Math.PI / 2;
        } else if (ped.rig.group.position.x < ped.minLimit) {
          ped.walkDir = 1;
          ped.rig.group.rotation.y = -Math.PI / 2;
        }
      } else {
        ped.rig.group.position.z += ped.walkDir * ped.walkSpeed * dt;
        if (ped.rig.group.position.z > ped.maxLimit) {
          ped.walkDir = -1;
          ped.rig.group.rotation.y = 0;
        } else if (ped.rig.group.position.z < ped.minLimit) {
          ped.walkDir = 1;
          ped.rig.group.rotation.y = Math.PI;
        }
      }
      animateRealisticHuman(ped.rig, 'crossing', elapsed, ped.phaseOffset, ped.walkSpeed);
      continue;
    }

    if (ped.activity === 'walking') {
      if (ped.axis === 'x') {
        ped.rig.group.position.x += ped.walkDir * ped.walkSpeed * dt;
        if (ped.rig.group.position.x > ped.maxLimit) ped.walkDir = -1;
        if (ped.rig.group.position.x < ped.minLimit) ped.walkDir = 1;
        ped.rig.group.rotation.y = ped.walkDir > 0 ? -Math.PI / 2 : Math.PI / 2;
      } else {
        ped.rig.group.position.z += ped.walkDir * ped.walkSpeed * dt;
        if (ped.rig.group.position.z > ped.maxLimit) ped.walkDir = -1;
        if (ped.rig.group.position.z < ped.minLimit) ped.walkDir = 1;
        ped.rig.group.rotation.y = ped.walkDir > 0 ? Math.PI : 0;
      }
    }
    animateRealisticHuman(ped.rig, ped.activity, elapsed, ped.phaseOffset, ped.walkSpeed || 1.15);
  }
}
