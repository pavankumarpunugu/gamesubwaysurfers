import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuitToTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onQuitToTitle,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Title */}
        <h2 className="font-game text-3xl text-yellow-400 tracking-wide drop-shadow">
          PAUSED
        </h2>
        <p className="text-zinc-400 text-xs font-semibold mt-1">Take a breath, Surfer!</p>

        {/* Buttons List */}
        <div className="flex flex-col gap-3 w-full mt-6">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-game text-lg rounded-2xl border-2 border-emerald-300 shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME RUN</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-game text-base rounded-2xl border border-zinc-600 shadow flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-game text-base rounded-2xl border border-zinc-600 shadow flex items-center justify-center gap-2 active:scale-95 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'UNMUTE SOUND' : 'MUTE SOUND'}</span>
          </button>

          <button
            onClick={onQuitToTitle}
            className="w-full py-3 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-game text-sm rounded-2xl border border-zinc-700 shadow flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Home className="w-4 h-4" />
            <span>TITLE MENU</span>
          </button>
        </div>

        {/* Controls Quick Ref */}
        <div className="mt-6 pt-4 border-t border-zinc-800 w-full text-[11px] text-zinc-400 space-y-1">
          <div><strong className="text-zinc-200">A / D or ◄ / ►:</strong> Switch Tracks</div>
          <div><strong className="text-zinc-200">W / ▲ or Space:</strong> Jump</div>
          <div><strong className="text-zinc-200">S / ▼:</strong> Slide / Roll Down</div>
          <div><strong className="text-zinc-200">H or Double-Tap:</strong> Hoverboard</div>
        </div>
      </div>
    </div>
  );
};
