import React, { useMemo } from 'react';
import {
  Bell,
  Coins,
  CornerUpLeft,
  Heart,
  MapPin,
  Pause,
  UserCheck,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { MINI_MAP_ROADS } from '../game/cityNetwork';
import type { HudState } from '../game/types';

interface GameHudProps {
  hud: HudState;
  soundEnabled: boolean;
  controlScheme: 'auto' | 'keyboard' | 'touch';
  onToggleSound: () => void;
  onPause: () => void;
  onRingBell: () => void;
  onTouchSteer: (val: number) => void;
  onTouchBoost: (active: boolean) => void;
  onTouchBrake: (active: boolean) => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  soundEnabled,
  controlScheme,
  onToggleSound,
  onPause,
  onRingBell,
  onTouchSteer,
  onTouchBoost,
  onTouchBrake,
}) => {
  const bellReady = hud.bellCooldown <= 0.02;

  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  const showTouchControls =
    controlScheme === 'touch' || (controlScheme === 'auto' && isTouchDevice);

  // Connected City Mini-Map bounds: X [-150..185], Z [-95..140]
  const mapX = (wx: number) => ((wx + 152) / 340) * 100;
  const mapY = (wz: number) => ((wz + 95) / 238) * 100;

  const routeSvgPoints = useMemo(() => {
    if (!hud.routePoints || hud.routePoints.length < 2) return '';
    return hud.routePoints.map((pt) => `${mapX(pt.x).toFixed(1)},${mapY(pt.z).toFixed(1)}`).join(' ');
  }, [hud.routePoints]);

  const playerDeg = (-hud.playerYaw * 180) / Math.PI;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-2 sm:p-3.5">
      {/* TOP PERIMETER ROW — Compact & Clear (Center Road Never Blocked) */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-Left Metric Cluster */}
        <div
          className="rounded-xl px-2.5 sm:px-3.5 py-1.5 border border-white/12 flex items-center gap-2.5 sm:gap-3.5"
          style={{ backgroundColor: 'rgba(18, 15, 13, 0.84)' }}
        >
          <div>
            <div className="text-[10px] text-stone-400 font-medium leading-none">Fare</div>
            <div className="text-sm sm:text-xl font-bold text-amber-400 font-mono tabular-nums leading-tight">
              ৳{hud.fareTaka.toLocaleString()}
            </div>
          </div>

          <div className="h-6 w-px bg-white/12" />

          <div>
            <div className="text-[10px] text-stone-400 font-medium leading-none">Speed</div>
            <div className="text-sm sm:text-lg font-semibold text-emerald-400 font-mono tabular-nums leading-tight">
              {hud.speedKmh} <span className="text-[10px] text-stone-400">km/h</span>
            </div>
          </div>

          {hud.combo > 1 && (
            <>
              <div className="h-6 w-px bg-white/12" />
              <div>
                <div className="text-[10px] text-amber-300 font-medium leading-none">Combo</div>
                <div className="text-sm sm:text-lg font-bold text-amber-300 font-mono tabular-nums leading-tight">
                  ×{hud.combo}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Top-Center Road Name & Distance + Active Passenger Trip (Mobile UI Fixed: Top Edge Only, Crisp Shadow) */}
        <div className="flex flex-col items-center gap-1 max-w-[46vw] sm:max-w-md">
          <div
            className="rounded-xl px-3 py-1 border border-white/12 flex items-center gap-1.5 text-[11px] sm:text-xs shadow-md"
            style={{
              backgroundColor: 'rgba(14, 12, 10, 0.82)',
              textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            }}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-stone-100 truncate">{hud.currentRoadName}</span>
            <span className="text-stone-400">·</span>
            <span className="font-mono font-bold text-amber-300 whitespace-nowrap tabular-nums">
              {hud.distanceMeters} Meter
            </span>
          </div>

          {hud.passengerTrip.status !== 'none' && (
            <div
              className={`rounded-xl px-2.5 sm:px-3 py-1 border flex items-center gap-2 text-[10px] sm:text-xs shadow-md ${
                hud.passengerTrip.status === 'waiting' || hud.passengerTrip.status === 'boarding'
                  ? 'border-emerald-400/45'
                  : 'border-amber-400/45'
              }`}
              style={{
                backgroundColor: 'rgba(12, 20, 16, 0.86)',
                textShadow: '0 1px 2px rgba(0,0,0,0.9)',
              }}
            >
              <UserCheck
                className={`w-3.5 h-3.5 shrink-0 ${
                  hud.passengerTrip.status === 'waiting' || hud.passengerTrip.status === 'boarding'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              />
              <span className="text-stone-100 font-medium truncate">
                {hud.passengerTrip.status === 'waiting' &&
                  `Pickup: ${hud.passengerTrip.passengerName} (${hud.passengerTrip.pickupRoadName})`}
                {hud.passengerTrip.status === 'boarding' &&
                  `${hud.passengerTrip.passengerName} boarding...`}
                {hud.passengerTrip.status === 'riding' &&
                  `Drop: ${hud.passengerTrip.passengerName} → ${hud.passengerTrip.destinationRoadName}`}
                {hud.passengerTrip.status === 'alighting' &&
                  `Arrived at ${hud.passengerTrip.destinationRoadName}`}
              </span>
              {(hud.passengerTrip.status === 'waiting' || hud.passengerTrip.status === 'riding') && (
                <span className="font-mono font-bold text-emerald-300 shrink-0 tabular-nums">
                  {hud.passengerTrip.remainingMeters}m
                </span>
              )}
              <span className="font-mono font-bold text-amber-300 shrink-0">
                +৳{hud.passengerTrip.rewardTaka}
              </span>
            </div>
          )}

          {hud.passengerTrip.turnHint &&
            (hud.passengerTrip.status === 'waiting' || hud.passengerTrip.status === 'riding') && (
              <div
                className="rounded-lg px-2.5 py-0.5 border border-sky-400/35 text-[10px] sm:text-[11px] font-semibold text-sky-200 flex items-center gap-1"
                style={{ backgroundColor: 'rgba(12, 18, 24, 0.84)' }}
              >
                <CornerUpLeft className="w-3 h-3 text-sky-400 shrink-0" />
                <span>{hud.passengerTrip.turnHint}</span>
              </div>
            )}
        </div>

        {/* Top-Right Controls & Connected 2D City Mini-Map */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <div
              className="hidden sm:flex h-9 px-2.5 rounded-xl border border-amber-400/25 items-center gap-1.5"
              style={{ backgroundColor: 'rgba(18, 15, 13, 0.84)' }}
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 font-mono tabular-nums">
                ৳{hud.walletTaka.toLocaleString()}
              </span>
            </div>

            <div
              className="h-9 px-2 sm:px-2.5 rounded-xl border border-white/12 flex items-center gap-1"
              style={{ backgroundColor: 'rgba(18, 15, 13, 0.84)' }}
              aria-label={`Rickshaw integrity ${hud.hearts} of ${hud.maxHearts}`}
            >
              {Array.from({ length: hud.maxHearts }).map((_, idx) => (
                <Heart
                  key={idx}
                  className={`w-3.5 h-3.5 ${
                    idx < hud.hearts ? 'text-rose-500 fill-rose-500' : 'text-stone-600'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
              className="w-9 h-9 rounded-xl border border-white/12 text-stone-200 hover:text-white hover:border-amber-400/50 flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: 'rgba(18, 15, 13, 0.84)' }}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onPause}
              aria-label="Pause game"
              className="w-9 h-9 rounded-xl border border-white/12 text-stone-200 hover:text-white hover:border-amber-400/50 flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: 'rgba(18, 15, 13, 0.84)' }}
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Connected City Road Mini-Map */}
          <div
            className="w-[104px] sm:w-[122px] rounded-xl border border-white/15 p-1.5 flex flex-col gap-1"
            style={{ backgroundColor: 'rgba(14, 13, 12, 0.86)' }}
          >
            <div className="flex items-center justify-between text-[9px] font-bold text-stone-300 px-0.5">
              <span>CITY MAP</span>
              <span className="font-mono text-amber-300 tabular-nums">
                {hud.activeBlip ? `${hud.activeBlip.distanceMeters}m` : 'OPEN'}
              </span>
            </div>

            <svg
              viewBox="0 0 100 100"
              className="w-full h-[64px] sm:h-[76px] rounded-lg bg-stone-950 border border-white/10"
            >
              {/* Brahmaputra River */}
              <rect x="78" y="0" width="22" height="100" fill="#0f3d52" opacity="0.65" />

              {/* All Connected Mymensingh Roads */}
              {MINI_MAP_ROADS.map((r, idx) => (
                <line
                  key={idx}
                  x1={mapX(r.x1)}
                  y1={mapY(r.z1)}
                  x2={mapX(r.x2)}
                  y2={mapY(r.z2)}
                  stroke={r.isBridge ? '#38bdf8' : '#57534e'}
                  strokeWidth={r.isBridge ? '3.5' : '3'}
                  strokeLinecap="round"
                />
              ))}

              {/* Active Navigation Route */}
              {routeSvgPoints && (
                <polyline
                  points={routeSvgPoints}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.4"
                  strokeDasharray="3 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Active Pickup / Drop-off Blip */}
              {hud.activeBlip && (
                <circle
                  cx={mapX(hud.activeBlip.x)}
                  cy={mapY(hud.activeBlip.z)}
                  r="4.2"
                  fill={hud.activeBlip.kind === 'pickup' ? '#10b981' : '#f59e0b'}
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />
              )}

              {/* Player Rickshaw Directional Triangle */}
              <g
                transform={`translate(${mapX(hud.playerX).toFixed(1)}, ${mapY(hud.playerZ).toFixed(1)}) rotate(${playerDeg.toFixed(1)})`}
              >
                <polygon
                  points="0,-5 3.6,4 0,2 -3.6,4"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Subtle Upper-Perimeter Auto-Brake / Event Notification (Never Blocks Center Road) */}
      <div className="flex flex-col items-center gap-1 mb-auto mt-1">
        {hud.autoBrakingHint && (
          <div
            className="px-3.5 py-1 rounded-lg border border-emerald-400/50 text-emerald-200 text-xs font-semibold shadow-md"
            style={{ backgroundColor: 'rgba(10, 26, 20, 0.9)' }}
          >
            {hud.autoBrakingHint}
          </div>
        )}
        {hud.eventBanner && (
          <div
            className="px-3.5 py-1 rounded-lg border border-amber-400/40 text-amber-200 text-xs font-semibold font-mono tabular-nums shadow-md"
            style={{ backgroundColor: 'rgba(20, 15, 12, 0.86)' }}
          >
            {hud.eventBanner}
          </div>
        )}
      </div>

      {/* BOTTOM PERIMETER CONTROLS — Ergonomic Mobile Landscape Layout */}
      <div className="w-full flex items-end justify-between gap-2">
        {/* Bottom-Left Steering */}
        <div
          className={`${
            showTouchControls ? 'flex' : 'flex md:hidden'
          } items-center gap-2 pointer-events-auto`}
        >
          <button
            type="button"
            onPointerDown={() => onTouchSteer(-1)}
            onPointerUp={() => onTouchSteer(0)}
            onPointerLeave={() => onTouchSteer(0)}
            onPointerCancel={() => onTouchSteer(0)}
            className="w-14 h-14 rounded-2xl border border-white/15 text-white font-bold text-xl active:bg-amber-500 active:text-stone-950 cursor-pointer"
            style={{ backgroundColor: 'rgba(18, 15, 13, 0.84)' }}
            aria-label="Turn left"
          >
            ◀
          </button>
          <button
            type="button"
            onPointerDown={() => onTouchSteer(1)}
            onPointerUp={() => onTouchSteer(0)}
            onPointerLeave={() => onTouchSteer(0)}
            onPointerCancel={() => onTouchSteer(0)}
            className="w-14 h-14 rounded-2xl border border-white/15 text-white font-bold text-xl active:bg-amber-500 active:text-stone-950 cursor-pointer"
            style={{ backgroundColor: 'rgba(18, 15, 13, 0.84)' }}
            aria-label="Turn right"
          >
            ▶
          </button>
        </div>

        {/* Bottom-Center Stamina + Bell */}
        <div
          className="mx-auto rounded-xl px-3 py-1.5 border border-white/12 flex items-center gap-2.5 sm:gap-3.5 pointer-events-auto"
          style={{ backgroundColor: 'rgba(18, 15, 13, 0.84)' }}
        >
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="w-16 sm:w-28 h-2 rounded-full bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-[width] duration-75"
                style={{ width: `${hud.stamina}%` }}
              />
            </div>
            <span className="text-[11px] font-mono tabular-nums text-stone-300 w-8 text-right">
              {hud.stamina}%
            </span>
          </div>

          <div className="h-4 w-px bg-white/12" />

          <button
            type="button"
            onClick={onRingBell}
            disabled={!bellReady}
            className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              bellReady
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Bell</span>
          </button>
        </div>

        {/* Bottom-Right Brake & Pedal */}
        <div
          className={`${
            showTouchControls ? 'flex' : 'flex md:hidden'
          } items-center gap-2 pointer-events-auto`}
        >
          <button
            type="button"
            onPointerDown={() => onTouchBrake(true)}
            onPointerUp={() => onTouchBrake(false)}
            onPointerLeave={() => onTouchBrake(false)}
            onPointerCancel={() => onTouchBrake(false)}
            className="h-14 px-4 rounded-2xl border border-rose-400/40 text-rose-300 font-bold text-xs sm:text-sm active:bg-rose-500 active:text-white cursor-pointer"
            style={{ backgroundColor: 'rgba(18, 15, 13, 0.84)' }}
          >
            Brake
          </button>
          <button
            type="button"
            onPointerDown={() => onTouchBoost(true)}
            onPointerUp={() => onTouchBoost(false)}
            onPointerLeave={() => onTouchBoost(false)}
            onPointerCancel={() => onTouchBoost(false)}
            className="h-14 px-5 rounded-2xl border border-emerald-400/40 text-emerald-300 font-bold text-xs sm:text-sm active:bg-emerald-500 active:text-stone-950 cursor-pointer"
            style={{ backgroundColor: 'rgba(18, 15, 13, 0.84)' }}
          >
            Pedal
          </button>
        </div>
      </div>
    </div>
  );
};
