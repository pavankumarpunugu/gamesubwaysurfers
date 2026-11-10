import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, ShoppingBag, Trophy, Coins, Compass } from 'lucide-react';
import { PlayerStats } from '../types/game';

interface GameOverModalProps {
  stats: PlayerStats;
  onRestart: () => void;
  onQuitToTitle: () => void;
  onOpenShop: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onQuitToTitle,
  onOpenShop,
}) => {
  const isNewHighScore = stats.score > 0 && stats.score >= stats.highScore;

  useEffect(() => {
    if (isNewHighScore) {
      // Confetti burst for new high score!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#facc15', '#38bdf8', '#ec4899', '#10b981'],
      });
    }
  }, [isNewHighScore]);

  return (
    <div className="absolute inset-0 bg-black/75 z-30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Game Over Title Badge */}
        <div className="relative mb-2">
          {isNewHighScore && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400 text-amber-300 font-game text-xs rounded-full shadow animate-bounce">
              <Trophy className="w-3.5 h-3.5" />
              <span>NEW HIGH SCORE!</span>
            </div>
          )}
          <h2 className="font-game text-4xl text-rose-500 tracking-wide drop-shadow-md">
            CRASHED!
          </h2>
          <p className="text-zinc-400 text-xs font-semibold">The Inspector caught up with you!</p>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 my-5">
          {/* Final Score */}
          <div className="bg-zinc-800/80 border border-zinc-700/80 p-3 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Final Score</span>
            <span className="font-game text-2xl text-yellow-300 tabular-nums">
              {stats.score.toLocaleString()}
            </span>
          </div>

          {/* High Score */}
          <div className="bg-zinc-800/80 border border-zinc-700/80 p-3 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-400">High Score</span>
            <span className="font-game text-2xl text-amber-400 tabular-nums">
              {stats.highScore.toLocaleString()}
            </span>
          </div>

          {/* Coins Collected */}
          <div className="bg-zinc-800/80 border border-zinc-700/80 p-3 rounded-2xl flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-400">
              <Coins className="w-3 h-3 text-yellow-400" />
              <span>Coins Grabbed</span>
            </div>
            <span className="font-game text-xl text-yellow-200 tabular-nums">
              +{stats.coins.toLocaleString()}
            </span>
          </div>

          {/* Distance */}
          <div className="bg-zinc-800/80 border border-zinc-700/80 p-3 rounded-2xl flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-400">
              <Compass className="w-3 h-3 text-sky-400" />
              <span>Distance</span>
            </div>
            <span className="font-game text-xl text-sky-300 tabular-nums">
              {stats.distance} m
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onRestart}
            className="w-full py-4 bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-zinc-950 font-game text-xl rounded-2xl border-2 border-zinc-950 shadow-lg flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onOpenShop}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border-2 border-yellow-500/80 text-yellow-300 font-game text-sm rounded-2xl shadow flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <ShoppingBag className="w-4 h-4 text-yellow-400" />
            <span>UPGRADES & CHARACTERS</span>
          </button>

          <button
            onClick={onQuitToTitle}
            className="w-full py-2.5 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-game text-xs rounded-2xl border border-zinc-700 flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>BACK TO TITLE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
