import React, { useState } from 'react';
import {
  Check,
  Coins,
  Gauge,
  MapPin,
  Shield,
  Sparkles,
  Trophy,
  User,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  CHARACTER_ROSTER,
  CITY_ZONES_CATALOG,
  getDriverLevel,
} from '../game/profile';
import type { MymensinghZoneId, PlayerProfile } from '../game/types';

interface GarageModalProps {
  profile: PlayerProfile;
  onSelectZone: (id: MymensinghZoneId) => void;
  onUpgradeStat: (stat: 'speedLevel' | 'brakeLevel' | 'durabilityLevel') => void;
  onClaimMission: (missionId: string) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  profile,
  onSelectZone,
  onUpgradeStat,
  onClaimMission,
  onClose,
}) => {
  const [tab, setTab] = useState<'overview' | 'missions' | 'routes'>('overview');
  const charSpec = CHARACTER_ROSTER[profile.characterId] || CHARACTER_ROSTER[0];
  const levelInfo = getDriverLevel(profile.xp);
  const claimableCount = profile.missions.filter((m) => m.completed && !m.claimed).length;
  const maxHearts = 2 + profile.upgrades.durabilityLevel;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 pointer-events-auto"
      style={{ backgroundColor: 'rgba(10, 8, 6, 0.78)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-white/15 p-4 sm:p-6 shadow-2xl text-left"
        style={{ backgroundColor: 'rgba(20, 16, 13, 0.98)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-amber-400" />
            <h2
              className="text-lg sm:text-xl font-bold text-amber-400"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Rickshaw Garage &amp; Missions
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tabular-nums text-amber-300 px-2.5 py-1 rounded-lg bg-stone-900 border border-amber-400/25 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />৳{profile.walletTaka.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close garage"
              className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Character + Custom Rickshaw + XP Banner */}
        <div className="mt-3 rounded-xl border border-amber-400/25 bg-stone-900/90 p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl border border-white/20 flex flex-col overflow-hidden shrink-0"
              title={charSpec.name}
            >
              <div className="flex-1" style={{ backgroundColor: charSpec.shirtCss }} />
              <div className="h-1.5" style={{ backgroundColor: charSpec.gamchaCss }} />
              <div className="flex-1" style={{ backgroundColor: charSpec.lungiCss }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>Selected Driver</span>
              </div>
              <div className="font-bold text-sm text-stone-100 truncate">
                {charSpec.banglaName} · {charSpec.name}
              </div>
              <div className="text-xs text-amber-300 truncate">
                Rickshaw: {charSpec.rickshawName} ({charSpec.rickshawTitleBangla})
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-300">Driver Level {levelInfo.level}</span>
              <span className="font-mono text-stone-300">
                {levelInfo.currentXp}/{levelInfo.nextLevelXp} XP
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400"
                style={{ width: `${Math.round((levelInfo.currentXp / levelInfo.nextLevelXp) * 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-400 font-mono">
              <span>Trips: {profile.totalTrips}</span>
              <span>Dist: {profile.totalDistance.toLocaleString()}m</span>
              <span>Integrity: {maxHearts}♥</span>
            </div>
          </div>
        </div>

        {/* Garage Sub-Tabs */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              tab === 'overview'
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-900 text-stone-300 border border-white/10 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Upgrades &amp; Stats</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('missions')}
            className={`relative h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              tab === 'missions'
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-900 text-stone-300 border border-white/10 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Missions ({profile.missions.length})</span>
            {claimableCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-extrabold">
                {claimableCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('routes')}
            className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              tab === 'routes'
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-900 text-stone-300 border border-white/10 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Start Area</span>
          </button>
        </div>

        {/* TAB 1: UPGRADES & CONDITION */}
        {tab === 'overview' && (
          <div className="mt-3 space-y-2.5">
            {(
              [
                {
                  key: 'speedLevel' as const,
                  label: 'Pedal Drive & Top Speed',
                  desc: 'Faster cruising pace and stronger acceleration out of intersections',
                  icon: Zap,
                  baseCost: 120,
                },
                {
                  key: 'brakeLevel' as const,
                  label: 'Calibrated Hand Brakes',
                  desc: 'Tighter turning control & shorter stopping distance for passenger pickups',
                  icon: Gauge,
                  baseCost: 100,
                },
                {
                  key: 'durabilityLevel' as const,
                  label: 'Reinforced Bamboo & Frame',
                  desc: 'Increases rickshaw condition integrity (+1 heart per level)',
                  icon: Shield,
                  baseCost: 140,
                },
              ] as const
            ).map((item) => {
              const lvl = profile.upgrades[item.key];
              const maxed = lvl >= 4;
              const cost = lvl * item.baseCost;
              const canAfford = profile.walletTaka >= cost;
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="rounded-xl border border-white/10 bg-stone-900/75 p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-sm font-bold text-stone-100">{item.label}</span>
                      <span className="text-[11px] font-mono text-emerald-400">Lv {lvl}/4</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">{item.desc}</p>
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <span
                          key={step}
                          className={`h-1.5 flex-1 rounded-full ${
                            step <= lvl ? 'bg-amber-400' : 'bg-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={maxed || !canAfford}
                    onClick={() => onUpgradeStat(item.key)}
                    className={`shrink-0 h-9 px-3 rounded-lg text-xs font-bold font-mono cursor-pointer ${
                      maxed
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 cursor-default'
                        : canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    {maxed ? 'MAX' : `৳${cost}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: ALL 9 PROGRESSIVE MISSIONS */}
        {tab === 'missions' && (
          <div className="mt-3 space-y-2">
            {profile.missions.map((m) => {
              const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-white/10 bg-stone-900/75 p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-stone-100">{m.title}</span>
                      <span className="text-xs font-mono text-amber-300">+৳{m.rewardTaka}</span>
                      <span className="text-xs font-mono text-emerald-300">+{m.rewardXp} XP</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">{m.description}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-stone-800 overflow-hidden">
                        <div
                          className={`h-full ${m.completed ? 'bg-emerald-400' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-stone-300">
                        {Math.min(m.progress, m.target)}/{m.target}
                      </span>
                    </div>
                  </div>

                  {m.claimed ? (
                    <span className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                      Claimed
                    </span>
                  ) : m.completed ? (
                    <button
                      type="button"
                      onClick={() => onClaimMission(m.id)}
                      className="shrink-0 h-9 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Claim</span>
                    </button>
                  ) : (
                    <span className="shrink-0 px-2.5 py-1 rounded-lg bg-stone-800 text-stone-400 text-xs font-mono">
                      Active
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: MYMENSINGH START AREA */}
        {tab === 'routes' && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-stone-300">
              All Mymensingh roads are connected! Pick where to begin your next shift:
            </p>
            {CITY_ZONES_CATALOG.map((zone) => {
              const selected = profile.selectedZone === zone.id;
              return (
                <div
                  key={zone.id}
                  className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${
                    selected
                      ? 'border-emerald-400/60 bg-emerald-950/35'
                      : 'border-white/10 bg-stone-900/75'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-stone-100">{zone.name}</span>
                      <span
                        className="text-xs text-amber-300"
                        style={{ fontFamily: 'var(--font-bangla)' }}
                      >
                        {zone.bangla}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">{zone.subtitle}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectZone(zone.id)}
                    className={`shrink-0 h-9 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                      selected
                        ? 'bg-emerald-500 text-stone-950'
                        : 'bg-stone-700 hover:bg-stone-600 text-white'
                    }`}
                  >
                    {selected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <span>Select</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
