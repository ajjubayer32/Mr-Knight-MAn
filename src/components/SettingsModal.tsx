import React from 'react';
import { Info, Settings, X } from 'lucide-react';
import type { GameSettings, GraphicsQuality } from '../game/types';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const toggles: Array<{
    key: 'vfxEnabled' | 'soundEnabled' | 'ambientEnabled' | 'musicEnabled' | 'vibrationEnabled';
    label: string;
    desc: string;
  }> = [
    {
      key: 'vfxEnabled',
      label: 'Visual Effects (VFX)',
      desc: 'Coin pickup bursts, drop-off celebration particles & impact sparks',
    },
    {
      key: 'soundEnabled',
      label: 'Sound Effects',
      desc: 'Rickshaw bell ring, coin chimes, horns & passenger cues',
    },
    {
      key: 'ambientEnabled',
      label: 'Ambient City Sound',
      desc: 'Mymensingh street breeze, distant bells, traffic murmur & wheel hum',
    },
    {
      key: 'musicEnabled',
      label: 'Background Music',
      desc: 'Soft Bengali folk dotara melody while driving',
    },
    {
      key: 'vibrationEnabled',
      label: 'Vibration Feedback',
      desc: 'Tactile pulse on bell, pickups & collisions (mobile)',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 pointer-events-auto"
      style={{ backgroundColor: 'rgba(10, 8, 6, 0.76)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-white/15 p-4 sm:p-6 shadow-2xl text-left"
        style={{ backgroundColor: 'rgba(20, 16, 13, 0.98)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-amber-400" />
            <h2
              className="text-lg sm:text-xl font-bold text-amber-400"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Settings &amp; About
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {toggles.map((item) => {
            const on = settings[item.key];
            return (
              <div
                key={item.key}
                className="rounded-xl border border-white/10 bg-stone-900/80 p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-stone-100">{item.label}</div>
                  <div className="text-xs text-stone-400">{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ [item.key]: !on })}
                  className={`shrink-0 h-8 px-3.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    on
                      ? 'bg-emerald-500 text-stone-950'
                      : 'bg-stone-800 text-stone-300 border border-white/10'
                  }`}
                >
                  {on ? 'ON' : 'OFF'}
                </button>
              </div>
            );
          })}

          <div className="rounded-xl border border-white/10 bg-stone-900/80 p-3">
            <div className="text-sm font-semibold text-stone-100">Graphics Quality</div>
            <div className="text-xs text-stone-400 mb-2">
              Adjust shadows and resolution scaling for smoother performance
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onUpdateSettings({ graphicsQuality: q })}
                  className={`h-8 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-stone-900/80 p-3">
            <div className="text-sm font-semibold text-stone-100">Controls Mode</div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(['auto', 'keyboard', 'touch'] as const).map((ctrl) => (
                <button
                  key={ctrl}
                  type="button"
                  onClick={() => onUpdateSettings({ controlScheme: ctrl })}
                  className={`h-8 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                    settings.controlScheme === ctrl
                      ? 'bg-sky-400 text-stone-950'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  {ctrl}
                </button>
              ))}
            </div>
          </div>

          {/* Integrated About Section */}
          <div className="rounded-xl border border-amber-400/20 bg-stone-900/90 p-3.5 space-y-2 text-xs text-stone-300 leading-relaxed">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <Info className="w-4 h-4 shrink-0" />
              <span>About Mymensingh Rickshaw Rush</span>
            </div>
            <p>
              Drive an authentic traditional Bangladeshi pedal rickshaw across connected Mymensingh streets —{' '}
              <span className="text-emerald-300">Ganginarpar</span>,{' '}
              <span className="text-emerald-300">Town Hall Road</span>,{' '}
              <span className="text-emerald-300">Charpara Station Road</span>, and{' '}
              <span className="text-emerald-300">Shambhuganj Bridge</span>.
            </p>
            <p className="text-stone-400">
              Choose any of the 5 drivers (<span className="text-stone-200">Jubayer, Siam, Riyad, Sadi, Pantho</span>) and their custom hand-painted rickshaw. Follow map turns to pick up waiting passengers and drop them off across intersections, side branches, and U-turns.
            </p>
            <div className="pt-1 text-[11px] text-stone-400 font-mono">
              Controls: W/↑ Pedal · S/↓ Brake · A/D or ←/→ Turn &amp; U-Turn · Space Bell · Esc Pause
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
