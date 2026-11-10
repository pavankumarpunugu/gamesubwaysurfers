/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/gameEngine';
import { soundManager } from './audio/soundManager';
import { CharacterConfig, GameStatus, HoverboardConfig, PlayerStats, PowerUpState, Upgrades } from './types/game';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { ShopModal } from './components/ShopModal';

// Initial Characters
const DEFAULT_CHARACTERS: CharacterConfig[] = [
  {
    id: 'jake',
    name: 'Jake',
    tagline: 'The classic subway graffiti artist',
    hatColor: '#dc2626', // Red cap
    shirtColor: '#2563eb', // Blue hoodie
    pantsColor: '#1e293b', // Dark jeans
    shoesColor: '#dc2626', // Red sneakers
    skinColor: '#fbcfe8',
    price: 0,
    unlocked: true,
  },
  {
    id: 'tricky',
    name: 'Tricky',
    tagline: 'Clever skater with pink beanie',
    hatColor: '#ec4899', // Pink beanie
    shirtColor: '#059669', // Teal jacket
    pantsColor: '#4c1d95', // Purple pants
    shoesColor: '#facc15', // Yellow sneakers
    skinColor: '#fed7aa',
    price: 350,
    unlocked: false,
  },
  {
    id: 'fresh',
    name: 'Fresh',
    tagline: 'Street dancer with golden swagger',
    hatColor: '#f59e0b', // Gold cap
    shirtColor: '#7c3aed', // Purple hoodie
    pantsColor: '#0f172a', // Midnight cargo
    shoesColor: '#06b6d4', // Cyan sneakers
    skinColor: '#92400e',
    price: 800,
    unlocked: false,
  },
];

// Initial Hoverboards
const DEFAULT_HOVERBOARDS: HoverboardConfig[] = [
  {
    id: 'sunset',
    name: 'Sunset Surf',
    deckColor: '#f59e0b',
    accentColor: '#06b6d4',
    trailColor: '#06b6d4',
    price: 0,
    unlocked: true,
  },
  {
    id: 'cyber',
    name: 'Cyber Glow',
    deckColor: '#06b6d4',
    accentColor: '#ec4899',
    trailColor: '#a855f7',
    price: 250,
    unlocked: false,
  },
  {
    id: 'monster',
    name: 'Monster Flames',
    deckColor: '#ef4444',
    accentColor: '#facc15',
    trailColor: '#f97316',
    price: 600,
    unlocked: false,
  },
];

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI State
  const [gameStatus, setGameStatus] = useState<GameStatus>('TITLE');
  const [stats, setStats] = useState<PlayerStats>({
    score: 0,
    highScore: 0,
    coins: 0,
    totalCoins: 0,
    distance: 0,
    multiplier: 1,
  });
  const [activePowerUps, setActivePowerUps] = useState<PowerUpState[]>([]);
  const [isInspectorClose, setIsInspectorClose] = useState<boolean>(false);
  const [hasHoverboardReady, setHasHoverboardReady] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [showShop, setShowShop] = useState<boolean>(false);

  // Shop Data
  const [characters, setCharacters] = useState<CharacterConfig[]>(() => {
    const saved = localStorage.getItem('subway_characters');
    return saved ? JSON.parse(saved) : DEFAULT_CHARACTERS;
  });
  const [selectedCharId, setSelectedCharId] = useState<string>('jake');

  const [hoverboards, setHoverboards] = useState<HoverboardConfig[]>(() => {
    const saved = localStorage.getItem('subway_hoverboards');
    return saved ? JSON.parse(saved) : DEFAULT_HOVERBOARDS;
  });
  const [selectedBoardId, setSelectedBoardId] = useState<string>('sunset');

  const [upgrades, setUpgrades] = useState<Upgrades>(() => {
    const saved = localStorage.getItem('subway_upgrades');
    return saved ? JSON.parse(saved) : {
      magnetLevel: 1,
      jetpackLevel: 1,
      sneakersLevel: 1,
      multiplierLevel: 1,
    };
  });

  const selectedChar = characters.find((c) => c.id === selectedCharId) || characters[0];
  const selectedBoard = hoverboards.find((b) => b.id === selectedBoardId) || hoverboards[0];

  // Initialize Game Engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(
      canvasMountRef.current,
      selectedChar,
      selectedBoard,
      upgrades,
      {
        onStatsUpdate: (newStats) => {
          setStats({ ...newStats });
        },
        onPowerUpsUpdate: (powerUps) => {
          setActivePowerUps([...powerUps]);
        },
        onInspectorTension: (isClose) => {
          setIsInspectorClose(isClose);
        },
        onGameOver: (finalStats) => {
          setStats({ ...finalStats });
          setGameStatus('GAMEOVER');
        },
        onHoverboardStateChange: (hasBoard) => {
          setHasHoverboardReady(hasBoard);
        },
      }
    );

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update engine character when changed
  const handleSelectCharacter = (char: CharacterConfig) => {
    setSelectedCharId(char.id);
    if (engineRef.current) {
      engineRef.current.setCharacter(char);
    }
  };

  const handleUnlockCharacter = (id: string, price: number) => {
    if (stats.totalCoins < price) return;
    const newTotal = stats.totalCoins - price;
    setStats((prev) => ({ ...prev, totalCoins: newTotal }));
    localStorage.setItem('subway_total_coins', String(newTotal));

    const updated = characters.map((c) => (c.id === id ? { ...c, unlocked: true } : c));
    setCharacters(updated);
    localStorage.setItem('subway_characters', JSON.stringify(updated));

    const newlyUnlocked = updated.find((c) => c.id === id);
    if (newlyUnlocked) handleSelectCharacter(newlyUnlocked);
  };

  const handleSelectBoard = (board: HoverboardConfig) => {
    setSelectedBoardId(board.id);
  };

  const handleUnlockBoard = (id: string, price: number) => {
    if (stats.totalCoins < price) return;
    const newTotal = stats.totalCoins - price;
    setStats((prev) => ({ ...prev, totalCoins: newTotal }));
    localStorage.setItem('subway_total_coins', String(newTotal));

    const updated = hoverboards.map((b) => (b.id === id ? { ...b, unlocked: true } : b));
    setHoverboards(updated);
    localStorage.setItem('subway_hoverboards', JSON.stringify(updated));

    const newlyUnlocked = updated.find((b) => b.id === id);
    if (newlyUnlocked) handleSelectBoard(newlyUnlocked);
  };

  const handleUpgradePowerUp = (type: keyof Upgrades, cost: number) => {
    if (stats.totalCoins < cost) return;
    const newTotal = stats.totalCoins - cost;
    setStats((prev) => ({ ...prev, totalCoins: newTotal }));
    localStorage.setItem('subway_total_coins', String(newTotal));

    const updated: Upgrades = {
      ...upgrades,
      [type]: upgrades[type] + 1,
    };
    setUpgrades(updated);
    localStorage.setItem('subway_upgrades', JSON.stringify(updated));

    if (engineRef.current) {
      engineRef.current.setUpgrades(updated);
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    soundManager.setMuted(nextMute);
    setIsMuted(nextMute);
  };

  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.startGame();
      setGameStatus('PLAYING');
    }
  };

  const handlePause = () => {
    if (engineRef.current && gameStatus === 'PLAYING') {
      engineRef.current.pauseGame();
      setGameStatus('PAUSED');
    }
  };

  const handleResume = () => {
    if (engineRef.current && gameStatus === 'PAUSED') {
      engineRef.current.resumeGame();
      setGameStatus('PLAYING');
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.startGame();
      setGameStatus('PLAYING');
    }
  };

  const handleQuitToTitle = () => {
    if (engineRef.current) {
      engineRef.current.dispose();
      // Re-initialize for title
      if (canvasMountRef.current) {
        const engine = new GameEngine(
          canvasMountRef.current,
          selectedChar,
          selectedBoard,
          upgrades,
          {
            onStatsUpdate: (newStats) => setStats({ ...newStats }),
            onPowerUpsUpdate: (powerUps) => setActivePowerUps([...powerUps]),
            onInspectorTension: (isClose) => setIsInspectorClose(isClose),
            onGameOver: (finalStats) => {
              setStats({ ...finalStats });
              setGameStatus('GAMEOVER');
            },
            onHoverboardStateChange: (hasBoard) => setHasHoverboardReady(hasBoard),
          }
        );
        engineRef.current = engine;
      }
    }
    setGameStatus('TITLE');
  };

  const handleActivateHoverboard = () => {
    if (engineRef.current && gameStatus === 'PLAYING') {
      engineRef.current.activateHoverboard(selectedBoard);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-sky-900 select-none">
      {/* 3D WebGL Canvas Isolated Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Title Screen Overlay */}
      {gameStatus === 'TITLE' && (
        <TitleScreen
          onStart={handleStartGame}
          onOpenShop={() => setShowShop(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          stats={stats}
          selectedChar={selectedChar}
          selectedBoard={selectedBoard}
        />
      )}

      {/* In-Game HUD (Low-Occlusion perimeter cluster) */}
      {gameStatus === 'PLAYING' && (
        <GameHUD
          stats={stats}
          powerUps={activePowerUps}
          hasHoverboardReady={hasHoverboardReady}
          onActivateHoverboard={handleActivateHoverboard}
          onPause={handlePause}
          inspectorClose={isInspectorClose}
        />
      )}

      {/* Pause Modal */}
      {gameStatus === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onQuitToTitle={handleQuitToTitle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Modal */}
      {gameStatus === 'GAMEOVER' && (
        <GameOverModal
          stats={stats}
          onRestart={handleRestart}
          onQuitToTitle={handleQuitToTitle}
          onOpenShop={() => setShowShop(true)}
        />
      )}

      {/* Character & Upgrades Shop Modal */}
      {showShop && (
        <ShopModal
          totalCoins={stats.totalCoins}
          onCoinsChange={(newCoins) => setStats((prev) => ({ ...prev, totalCoins: newCoins }))}
          characters={characters}
          selectedCharId={selectedCharId}
          onSelectCharacter={handleSelectCharacter}
          onUnlockCharacter={handleUnlockCharacter}
          hoverboards={hoverboards}
          selectedBoardId={selectedBoardId}
          onSelectBoard={handleSelectBoard}
          onUnlockBoard={handleUnlockBoard}
          upgrades={upgrades}
          onUpgradePowerUp={handleUpgradePowerUp}
          onClose={() => setShowShop(false)}
        />
      )}
    </div>
  );
}
