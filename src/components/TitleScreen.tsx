import React from 'react';
import { Volume2, VolumeX, Sparkles, ShoppingBag, Shield } from 'lucide-react';
import { CharacterConfig, HoverboardConfig, PlayerStats } from '../types/game';

interface TitleScreenProps {
  onStart: () => void;
  onOpenShop: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  stats: PlayerStats;
  selectedChar: CharacterConfig;
  selectedBoard: HoverboardConfig;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenShop,
  isMuted,
  onToggleMute,
  stats,
  selectedChar,
  selectedBoard,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none select-none z-20">
      {/* Top Header Cluster */}
      <div className="flex items-center justify-between w-full">
        {/* High Score Badge */}
        <div className="flex items-center gap-3 bg-zinc-900/80 border-2 border-amber-400/80 px-4 py-2 rounded-2xl shadow-xl pointer-events-auto">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-inner">
            <span className="text-zinc-950 font-black text-sm">🏆</span>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-amber-300">Top Score</div>
            <div className="font-game text-xl text-yellow-300 tabular-nums tracking-wide">
              {stats.highScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Coins & Audio Controls */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Total Coins */}
          <div className="flex items-center gap-2 bg-zinc-900/80 border border-yellow-500/50 px-3.5 py-2 rounded-2xl shadow-lg">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-200 flex items-center justify-center text-xs font-black text-zinc-900 shadow">
              ★
            </div>
            <span className="font-game text-yellow-300 text-lg tabular-nums">
              {stats.totalCoins.toLocaleString()}
            </span>
          </div>

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className="w-11 h-11 rounded-2xl bg-zinc-900/80 border border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-200 transition active:scale-95 shadow-lg"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Hero Subway Surfers 3D Title Lockup */}
      <div className="flex flex-col items-center justify-center my-auto text-center pointer-events-auto">
        <div className="relative group cursor-pointer transition-transform hover:scale-105" onClick={onStart}>
          {/* Glow backdrop */}
          <div className="absolute -inset-6 bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-rose-500/20 blur-2xl rounded-full" />

          {/* Bespoke Subway Surfers Graffiti SVG Logo */}
          <svg className="w-[320px] sm:w-[460px] h-[140px] drop-shadow-2xl overflow-visible" viewBox="0 0 500 160">
            <defs>
              <linearGradient id="subwayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="45%" stopColor="#f59e0b" />
                <stop offset="90%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="surfGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#09090b" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* "SUBWAY" Top Arc */}
            <text
              x="250"
              y="72"
              textAnchor="middle"
              className="font-game"
              fontSize="68"
              fontWeight="900"
              fill="url(#subwayGrad)"
              stroke="#09090b"
              strokeWidth="9"
              strokeLinejoin="round"
              filter="url(#shadow)"
              letterSpacing="2"
            >
              SUBWAY
            </text>

            {/* "SURFERS 3D" Bottom Arc with Angle */}
            <g transform="rotate(-3 250 120)">
              <text
                x="250"
                y="136"
                textAnchor="middle"
                className="font-game"
                fontSize="56"
                fontWeight="900"
                fill="url(#surfGrad)"
                stroke="#09090b"
                strokeWidth="8"
                strokeLinejoin="round"
                filter="url(#shadow)"
                letterSpacing="3"
              >
                SURFERS
              </text>
              {/* "3D" Tag Badge */}
              <rect x="400" y="86" width="62" height="34" rx="8" fill="#ec4899" stroke="#09090b" strokeWidth="4" />
              <text x="431" y="110" textAnchor="middle" className="font-game" fontSize="22" fontWeight="900" fill="#ffffff">
                3D
              </text>
            </g>
          </svg>

          {/* Tagline */}
          <div className="mt-1 text-sm sm:text-base font-extrabold uppercase tracking-widest text-sky-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            World Tour • Endless Railway Chase
          </div>
        </div>

        {/* Primary Start CTA Button */}
        <button
          onClick={onStart}
          className="mt-8 px-10 py-4 bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-zinc-950 font-game text-2xl tracking-wide rounded-3xl border-4 border-zinc-950 shadow-[0_8px_0_#78350f,0_14px_25px_rgba(0,0,0,0.6)] active:translate-y-1 active:shadow-[0_4px_0_#78350f] transition flex items-center gap-3 cursor-pointer group"
        >
          <span>TAP TO SURF</span>
          <span className="text-xl group-hover:translate-x-1 transition-transform">⚡</span>
        </button>

        {/* Active Character / Board Pill */}
        <div className="mt-4 flex items-center gap-2 bg-zinc-900/75 border border-zinc-700/80 px-4 py-1.5 rounded-full text-xs text-zinc-300">
          <span className="text-amber-400 font-bold">{selectedChar.name}</span>
          <span>•</span>
          <span className="text-cyan-400 font-bold">{selectedBoard.name}</span>
        </div>
      </div>

      {/* Bottom Control Bar & Single Flat Hint Line */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex items-center gap-4 pointer-events-auto">
          {/* Shop / Upgrades Button */}
          <button
            onClick={onOpenShop}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 border-2 border-yellow-500/80 text-yellow-300 font-subway font-bold rounded-2xl shadow-xl transition active:scale-95"
          >
            <ShoppingBag className="w-5 h-5 text-yellow-400" />
            <span>CHARACTERS & UPGRADES</span>
          </button>
        </div>

        {/* Flat control-hint line (as required by game craft constitution) */}
        <div className="text-xs font-semibold text-zinc-900/90 sm:text-zinc-100 bg-black/40 px-4 py-1 rounded-full drop-shadow">
          WASD / Arrows Move · Space Jump / Surf · S / Down Slide · Esc Pause
        </div>
      </div>
    </div>
  );
};
