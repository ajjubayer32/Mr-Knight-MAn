export type GamePhase = 'title' | 'transition' | 'playing' | 'paused' | 'gameover';

export type TrafficKind = 'rickshaw' | 'cng' | 'bus' | 'moto' | 'car' | 'bicycle';

export type CollectibleKind = 'taka' | 'tea';

export type MymensinghZoneId = 'ganginarpar' | 'townhall' | 'bridge' | 'charpara';

export type DriverCharacterId = 0 | 1 | 2 | 3 | 4;

export type RickshawLiveryId = 0 | 1 | 2 | 3 | 4;

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  vfxEnabled: boolean;
  soundEnabled: boolean;
  ambientEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  graphicsQuality: GraphicsQuality;
  controlScheme: 'auto' | 'keyboard' | 'touch';
}

export interface GarageUpgrades {
  speedLevel: number; // 1..4
  brakeLevel: number; // 1..4
  durabilityLevel: number; // 1..4
}

export type MissionKind =
  | 'delivery'
  | 'destination'
  | 'distance'
  | 'earnings'
  | 'multi_passenger'
  | 'time_challenge'
  | 'near_miss'
  | 'long_route'
  | 'special_delivery';

export interface MissionProgress {
  id: string;
  kind: MissionKind;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardTaka: number;
  rewardXp: number;
  targetZoneId?: MymensinghZoneId;
  timeLimitSec?: number;
  completed: boolean;
  claimed: boolean;
}

export interface PlayerProfile {
  walletTaka: number;
  xp: number;
  bestFare: number;
  bestDistance: number;
  totalDistance: number;
  totalTrips: number;
  totalCoins: number;
  totalNearMisses: number;
  unlockedZones: MymensinghZoneId[];
  selectedZone: MymensinghZoneId;
  characterId: DriverCharacterId;
  upgrades: GarageUpgrades;
  missions: MissionProgress[];
  settings: GameSettings;
}

export interface PassengerTripState {
  status: 'none' | 'waiting' | 'boarding' | 'riding' | 'alighting';
  passengerName: string;
  passengerGender: 'male' | 'female';
  pickupZone: string;
  pickupRoadName: string;
  destinationZone: string;
  destinationZoneId: MymensinghZoneId;
  destinationRoadName: string;
  remainingMeters: number;
  rewardTaka: number;
  elapsedTripSec: number;
  turnHint: string;
  isSpecial: boolean;
}

export interface MiniMapRoad {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  isBridge?: boolean;
}

export interface MapBlip {
  kind: 'pickup' | 'dropoff';
  label: string;
  roadName: string;
  x: number;
  z: number;
  distanceMeters: number;
}

export interface HudState {
  phase: GamePhase;
  distanceMeters: number;
  speedKmh: number;
  fareTaka: number;
  walletTaka: number;
  coinsCollected: number;
  passengersServed: number;
  hearts: number;
  maxHearts: number;
  stamina: number; // 0..100
  combo: number;
  comboTimer: number; // 0..1
  nearMisses: number;
  bellCooldown: number; // 0..1 (0 = ready)
  eventBanner: string | null;
  bestFare: number;
  bestDistance: number;
  currentZoneId: MymensinghZoneId;
  currentZoneLabel: string;
  currentZoneBangla: string;
  currentRoadName: string;
  playerX: number;
  playerZ: number;
  playerYaw: number;
  passengerTrip: PassengerTripState;
  activeBlip: MapBlip | null;
  routePoints: Array<{ x: number; z: number }>;
  autoBrakingHint: string | null;
  characterId: DriverCharacterId;
}

export interface GameSummary {
  distanceMeters: number;
  fareTaka: number;
  coinsCollected: number;
  passengersServed: number;
  nearMisses: number;
  topSpeedKmh: number;
  isNewBest: boolean;
  bestFare: number;
  bestDistance: number;
  walletTaka: number;
  xpEarned: number;
}
