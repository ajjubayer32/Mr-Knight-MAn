import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Play,
  Settings,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import { CHARACTER_ROSTER, getDriverLevel } from '../game/profile';
import type {
  DriverCharacterId,
  GameSettings,
  MymensinghZoneId,
  PlayerProfile,
} from '../game/types';
import { GarageModal } from './GarageModal';
import { SettingsModal } from './SettingsModal';

interface TitleOverlayProps {
  profile: PlayerProfile;
  onStart: () => void;
  onSwipeCharacter: (direction: -1 | 1, nextId: DriverCharacterId) => void;
  onSelectZone: (id: MymensinghZoneId) => void;
  onUpgradeStat: (stat: 'speedLevel' | 'brakeLevel' | 'durabilityLevel') => void;
  onClaimMission: (missionId: string) => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  profile,
  onStart,
  onSwipeCharacter,
  onSelectZone,
  onUpgradeStat,
  onClaimMission,
  onUpdateSettings,
}) => {
  const [modal, setModal] = useState<'none' | 'garage' | 'settings'>('none');
  const dragStartX = useRef<number | null>(null);

  const activeChar = CHARACTER_ROSTER[profile.characterId] || CHARACTER_ROSTER[0];
  const levelInfo = getDriverLevel(profile.xp);
  const claimableCount = profile.missions.filter((m) => m.completed && !m.claimed).length;

  const stepCharacter = (dir: -1 | 1) => {
    const nextIdx = (profile.characterId + dir + CHARACTER_ROSTER.length) % CHARACTER_ROSTER.length;
    onSwipeCharacter(dir, nextIdx as DriverCharacterId);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && modal !== 'none') {
        setModal('none');
        return;
      }
      if (modal !== 'none') return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        stepCharacter(-1);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        stepCharacter(1);
      } else if (e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (modal !== 'none') return;
    dragStartX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null || modal !== 'none') return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(dx) > 42) {
      stepCharacter(dx < 0 ? 1 : -1);
    }
  };

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col justify-between select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        dragStartX.current = null;
      }}
    >
      {/* Top Compact Bar: Title, Wallet, Driver XP, Garage & Settings */}
      <div
        className="w-full px-3 sm:px-5 pt-2.5 sm:pt-3.5 pb-4 flex items-center justify-between gap-2"
        style={{
          background:
            'linear-gradient(to bottom, rgba(16, 12, 9, 0.9) 0%, rgba(16, 12, 9, 0.5) 70%, rgba(16, 12, 9, 0) 100%)',
        }}
      >
        {/* Left: Game Lockup + Wallet + Level */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="min-w-0">
            <h1
              className="text-base sm:text-xl font-extrabold text-amber-400 tracking-tight leading-none truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              MYMENSINGH RICKSHAW RUSH
            </h1>
            <div
              className="text-[11px] sm:text-xs text-emerald-300 font-medium truncate mt-0.5"
              style={{ fontFamily: 'var(--font-bangla)' }}
            >
              ময়মনসিংহ রিকশা সিমুলেটর · চরিত্র নির্বাচন করুন
            </div>
          </div>

          <div
            className="h-9 px-2.5 sm:px-3 rounded-xl border border-amber-400/35 flex items-center gap-1.5 shrink-0"
            style={{ backgroundColor: 'rgba(18, 14, 11, 0.9)' }}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-amber-300 font-mono tabular-nums">
              ৳{profile.walletTaka.toLocaleString()}
            </span>
          </div>

          <div
            className="hidden md:flex h-9 px-2.5 rounded-xl border border-emerald-400/30 items-center gap-1.5 text-xs font-mono text-emerald-300 shrink-0"
            style={{ backgroundColor: 'rgba(18, 14, 11, 0.88)' }}
          >
            <span>Lv {levelInfo.level}</span>
            <span className="text-stone-500">·</span>
            <span className="text-stone-300">{profile.xp} XP</span>
          </div>
        </div>

        {/* Right: Quick Sound, Garage, Settings */}
        <div
          className="flex items-center gap-1.5 sm:gap-2 shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ soundEnabled: !profile.settings.soundEnabled })
            }
            aria-label={profile.settings.soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/15 text-stone-200 hover:text-white hover:border-amber-400/50 flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: 'rgba(18, 14, 11, 0.9)' }}
          >
            {profile.settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setModal('garage')}
            className="relative h-9 sm:h-10 px-3 rounded-xl border border-white/15 text-stone-100 hover:border-amber-400/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: 'rgba(18, 14, 11, 0.9)' }}
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Garage</span>
            {claimableCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-stone-950 text-[10px] font-extrabold flex items-center justify-center">
                {claimableCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setModal('settings')}
            className="h-9 sm:h-10 px-3 rounded-xl border border-white/15 text-stone-100 hover:border-amber-400/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: 'rgba(18, 14, 11, 0.9)' }}
          >
            <Settings className="w-4 h-4 text-stone-300" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Middle Unobstructed 3D Character + Custom Rickshaw Showcase + Side Swipe Arrows */}
      <div className="flex-1 flex items-center justify-between px-2 sm:px-6 pointer-events-none">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => stepCharacter(-1)}
          aria-label="Previous character"
          className="pointer-events-auto w-10 h-14 sm:w-12 sm:h-16 rounded-2xl border border-white/15 text-white hover:border-amber-400/60 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
          style={{ backgroundColor: 'rgba(18, 14, 11, 0.78)' }}
        >
          <ChevronLeft className="w-6 h-6 text-amber-300" />
        </button>

        {/* Floating Info Card on Right Edge (Leaves Center 3D Character & Rickshaw Clear) */}
        <div className="hidden sm:flex flex-col items-end pointer-events-none ml-auto mr-3">
          <div
            className="max-w-xs rounded-2xl border border-white/15 p-3.5 text-right shadow-xl"
            style={{ backgroundColor: 'rgba(18, 14, 11, 0.84)' }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              {activeChar.roleTitle}
            </div>
            <div className="mt-0.5 text-xl font-extrabold text-white leading-tight">
              <span style={{ fontFamily: 'var(--font-bangla)' }}>{activeChar.banglaName}</span>{' '}
              <span className="text-amber-400">· {activeChar.name}</span>
            </div>
            <p className="mt-1 text-xs text-stone-300 leading-snug">{activeChar.personality}</p>

            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-end gap-2">
              <div className="text-right">
                <div className="text-[10px] text-stone-400">Custom Rickshaw</div>
                <div className="text-xs font-bold text-amber-300">
                  {activeChar.rickshawName} ·{' '}
                  <span style={{ fontFamily: 'var(--font-bangla)' }}>
                    {activeChar.rickshawTitleBangla}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <span
                  className="w-4 h-4 rounded-full border border-white/50"
                  style={{ backgroundColor: activeChar.frameCss }}
                />
                <span
                  className="w-4 h-4 rounded-full border border-white/50"
                  style={{ backgroundColor: activeChar.rexineCss }}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => stepCharacter(1)}
          aria-label="Next character"
          className="pointer-events-auto w-10 h-14 sm:w-12 sm:h-16 rounded-2xl border border-white/15 text-white hover:border-amber-400/60 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
          style={{ backgroundColor: 'rgba(18, 14, 11, 0.78)' }}
        >
          <ChevronRight className="w-6 h-6 text-amber-300" />
        </button>
      </div>

      {/* Bottom Dock: 5-Character Selector Strip + Start Game Button */}
      <div
        className="w-full px-3 sm:px-6 pb-3 sm:pb-5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2.5"
        style={{
          background:
            'linear-gradient(to top, rgba(14, 10, 8, 0.94) 0%, rgba(14, 10, 8, 0.62) 68%, rgba(14, 10, 8, 0) 100%)',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* 5 Playable Characters Strip */}
        <div className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto">
          {CHARACTER_ROSTER.map((char) => {
            const selected = profile.characterId === char.id;
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => {
                  if (char.id === profile.characterId) return;
                  const dir = char.id > profile.characterId ? 1 : -1;
                  onSwipeCharacter(dir, char.id);
                }}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  selected
                    ? 'border-amber-400 bg-amber-500/20 text-white shadow-[0_0_16px_rgba(245,158,11,0.28)]'
                    : 'border-white/12 bg-stone-950/85 text-stone-300 hover:border-white/30 hover:text-white'
                }`}
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg overflow-hidden border border-white/25 flex flex-col shrink-0">
                  <div className="flex-1" style={{ backgroundColor: char.shirtCss }} />
                  <div className="h-1" style={{ backgroundColor: char.gamchaCss }} />
                  <div className="flex-1" style={{ backgroundColor: char.frameCss }} />
                </div>
                <div className="text-left leading-tight">
                  <div
                    className="text-xs font-bold"
                    style={{ fontFamily: 'var(--font-bangla)' }}
                  >
                    {char.banglaName}
                  </div>
                  <div className="text-[10px] text-amber-300 font-medium">{char.name}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Prominent Start Game CTA */}
        <button
          type="button"
          onClick={onStart}
          className="w-full sm:w-auto min-w-[210px] h-11 sm:h-12 px-7 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-extrabold text-base sm:text-lg tracking-tight shadow-[0_8px_28px_rgba(245,158,11,0.42)] transition-all cursor-pointer flex items-center justify-center gap-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <Play className="w-5 h-5 fill-stone-950" />
          <span>Start Game</span>
        </button>
      </div>

      {/* Garage Modal */}
      {modal === 'garage' && (
        <GarageModal
          profile={profile}
          onSelectZone={onSelectZone}
          onUpgradeStat={onUpgradeStat}
          onClaimMission={onClaimMission}
          onClose={() => setModal('none')}
        />
      )}

      {/* Unified Settings Modal (includes VFX, Sound/Ambient, Music, About) */}
      {modal === 'settings' && (
        <SettingsModal
          settings={profile.settings}
          onUpdateSettings={onUpdateSettings}
          onClose={() => setModal('none')}
        />
      )}
    </div>
  );
};
