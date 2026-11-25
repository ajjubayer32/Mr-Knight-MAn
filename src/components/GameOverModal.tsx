import React from 'react';
import { Home, RotateCcw } from 'lucide-react';
import type { GameSummary } from '../game/types';

interface GameOverModalProps {
  summary: GameSummary;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  summary,
  onPlayAgain,
  onReturnToMenu,
}) => {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10, 8, 6, 0.74)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/15 p-5 sm:p-7 shadow-2xl"
        style={{ backgroundColor: 'rgba(22, 18, 15, 0.97)' }}
      >
        <div className="text-center">
          {summary.isNewBest && (
            <p className="text-xs font-semibold text-emerald-400 mb-1">New Personal Best</p>
          )}
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Shift Complete
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-300">
            Wallet:{' '}
            <span className="font-mono font-bold text-amber-300">
              ৳{summary.walletTaka.toLocaleString()}
            </span>{' '}
            · Earned{' '}
            <span className="font-mono font-bold text-emerald-300">+{summary.xpEarned} XP</span>
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className="rounded-xl bg-stone-900/90 border border-white/10 p-3">
            <div className="text-xs text-stone-400">Shift Fare</div>
            <div className="mt-0.5 text-xl sm:text-2xl font-bold text-amber-400 font-mono tabular-nums">
              ৳{summary.fareTaka.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl bg-stone-900/90 border border-white/10 p-3">
            <div className="text-xs text-stone-400">Distance</div>
            <div className="mt-0.5 text-xl sm:text-2xl font-bold text-stone-100 font-mono tabular-nums">
              {summary.distanceMeters.toLocaleString()} m
            </div>
          </div>
          <div className="rounded-xl bg-stone-900/90 border border-white/10 p-3">
            <div className="text-xs text-stone-400">Passengers Dropped</div>
            <div className="mt-0.5 text-lg sm:text-xl font-bold text-emerald-400 font-mono tabular-nums">
              {summary.passengersServed}
            </div>
          </div>
          <div className="rounded-xl bg-stone-900/90 border border-white/10 p-3">
            <div className="text-xs text-stone-400">Near Misses · Coins</div>
            <div className="mt-0.5 text-lg sm:text-xl font-bold text-stone-100 font-mono tabular-nums">
              {summary.nearMisses} · {summary.coinsCollected}
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-stone-400 font-mono tabular-nums">
          Best: ৳{summary.bestFare.toLocaleString()} · {summary.bestDistance.toLocaleString()} m · Top {summary.topSpeedKmh} km/h
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onPlayAgain}
            className="h-11 sm:h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ride Again</span>
          </button>

          <button
            type="button"
            onClick={onReturnToMenu}
            className="h-11 sm:h-12 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold text-sm border border-white/12 transition-colors cursor-pointer flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Home className="w-4 h-4" />
            <span>Character Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
