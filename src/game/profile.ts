import type {
  DriverCharacterId,
  MissionProgress,
  MymensinghZoneId,
  PlayerProfile,
} from './types';

const PROFILE_KEY = 'mymensingh_rickshaw_profile_v3';

export interface ZoneCatalogEntry {
  id: MymensinghZoneId;
  name: string;
  bangla: string;
  subtitle: string;
  unlockCost: number;
}

export const CITY_ZONES_CATALOG: ZoneCatalogEntry[] = [
  {
    id: 'ganginarpar',
    name: 'Ganginarpar',
    bangla: 'গাঙ্গিনারপাড় মোড়',
    subtitle: 'Bustling commercial heart, clothing shops & main intersection',
    unlockCost: 0,
  },
  {
    id: 'townhall',
    name: 'Town Hall Road',
    bangla: 'টাউন হল রোড',
    subtitle: 'Leafy heritage avenue, bookstores, schools & red-brick facades',
    unlockCost: 0,
  },
  {
    id: 'charpara',
    name: 'Charpara Station Road',
    bangla: 'চরপাড়া ও স্টেশন রোড',
    subtitle: 'Medical more, pharmacies, hotels & connected cross-roads',
    unlockCost: 0,
  },
  {
    id: 'bridge',
    name: 'Shambhuganj Bridge',
    bangla: 'শম্ভুগঞ্জ ব্রিজ',
    subtitle: 'Open Brahmaputra river bridge & riverside approach roads',
    unlockCost: 0,
  },
];

export interface CharacterRickshawProfile {
  id: DriverCharacterId;
  name: string;
  banglaName: string;
  roleTitle: string;
  personality: string;
  // Distinct character appearance
  skinHex: number;
  skinCss: string;
  hairHex: number;
  hairStyle: 'wavy' | 'spiky' | 'curly' | 'crop_cap' | 'parted';
  facialHair: 'stubble' | 'none' | 'goatee' | 'clean' | 'mustache';
  hasGlasses?: boolean;
  hasCap?: boolean;
  capHex?: number;
  shirtHex: number;
  shirtCss: string;
  shirtStyle: 'collar' | 'hoodie' | 'tee' | 'half_sleeve' | 'vest';
  lungiHex: number;
  lungiCss: string;
  gamchaHex: number;
  gamchaCss: string;
  // Unique matched custom rickshaw
  rickshawName: string;
  rickshawTitleBangla: string;
  frameHex: number;
  frameCss: string;
  rexineHex: number;
  rexineCss: string;
  canopyPrimary: string;
  canopySecondary: string;
  canopyTrim: string;
  artBgHex: string;
  artAccentHex: string;
  artMotif: 'boat' | 'flower' | 'bridge' | 'rose' | 'heritage';
  tasselColors: number[];
}

export const CHARACTER_ROSTER: CharacterRickshawProfile[] = [
  {
    id: 0,
    name: 'Jubayer',
    banglaName: 'জুবায়ের',
    roleTitle: 'Ganginarpar Pace Setter',
    personality: 'Sharp reflexes, warm smile, loves smooth turns through busy intersections.',
    skinHex: 0xa26f4c,
    skinCss: '#a26f4c',
    hairHex: 0x18181b,
    hairStyle: 'wavy',
    facialHair: 'stubble',
    shirtHex: 0x0f766e,
    shirtCss: '#0f766e',
    shirtStyle: 'collar',
    lungiHex: 0x1e293b,
    lungiCss: '#1e293b',
    gamchaHex: 0xdc2626,
    gamchaCss: '#dc2626',
    rickshawName: 'Padma Emerald',
    rickshawTitleBangla: 'মায়ের দোয়া',
    frameHex: 0x0d7a5f,
    frameCss: '#0d7a5f',
    rexineHex: 0xb91c1c,
    rexineCss: '#b91c1c',
    canopyPrimary: '#0b664f',
    canopySecondary: '#b91c1c',
    canopyTrim: '#ffd12a',
    artBgHex: '#0a5e48',
    artAccentHex: '#ff2e79',
    artMotif: 'boat',
    tasselColors: [0xff2e79, 0xffd12a, 0x00c853, 0xffd12a, 0xff2e79],
  },
  {
    id: 1,
    name: 'Siam',
    banglaName: 'সিয়াম',
    roleTitle: 'Town Hall Express',
    personality: 'Trendy city rider with shades and fast street style.',
    skinHex: 0xb4825f,
    skinCss: '#b4825f',
    hairHex: 0x1c1917,
    hairStyle: 'spiky',
    facialHair: 'none',
    hasGlasses: true,
    shirtHex: 0xd97706,
    shirtCss: '#d97706',
    shirtStyle: 'hoodie',
    lungiHex: 0x1e3a8a,
    lungiCss: '#1e3a8a',
    gamchaHex: 0x0d9488,
    gamchaCss: '#0d9488',
    rickshawName: 'Shapla Crimson',
    rickshawTitleBangla: 'শাপলা এক্সপ্রেস',
    frameHex: 0x991b1b,
    frameCss: '#991b1b',
    rexineHex: 0xd97706,
    rexineCss: '#d97706',
    canopyPrimary: '#991b1b',
    canopySecondary: '#f59e0b',
    canopyTrim: '#fef08a',
    artBgHex: '#8b1515',
    artAccentHex: '#fde047',
    artMotif: 'flower',
    tasselColors: [0xfde047, 0xf97316, 0xef4444, 0xf97316, 0xfde047],
  },
  {
    id: 2,
    name: 'Riyad',
    banglaName: 'রিয়াদ',
    roleTitle: 'Brahmaputra Breeze',
    personality: 'Calm long-route navigator built for river bridge runs.',
    skinHex: 0x926142,
    skinCss: '#926142',
    hairHex: 0x111827,
    hairStyle: 'curly',
    facialHair: 'goatee',
    shirtHex: 0x1d4ed8,
    shirtCss: '#1d4ed8',
    shirtStyle: 'tee',
    lungiHex: 0x27272a,
    lungiCss: '#27272a',
    gamchaHex: 0xf59e0b,
    gamchaCss: '#f59e0b',
    rickshawName: 'Brahmaputra Royal',
    rickshawTitleBangla: 'ময়মনসিংহ সুন্দরী',
    frameHex: 0x1e40af,
    frameCss: '#1e40af',
    rexineHex: 0x047857,
    rexineCss: '#047857',
    canopyPrimary: '#1d4ed8',
    canopySecondary: '#06b6d4',
    canopyTrim: '#ffffff',
    artBgHex: '#153a9e',
    artAccentHex: '#38bdf8',
    artMotif: 'bridge',
    tasselColors: [0x38bdf8, 0xffffff, 0xfacc15, 0xffffff, 0x38bdf8],
  },
  {
    id: 3,
    name: 'Sadi',
    banglaName: 'সাদি',
    roleTitle: 'Charpara Navigator',
    personality: 'Dependable in tight turns, sporting a crisp white cap.',
    skinHex: 0x805136,
    skinCss: '#805136',
    hairHex: 0x171717,
    hairStyle: 'crop_cap',
    facialHair: 'clean',
    hasCap: true,
    capHex: 0xf8fafc,
    shirtHex: 0x881337,
    shirtCss: '#881337',
    shirtStyle: 'half_sleeve',
    lungiHex: 0x365314,
    lungiCss: '#365314',
    gamchaHex: 0xfef3c7,
    gamchaCss: '#fef3c7',
    rickshawName: 'Surma Plum & Gold',
    rickshawTitleBangla: 'সোনার বাংলা',
    frameHex: 0x6d1b4b,
    frameCss: '#6d1b4b',
    rexineHex: 0xca8a04,
    rexineCss: '#ca8a04',
    canopyPrimary: '#6d1b4b',
    canopySecondary: '#ec4899',
    canopyTrim: '#fde047',
    artBgHex: '#58153d',
    artAccentHex: '#fb7185',
    artMotif: 'rose',
    tasselColors: [0xfb7185, 0xfde047, 0xc084fc, 0xfde047, 0xfb7185],
  },
  {
    id: 4,
    name: 'Pantho',
    banglaName: 'পান্থ',
    roleTitle: 'Station Road Veteran',
    personality: 'Steady veteran who knows every U-turn and shortcut in Mymensingh.',
    skinHex: 0x9b6b49,
    skinCss: '#9b6b49',
    hairHex: 0x292524,
    hairStyle: 'parted',
    facialHair: 'mustache',
    shirtHex: 0x334155,
    shirtCss: '#334155',
    shirtStyle: 'vest',
    lungiHex: 0x7c2d12,
    lungiCss: '#7c2d12',
    gamchaHex: 0x10b981,
    gamchaCss: '#10b981',
    rickshawName: 'Kachari Copper',
    rickshawTitleBangla: 'ব্রহ্মপুত্র তীরে',
    frameHex: 0xc2410c,
    frameCss: '#c2410c',
    rexineHex: 0x1e3a8a,
    rexineCss: '#1e3a8a',
    canopyPrimary: '#c2410c',
    canopySecondary: '#0f766e',
    canopyTrim: '#fef3c7',
    artBgHex: '#9a3412',
    artAccentHex: '#2dd4bf',
    artMotif: 'heritage',
    tasselColors: [0x2dd4bf, 0xfef3c7, 0xf97316, 0xfef3c7, 0x2dd4bf],
  },
];

export function createDefaultMissions(): MissionProgress[] {
  return [
    {
      id: 'delivery_1',
      kind: 'delivery',
      title: 'First City Drop-off',
      description: 'Pick up a passenger and deliver them safely to their stop.',
      target: 1,
      progress: 0,
      rewardTaka: 100,
      rewardXp: 50,
      completed: false,
      claimed: false,
    },
    {
      id: 'dest_charpara',
      kind: 'destination',
      title: 'Charpara Station Run',
      description: 'Deliver a passenger directly to Charpara Station Road.',
      target: 1,
      progress: 0,
      rewardTaka: 160,
      rewardXp: 80,
      targetZoneId: 'charpara',
      completed: false,
      claimed: false,
    },
    {
      id: 'dist_500',
      kind: 'distance',
      title: 'Mymensingh Explorer',
      description: 'Drive 500 m across connected city roads.',
      target: 500,
      progress: 0,
      rewardTaka: 150,
      rewardXp: 75,
      completed: false,
      claimed: false,
    },
    {
      id: 'earn_350',
      kind: 'earnings',
      title: 'Busy Shift Target',
      description: 'Earn ৳350 or more in a single ride.',
      target: 350,
      progress: 0,
      rewardTaka: 200,
      rewardXp: 100,
      completed: false,
      claimed: false,
    },
    {
      id: 'multi_4',
      kind: 'multi_passenger',
      title: 'Neighborhood Rickshaw Service',
      description: 'Complete 4 passenger deliveries in total.',
      target: 4,
      progress: 0,
      rewardTaka: 280,
      rewardXp: 140,
      completed: false,
      claimed: false,
    },
    {
      id: 'time_35',
      kind: 'time_challenge',
      title: 'Express Time Challenge',
      description: 'Complete a passenger delivery within 35 seconds after boarding.',
      target: 1,
      progress: 0,
      rewardTaka: 240,
      rewardXp: 120,
      timeLimitSec: 35,
      completed: false,
      claimed: false,
    },
    {
      id: 'traffic_5',
      kind: 'near_miss',
      title: 'Traffic Weaving Pro',
      description: 'Pass 5 close vehicles cleanly without colliding.',
      target: 5,
      progress: 0,
      rewardTaka: 220,
      rewardXp: 110,
      completed: false,
      claimed: false,
    },
    {
      id: 'long_1200',
      kind: 'long_route',
      title: 'Long Route Veteran',
      description: 'Accumulate 1,200 m of city driving distance.',
      target: 1200,
      progress: 0,
      rewardTaka: 360,
      rewardXp: 180,
      completed: false,
      claimed: false,
    },
    {
      id: 'vip_bridge',
      kind: 'special_delivery',
      title: 'Special Bridge Delivery',
      description: 'Complete a special express trip to Shambhuganj Bridge.',
      target: 1,
      progress: 0,
      rewardTaka: 450,
      rewardXp: 220,
      targetZoneId: 'bridge',
      completed: false,
      claimed: false,
    },
  ];
}

export function getDriverLevel(xp: number): { level: number; currentXp: number; nextLevelXp: number } {
  const level = Math.floor(xp / 200) + 1;
  const currentXp = xp % 200;
  return { level, currentXp, nextLevelXp: 200 };
}

export function createDefaultProfile(): PlayerProfile {
  return {
    walletTaka: 180,
    xp: 0,
    bestFare: 0,
    bestDistance: 0,
    totalDistance: 0,
    totalTrips: 0,
    totalCoins: 0,
    totalNearMisses: 0,
    unlockedZones: ['ganginarpar', 'townhall', 'charpara', 'bridge'],
    selectedZone: 'ganginarpar',
    characterId: 0,
    upgrades: {
      speedLevel: 1,
      brakeLevel: 1,
      durabilityLevel: 1,
    },
    missions: createDefaultMissions(),
    settings: {
      vfxEnabled: true,
      soundEnabled: true,
      ambientEnabled: true,
      musicEnabled: true,
      vibrationEnabled: true,
      graphicsQuality: 'high',
      controlScheme: 'auto',
    },
  };
}

export function loadPlayerProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return createDefaultProfile();
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    const def = createDefaultProfile();
    const charId =
      typeof parsed.characterId === 'number' && parsed.characterId >= 0 && parsed.characterId <= 4
        ? (parsed.characterId as DriverCharacterId)
        : 0;
    return {
      ...def,
      ...parsed,
      characterId: charId,
      unlockedZones:
        Array.isArray(parsed.unlockedZones) && parsed.unlockedZones.length > 0
          ? parsed.unlockedZones
          : def.unlockedZones,
      upgrades: { ...def.upgrades, ...(parsed.upgrades || {}) },
      settings: { ...def.settings, ...(parsed.settings || {}) },
      missions:
        Array.isArray(parsed.missions) && parsed.missions.length === def.missions.length
          ? parsed.missions
          : def.missions,
    };
  } catch {
    return createDefaultProfile();
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage errors
  }
}
