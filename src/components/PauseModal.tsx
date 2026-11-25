import React, { useState } from 'react';
import {
  Home,
  Music,
  Play,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { GameSettings } from '../game/types';
import { SettingsModal } from './SettingsModal';

interface PauseModalProps {
  settings: GameSettings;
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  settings,
  onResume,
  onRestart,
  onQuitToMenu,
  onUpdateSettings,
}) => {
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) {
    return (
      <SettingsModal
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10, 8, 6, 0.72)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/15 p-5 sm:p-6 text-center shadow-2xl"
        style={{ backgroundColor: 'rgba(22, 18, 15, 0.97)' }}
      >
        {confirmQuit ? (
          <div>
            <h2
              className="text-xl font-bold text-amber-400 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Return to Character Home?
            </h2>
            <p className="mt-2 text-sm text-stone-200">
              Your shift earnings and mission progress are saved.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onQuitToMenu}
                className="h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors cursor-pointer"
              >
                YES
              </button>
              <button
                type="button"
                onClick={() => setConfirmQuit(false)}
                className="h-11 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold text-sm border border-white/10 transition-colors cursor-pointer"
              >
                NO
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2
              className="text-2xl font-bold text-amber-400 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Ride Paused
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-300">
              Take a breather before rolling back into Mymensingh traffic.
            </p>

            {/* Quick Sound & Music Toggles */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                  settings.soundEnabled
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-stone-900 border-white/10 text-stone-400'
                }`}
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                <span>Sound: {settings.soundEnabled ? 'On' : 'Off'}</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
                className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                  settings.musicEnabled
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                    : 'bg-stone-900 border-white/10 text-stone-400'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>Music: {settings.musicEnabled ? 'On' : 'Off'}</span>
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResume}
                className="h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-stone-950" />
                <span>Resume</span>
              </button>

              <button
                type="button"
                onClick={onRestart}
                className="h-11 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold text-sm border border-white/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="h-10 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 font-semibold text-xs border border-white/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Settings &amp; About</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmQuit(true)}
                className="h-10 rounded-xl bg-stone-900 hover:bg-rose-950/60 text-rose-300 font-semibold text-xs border border-rose-500/25 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Character Home</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
