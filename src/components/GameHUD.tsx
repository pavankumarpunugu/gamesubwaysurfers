import React from 'react';
import { Pause, Zap, Magnet, Rocket, Footprints, ShieldAlert } from 'lucide-react';
import { PlayerStats, PowerUpState } from '../types/game';

interface GameHUDProps {
  stats: PlayerStats;
  powerUps: PowerUpState[];
  hasHoverboardReady: boolean;
  onActivateHoverboard: () => void;
  onPause: () => void;
  inspectorClose: boolean;
  onShiftLane?: (dir: number) => void;
  onJump?: () => void;
  onSlide?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  powerUps,
  hasHoverboardReady,
  onActivateHoverboard,
  onPause,
  inspectorClose,
  onShiftLane,
  onJump,
  onSlide,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Inspector Danger Chase Vignette (Red flashing edges when Inspector is breathing down your neck) */}
      {inspectorClose && (
        <div className="absolute inset-0 border-[10px] sm:border-[16px] border-rose-600/70 shadow-[inset_0_0_80px_rgba(225,29,72,0.85)] pointer-events-none animate-pulse transition-opacity duration-300 flex items-start justify-center pt-16">
          <div className="bg-rose-950/90 border-2 border-rose-500 text-rose-200 px-4 py-1.5 rounded-full font-game text-xs tracking-wider flex items-center gap-2 shadow-2xl">
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>INSPECTOR IS CLOSING IN!</span>
          </div>
        </div>
      )}

      {/* Top HUD Cluster (Score, Multiplier, Coins, Distance, Pause) */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Distance & Pause */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={onPause}
            className="w-11 h-11 rounded-2xl bg-zinc-900/85 border border-zinc-700/80 hover:border-zinc-500 text-zinc-100 flex items-center justify-center transition active:scale-95 shadow-lg"
            title="Pause (Esc)"
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>

          <div className="bg-zinc-900/85 border border-zinc-700/80 px-3.5 py-1.5 rounded-2xl shadow-lg">
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Distance</div>
            <div className="font-game text-zinc-100 text-lg tabular-nums">
              {stats.distance} <span className="text-xs text-zinc-400 font-sans">m</span>
            </div>
          </div>
        </div>

        {/* Right: Score & Coins */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Main Score & Multiplier */}
          <div className="flex items-center gap-2 bg-zinc-900/90 border-2 border-yellow-500/80 px-4 py-1.5 rounded-2xl shadow-xl">
            {stats.multiplier > 1 && (
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-game text-xs px-2 py-0.5 rounded-lg font-black shadow">
                2X
              </span>
            )}
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-300">Score</div>
              <div className="font-game text-2xl text-yellow-300 tabular-nums tracking-wide">
                {stats.score.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Collected Coins */}
          <div className="flex items-center gap-2 bg-zinc-900/85 border border-yellow-500/60 px-3 py-1 rounded-xl shadow-lg">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center text-[10px] font-black text-zinc-900 shadow">
              ★
            </div>
            <span className="font-game text-yellow-300 text-base tabular-nums">
              {stats.coins.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Active Power-Up Timers (Bottom-Left Cluster) */}
      <div className="flex flex-col gap-2 pointer-events-auto max-w-[200px]">
        {powerUps.map((pu) => {
          const progress = Math.max(0, pu.timeLeft / pu.duration);
          const icon =
            pu.type === 'magnet' ? <Magnet className="w-4 h-4 text-rose-400" /> :
            pu.type === 'jetpack' ? <Rocket className="w-4 h-4 text-amber-400" /> :
            pu.type === 'sneakers' ? <Footprints className="w-4 h-4 text-pink-400" /> :
            <Zap className="w-4 h-4 text-sky-400" />;

          const title =
            pu.type === 'magnet' ? 'MAGNET' :
            pu.type === 'jetpack' ? 'JETPACK' :
            pu.type === 'sneakers' ? 'SUPER SHOES' : '2X SCORE';

          return (
            <div
              key={pu.type}
              className="bg-zinc-900/90 border border-zinc-700/80 px-3 py-1.5 rounded-xl shadow-lg flex flex-col gap-1"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-game text-zinc-200">
                  {icon}
                  <span>{title}</span>
                </div>
                <span className="font-game text-yellow-300 tabular-nums">
                  {Math.ceil(pu.timeLeft)}s
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-100 rounded-full"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Cluster (Hoverboard Ready & Mobile Touch Controls) */}
      <div className="flex items-end justify-between w-full pointer-events-auto">
        {/* On-screen touch buttons for mobile/tablet */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            onTouchStart={(e) => { e.preventDefault(); onShiftLane?.(-1); }}
            className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-zinc-700 text-zinc-200 font-game text-xl active:bg-zinc-700 flex items-center justify-center"
          >
            ◀
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); onShiftLane?.(1); }}
            className="w-12 h-12 rounded-2xl bg-zinc-900/80 border border-zinc-700 text-zinc-200 font-game text-xl active:bg-zinc-700 flex items-center justify-center"
          >
            ▶
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); onJump?.(); }}
            className="w-12 h-12 rounded-2xl bg-sky-600/80 border border-sky-400 text-white font-game text-sm active:bg-sky-500 flex items-center justify-center"
          >
            JUMP
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); onSlide?.(); }}
            className="w-12 h-12 rounded-2xl bg-amber-600/80 border border-amber-400 text-white font-game text-sm active:bg-amber-500 flex items-center justify-center"
          >
            SLIDE
          </button>
        </div>

        {/* Hoverboard Summon Button (Bottom-Right) */}
        <button
          onClick={onActivateHoverboard}
          disabled={!hasHoverboardReady}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-game text-sm tracking-wide shadow-xl transition active:scale-95 ml-auto ${
            hasHoverboardReady
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-2 border-cyan-300 text-white hover:brightness-110 shadow-cyan-500/30'
              : 'bg-zinc-800/80 border border-zinc-700 text-zinc-500 cursor-not-allowed opacity-60'
          }`}
          title="Activate Hoverboard (Space or Double-Tap)"
        >
          <span className="text-lg">🏄</span>
          <span>{hasHoverboardReady ? 'HOVERBOARD' : 'ACTIVE'}</span>
        </button>
      </div>
    </div>
  );
};
