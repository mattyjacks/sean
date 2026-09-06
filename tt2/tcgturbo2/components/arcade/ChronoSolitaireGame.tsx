'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { soundEngine } from '@/lib/tcg/soundEngine';
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Clock,
  Shuffle,
  Info,
  Flame,
  Droplets,
  Leaf,
  Moon
} from 'lucide-react';

export type AstralSuit = 'solar' | 'void' | 'tide' | 'verdant';

export interface SolitaireCard {
  id: string;
  suit: AstralSuit;
  rank: number; // 1 (A) to 13 (K)
  faceUp: boolean;
}

const SUIT_META: Record<
  AstralSuit,
  { name: string; symbol: string; color: 'gold' | 'purple' | 'cyan' | 'emerald'; icon: typeof Flame }
> = {
  solar: { name: 'Solar', symbol: '☀️', color: 'gold', icon: Flame },
  void: { name: 'Void', symbol: '🌑', color: 'purple', icon: Moon },
  tide: { name: 'Tide', symbol: '🌊', color: 'cyan', icon: Droplets },
  verdant: { name: 'Verdant', symbol: '🌿', color: 'emerald', icon: Leaf }
};

// Color harmony rules: In Chrono Solitaire, tableau piles build down in alternating astral poles:
// Light / Radiant (Solar ☀️, Tide 🌊) vs Dark / Deep (Void 🌑, Verdant 🌿)
function getPole(suit: AstralSuit): 'radiant' | 'deep' {
  return suit === 'solar' || suit === 'tide' ? 'radiant' : 'deep';
}

function getRankDisplay(rank: number): string {
  switch (rank) {
    case 1:
      return 'A';
    case 11:
      return 'J';
    case 12:
      return 'Q';
    case 13:
      return 'K';
    default:
      return rank.toString();
  }
}

function createFullDeck(): SolitaireCard[] {
  const suits: AstralSuit[] = ['solar', 'void', 'tide', 'verdant'];
  const deck: SolitaireCard[] = [];
  let idCounter = 1;

  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: `card_${idCounter++}_${suit}_${rank}`,
        suit,
        rank,
        faceUp: false
      });
    }
  }

  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

interface ChronoGameState {
  stock: SolitaireCard[];
  waste: SolitaireCard[];
  foundations: Record<AstralSuit, SolitaireCard[]>;
  tableau: SolitaireCard[][];
}

interface ChronoSolitaireGameProps {
  onBackToArcade: () => void;
  onLaunchMainGame: () => void;
}

export function ChronoSolitaireGame({ onBackToArcade, onLaunchMainGame }: ChronoSolitaireGameProps) {
  const [stock, setStock] = useState<SolitaireCard[]>([]);
  const [waste, setWaste] = useState<SolitaireCard[]>([]);
  const [foundations, setFoundations] = useState<Record<AstralSuit, SolitaireCard[]>>({
    solar: [],
    void: [],
    tide: [],
    verdant: []
  });
  const [tableau, setTableau] = useState<SolitaireCard[][]>([[], [], [], [], [], [], []]);

  // Selected card for tap-to-move / keyboard play
  const [selectedSource, setSelectedSource] = useState<{
    location: 'waste' | 'tableau' | 'foundation';
    tableauIndex?: number;
    cardIndex?: number;
    suit?: AstralSuit;
  } | null>(null);

  // Undo / Temporal Rewind History
  const [history, setHistory] = useState<ChronoGameState[]>([]);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [temporalRewindsRemaining, setTemporalRewindsRemaining] = useState<number>(5);
  const [showRules, setShowRules] = useState<boolean>(false);

  // Initialize a fresh deal
  const dealNewGame = useCallback(() => {
    soundEngine.playCardDraw();
    const deck = createFullDeck();
    const newTableau: SolitaireCard[][] = [[], [], [], [], [], [], []];

    // Deal 7 tableau columns: column i has (i + 1) cards, top card face up
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck.pop()!;
        card.faceUp = row === col;
        newTableau[col].push(card);
      }
    }

    setTableau(newTableau);
    setStock(deck);
    setWaste([]);
    setFoundations({ solar: [], void: [], tide: [], verdant: [] });
    setSelectedSource(null);
    setHistory([]);
    setMovesCount(0);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setIsVictory(false);
    setTemporalRewindsRemaining(5);
  }, []);

  useEffect(() => {
    dealNewGame();
  }, [dealNewGame]);

  // Timer tick
  useEffect(() => {
    if (!isTimerRunning || isVictory) return;
    const interval = setInterval(() => {
      setTimerSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isVictory]);

  // Check victory condition (all 4 foundations have 13 cards = 52 total)
  useEffect(() => {
    const totalFoundationCards = Object.values(foundations).reduce(
      (sum, pile) => sum + pile.length,
      0
    );
    if (totalFoundationCards === 52 && !isVictory) {
      setIsVictory(true);
      setIsTimerRunning(false);
      soundEngine.playVictory();
    }
  }, [foundations, isVictory]);

  // Save state before performing an action for Undo / Rewind
  const saveSnapshot = () => {
    const clone: ChronoGameState = {
      stock: stock.map(c => ({ ...c })),
      waste: waste.map(c => ({ ...c })),
      foundations: {
        solar: foundations.solar.map(c => ({ ...c })),
        void: foundations.void.map(c => ({ ...c })),
        tide: foundations.tide.map(c => ({ ...c })),
        verdant: foundations.verdant.map(c => ({ ...c }))
      },
      tableau: tableau.map(col => col.map(c => ({ ...c })))
    };
    setHistory(prev => [...prev.slice(-15), clone]);
    setMovesCount(m => m + 1);
  };

  // Temporal Rewind (Undo)
  const undoLastMove = () => {
    if (history.length === 0 || temporalRewindsRemaining <= 0) {
      soundEngine.playTrap();
      return;
    }

    soundEngine.playBuff();
    const previous = history[history.length - 1];
    setStock(previous.stock);
    setWaste(previous.waste);
    setFoundations(previous.foundations);
    setTableau(previous.tableau);
    setSelectedSource(null);
    setHistory(prev => prev.slice(0, -1));
    setTemporalRewindsRemaining(r => Math.max(0, r - 1));
  };

  // Draw from stock to waste (or recycle waste back into stock)
  const handleStockClick = () => {
    saveSnapshot();
    soundEngine.playCardDraw();

    if (stock.length === 0) {
      // Recycle waste back into stock
      if (waste.length === 0) return;
      const recycled = [...waste].reverse().map(c => ({ ...c, faceUp: false }));
      setStock(recycled);
      setWaste([]);
      return;
    }

    const nextStock = [...stock];
    const drawn = nextStock.pop()!;
    drawn.faceUp = true;
    setStock(nextStock);
    setWaste(prev => [...prev, drawn]);
    setSelectedSource(null);
  };

  // Helper to test if a card can be placed on a foundation
  const canMoveToFoundation = (card: SolitaireCard, suit: AstralSuit): boolean => {
    if (card.suit !== suit) return false;
    const foundationPile = foundations[suit];
    if (foundationPile.length === 0) {
      return card.rank === 1; // Must start with Ace
    }
    const topCard = foundationPile[foundationPile.length - 1];
    return card.rank === topCard.rank + 1;
  };

  // Helper to test if moving cards onto target tableau column is valid
  const canMoveToTableau = (card: SolitaireCard, targetCol: SolitaireCard[]): boolean => {
    if (targetCol.length === 0) {
      // Only Kings (Rank 13) can land in empty column
      return card.rank === 13;
    }
    const topCard = targetCol[targetCol.length - 1];
    if (!topCard.faceUp) return false;
    // Must be descending rank (e.g. 8 on 9) and alternating astral pole (Radiant vs Deep)
    return topCard.rank === card.rank + 1 && getPole(topCard.suit) !== getPole(card.suit);
  };

  // Move cards from source to destination tableau
  const moveSubstackToTableau = (colIndex: number) => {
    if (!selectedSource) return;

    if (selectedSource.location === 'waste') {
      const topWaste = waste[waste.length - 1];
      if (!topWaste) return;

      if (canMoveToTableau(topWaste, tableau[colIndex])) {
        saveSnapshot();
        soundEngine.playSummon();
        setWaste(prev => prev.slice(0, -1));
        setTableau(prev => {
          const next = prev.map(c => [...c]);
          next[colIndex].push(topWaste);
          return next;
        });
        setSelectedSource(null);
      } else {
        soundEngine.playTrap();
        setSelectedSource(null);
      }
    } else if (selectedSource.location === 'tableau') {
      const srcCol = selectedSource.tableauIndex!;
      const srcCardIdx = selectedSource.cardIndex!;

      if (srcCol === colIndex) {
        setSelectedSource(null);
        return;
      }

      const movingCards = tableau[srcCol].slice(srcCardIdx);
      const firstMoving = movingCards[0];

      if (canMoveToTableau(firstMoving, tableau[colIndex])) {
        saveSnapshot();
        soundEngine.playSummon();
        setTableau(prev => {
          const next = prev.map(c => [...c]);
          next[srcCol] = next[srcCol].slice(0, srcCardIdx);
          // Auto-flip newly exposed top card
          if (next[srcCol].length > 0) {
            next[srcCol][next[srcCol].length - 1].faceUp = true;
          }
          next[colIndex].push(...movingCards);
          return next;
        });
        setSelectedSource(null);
      } else {
        soundEngine.playTrap();
        setSelectedSource(null);
      }
    } else if (selectedSource.location === 'foundation') {
      const srcSuit = selectedSource.suit!;
      const pile = foundations[srcSuit];
      const topCard = pile[pile.length - 1];
      if (!topCard) return;

      if (canMoveToTableau(topCard, tableau[colIndex])) {
        saveSnapshot();
        soundEngine.playSummon();
        setFoundations(prev => ({
          ...prev,
          [srcSuit]: prev[srcSuit].slice(0, -1)
        }));
        setTableau(prev => {
          const next = prev.map(c => [...c]);
          next[colIndex].push(topCard);
          return next;
        });
        setSelectedSource(null);
      } else {
        soundEngine.playTrap();
        setSelectedSource(null);
      }
    }
  };

  // Move single card to target foundation
  const moveCardToFoundation = (targetSuit: AstralSuit) => {
    if (!selectedSource) return;

    if (selectedSource.location === 'waste') {
      const topWaste = waste[waste.length - 1];
      if (topWaste && canMoveToFoundation(topWaste, targetSuit)) {
        saveSnapshot();
        soundEngine.playVictory();
        setWaste(prev => prev.slice(0, -1));
        setFoundations(prev => ({
          ...prev,
          [targetSuit]: [...prev[targetSuit], topWaste]
        }));
        setSelectedSource(null);
      } else {
        soundEngine.playTrap();
        setSelectedSource(null);
      }
    } else if (selectedSource.location === 'tableau') {
      const srcCol = selectedSource.tableauIndex!;
      const colCards = tableau[srcCol];
      // Only the very top card can move to foundation
      if (selectedSource.cardIndex !== colCards.length - 1) {
        soundEngine.playTrap();
        setSelectedSource(null);
        return;
      }
      const topCard = colCards[colCards.length - 1];
      if (topCard && canMoveToFoundation(topCard, targetSuit)) {
        saveSnapshot();
        soundEngine.playVictory();
        setTableau(prev => {
          const next = prev.map(c => [...c]);
          next[srcCol] = next[srcCol].slice(0, -1);
          if (next[srcCol].length > 0) {
            next[srcCol][next[srcCol].length - 1].faceUp = true;
          }
          return next;
        });
        setFoundations(prev => ({
          ...prev,
          [targetSuit]: [...prev[targetSuit], topCard]
        }));
        setSelectedSource(null);
      } else {
        soundEngine.playTrap();
        setSelectedSource(null);
      }
    }
  };

  // Double-click / Quick auto-solve tap to foundation
  const tryAutoFoundation = (card: SolitaireCard, from: 'waste' | 'tableau', colIdx?: number) => {
    const targetSuit = card.suit;
    if (canMoveToFoundation(card, targetSuit)) {
      saveSnapshot();
      soundEngine.playVictory();

      if (from === 'waste') {
        setWaste(prev => prev.slice(0, -1));
      } else if (from === 'tableau' && colIdx !== undefined) {
        setTableau(prev => {
          const next = prev.map(c => [...c]);
          next[colIdx] = next[colIdx].slice(0, -1);
          if (next[colIdx].length > 0) {
            next[colIdx][next[colIdx].length - 1].faceUp = true;
          }
          return next;
        });
      }

      setFoundations(prev => ({
        ...prev,
        [targetSuit]: [...prev[targetSuit], card]
      }));
      setSelectedSource(null);
      return true;
    }
    return false;
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Color styles for card visual rendering
  const getSuitStyles = (suit: AstralSuit) => {
    switch (suit) {
      case 'solar':
        return 'text-amber-400 border-amber-500/80 bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950';
      case 'void':
        return 'text-purple-400 border-purple-500/80 bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-950';
      case 'tide':
        return 'text-cyan-300 border-cyan-500/80 bg-gradient-to-br from-cyan-950/70 via-slate-900 to-slate-950';
      case 'verdant':
        return 'text-emerald-400 border-emerald-500/80 bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950';
    }
  };

  return (
    <div className="chrono-solitaire-view flex flex-col flex-1 w-full max-w-[1400px] mx-auto p-3 sm:p-6 gap-5 h-[calc(100vh-70px)] overflow-y-auto select-none">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900/90 border border-purple-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToArcade}
            className="btn bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            <span>Back to Arcade</span>
          </button>

          <div>
            <h2 className="text-lg md:text-xl font-black font-serif uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <span>🔮 Chrono Rift Solitaire</span>
              <span className="text-[10px] bg-purple-950 border border-purple-500 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                TEMPORAL KLONDIKE
              </span>
            </h2>
          </div>
        </div>

        {/* Stats & Temporal Control Panel */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-mono">
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {formatTimer(timerSeconds)}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">Moves: {movesCount}</span>
            <span className="text-slate-500">|</span>
            <button
              type="button"
              onClick={() => setShowRules(r => !r)}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
              title="View Rules"
            >
              <Info className="w-3.5 h-3.5" />
              Rules
            </button>
          </div>

          <button
            type="button"
            onClick={undoLastMove}
            disabled={history.length === 0 || temporalRewindsRemaining <= 0}
            className={`btn px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
              history.length > 0 && temporalRewindsRemaining > 0
                ? 'bg-purple-950/80 border-purple-500 text-purple-200 hover:bg-purple-900 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            <span>Temporal Rewind ({temporalRewindsRemaining})</span>
          </button>

          <button
            type="button"
            onClick={dealNewGame}
            className="btn bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>New Rift</span>
          </button>
        </div>
      </div>

      {/* Rules Explainer Dropdown */}
      {showRules && (
        <div className="bg-indigo-950/70 border border-indigo-500/40 rounded-2xl p-4 text-xs font-mono text-slate-300 space-y-2 animate-in fade-in">
          <div className="font-bold text-amber-300 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Chrono Rift Rules:
          </div>
          <p>
            • <strong>Poles & Stacking:</strong> Stack cards descending in alternating astral poles:
            <span className="text-amber-300"> Radiant (Solar ☀️, Tide 🌊)</span> alternate with{' '}
            <span className="text-purple-300"> Deep (Void 🌑, Verdant 🌿)</span>.
          </p>
          <p>
            • <strong>Astral Foundations:</strong> Build each suit pile upward from <strong>Ace (1)</strong> to{' '}
            <strong>King (13)</strong>. Double-tap any exposed top card to auto-send it to its foundation!
          </p>
          <p>
            • <strong>Temporal Rewinds:</strong> Use up to 5 temporal rewinds to undo risky card plays.
          </p>
        </div>
      )}

      {/* Main Solitaire Table Felt */}
      <div className="solitaire-felt flex-1 bg-gradient-to-b from-[#090e21] via-[#0d1430] to-[#070a17] border-2 border-indigo-500/30 rounded-3xl p-4 md:p-6 flex flex-col gap-6 shadow-2xl relative min-h-[620px]">
        {/* Top Row: Stock + Waste on Left, 4 Foundations on Right */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Stock & Waste Pile */}
          <div className="flex items-center gap-4">
            {/* Stock Pile */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Rift Deck ({stock.length})</span>
              <div
                onClick={handleStockClick}
                className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 border-indigo-500/60 bg-gradient-to-br from-indigo-950 to-slate-950 cursor-pointer shadow-lg hover:border-amber-400 hover:scale-105 transition-all flex flex-col items-center justify-center p-2 relative group"
              >
                {stock.length > 0 ? (
                  <>
                    <Sparkles className="w-6 h-6 text-purple-400 group-hover:animate-spin" />
                    <span className="text-[9px] font-mono text-purple-300 font-bold mt-1">DRAW</span>
                  </>
                ) : (
                  <RotateCcw className="w-6 h-6 text-slate-500" />
                )}
              </div>
            </div>

            {/* Waste Pile */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Waste ({waste.length})</span>
              {waste.length === 0 ? (
                <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 flex items-center justify-center text-slate-600 text-xs font-mono">
                  Empty
                </div>
              ) : (
                (() => {
                  const topWaste = waste[waste.length - 1];
                  const isSelected = selectedSource?.location === 'waste';
                  return (
                    <div
                      onClick={() => {
                        soundEngine.playHover();
                        if (isSelected) {
                          setSelectedSource(null);
                        } else {
                          setSelectedSource({ location: 'waste' });
                        }
                      }}
                      onDoubleClick={() => tryAutoFoundation(topWaste, 'waste')}
                      className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 shadow-xl cursor-pointer transition-all flex flex-col justify-between p-2 font-mono ${getSuitStyles(
                        topWaste.suit
                      )} ${isSelected ? 'ring-4 ring-amber-400 -translate-y-2' : 'hover:-translate-y-1'}`}
                    >
                      <div className="text-xs font-black self-start">{getRankDisplay(topWaste.rank)}</div>
                      <div className="text-xl self-center">{SUIT_META[topWaste.suit].symbol}</div>
                      <div className="text-xs font-black self-end">{getRankDisplay(topWaste.rank)}</div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {/* 4 Astral Foundations (Solar, Void, Tide, Verdant) */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {(['solar', 'void', 'tide', 'verdant'] as AstralSuit[]).map(suit => {
              const pile = foundations[suit];
              const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
              const meta = SUIT_META[suit];

              return (
                <div key={suit} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                    {meta.name} ({pile.length}/13)
                  </span>
                  <div
                    onClick={() => {
                      if (selectedSource) {
                        moveCardToFoundation(suit);
                      }
                    }}
                    className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 transition-all flex flex-col items-center justify-between p-2 font-mono relative cursor-pointer ${
                      topCard
                        ? `${getSuitStyles(suit)} shadow-lg`
                        : 'border-dashed border-slate-700/80 bg-slate-950/50 hover:border-slate-500'
                    }`}
                  >
                    {topCard ? (
                      <>
                        <div className="text-xs font-black self-start">{getRankDisplay(topCard.rank)}</div>
                        <div className="text-2xl">{meta.symbol}</div>
                        <div className="text-xs font-black self-end">{getRankDisplay(topCard.rank)}</div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-1">
                        <span className="text-2xl opacity-40">{meta.symbol}</span>
                        <span className="text-[9px] font-bold tracking-wider opacity-60">ACE</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tableau: 7 Cascading Columns */}
        <div className="tableau-grid grid grid-cols-7 gap-2 sm:gap-3 flex-1 pt-4 items-start">
          {tableau.map((col, colIdx) => (
            <div
              key={`col_${colIdx}`}
              onClick={() => {
                if (col.length === 0 && selectedSource) {
                  moveSubstackToTableau(colIdx);
                }
              }}
              className="flex flex-col items-center relative min-h-[260px] rounded-2xl p-1 bg-slate-950/20 border border-slate-800/40"
            >
              {col.length === 0 ? (
                <div
                  onClick={() => moveSubstackToTableau(colIdx)}
                  className="w-full h-24 sm:h-28 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-slate-700 text-[10px] font-mono hover:border-amber-400 cursor-pointer"
                >
                  KING
                </div>
              ) : (
                col.map((card, cardIdx) => {
                  const isTop = cardIdx === col.length - 1;
                  const isSelected =
                    selectedSource?.location === 'tableau' &&
                    selectedSource.tableauIndex === colIdx &&
                    selectedSource.cardIndex! <= cardIdx;

                  return (
                    <div
                      key={card.id}
                      style={{
                        marginTop: cardIdx === 0 ? 0 : '-56px',
                        zIndex: cardIdx + 1
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        if (!card.faceUp) return;

                        if (selectedSource) {
                          // Try moving current selected stack here
                          moveSubstackToTableau(colIdx);
                        } else {
                          // Select this stack
                          soundEngine.playHover();
                          setSelectedSource({
                            location: 'tableau',
                            tableauIndex: colIdx,
                            cardIndex: cardIdx
                          });
                        }
                      }}
                      onDoubleClick={e => {
                        e.stopPropagation();
                        if (isTop && card.faceUp) {
                          tryAutoFoundation(card, 'tableau', colIdx);
                        }
                      }}
                      className={`w-full max-w-[100px] h-24 sm:h-28 rounded-xl border-2 font-mono p-2 flex flex-col justify-between shadow-md transition-transform cursor-pointer ${
                        card.faceUp
                          ? `${getSuitStyles(card.suit)} ${
                              isSelected ? 'ring-4 ring-amber-400 -translate-y-1.5' : 'hover:-translate-y-1'
                            }`
                          : 'bg-gradient-to-br from-indigo-950 to-slate-950 border-indigo-700/60 text-slate-600'
                      }`}
                    >
                      {card.faceUp ? (
                        <>
                          <div className="text-xs font-black self-start">{getRankDisplay(card.rank)}</div>
                          <div className="text-lg sm:text-xl self-center">{SUIT_META[card.suit].symbol}</div>
                          <div className="text-xs font-black self-end">{getRankDisplay(card.rank)}</div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Sparkles className="w-4 h-4 text-indigo-500 opacity-60" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>

        {/* Victory Celebration Overlay */}
        {isVictory && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center gap-6 p-6 z-50 animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.6)]">
              <Trophy className="w-10 h-10 text-slate-950" />
            </div>

            <div className="text-center space-y-2 max-w-md">
              <h3 className="text-3xl font-black font-serif uppercase tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-white bg-clip-text text-transparent">
                TEMPORAL RIFT RESTORED!
              </h3>
              <p className="text-slate-300 text-sm font-mono">
                You gathered all 52 celestial astral suits in {formatTimer(timerSeconds)} with {movesCount} moves!
              </p>
            </div>

            <div className="bg-slate-900 border border-amber-500/50 p-4 rounded-2xl flex items-center gap-4 font-mono text-sm">
              <span className="text-amber-400 font-bold">🎁 Victory Reward:</span>
              <span className="text-white">+500 Astral Gems</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={dealNewGame}
                className="btn bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono text-sm font-black px-6 py-3 rounded-2xl shadow-xl transition-transform hover:scale-105"
              >
                Play Another Rift
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
      </div>
    </div>
  );
}
