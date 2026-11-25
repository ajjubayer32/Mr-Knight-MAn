import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { TitleOverlay } from './components/TitleOverlay';
import { soundEngine } from './game/audio';
import { RickshawEngine, type TripCompletionEvent } from './game/engine';
import {
  CITY_ZONES_CATALOG,
  loadPlayerProfile,
  savePlayerProfile,
} from './game/profile';
import type {
  DriverCharacterId,
  GameSettings,
  GameSummary,
  HudState,
  MymensinghZoneId,
  PlayerProfile,
} from './game/types';

function createInitialHud(profile: PlayerProfile): HudState {
  const zone =
    CITY_ZONES_CATALOG.find((z) => z.id === profile.selectedZone) || CITY_ZONES_CATALOG[0];
  return {
    phase: 'title',
    distanceMeters: 0,
    speedKmh: 0,
    fareTaka: 0,
    walletTaka: profile.walletTaka,
    coinsCollected: 0,
    passengersServed: 0,
    hearts: 2 + profile.upgrades.durabilityLevel,
    maxHearts: 2 + profile.upgrades.durabilityLevel,
    stamina: 100,
    combo: 1,
    comboTimer: 0,
    nearMisses: 0,
    bellCooldown: 0,
    eventBanner: null,
    bestFare: profile.bestFare,
    bestDistance: profile.bestDistance,
    currentZoneId: zone.id,
    currentZoneLabel: zone.name,
    currentZoneBangla: zone.bangla,
    currentRoadName: 'Ganginarpar Main Road',
    playerX: 0,
    playerZ: 22,
    playerYaw: 0,
    passengerTrip: {
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
    },
    activeBlip: null,
    routePoints: [],
    autoBrakingHint: null,
    characterId: profile.characterId,
  };
}

function tryLockLandscape(): void {
  try {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return;
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    orientation?.lock?.('landscape')?.catch(() => {});
  } catch {
    // Ignore when browser or iframe blocks orientation lock
  }
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RickshawEngine | null>(null);

  const [profile, setProfile] = useState<PlayerProfile>(() => loadPlayerProfile());
  const [hud, setHud] = useState<HudState>(() => createInitialHud(loadPlayerProfile()));
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const profileRef = useRef(profile);
  profileRef.current = profile;

  const hudRef = useRef(hud);
  hudRef.current = hud;

  useEffect(() => {
    tryLockLandscape();
  }, []);

  const updateProfile = useCallback(
    (updater: (prev: PlayerProfile) => PlayerProfile, syncEngine = true) => {
      setProfile((prev) => {
        const next = updater(prev);
        profileRef.current = next;
        savePlayerProfile(next);
        if (syncEngine) {
          engineRef.current?.syncProfile(next);
        }
        return next;
      });
    },
    []
  );

  const applyTripCompletedToProfile = useCallback(
    (evt: TripCompletionEvent) => {
      updateProfile((prev) => {
        const nextMissions = prev.missions.map((m) => {
          let nextProg = m.progress;
          if (m.kind === 'delivery' || m.kind === 'multi_passenger') {
            nextProg = m.progress + 1;
          } else if (m.kind === 'destination' && m.targetZoneId === evt.destinationZoneId) {
            nextProg = m.progress + 1;
          } else if (m.kind === 'time_challenge' && m.timeLimitSec && evt.elapsedSec <= m.timeLimitSec) {
            nextProg = m.progress + 1;
          } else if (
            m.kind === 'special_delivery' &&
            (evt.isSpecial || evt.destinationZoneId === m.targetZoneId)
          ) {
            nextProg = m.progress + 1;
          }
          return {
            ...m,
            progress: nextProg,
            completed: m.completed || nextProg >= m.target,
          };
        });
        return {
          ...prev,
          xp: prev.xp + 35,
          totalTrips: prev.totalTrips + 1,
          missions: nextMissions,
        };
      }, false);
    },
    [updateProfile]
  );

  const applyRunProgressToProfile = useCallback(
    (
      walletTaka: number,
      coinsCollected: number,
      distanceMeters: number,
      fareTaka: number,
      nearMisses: number,
      xpEarned: number
    ) => {
      updateProfile((prev) => {
        const nextBestFare = Math.max(prev.bestFare, fareTaka);
        const nextBestDistance = Math.max(prev.bestDistance, distanceMeters);
        const nextTotalDist = prev.totalDistance + distanceMeters;
        const nextTotalNearMiss = prev.totalNearMisses + nearMisses;

        const nextMissions = prev.missions.map((m) => {
          let nextProg = m.progress;
          if (m.kind === 'distance') {
            nextProg = Math.max(m.progress, distanceMeters);
          } else if (m.kind === 'earnings') {
            nextProg = Math.max(m.progress, fareTaka);
          } else if (m.kind === 'near_miss') {
            nextProg = nextTotalNearMiss;
          } else if (m.kind === 'long_route') {
            nextProg = nextTotalDist;
          }
          return {
            ...m,
            progress: nextProg,
            completed: m.completed || nextProg >= m.target,
          };
        });

        return {
          ...prev,
          walletTaka: Math.max(prev.walletTaka, walletTaka),
          xp: prev.xp + xpEarned,
          bestFare: nextBestFare,
          bestDistance: nextBestDistance,
          totalDistance: nextTotalDist,
          totalCoins: prev.totalCoins + coinsCollected,
          totalNearMisses: nextTotalNearMiss,
          missions: nextMissions,
        };
      });
    },
    [updateProfile]
  );

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const engine = new RickshawEngine(mount, profileRef.current, {
      onHudUpdate: (nextHud) => {
        hudRef.current = nextHud;
        setHud(nextHud);
      },
      onTripCompleted: applyTripCompletedToProfile,
      onZoneDiscovered: (zoneId: MymensinghZoneId) => {
        updateProfile((prev) => {
          if (prev.unlockedZones.includes(zoneId)) return prev;
          return {
            ...prev,
            unlockedZones: [...prev.unlockedZones, zoneId],
          };
        }, false);
      },
      onGameOver: (runSummary) => {
        applyRunProgressToProfile(
          runSummary.walletTaka,
          runSummary.coinsCollected,
          runSummary.distanceMeters,
          runSummary.fareTaka,
          runSummary.nearMisses,
          runSummary.xpEarned
        );
        setSummary(runSummary);
      },
      onContextLostChange: (lost) => setContextLost(lost),
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [applyRunProgressToProfile, applyTripCompletedToProfile, updateProfile]);

  const handleStart = useCallback(() => {
    tryLockLandscape();
    setSummary(null);
    engineRef.current?.startGame(profileRef.current);
  }, []);

  const handleRestartFromPause = useCallback(() => {
    const currentHud = hudRef.current;
    const runXp = Math.round(currentHud.distanceMeters * 0.08) + currentHud.nearMisses * 10;
    applyRunProgressToProfile(
      currentHud.walletTaka,
      currentHud.coinsCollected,
      currentHud.distanceMeters,
      currentHud.fareTaka,
      currentHud.nearMisses,
      runXp
    );
    setSummary(null);
    engineRef.current?.startGame(profileRef.current);
  }, [applyRunProgressToProfile]);

  const handleQuitToMenu = useCallback(() => {
    const currentHud = hudRef.current;
    if (currentHud.phase === 'playing' || currentHud.phase === 'paused') {
      const runXp = Math.round(currentHud.distanceMeters * 0.08) + currentHud.nearMisses * 10;
      applyRunProgressToProfile(
        currentHud.walletTaka,
        currentHud.coinsCollected,
        currentHud.distanceMeters,
        currentHud.fareTaka,
        currentHud.nearMisses,
        runXp
      );
    }
    setSummary(null);
    engineRef.current?.returnToMenu();
  }, [applyRunProgressToProfile]);

  const handleSwipeCharacter = useCallback(
    (direction: -1 | 1, nextId: DriverCharacterId) => {
      engineRef.current?.previewCharacterSwipe(direction, nextId);
      updateProfile((prev) => ({ ...prev, characterId: nextId }), false);
    },
    [updateProfile]
  );

  const handleSelectZone = useCallback(
    (id: MymensinghZoneId) => {
      soundEngine.playUiClick();
      updateProfile((prev) => ({ ...prev, selectedZone: id }));
    },
    [updateProfile]
  );

  const handleUpgradeStat = useCallback(
    (stat: 'speedLevel' | 'brakeLevel' | 'durabilityLevel') => {
      const baseCost = stat === 'speedLevel' ? 120 : stat === 'brakeLevel' ? 100 : 140;
      const currentLvl = profileRef.current.upgrades[stat];
      if (currentLvl >= 4) return;
      const cost = currentLvl * baseCost;
      if (profileRef.current.walletTaka < cost) return;

      soundEngine.playCoin(2);
      updateProfile((prev) => ({
        ...prev,
        walletTaka: prev.walletTaka - cost,
        upgrades: {
          ...prev.upgrades,
          [stat]: currentLvl + 1,
        },
      }));
    },
    [updateProfile]
  );

  const handleClaimMission = useCallback(
    (missionId: string) => {
      const mission = profileRef.current.missions.find((m) => m.id === missionId);
      if (!mission || !mission.completed || mission.claimed) return;
      soundEngine.playPassengerDropoff();
      updateProfile((prev) => ({
        ...prev,
        walletTaka: prev.walletTaka + mission.rewardTaka,
        xp: prev.xp + mission.rewardXp,
        missions: prev.missions.map((m) =>
          m.id === missionId ? { ...m, claimed: true } : m
        ),
      }));
    },
    [updateProfile]
  );

  const handleUpdateSettings = useCallback(
    (patch: Partial<GameSettings>) => {
      soundEngine.playUiClick();
      updateProfile((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...patch,
        },
      }));
    },
    [updateProfile]
  );

  const handleTogglePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  const handleRingBell = useCallback(() => {
    engineRef.current?.ringBell();
  }, []);

  const handleTouchSteer = useCallback((val: number) => {
    engineRef.current?.setTouchSteer(val);
  }, []);

  const handleTouchBoost = useCallback((active: boolean) => {
    engineRef.current?.setTouchBoost(active);
  }, []);

  const handleTouchBrake = useCallback((active: boolean) => {
    engineRef.current?.setTouchBrake(active);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#181412]">
      {/* Isolated WebGL Viewport Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* Character Home / Selection Screen */}
      {hud.phase === 'title' && (
        <TitleOverlay
          profile={profile}
          onStart={handleStart}
          onSwipeCharacter={handleSwipeCharacter}
          onSelectZone={handleSelectZone}
          onUpgradeStat={handleUpgradeStat}
          onClaimMission={handleClaimMission}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* Active Gameplay HUD */}
      {(hud.phase === 'playing' || hud.phase === 'paused') && (
        <GameHud
          hud={hud}
          soundEnabled={profile.settings.soundEnabled}
          controlScheme={profile.settings.controlScheme}
          onToggleSound={() =>
            handleUpdateSettings({ soundEnabled: !profile.settings.soundEnabled })
          }
          onPause={handleTogglePause}
          onRingBell={handleRingBell}
          onTouchSteer={handleTouchSteer}
          onTouchBoost={handleTouchBoost}
          onTouchBrake={handleTouchBrake}
        />
      )}

      {/* Pause Modal */}
      {hud.phase === 'paused' && (
        <PauseModal
          settings={profile.settings}
          onResume={handleTogglePause}
          onRestart={handleRestartFromPause}
          onQuitToMenu={handleQuitToMenu}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* Game Over Modal */}
      {hud.phase === 'gameover' && summary && (
        <GameOverModal
          summary={summary}
          onPlayAgain={handleStart}
          onReturnToMenu={handleQuitToMenu}
        />
      )}

      {/* WebGL Context Lost Safety Notice */}
      {contextLost && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-stone-950/90 p-6 text-center">
          <div className="max-w-sm">
            <h2 className="text-xl font-bold text-amber-400">Graphics Context Interrupted</h2>
            <p className="mt-2 text-sm text-stone-300">
              Restoring the 3D Mymensingh street scene. If it does not resume automatically, reload the page.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
