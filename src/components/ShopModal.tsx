import React, { useState } from 'react';
import { X, Magnet, Rocket, Footprints, Zap, Sparkles, Check, Lock } from 'lucide-react';
import { CharacterConfig, HoverboardConfig, Upgrades } from '../types/game';

interface ShopModalProps {
  totalCoins: number;
  onCoinsChange: (newCoins: number) => void;
  characters: CharacterConfig[];
  selectedCharId: string;
  onSelectCharacter: (id: CharacterConfig) => void;
  onUnlockCharacter: (id: string, price: number) => void;
  hoverboards: HoverboardConfig[];
  selectedBoardId: string;
  onSelectBoard: (board: HoverboardConfig) => void;
  onUnlockBoard: (id: string, price: number) => void;
  upgrades: Upgrades;
  onUpgradePowerUp: (type: keyof Upgrades, cost: number) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  totalCoins,
  characters,
  selectedCharId,
  onSelectCharacter,
  onUnlockCharacter,
  hoverboards,
  selectedBoardId,
  onSelectBoard,
  onUnlockBoard,
  upgrades,
  onUpgradePowerUp,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'UPGRADES' | 'CHARACTERS' | 'BOARDS'>('UPGRADES');

  // Upgrade cost calculations
  const getUpgradeCost = (currentLevel: number) => {
    const costs = [0, 200, 450, 900, 1800];
    return costs[currentLevel] || 9999;
  };

  return (
    <div className="absolute inset-0 bg-black/80 z-40 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="font-game text-2xl text-yellow-400">SURF SHOP</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-zinc-400 font-semibold">Balance:</span>
              <div className="flex items-center gap-1 bg-zinc-800 px-2.5 py-0.5 rounded-full border border-yellow-500/40">
                <span className="text-yellow-400 text-xs">★</span>
                <span className="font-game text-sm text-yellow-300 tabular-nums">
                  {totalCoins.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-2 my-4">
          <button
            onClick={() => setActiveTab('UPGRADES')}
            className={`py-2 text-xs font-game rounded-xl transition ${
              activeTab === 'UPGRADES'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-md font-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            UPGRADES
          </button>
          <button
            onClick={() => setActiveTab('CHARACTERS')}
            className={`py-2 text-xs font-game rounded-xl transition ${
              activeTab === 'CHARACTERS'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-md font-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CHARACTERS
          </button>
          <button
            onClick={() => setActiveTab('BOARDS')}
            className={`py-2 text-xs font-game rounded-xl transition ${
              activeTab === 'BOARDS'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-md font-black'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            HOVERBOARDS
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {activeTab === 'UPGRADES' && (
            <div className="space-y-3">
              {/* Magnet Upgrade */}
              {(() => {
                const level = upgrades.magnetLevel;
                const cost = getUpgradeCost(level);
                const isMax = level >= 5;
                const canAfford = totalCoins >= cost && !isMax;

                return (
                  <div className="bg-zinc-800/80 border border-zinc-700/80 p-3.5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                        <Magnet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-game text-sm text-zinc-100">Coin Magnet</div>
                        <div className="text-[11px] text-zinc-400">Pulls coins across all lanes ({10 + (level - 1) * 3}s)</div>
                        {/* Level pips */}
                        <div className="flex gap-1 mt-1.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`w-3.5 h-1.5 rounded-full ${
                                lvl <= level ? 'bg-amber-400' : 'bg-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onUpgradePowerUp('magnetLevel', cost)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-xl font-game text-xs transition active:scale-95 ${
                        isMax
                          ? 'bg-zinc-700 text-zinc-400 cursor-default'
                          : canAfford
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-zinc-950 hover:brightness-110 shadow'
                          : 'bg-zinc-700/60 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? 'MAX' : `${cost} ★`}
                    </button>
                  </div>
                );
              })()}

              {/* Jetpack Upgrade */}
              {(() => {
                const level = upgrades.jetpackLevel;
                const cost = getUpgradeCost(level);
                const isMax = level >= 5;
                const canAfford = totalCoins >= cost && !isMax;

                return (
                  <div className="bg-zinc-800/80 border border-zinc-700/80 p-3.5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                        <Rocket className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-game text-sm text-zinc-100">Jetpack</div>
                        <div className="text-[11px] text-zinc-400">Rocket into the sky for coins ({8 + (level - 1) * 2}s)</div>
                        <div className="flex gap-1 mt-1.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`w-3.5 h-1.5 rounded-full ${
                                lvl <= level ? 'bg-amber-400' : 'bg-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onUpgradePowerUp('jetpackLevel', cost)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-xl font-game text-xs transition active:scale-95 ${
                        isMax
                          ? 'bg-zinc-700 text-zinc-400 cursor-default'
                          : canAfford
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-zinc-950 hover:brightness-110 shadow'
                          : 'bg-zinc-700/60 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? 'MAX' : `${cost} ★`}
                    </button>
                  </div>
                );
              })()}

              {/* Super Sneakers Upgrade */}
              {(() => {
                const level = upgrades.sneakersLevel;
                const cost = getUpgradeCost(level);
                const isMax = level >= 5;
                const canAfford = totalCoins >= cost && !isMax;

                return (
                  <div className="bg-zinc-800/80 border border-zinc-700/80 p-3.5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
                        <Footprints className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-game text-sm text-zinc-100">Super Sneakers</div>
                        <div className="text-[11px] text-zinc-400">High bouncy jumps over obstacles ({12 + (level - 1) * 3}s)</div>
                        <div className="flex gap-1 mt-1.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`w-3.5 h-1.5 rounded-full ${
                                lvl <= level ? 'bg-amber-400' : 'bg-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onUpgradePowerUp('sneakersLevel', cost)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-xl font-game text-xs transition active:scale-95 ${
                        isMax
                          ? 'bg-zinc-700 text-zinc-400 cursor-default'
                          : canAfford
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-zinc-950 hover:brightness-110 shadow'
                          : 'bg-zinc-700/60 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? 'MAX' : `${cost} ★`}
                    </button>
                  </div>
                );
              })()}

              {/* Multiplier Upgrade */}
              {(() => {
                const level = upgrades.multiplierLevel;
                const cost = getUpgradeCost(level);
                const isMax = level >= 5;
                const canAfford = totalCoins >= cost && !isMax;

                return (
                  <div className="bg-zinc-800/80 border border-zinc-700/80 p-3.5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-game text-sm text-zinc-100">2X Multiplier</div>
                        <div className="text-[11px] text-zinc-400">Doubles all score progression ({14 + (level - 1) * 4}s)</div>
                        <div className="flex gap-1 mt-1.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`w-3.5 h-1.5 rounded-full ${
                                lvl <= level ? 'bg-amber-400' : 'bg-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onUpgradePowerUp('multiplierLevel', cost)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-xl font-game text-xs transition active:scale-95 ${
                        isMax
                          ? 'bg-zinc-700 text-zinc-400 cursor-default'
                          : canAfford
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-zinc-950 hover:brightness-110 shadow'
                          : 'bg-zinc-700/60 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? 'MAX' : `${cost} ★`}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'CHARACTERS' && (
            <div className="space-y-3">
              {characters.map((char) => {
                const isSelected = char.id === selectedCharId;
                const canAfford = totalCoins >= char.price;

                return (
                  <div
                    key={char.id}
                    className={`bg-zinc-800/80 border p-3.5 rounded-2xl flex items-center justify-between transition ${
                      isSelected ? 'border-amber-400 bg-amber-500/10' : 'border-zinc-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                        style={{ backgroundColor: char.shirtColor }}
                      >
                        <span className="text-xl">🧢</span>
                      </div>
                      <div>
                        <div className="font-game text-sm text-zinc-100">{char.name}</div>
                        <div className="text-[11px] text-zinc-400">{char.tagline}</div>
                      </div>
                    </div>

                    {char.unlocked ? (
                      <button
                        onClick={() => onSelectCharacter(char)}
                        className={`px-3.5 py-1.5 rounded-xl font-game text-xs transition ${
                          isSelected
                            ? 'bg-emerald-500 text-zinc-950 flex items-center gap-1 font-black'
                            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                        }`}
                      >
                        {isSelected ? <><Check className="w-3.5 h-3.5" /> SELECTED</> : 'SELECT'}
                      </button>
                    ) : (
                      <button
                        onClick={() => onUnlockCharacter(char.id, char.price)}
                        disabled={!canAfford}
                        className={`px-3.5 py-1.5 rounded-xl font-game text-xs flex items-center gap-1 transition ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-zinc-950 hover:brightness-110'
                            : 'bg-zinc-700/60 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{char.price} ★</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'BOARDS' && (
            <div className="space-y-3">
              {hoverboards.map((board) => {
                const isSelected = board.id === selectedBoardId;
                const canAfford = totalCoins >= board.price;

                return (
                  <div
                    key={board.id}
                    className={`bg-zinc-800/80 border p-3.5 rounded-2xl flex items-center justify-between transition ${
                      isSelected ? 'border-cyan-400 bg-cyan-500/10' : 'border-zinc-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner"
                        style={{ backgroundColor: board.deckColor, borderColor: board.accentColor }}
                      >
                        <span className="text-xl">🏄</span>
                      </div>
                      <div>
                        <div className="font-game text-sm text-zinc-100">{board.name}</div>
                        <div className="text-[11px] text-zinc-400">Crashes protect life once</div>
                      </div>
                    </div>

                    {board.unlocked ? (
                      <button
                        onClick={() => onSelectBoard(board)}
                        className={`px-3.5 py-1.5 rounded-xl font-game text-xs transition ${
                          isSelected
                            ? 'bg-cyan-500 text-zinc-950 flex items-center gap-1 font-black'
                            : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
                        }`}
                      >
                        {isSelected ? <><Check className="w-3.5 h-3.5" /> SURFING</> : 'SELECT'}
                      </button>
                    ) : (
                      <button
                        onClick={() => onUnlockBoard(board.id, board.price)}
                        disabled={!canAfford}
                        className={`px-3.5 py-1.5 rounded-xl font-game text-xs flex items-center gap-1 transition ${
                          canAfford
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-zinc-950 hover:brightness-110'
                            : 'bg-zinc-700/60 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{board.price} ★</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
