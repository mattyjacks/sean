'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { soundEngine } from '@/lib/tcg/soundEngine';
import {
  ArrowLeft,
  Sparkles,
  Trophy,
  RotateCcw,
  Heart,
  Flame,
  Swords,
  Info
} from 'lucide-react';

interface RuneSymbol {
  id: string;
  name: string;
  glyph: string;
  element: 'Solar' | 'Void' | 'Tide' | 'Verdant' | 'Astral' | 'Chrono';
  borderClass: string;
  glowColor: string;
}

const RUNE_DEFINITIONS: RuneSymbol[] = [
  {
    id: 'rune_ignis',
    name: 'Ignis Sunfire',
    glyph: '🔥',
    element: 'Solar',
    borderClass: 'border-amber-500 bg-amber-950/40 text-amber-300',
    glowColor: 'rgba(245,158,11,0.5)'
  },
  {
    id: 'rune_void',
    name: 'Abyssal Void',
    glyph: '🌑',
    element: 'Void',
    borderClass: 'border-purple-500 bg-purple-950/40 text-purple-300',
    glowColor: 'rgba(168,85,247,0.5)'
  },
  {
    id: 'rune_tide',
    name: 'Ocean Surge',
    glyph: '🌊',
    element: 'Tide',
    borderClass: 'border-cyan-500 bg-cyan-950/40 text-cyan-300',
    glowColor: 'rgba(6,182,212,0.5)'
  },
  {
    id: 'rune_verdant',
    name: 'Elder Sprout',
    glyph: '🌿',
    element: 'Verdant',
    borderClass: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
    glowColor: 'rgba(16,185,129,0.5)'
  },
  {
    id: 'rune_chrono',
    name: 'Temporal Hourglass',
    glyph: '⏳',
    element: 'Chrono',
    borderClass: 'border-yellow-400 bg-yellow-950/40 text-yellow-200',
    glowColor: 'rgba(234,179,8,0.5)'
  },
  {
    id: 'rune_celestial',
    name: 'Astral Nova',
    glyph: '✨',
    element: 'Astral',
    borderClass: 'border-fuchsia-500 bg-fuchsia-950/40 text-fuchsia-300',
    glowColor: 'rgba(217,70,239,0.5)'
  },
  {
    id: 'rune_thunder',
    name: 'Storm Bolt',
    glyph: '⚡',
    element: 'Solar',
    borderClass: 'border-sky-400 bg-sky-950/40 text-sky-200',
    glowColor: 'rgba(56,189,248,0.5)'
  },
  {
    id: 'rune_shield',
    name: 'Aegis Ward',
    glyph: '🛡️',
    element: 'Astral',
    borderClass: 'border-indigo-400 bg-indigo-950/40 text-indigo-200',
    glowColor: 'rgba(129,140,248,0.5)'
  }
];

interface TileCard {
  instanceId: string;
  symbol: RuneSymbol;
  isFlipped: boolean;
  isMatched: boolean;
}

interface GuardianBoss {
  name: string;
  title: string;
  maxHp: number;
  hp: number;
  avatar: string;
  attackPower: number;
}

const GUARDIAN_BOSSES: GuardianBoss[] = [
  {
    name: 'Sylva the Grove Warden',
    title: 'Elder Canopy Sentinel',
    maxHp: 160,
    hp: 160,
    avatar: '🌳',
    attackPower: 12
  },
  {
    name: 'Malakor the Voidcaller',
    title: 'Abyssal Overlord',
    maxHp: 220,
    hp: 220,
    avatar: '👿',
    attackPower: 18
  },
  {
    name: 'Aurelia Solar Empress',
    title: 'Radiant Sun Titan',
    maxHp: 300,
    hp: 300,
    avatar: '👑',
    attackPower: 25
  }
];

interface VerdantRuneMatchGameProps {
  onBackToArcade: () => void;
  onLaunchMainGame: () => void;
}

export function VerdantRuneMatchGame({
  onBackToArcade,
  onLaunchMainGame
}: VerdantRuneMatchGameProps) {
  const [currentBossIndex, setCurrentBossIndex] = useState<number>(0);
  const [bossHp, setBossHp] = useState<number>(GUARDIAN_BOSSES[0].maxHp);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [maxPlayerHp] = useState<number>(100);

  const [tiles, setTiles] = useState<TileCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [comboStreak, setComboStreak] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [gameResult, setGameResult] = useState<'playing' | 'victory' | 'game_over'>('playing');
  const [turnsUsed, setTurnsUsed] = useState<number>(0);
  const [showRules, setShowRules] = useState<boolean>(false);

  const currentBoss = GUARDIAN_BOSSES[currentBossIndex];

  // Generate 16 tiles (8 pairs)
  const generateBoard = useCallback(() => {
    soundEngine.playCardDraw();
    const selectedRunes = RUNE_DEFINITIONS.slice(0, 8);
    const cardPairs: TileCard[] = [];

    selectedRunes.forEach((rune, idx) => {
      cardPairs.push({
        instanceId: `tile_${idx}_a`,
        symbol: rune,
        isFlipped: false,
        isMatched: false
      });
      cardPairs.push({
        instanceId: `tile_${idx}_b`,
        symbol: rune,
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }

    setTiles(cardPairs);
    setFlippedIndices([]);
    setIsProcessing(false);
  }, []);

  const resetDuel = useCallback(
    (bossIdx: number = 0) => {
      setCurrentBossIndex(bossIdx);
      setBossHp(GUARDIAN_BOSSES[bossIdx].maxHp);
      setPlayerHp(100);
      setComboStreak(0);
      setScore(0);
      setTurnsUsed(0);
      setCombatLog([`⚔️ Encounter started against ${GUARDIAN_BOSSES[bossIdx].name}!`]);
      setGameResult('playing');
      generateBoard();
    },
    [generateBoard]
  );

  useEffect(() => {
    resetDuel(0);
  }, [resetDuel]);

  // Handle tile flip
  const handleTileClick = (index: number) => {
    if (isProcessing || gameResult !== 'playing') return;
    const tile = tiles[index];
    if (tile.isFlipped || tile.isMatched) return;

    soundEngine.playCardDraw();

    const newFlipped = [...flippedIndices, index];
    setTiles(prev => {
      const next = [...prev];
      next[index] = { ...next[index], isFlipped: true };
      return next;
    });
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      setTurnsUsed(t => t + 1);

      const [firstIdx, secondIdx] = newFlipped;
      const firstTile = tiles[firstIdx];
      const secondTile = tile;

      if (firstTile.symbol.id === secondTile.symbol.id) {
        // MATCH SUCCESS!
        setTimeout(() => {
          soundEngine.playVictory();
          const newCombo = comboStreak + 1;
          setComboStreak(newCombo);

          const baseDamage = 25;
          const comboBonus = (newCombo - 1) * 15;
          const totalDamage = baseDamage + comboBonus;

          // Heal player on matching Verdant or Shield
          let healAmount = 0;
          if (firstTile.symbol.element === 'Verdant' || firstTile.symbol.id === 'rune_shield') {
            healAmount = 15;
            setPlayerHp(hp => Math.min(maxPlayerHp, hp + healAmount));
            soundEngine.playBuff();
          }

          setTiles(prev => {
            const next = [...prev];
            next[firstIdx].isMatched = true;
            next[secondIdx].isMatched = true;
            return next;
          });

          setFlippedIndices([]);
          setIsProcessing(false);

          const newBossHp = Math.max(0, bossHp - totalDamage);
          setBossHp(newBossHp);
          setScore(s => s + totalDamage * 10);

          setCombatLog(prev => [
            `✨ Matched ${firstTile.symbol.name}! Dealt ${totalDamage} DMG to ${currentBoss.name}!${
              healAmount > 0 ? ` (+${healAmount} HP)` : ''
            }`,
            ...prev.slice(0, 5)
          ]);

          // Check Boss Defeat
          if (newBossHp === 0) {
            soundEngine.playVictory();
            if (currentBossIndex < GUARDIAN_BOSSES.length - 1) {
              setCombatLog(prev => [
                `🏆 Defeated ${currentBoss.name}! Advancing to next Guardian...`,
                ...prev
              ]);
              setTimeout(() => {
                resetDuel(currentBossIndex + 1);
              }, 1200);
            } else {
              setGameResult('victory');
            }
          } else {
            // Check if all tiles on board are matched but boss still alive
            setTimeout(() => {
              setTiles(currentTiles => {
                const remainingUnmatched = currentTiles.filter(t => !t.isMatched);
                if (remainingUnmatched.length === 0 && newBossHp > 0) {
                  // Reshuffle new board to continue duel
                  setCombatLog(prev => [
                    `🌀 All runes matched! Summoning fresh Celestial Board...`,
                    ...prev
                  ]);
                  generateBoard();
                }
                return currentTiles;
              });
            }, 500);
          }
        }, 600);
      } else {
        // MISMATCH -> Guardian Boss Strikes Back!
        setTimeout(() => {
          soundEngine.playAttack();
          setComboStreak(0);

          const bossDamage = currentBoss.attackPower;
          const newPlayerHp = Math.max(0, playerHp - bossDamage);
          setPlayerHp(newPlayerHp);

          setTiles(prev => {
            const next = [...prev];
            next[firstIdx].isFlipped = false;
            next[secondIdx].isFlipped = false;
            return next;
          });

          setFlippedIndices([]);
          setIsProcessing(false);

          setCombatLog(prev => [
            `💥 Mismatch! ${currentBoss.name} retaliates for ${bossDamage} DMG!`,
            ...prev.slice(0, 5)
          ]);

          if (newPlayerHp === 0) {
            soundEngine.playTrap();
            setGameResult('game_over');
          }
        }, 900);
      }
    }
  };

  return (
    <div className="verdant-match-view flex flex-col flex-1 w-full max-w-[1400px] mx-auto p-3 sm:p-6 gap-5 h-[calc(100vh-70px)] overflow-y-auto select-none">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToArcade}
            className="btn bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Back to Arcade</span>
          </button>

          <div>
            <h2 className="text-lg md:text-xl font-black font-serif uppercase tracking-wider text-emerald-300 flex items-center gap-2">
              <span>🌿 Verdant Rune Match Duel</span>
              <span className="text-[10px] bg-emerald-950 border border-emerald-500 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                BOSS PUZZLE
              </span>
            </h2>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-mono">
            <span className="text-amber-400 font-bold">Score: {score}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">Turns: {turnsUsed}</span>
            <span className="text-slate-500">|</span>
            {comboStreak > 1 && (
              <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-1.5 py-0.5 rounded font-black text-[10px]">
                🔥 {comboStreak}x COMBO
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowRules(r => !r)}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 ml-1"
              title="View Rules"
            >
              <Info className="w-3.5 h-3.5" />
              Rules
            </button>
          </div>

          <button
            type="button"
            onClick={() => resetDuel(0)}
            className="btn bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reset Duel</span>
          </button>
        </div>
      </div>

      {/* Rules Explainer */}
      {showRules && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 text-xs font-mono text-slate-300 space-y-2 animate-in fade-in">
          <div className="font-bold text-emerald-300 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Rune Match Duel Rules:
          </div>
          <p>
            • <strong>Match to Strike:</strong> Flip 2 matching rune tiles to launch elemental attacks at the Astral Boss! Higher combos inflict devastating multiplier damage.
          </p>
          <p>
            • <strong>Boss Retaliation:</strong> Mismatches give the guardian boss an opportunity to retaliate and damage your health pool.
          </p>
          <p>
            • <strong>Verdant & Shield Runes:</strong> Matching Verdant or Aegis runes will restore +15 Health to your commander.
          </p>
        </div>
      )}

      {/* Duel Battle Mat */}
      <div className="match-felt flex-1 bg-gradient-to-b from-[#06140f] via-[#091f17] to-[#040d0a] border-2 border-emerald-500/30 rounded-3xl p-4 md:p-6 flex flex-col gap-6 shadow-2xl relative min-h-[620px]">
        {/* Boss and Player Status Combatants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Boss Banner */}
          <div className="bg-slate-950/80 border border-red-500/40 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-950 to-slate-900 border-2 border-red-500/60 flex items-center justify-center text-3xl shadow">
                {currentBoss.avatar}
              </div>
              <div>
                <div className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                  Guardian Boss ({currentBossIndex + 1}/{GUARDIAN_BOSSES.length})
                </div>
                <h3 className="font-serif font-black text-white text-base md:text-lg">
                  {currentBoss.name}
                </h3>
                <div className="text-xs text-slate-400 font-mono">{currentBoss.title}</div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 w-32 sm:w-44">
              <div className="flex items-center justify-between w-full text-xs font-mono">
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <Swords className="w-3 h-3" /> HP
                </span>
                <span className="text-white font-black">
                  {bossHp}/{currentBoss.maxHp}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-red-950">
                <div
                  className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-300"
                  style={{ width: `${(bossHp / currentBoss.maxHp) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Commander / Player Status */}
          <div className="bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 border-2 border-emerald-500/60 flex items-center justify-center text-3xl shadow">
                🧙‍♂️
              </div>
              <div>
                <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  Astral Spellcaster
                </div>
                <h3 className="font-serif font-black text-white text-base md:text-lg">
                  You (Commander)
                </h3>
                <div className="text-xs text-slate-400 font-mono">Verdant Conduit</div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 w-32 sm:w-44">
              <div className="flex items-center justify-between w-full text-xs font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Heart className="w-3 h-3" /> HP
                </span>
                <span className="text-white font-black">
                  {playerHp}/{maxPlayerHp}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-emerald-950">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full transition-all duration-300"
                  style={{ width: `${(playerHp / maxPlayerHp) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4x4 Tiles Match Matrix */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-[560px] w-full mx-auto">
            {tiles.map((tile, idx) => {
              const isRevealed = tile.isFlipped || tile.isMatched;

              return (
                <div
                  key={tile.instanceId}
                  onClick={() => handleTileClick(idx)}
                  className={`aspect-square rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer relative shadow-lg ${
                    tile.isMatched
                      ? 'border-emerald-500/40 bg-emerald-950/20 opacity-40 scale-95 pointer-events-none'
                      : isRevealed
                      ? `${tile.symbol.borderClass} scale-105 shadow-[0_0_20px_${tile.symbol.glowColor}]`
                      : 'border-emerald-800/60 bg-gradient-to-br from-emerald-950/80 via-slate-950 to-[#04120c] hover:border-emerald-400 hover:scale-102'
                  }`}
                >
                  {isRevealed ? (
                    <div className="flex flex-col items-center justify-center gap-1 animate-in zoom-in-75 duration-200">
                      <span className="text-3xl sm:text-4xl">{tile.symbol.glyph}</span>
                      <span className="text-[10px] font-mono font-bold tracking-tight text-center px-1 truncate max-w-[90px]">
                        {tile.symbol.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Sparkles className="w-6 h-6 text-emerald-500/70" />
                      <span className="text-[9px] font-mono text-emerald-400/60 font-black">RUNE</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Combat Feed */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1 text-xs font-mono max-h-24 overflow-y-auto">
          {combatLog.length === 0 ? (
            <div className="text-slate-500 text-center">Flip tiles to match runes and attack!</div>
          ) : (
            combatLog.map((log, i) => (
              <div key={`log_${i}`} className={i === 0 ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                {log}
              </div>
            ))
          )}
        </div>

        {/* Victory Modal */}
        {gameResult === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center gap-6 p-6 z-50 animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-300 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.6)]">
              <Trophy className="w-10 h-10 text-slate-950" />
            </div>

            <div className="text-center space-y-2 max-w-md">
              <h3 className="text-3xl font-black font-serif uppercase tracking-wider bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent">
                ALL GUARDIANS SUBDUED!
              </h3>
              <p className="text-slate-300 text-sm font-mono">
                You conquered all 3 elder astral guardians with a total score of {score} in {turnsUsed} turns!
              </p>
            </div>

            <div className="bg-slate-900 border border-emerald-500/50 p-4 rounded-2xl flex items-center gap-4 font-mono text-sm">
              <span className="text-emerald-400 font-bold">🎁 Victory Reward:</span>
              <span className="text-white">+750 Astral Gems</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => resetDuel(0)}
                className="btn bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-mono text-sm font-black px-6 py-3 rounded-2xl shadow-xl transition-transform hover:scale-105"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={onLaunchMainGame}
                className="btn bg-slate-800 hover:bg-slate-700 text-white font-mono text-sm font-bold px-6 py-3 rounded-2xl border border-slate-700 transition-transform hover:scale-105"
              >
                To Tournament Battle
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameResult === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center gap-6 p-6 z-50 animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-red-950 border-2 border-red-500 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.5)]">
              <Flame className="w-10 h-10 text-red-400" />
            </div>

            <div className="text-center space-y-2 max-w-md">
              <h3 className="text-3xl font-black font-serif uppercase tracking-wider text-red-400">
                DEFEATED IN THE GROVE!
              </h3>
              <p className="text-slate-300 text-sm font-mono">
                {currentBoss.name} overwhelmed your runes. Try again and maintain your combos!
              </p>
            </div>

            <button
              type="button"
              onClick={() => resetDuel(currentBossIndex)}
              className="btn bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono text-sm font-black px-6 py-3 rounded-2xl shadow-xl transition-transform hover:scale-105"
            >
              Retry Boss Encounter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
