'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Card } from './Card';
import { GameState, CardDef, CardInstance, EquippedCosmetics, GameAction } from '@/lib/tcg/types';
import {
  calculateAscensionCost,
  canAscendOnUnit,
  dispatchGameAction
} from '@/lib/tcg/gameEngine';
import { soundEngine } from '@/lib/tcg/soundEngine';
import { getSupporterTier } from '@/lib/tcg/collectionEngine';
import { Zap, ShieldAlert, Sparkles, User, Bot, RotateCcw, Swords, Crown, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';

interface BattleArenaProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onAction?: (action: GameAction) => void;
  onInspectCard: (card: CardDef | CardInstance) => void;
  onNewDuel: () => void;
  onChangeDecks?: () => void;
  equippedCosmetics?: EquippedCosmetics;
  totalSpentUSD?: number;
  localPlayerNumber?: 1 | 2;
  roomCode?: string;
}

export function BattleArena({
  gameState,
  setGameState,
  onAction,
  onInspectCard,
  onNewDuel,
  onChangeDecks,
  equippedCosmetics,
  totalSpentUSD = 0,
  localPlayerNumber,
  roomCode
}: BattleArenaProps) {
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [dropImpactSlot, setDropImpactSlot] = useState<{ player: 1 | 2; lane: number } | null>(null);
  const [isMobileHandExpanded, setIsMobileHandExpanded] = useState<boolean>(true);
  const [combatFlash, setCombatFlash] = useState<string | null>(null);
  const [viewingGraveyardPlayer, setViewingGraveyardPlayer] = useState<1 | 2 | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activePlayer = gameState.players[gameState.currentTurn - 1];
  const isPlayer1Turn = gameState.currentTurn === 1;

  // Clear selections
  const clearSelections = useCallback(() => {
    setSelectedAttackerId(null);
    setSelectedHandCardId(null);
  }, []);

  // Global escape & click away
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelections();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelections]);

  // Track mouse coordinates for dynamic curved attack laser
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Trigger screen shake & impact juice
  const triggerImpactJuice = useCallback((type: 'attack' | 'summon' | 'ascend') => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 360);

    if (type === 'attack') {
      soundEngine.playAttack();
      setCombatFlash('rgba(239, 68, 68, 0.25)');
      setTimeout(() => setCombatFlash(null), 250);
    } else if (type === 'ascend') {
      soundEngine.playAscend();
      setCombatFlash('rgba(245, 158, 11, 0.3)');
      setTimeout(() => setCombatFlash(null), 300);
    } else {
      soundEngine.playSummon();
    }
  }, []);

  // Render curved combat targeting laser arrow
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!selectedAttackerId) return;

    // Find the specific card element
    const matchingCard = document.querySelector(`.card.active-attacker`);
    if (!matchingCard) return;

    const rect = matchingCard.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    const targetX = mousePos.x;
    const targetY = mousePos.y;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    const cpX = (startX + targetX) / 2 + (targetY - startY) * 0.15;
    const cpY = (startY + targetY) / 2 - (targetX - startX) * 0.15;

    ctx.quadraticCurveTo(cpX, cpY, targetX, targetY);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 16;
    ctx.setLineDash([8, 5]);
    ctx.stroke();

    // Arrow Target Point
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [selectedAttackerId, mousePos]);

  const dispatchAction = useCallback(
    (action: GameAction) => {
      if (action.type === 'declareAttack') {
        triggerImpactJuice('attack');
      } else if (action.type === 'playCard' && typeof action.targetLaneIndex === 'number') {
        setDropImpactSlot({
          player: isPlayer1Turn ? 1 : 2,
          lane: action.targetLaneIndex
        });
        setTimeout(() => setDropImpactSlot(null), 600);
        triggerImpactJuice('summon');
      }

      if (onAction) {
        onAction(action);
      } else {
        setGameState(s => dispatchGameAction(s, action));
      }
    },
    [onAction, setGameState, isPlayer1Turn, triggerImpactJuice]
  );

  // Card click handlers
  const handleCardClick = (card: CardInstance, playerId: 1 | 2) => {
    if (gameState.winner) return;
    if (localPlayerNumber && localPlayerNumber !== playerId) return;

    // Friendly hand card clicked
    if (gameState.currentTurn === playerId) {
      if (card.type === 'spell' || card.type === 'ward') {
        dispatchAction({ type: 'playCard', instanceId: card.instanceId });
        clearSelections();
      } else {
        if (selectedHandCardId === card.instanceId) {
          // Double tap plays in first available lane
          dispatchAction({ type: 'playCard', instanceId: card.instanceId });
          clearSelections();
        } else {
          setSelectedHandCardId(card.instanceId);
          soundEngine.playHover();
        }
      }
    }
  };

  const handleBoardCreatureClick = (creature: CardInstance, playerId: 1 | 2, laneIdx: number) => {
    if (gameState.winner) return;

    const isFriendly = gameState.currentTurn === playerId && (localPlayerNumber ? localPlayerNumber === playerId : true);

    if (isFriendly) {
      // In-place evolution check: if friendly hand card selected, attempt evolution
      if (selectedHandCardId) {
        dispatchAction({
          type: 'playCard',
          instanceId: selectedHandCardId,
          targetLaneIndex: laneIdx
        });
        clearSelections();
        return;
      }

      // Ready attacker selection
      if (creature.canAttack && !creature.hasAttackedThisTurn && !creature.frozen && !activePlayer.isAI && (localPlayerNumber ? localPlayerNumber === playerId : true)) {
        if (selectedAttackerId === creature.instanceId) {
          clearSelections();
        } else {
          setSelectedAttackerId(creature.instanceId);
          soundEngine.playHover();
        }
      } else if (!activePlayer.isAI) {
        soundEngine.playTrap();
      }
    } else {
      // Opponent creature clicked as attack target
      if (selectedAttackerId) {
        if (laneIdx === -1) {
          dispatchAction({
            type: 'declareAttack',
            attackerInstanceId: selectedAttackerId,
            targetType: 'champion_lane',
            targetLaneOrId: null
          });
        } else {
          dispatchAction({
            type: 'declareAttack',
            attackerInstanceId: selectedAttackerId,
            targetType: 'creature',
            targetLaneOrId: laneIdx
          });
        }
        clearSelections();
      }
    }
  };

  const handleChampionClick = (targetPlayerId: 1 | 2) => {
    if (gameState.winner) return;

    // Direct strike against opponent Champion Commander
    if (selectedAttackerId && gameState.currentTurn !== targetPlayerId) {
      const oppTaunters = targetPlayerId === 1 ? p1Taunters : p2Taunters;
      if (oppTaunters.length > 0) {
        soundEngine.playTrap();
      }
      dispatchAction({
        type: 'declareAttack',
        attackerInstanceId: selectedAttackerId,
        targetType: 'champion',
        targetLaneOrId: null
      });
      clearSelections();
    }
  };

  const handleLaneSlotClick = (laneIdx: number, playerId: 1 | 2) => {
    if (gameState.winner) return;
    if (selectedHandCardId && gameState.currentTurn === playerId) {
      dispatchAction({
        type: 'playCard',
        instanceId: selectedHandCardId,
        targetLaneIndex: laneIdx
      });
      clearSelections();
    }
  };

  // Selected hand card reference
  const selectedCardInHand = activePlayer.hand.find(c => c.instanceId === selectedHandCardId);

  // Check Taunt on both boards
  const p1Taunters = gameState.players[0].board.filter(c => c && c.hasTaunt);
  const p2Taunters = gameState.players[1].board.filter(c => c && c.hasTaunt);

  // Safe Mana & MaxMana getters
  const p1Mana = gameState.players[0].mana ?? 1;
  const p1MaxMana = gameState.players[0].maxMana ?? 1;
  const p2Mana = gameState.players[1].mana ?? 1;
  const p2MaxMana = gameState.players[1].maxMana ?? 1;

  // Champion Commander data getters
  const p1Champ = gameState.players[0].champion || gameState.players[0].vanguard;
  const p2Champ = gameState.players[1].champion || gameState.players[1].vanguard;

  // Hand visibility in Online vs Couch Co-Op:
  const hideP1Hand = localPlayerNumber
    ? localPlayerNumber !== 1
    : gameState.mode === 'couch_2p' && !isPlayer1Turn;
  const hideP2Hand = localPlayerNumber
    ? localPlayerNumber !== 2
    : (gameState.mode === 'couch_2p' && isPlayer1Turn) || gameState.players[1].isAI;

  const isMyTurn = localPlayerNumber
    ? localPlayerNumber === gameState.currentTurn
    : !activePlayer.isAI;

  return (
    <div
      className={`battle-arena-view flex flex-col flex-1 w-full max-w-[1560px] mx-auto p-1.5 sm:p-3 md:p-4 gap-2 relative overflow-hidden select-none ${
        screenShake ? 'animate-screen-shake' : ''
      }`}
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Combat Flash Overlay */}
      {combatFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-50 transition-opacity duration-200"
          style={{ backgroundColor: combatFlash }}
        />
      )}

      {/* Targeting Laser Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-50"
      />

      {/* Arena Topbar (Mobile Optimized) */}
      <div className="arena-topbar flex flex-wrap items-center justify-between bg-slate-900/90 border border-amber-500/20 rounded-xl px-2.5 sm:px-4 py-1.5 backdrop-blur-md gap-2 shadow-lg z-20">
        <div className="match-info-pill flex items-center gap-1.5 sm:gap-3 text-xs sm:text-sm font-mono">
          <span className="mode-badge px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-purple-950/70 border border-purple-500/40 text-purple-300 font-bold flex items-center gap-1 text-[11px] sm:text-xs">
            {gameState.mode === 'couch_2p' ? <User className="w-3 h-3 text-purple-400" /> : <Bot className="w-3 h-3 text-sky-400" />}
            {gameState.mode === 'couch_2p'
              ? 'Local 2P'
              : localPlayerNumber
              ? `Online (P${localPlayerNumber})`
              : 'vs AI'}
          </span>
          <span className="turn-indicator-badge font-bold text-amber-300 flex items-center gap-1 text-[11px] sm:text-xs">
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
            <span className="truncate max-w-[140px] sm:max-w-none">
              {activePlayer.name}&apos;s Turn ({(gameState.phase || 'draw').toUpperCase()})
            </span>
          </span>
          <span className="text-slate-400 text-[11px] sm:text-xs">R{gameState.round}</span>
        </div>

        {/* Phase Guide & Quick Status */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-700/70 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-slate-200">
            {gameState.phase === 'draw'
              ? 'Draw Phase: Draw a card to begin your tactical plays'
              : gameState.phase === 'main'
              ? 'Main Phase: Play creatures, evolutions, spells & wards'
              : gameState.phase === 'combat'
              ? 'Combat Phase: Select ready creatures to attack targets'
              : 'End Phase: Cleaning up turn & passing control'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {roomCode && (
            <span className="hidden sm:inline bg-sky-950 border border-sky-500/50 text-sky-300 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
              Room: {roomCode}
            </span>
          )}

          {/* Mobile Hand Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileHandExpanded(!isMobileHandExpanded)}
            className="md:hidden flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-2 py-1 rounded-lg text-[11px] font-mono font-bold"
            title="Toggle Hand View on Mobile"
          >
            {isMobileHandExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            <span>{isMobileHandExpanded ? 'Hide Hand' : 'View Hand'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewingGraveyardPlayer(gameState.currentTurn)}
            className="btn btn-outline border-purple-500/50 text-purple-300 hover:bg-purple-950 px-2 sm:px-3 py-1 text-[11px] sm:text-xs flex items-center gap-1 font-mono"
            title="Inspect Active Player Graveyard"
          >
            <span>🪦</span>
            <span className="hidden sm:inline">Grave ({activePlayer.graveyard.length})</span>
          </button>

          {onChangeDecks && (
            <button
              type="button"
              onClick={onChangeDecks}
              className="btn btn-outline px-2 sm:px-3 py-1 text-[11px] sm:text-xs flex items-center gap-1 text-sky-200"
            >
              <Swords className="w-3 h-3 text-sky-400" />
              <span className="hidden sm:inline">Decks</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNewDuel}
            className="btn btn-outline px-2 sm:px-3 py-1 text-[11px] sm:text-xs flex items-center gap-1 hover:border-amber-500/60 text-amber-200"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Rematch</span>
          </button>
        </div>
      </div>

      {/* Hearthstone Tavern Duel Board */}
      <div className="duel-mat flex-1 flex flex-col justify-between bg-gradient-to-b from-[#0a0c16] via-[#101428] to-[#0a0c16] border-2 sm:border-4 border-[#2d241e] rounded-2xl p-2 sm:p-3 md:p-4 relative shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Hearthstone Wood Grain Texture & Mat Inset */}
        <div className="absolute inset-0 pointer-events-none border border-amber-500/10 rounded-xl" />
        <div className="mat-center-divider absolute top-1/2 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />

        {/* =========================================================================
            PLAYER 2 / OPPONENT ZONE (TOP)
            ========================================================================= */}
        <div className="player-mat-zone p2-zone flex flex-col gap-1.5 relative z-10">
          <div className="mat-row flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            {/* Hearthstone Oval Hero Portrait Frame (P2) */}
            <div
              className={`champion-portrait-wrap flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-slate-900 to-slate-950 border-2 rounded-2xl p-1.5 sm:p-2 shadow-xl cursor-pointer transition-all ${
                selectedAttackerId && isPlayer1Turn && p2Taunters.length === 0
                  ? 'border-red-500 ring-4 ring-red-500/60 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                  : !isPlayer1Turn
                  ? 'border-purple-400/80 shadow-[0_0_18px_rgba(192,132,252,0.4)]'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
              onClick={() => handleChampionClick(2)}
              title={selectedAttackerId && isPlayer1Turn ? 'Click to declare DIRECT ATTACK on enemy Champion!' : 'Champion Command Zone'}
            >
              {/* Hearthstone Oval Hero Token */}
              <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden border-2 border-amber-400 shadow-md flex-shrink-0 bg-slate-950">
                <Image
                  src={p2Champ.avatar}
                  alt={p2Champ.name}
                  fill
                  sizes="52px"
                  priority
                  className="object-cover"
                />
                {/* Hearthstone Blood-Red Health Badge */}
                <div className="absolute bottom-0 right-0 bg-gradient-to-br from-red-600 to-rose-700 text-white font-mono font-black text-[10px] sm:text-xs px-1.5 rounded-tl-md border-t border-l border-red-300 drop-shadow flex items-center justify-center">
                  {p2Champ.hp}
                </div>
              </div>

              {/* Name & Title */}
              <div className="flex flex-col min-w-0 pr-1">
                <div className="flex items-center gap-1">
                  <Crown className="w-3 h-3 text-purple-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[90px] sm:max-w-[130px]">
                    {gameState.players[1].name}
                  </span>
                </div>
                <span className="text-[10px] text-purple-300 font-mono truncate max-w-[90px] sm:max-w-[130px]">
                  {p2Champ.name}
                </span>
              </div>

              {/* Commander Power Medallion (P2) */}
              <button
                type="button"
                disabled={
                  p2Champ.heroPowerUsed ||
                  p2Mana < p2Champ.heroPower.cost ||
                  isPlayer1Turn ||
                  !isMyTurn ||
                  (localPlayerNumber ? localPlayerNumber !== 2 : false)
                }
                onClick={() => {
                  if (!isPlayer1Turn && isMyTurn && (localPlayerNumber ? localPlayerNumber === 2 : true)) {
                    dispatchAction({ type: 'activateHeroPower' });
                  }
                }}
                className={`commander-power-medallion w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 flex flex-col items-center justify-center relative transition-all ${
                  !p2Champ.heroPowerUsed &&
                  p2Mana >= p2Champ.heroPower.cost &&
                  !isPlayer1Turn &&
                  isMyTurn &&
                  (localPlayerNumber ? localPlayerNumber === 2 : true)
                    ? 'bg-gradient-to-br from-indigo-900 to-purple-900 border-amber-400 text-purple-200 hover:scale-110 shadow-[0_0_15px_rgba(251,191,36,0.7)] cursor-pointer'
                    : 'bg-slate-950 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
                }`}
                title={`Commander Power (2 Mana): ${p2Champ.heroPower.name} - ${p2Champ.heroPower.desc}`}
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold border border-blue-300 shadow">
                  2
                </span>
              </button>
            </div>

            {/* Secret Wards (P2) */}
            <div className="secret-wards-row flex items-center gap-1.5">
              {gameState.players[1].wards.map((ward, idx) => (
                <div
                  key={`p2_ward_${idx}`}
                  className={`ward-slot-chip w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center text-xs transition-all ${
                    ward
                      ? 'border-purple-500 bg-purple-950/80 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.6)] animate-pulse'
                      : 'border-dashed border-slate-800 bg-slate-950/40 text-slate-700'
                  }`}
                  title={ward ? 'Active Face-Down Secret Ward' : 'Empty Ward Slot'}
                >
                  <ShieldAlert className={`w-3.5 h-3.5 ${ward ? 'text-purple-400' : 'text-slate-700'}`} />
                </div>
              ))}
            </div>

            {/* Hearthstone Chunky Mana Tray & Piles (P2) */}
            <div className="flex items-center gap-2">
              <div className="mana-tray-hearthstone flex items-center gap-1.5 bg-slate-950/90 border border-sky-500/40 px-2.5 py-1 rounded-xl shadow-inner">
                <span className="font-mono text-xs font-black text-sky-400 flex items-center gap-0.5">
                  💎 {p2Mana}/{p2MaxMana}
                </span>
                <div className="hidden sm:flex gap-1">
                  {Array.from({ length: p2MaxMana }).map((_, i) => (
                    <div
                      key={`p2_gem_${i}`}
                      className={`w-2 h-3 rounded-xs border ${
                        i < p2Mana
                          ? 'bg-gradient-to-b from-cyan-300 to-blue-600 border-cyan-200 shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                          : 'bg-slate-800/60 border-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Piles */}
              <div className="flex gap-1.5 text-[9px] font-mono">
                <div className="w-8 h-11 sm:w-9 sm:h-13 rounded bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400">
                  <span className="text-[8px]">DECK</span>
                  <span className="font-bold text-white text-[10px]">{gameState.players[1].deck.length}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingGraveyardPlayer(2)}
                  className="w-8 h-11 sm:w-9 sm:h-13 rounded bg-slate-900 border border-purple-900/60 hover:border-purple-400 flex flex-col items-center justify-center text-purple-300 transition-colors cursor-pointer shadow"
                  title="View Player 2 Graveyard"
                >
                  <span className="text-[8px] flex items-center gap-0.5">🪦 GRAVE</span>
                  <span className="font-bold text-white text-[10px]">{gameState.players[1].graveyard.length}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Player 2 Hand (Hearthstone Curved Fan Arc) */}
          <div className="hand-container p2-hand flex justify-center items-center gap-[-14px] min-h-[95px] sm:min-h-[120px] py-1">
            {gameState.players[1].hand.map((card, idx) => {
              const isSelected = selectedHandCardId === card.instanceId && !isPlayer1Turn;
              const total = gameState.players[1].hand.length;
              const mid = (total - 1) / 2;
              const fanAngle = total > 1 ? (idx - mid) * 3 : 0;
              const fanY = total > 1 ? Math.abs(idx - mid) * 2 : 0;

              // Hearthstone Playable Green Glow: card cost <= mana and friendly turn
              const isCardPlayable = !hideP2Hand && !isPlayer1Turn && card.cost <= p2Mana;

              return (
                <div
                  key={card.instanceId || `p2_card_${idx}`}
                  style={{
                    transform: isSelected
                      ? 'translateY(-20px) scale(1.1) rotate(0deg)'
                      : `translateY(${fanY}px) rotate(${fanAngle}deg)`,
                    transition: 'all 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
                  className={`-mx-2 sm:-mx-2.5 z-20 hover:z-40 ${
                    isSelected ? 'z-40 ring-2 ring-purple-400 rounded-xl' : ''
                  }`}
                >
                  <Card
                    card={card}
                    isFaceDown={hideP2Hand}
                    size={!isPlayer1Turn ? 'sm' : 'xs'}
                    isPlayable={isCardPlayable}
                    draggable={!hideP2Hand && !isPlayer1Turn}
                    equippedCardBack={equippedCosmetics?.cardBack}
                    equippedFoilStyle={equippedCosmetics?.foilStyle}
                    onDragStart={() => {
                      if (!hideP2Hand && !isPlayer1Turn) {
                        setDraggedCardId(card.instanceId);
                        setSelectedHandCardId(card.instanceId);
                      }
                    }}
                    onInspect={onInspectCard}
                    onClick={() => {
                      if (!hideP2Hand) handleCardClick(card, 2);
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Player 2 Battlefield Lanes */}
          <div className="lanes-container p2-lanes flex justify-center gap-1.5 sm:gap-2.5 md:gap-3 py-1">
            {/* Player 2 Dedicated Champion Lane Slot */}
            {(() => {
              const p2ChampLane = gameState.players[1].championLane;
              const isP2Turn = !isPlayer1Turn;
              const isChampPlayable = selectedHandCardId && isP2Turn && (selectedCardInHand?.id.includes('_champion') || selectedCardInHand?.desc?.includes('Dedicated Champion Lane'));

              return (
                <div
                  className={`creature-lane-slot champion-lane-slot w-[60px] h-[88px] sm:w-[95px] sm:h-[135px] md:w-[125px] md:h-[175px] lg:w-[135px] lg:h-[190px] rounded-xl border-2 flex items-center justify-center relative transition-all cursor-pointer ${
                    p2ChampLane
                      ? 'border-amber-400 bg-gradient-to-b from-amber-950/40 via-slate-900 to-amber-950/30 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : isChampPlayable
                      ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/70 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                      : 'border-dashed border-amber-500/40 bg-slate-950/60 hover:border-amber-400/70'
                  }`}
                  onClick={() => {
                    if (isP2Turn) {
                      if (!p2ChampLane && selectedHandCardId) {
                        dispatchAction({ type: 'playCard', instanceId: selectedHandCardId, targetLaneIndex: 'champion' });
                        clearSelections();
                      } else if (p2ChampLane) {
                        handleBoardCreatureClick(p2ChampLane, 2, -1);
                      }
                    } else if (p2ChampLane && selectedAttackerId && isPlayer1Turn) {
                      dispatchAction({
                        type: 'declareAttack',
                        attackerInstanceId: selectedAttackerId,
                        targetType: 'champion_lane',
                        targetLaneOrId: null
                      });
                      clearSelections();
                    }
                  }}
                  onDragOver={e => { if (isP2Turn) e.preventDefault(); }}
                  onDrop={e => {
                    e.preventDefault();
                    if (draggedCardId && isP2Turn) {
                      dispatchAction({ type: 'playCard', instanceId: draggedCardId, targetLaneIndex: 'champion' });
                      clearSelections();
                    }
                  }}
                  title="Dedicated Champion Lane"
                >
                  <div className="absolute -top-2.5 sm:-top-3 z-30 bg-amber-500 text-slate-950 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[8px] sm:text-[9px] font-black font-mono shadow flex items-center gap-0.5 pointer-events-none">
                    <Crown className="w-2.5 h-2.5" />
                    <span>CHAMPION</span>
                  </div>

                  {p2ChampLane ? (
                    <Card
                      card={p2ChampLane}
                      size="sm"
                      isValidTarget={!!selectedAttackerId && isPlayer1Turn}
                      isReadyToAttack={isP2Turn && p2ChampLane.canAttack && !p2ChampLane.hasAttackedThisTurn && !p2ChampLane.frozen}
                      isExhausted={isP2Turn && (!p2ChampLane.canAttack || p2ChampLane.hasAttackedThisTurn)}
                      isSelectedAttacker={p2ChampLane.instanceId === selectedAttackerId && isP2Turn}
                      onInspect={onInspectCard}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-amber-400/60 p-1 text-center select-none">
                      <Crown className="w-5 h-5 sm:w-7 sm:h-7" />
                      <span className="text-[8px] sm:text-[10px] font-mono font-bold leading-tight">Champion Lane</span>
                    </div>
                  )}
                </div>
              );
            })()}
            {gameState.players[1].board.map((creature, laneIdx) => {
              const isTargetCandidate = !!selectedAttackerId && isPlayer1Turn;
              const isTaunter = creature && creature.hasTaunt;
              const isTargetValid = isTargetCandidate && (p2Taunters.length === 0 || isTaunter);

              const isP2Turn = !isPlayer1Turn;
              const isP2Ready = !!(isP2Turn && creature && creature.canAttack && !creature.hasAttackedThisTurn && !creature.frozen);
              const isP2AttackerSelected = !!(creature && creature.instanceId === selectedAttackerId && isP2Turn);

              const isP2Ascendable = !!(
                isP2Turn &&
                selectedCardInHand &&
                creature &&
                canAscendOnUnit(selectedCardInHand, creature) &&
                calculateAscensionCost(selectedCardInHand, creature) <= activePlayer.mana
              );
              const p2EvoDiscount = isP2Ascendable && selectedCardInHand && creature
                ? Math.max(0, selectedCardInHand.cost - calculateAscensionCost(selectedCardInHand, creature))
                : 0;

              const isRippleActive = dropImpactSlot?.player === 2 && dropImpactSlot?.lane === laneIdx;

              return (
                <div
                  key={`p2_lane_${laneIdx}`}
                  className={`creature-lane-slot w-[60px] h-[88px] sm:w-[95px] sm:h-[135px] md:w-[125px] md:h-[175px] lg:w-[135px] lg:h-[190px] rounded-xl border flex items-center justify-center relative transition-all cursor-pointer ${
                    creature
                      ? isP2Ascendable
                        ? 'border-amber-400 ring-2 ring-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                        : 'border-transparent'
                      : selectedHandCardId && !isPlayer1Turn
                      ? 'border-purple-500/80 bg-purple-950/30 ring-2 ring-purple-400/50 animate-pulse'
                      : 'border-dashed border-slate-800/80 bg-slate-950/40 hover:border-slate-700'
                  }`}
                  onClick={() => {
                    if (isP2Turn) {
                      if (!creature) handleLaneSlotClick(laneIdx, 2);
                      else handleBoardCreatureClick(creature, 2, laneIdx);
                    } else {
                      if (creature) handleBoardCreatureClick(creature, 2, laneIdx);
                    }
                  }}
                  onDragOver={e => {
                    if (isP2Turn) e.preventDefault();
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    if (draggedCardId && isP2Turn) {
                      dispatchAction({
                        type: 'playCard',
                        instanceId: draggedCardId,
                        targetLaneIndex: laneIdx
                      });
                      clearSelections();
                    }
                  }}
                >
                  {isRippleActive && <div className="summon-ripple" />}

                  {creature?.hasTaunt && (
                    <div className="absolute -top-2.5 sm:-top-3 z-30 bg-rose-600 border border-rose-400 text-white px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[8px] sm:text-[10px] font-black font-mono shadow-[0_0_12px_rgba(225,29,72,0.9)] flex items-center gap-0.5 sm:gap-1 pointer-events-none">
                      <ShieldAlert className="w-2.5 h-2.5" />
                      <span>TAUNT</span>
                    </div>
                  )}

                  {isP2Ascendable && (
                    <div className="absolute -top-3 sm:-top-3.5 z-30 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[8px] sm:text-[10px] font-black font-mono shadow-[0_0_15px_rgba(245,158,11,0.9)] animate-bounce flex items-center gap-1 pointer-events-none">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>EVOLVE (-{p2EvoDiscount}⚡)</span>
                    </div>
                  )}

                  {creature ? (
                    <Card
                      card={creature}
                      size="sm"
                      isValidTarget={!!isTargetValid}
                      isReadyToAttack={isP2Ready}
                      isExhausted={isP2Turn && (!creature.canAttack || creature.hasAttackedThisTurn)}
                      isSelectedAttacker={isP2AttackerSelected}
                      isAscensionCandidate={isP2Ascendable}
                      onInspect={onInspectCard}
                      onClick={() => handleBoardCreatureClick(creature, 2, laneIdx)}
                    />
                  ) : (
                    <span className="lane-placeholder-num font-mono text-base sm:text-xl font-black text-slate-800 select-none">
                      {laneIdx + 1}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Player 2 Visual Graveyard Zone Slot */}
            {(() => {
              const p2Grave = gameState.players[1].graveyard;
              const topCard = p2Grave.length > 0 ? p2Grave[p2Grave.length - 1] : null;

              return (
                <div
                  className="creature-lane-slot graveyard-lane-slot w-[60px] h-[88px] sm:w-[95px] sm:h-[135px] md:w-[125px] md:h-[175px] lg:w-[135px] lg:h-[190px] rounded-xl border-2 border-purple-800/80 bg-gradient-to-b from-purple-950/40 via-slate-950 to-slate-950 hover:border-purple-400 flex flex-col items-center justify-center relative transition-all cursor-pointer shadow-lg group"
                  onClick={() => setViewingGraveyardPlayer(2)}
                  title="Click to inspect Player 2 Graveyard"
                >
                  <div className="absolute -top-2.5 sm:-top-3 z-30 bg-purple-900 border border-purple-500 text-purple-200 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[8px] sm:text-[9px] font-black font-mono shadow flex items-center gap-0.5 pointer-events-none">
                    <span>🪦</span>
                    <span>GRAVEYARD ({p2Grave.length})</span>
                  </div>

                  {topCard ? (
                    <div className="w-full h-full p-1 flex flex-col items-center justify-center relative overflow-hidden rounded-lg">
                      <Card
                        card={topCard}
                        size="sm"
                        onInspect={onInspectCard}
                        onClick={() => setViewingGraveyardPlayer(2)}
                      />
                      <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors pointer-events-none" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-purple-400/50 p-1 text-center select-none">
                      <span className="text-xl sm:text-2xl">🪦</span>
                      <span className="text-[8px] sm:text-[10px] font-mono font-bold leading-tight">Graveyard</span>
                      <span className="text-[8px] font-mono text-slate-600">Empty (0)</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Center Battlefield Dividing Flank with Turn Phase & Step Tracker + Hearthstone Action Button */}
        <div className="battlefield-center-flank flex flex-wrap items-center justify-between px-2 py-1.5 relative z-30 gap-2 bg-slate-950/50 backdrop-blur-sm border-y border-amber-500/20 rounded-xl my-1 shadow-lg">
          {/* Turn Phase & Step Tracker */}
          <div className="phase-tracker-bar flex items-center gap-1 sm:gap-2 bg-slate-950/90 p-1 sm:p-1.5 rounded-xl border border-slate-800/80 shadow-inner">
            <span className="hidden xl:inline font-mono text-[10px] text-amber-400 font-bold px-1 uppercase tracking-wider">
              Phase:
            </span>
            {[
              { key: 'draw', label: 'DRAW', icon: '🃏', desc: 'Draw Card' },
              { key: 'main', label: 'MAIN', icon: '⚡', desc: 'Summon & Spells' },
              { key: 'combat', label: 'COMBAT', icon: '⚔️', desc: 'Declare Attacks' },
              { key: 'end', label: 'END', icon: '🛡️', desc: 'End Turn' }
            ].map((p, pIdx) => {
              const currentPhase = gameState.phase || 'draw';
              const isActive = currentPhase === p.key;
              const isPast =
                (p.key === 'draw' && (currentPhase === 'main' || currentPhase === 'combat' || currentPhase === 'end')) ||
                (p.key === 'main' && (currentPhase === 'combat' || currentPhase === 'end')) ||
                (p.key === 'combat' && currentPhase === 'end');

              return (
                <div key={p.key} className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={gameState.winner !== null || !isMyTurn}
                    onClick={() => {
                      if (!isMyTurn || gameState.winner !== null) return;
                      if (isActive || (currentPhase === 'draw' && p.key === 'main')) {
                        dispatchAction({ type: 'advancePhase' });
                      } else if (currentPhase === 'main' && p.key === 'combat') {
                        dispatchAction({ type: 'advancePhase' });
                      } else if (p.key === 'end') {
                        dispatchAction({ type: 'endTurn' });
                        clearSelections();
                      }
                    }}
                    className={`phase-step-chip flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.8)] scale-105 ring-1 ring-amber-300'
                        : isPast
                        ? 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/60 text-slate-600 border border-slate-900 hover:text-slate-400'
                    }`}
                    title={`${p.label} Phase: ${p.desc}`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping ml-0.5" />}
                  </button>
                  {pIdx < 3 && <ArrowRight className="w-3 h-3 text-slate-700 hidden sm:inline" />}
                </div>
              );
            })}
          </div>

          {/* Dynamic Action Button */}
          <button
            type="button"
            disabled={gameState.winner !== null || !isMyTurn}
            onClick={() => {
              if (!isMyTurn || gameState.winner !== null) return;
              if (gameState.phase === 'draw') {
                dispatchAction({ type: 'drawCard' });
              } else if (gameState.phase === 'main') {
                dispatchAction({ type: 'advancePhase' });
              } else {
                dispatchAction({ type: 'endTurn' });
                clearSelections();
                soundEngine.playTurnChime();
              }
            }}
            className={`hearthstone-end-turn-btn px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base font-black font-serif tracking-wider uppercase ${
              !isMyTurn
                ? 'opponent-turn opacity-70 cursor-not-allowed'
                : gameState.phase === 'draw'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.7)]'
                : gameState.phase === 'main'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-yellow-100 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.7)]'
                : 'text-yellow-100 animate-pulse'
            }`}
          >
            {!isMyTurn
              ? 'OPPONENT TURN'
              : gameState.phase === 'draw'
              ? 'DRAW CARD 🃏'
              : gameState.phase === 'main'
              ? 'TO COMBAT ⚔️'
              : 'END TURN 🛡️'}
          </button>
        </div>

        {/* =========================================================================
            PLAYER 1 ZONE (BOTTOM)
            ========================================================================= */}
        <div className="player-mat-zone p1-zone flex flex-col gap-1.5 relative z-10">
          {/* Player 1 Battlefield Lanes */}
          <div className="lanes-container p1-lanes flex justify-center gap-1.5 sm:gap-2.5 md:gap-3 py-1">
            {/* Player 1 Dedicated Champion Lane Slot */}
            {(() => {
              const p1ChampLane = gameState.players[0].championLane;
              const isTurn = isPlayer1Turn;
              const isChampPlayable = selectedHandCardId && isTurn && (selectedCardInHand?.id.includes('_champion') || selectedCardInHand?.desc?.includes('Dedicated Champion Lane'));

              return (
                <div
                  className={`creature-lane-slot champion-lane-slot w-[60px] h-[88px] sm:w-[95px] sm:h-[135px] md:w-[125px] md:h-[175px] lg:w-[135px] lg:h-[190px] rounded-xl border-2 flex items-center justify-center relative transition-all cursor-pointer ${
                    p1ChampLane
                      ? 'border-amber-400 bg-gradient-to-b from-amber-950/40 via-slate-900 to-amber-950/30 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : isChampPlayable
                      ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400/70 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                      : 'border-dashed border-amber-500/40 bg-slate-950/60 hover:border-amber-400/70'
                  }`}
                  onClick={() => {
                    if (isTurn) {
                      if (!p1ChampLane && selectedHandCardId) {
                        dispatchAction({ type: 'playCard', instanceId: selectedHandCardId, targetLaneIndex: 'champion' });
                        clearSelections();
                      } else if (p1ChampLane) {
                        handleBoardCreatureClick(p1ChampLane, 1, -1);
                      }
                    } else if (p1ChampLane && selectedAttackerId && !isPlayer1Turn) {
                      dispatchAction({
                        type: 'declareAttack',
                        attackerInstanceId: selectedAttackerId,
                        targetType: 'champion_lane',
                        targetLaneOrId: null
                      });
                      clearSelections();
                    }
                  }}
                  onDragOver={e => { if (isTurn) e.preventDefault(); }}
                  onDrop={e => {
                    e.preventDefault();
                    if (draggedCardId && isTurn) {
                      dispatchAction({ type: 'playCard', instanceId: draggedCardId, targetLaneIndex: 'champion' });
                      clearSelections();
                    }
                  }}
                  title="Dedicated Champion Lane"
                >
                  <div className="absolute -top-2.5 sm:-top-3 z-30 bg-amber-500 text-slate-950 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[8px] sm:text-[9px] font-black font-mono shadow flex items-center gap-0.5 pointer-events-none">
                    <Crown className="w-2.5 h-2.5" />
                    <span>CHAMPION</span>
                  </div>

                  {p1ChampLane ? (
                    <Card
                      card={p1ChampLane}
                      size="sm"
                      isValidTarget={!!selectedAttackerId && !isPlayer1Turn}
                      isReadyToAttack={isTurn && p1ChampLane.canAttack && !p1ChampLane.hasAttackedThisTurn && !p1ChampLane.frozen}
                      isExhausted={isTurn && (!p1ChampLane.canAttack || p1ChampLane.hasAttackedThisTurn)}
                      isSelectedAttacker={p1ChampLane.instanceId === selectedAttackerId && isTurn}
                      onInspect={onInspectCard}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-amber-400/60 p-1 text-center select-none">
                      <Crown className="w-5 h-5 sm:w-7 sm:h-7" />
                      <span className="text-[8px] sm:text-[10px] font-mono font-bold leading-tight">Champion Lane</span>
                    </div>
                  )}
                </div>
              );
            })()}
            {gameState.players[0].board.map((creature, laneIdx) => {
              const isTargetCandidate = !!selectedAttackerId && !isPlayer1Turn;
              const isTaunter = creature && creature.hasTaunt;
              const isTargetValid = isTargetCandidate && (p1Taunters.length === 0 || isTaunter);

              const isTurn = isPlayer1Turn;
              const isReady = !!(isTurn && creature && creature.canAttack && !creature.hasAttackedThisTurn && !creature.frozen);
              const isAttackerSelected = !!(creature && creature.instanceId === selectedAttackerId && isTurn);

              const isAscendable = !!(
                isTurn &&
                selectedCardInHand &&
                creature &&
                canAscendOnUnit(selectedCardInHand, creature) &&
                calculateAscensionCost(selectedCardInHand, creature) <= activePlayer.mana
              );
              const evoDiscount = isAscendable && selectedCardInHand && creature
                ? Math.max(0, selectedCardInHand.cost - calculateAscensionCost(selectedCardInHand, creature))
                : 0;

              const isRippleActive = dropImpactSlot?.player === 1 && dropImpactSlot?.lane === laneIdx;

              return (
                <div
                  key={`p1_lane_${laneIdx}`}
                  className={`creature-lane-slot w-[60px] h-[88px] sm:w-[95px] sm:h-[135px] md:w-[125px] md:h-[175px] lg:w-[135px] lg:h-[190px] rounded-xl border flex items-center justify-center relative transition-all cursor-pointer ${
                    creature
                      ? isAscendable
                        ? 'border-amber-400 ring-2 ring-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                        : 'border-transparent'
                      : selectedHandCardId && isPlayer1Turn
                      ? 'border-sky-500/80 bg-sky-950/30 ring-2 ring-sky-400/50 animate-pulse'
                      : 'border-dashed border-slate-800/80 bg-slate-950/40 hover:border-slate-700'
                  }`}
                  onClick={() => {
                    if (isTurn) {
                      if (!creature) handleLaneSlotClick(laneIdx, 1);
                      else handleBoardCreatureClick(creature, 1, laneIdx);
                    } else {
                      if (creature) handleBoardCreatureClick(creature, 1, laneIdx);
                    }
                  }}
                  onDragOver={e => {
                    if (isTurn) e.preventDefault();
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    if (draggedCardId && isTurn) {
                      dispatchAction({
                        type: 'playCard',
                        instanceId: draggedCardId,
                        targetLaneIndex: laneIdx
                      });
                      clearSelections();
                    }
                  }}
                >
                  {isRippleActive && <div className="summon-ripple" />}

                  {creature?.hasTaunt && (
                    <div className="absolute -top-2.5 sm:-top-3 z-30 bg-rose-600 border border-rose-400 text-white px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[8px] sm:text-[10px] font-black font-mono shadow-[0_0_12px_rgba(225,29,72,0.9)] flex items-center gap-0.5 sm:gap-1 pointer-events-none">
                      <ShieldAlert className="w-2.5 h-2.5" />
                      <span>TAUNT</span>
                    </div>
                  )}

                  {isAscendable && (
                    <div className="absolute -top-3 sm:-top-3.5 z-30 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[8px] sm:text-[10px] font-black font-mono shadow-[0_0_15px_rgba(245,158,11,0.9)] animate-bounce flex items-center gap-1 pointer-events-none">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>EVOLVE (-{evoDiscount}⚡)</span>
                    </div>
                  )}

                  {creature ? (
                    <Card
                      card={creature}
                      size="sm"
                      isValidTarget={!!isTargetValid}
                      isReadyToAttack={isReady}
                      isExhausted={isTurn && (!creature.canAttack || creature.hasAttackedThisTurn)}
                      isSelectedAttacker={isAttackerSelected}
                      isAscensionCandidate={isAscendable}
                      onInspect={onInspectCard}
                      onClick={() => handleBoardCreatureClick(creature, 1, laneIdx)}
                    />
                  ) : (
                    <span className="lane-placeholder-num font-mono text-base sm:text-xl font-black text-slate-800 select-none">
                      {laneIdx + 1}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Player 1 Visual Graveyard Zone Slot */}
            {(() => {
              const p1Grave = gameState.players[0].graveyard;
              const topCard = p1Grave.length > 0 ? p1Grave[p1Grave.length - 1] : null;

              return (
                <div
                  className="creature-lane-slot graveyard-lane-slot w-[60px] h-[88px] sm:w-[95px] sm:h-[135px] md:w-[125px] md:h-[175px] lg:w-[135px] lg:h-[190px] rounded-xl border-2 border-purple-800/80 bg-gradient-to-b from-purple-950/40 via-slate-950 to-slate-950 hover:border-purple-400 flex flex-col items-center justify-center relative transition-all cursor-pointer shadow-lg group"
                  onClick={() => setViewingGraveyardPlayer(1)}
                  title="Click to inspect Player 1 Graveyard"
                >
                  <div className="absolute -top-2.5 sm:-top-3 z-30 bg-purple-900 border border-purple-500 text-purple-200 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[8px] sm:text-[9px] font-black font-mono shadow flex items-center gap-0.5 pointer-events-none">
                    <span>🪦</span>
                    <span>GRAVEYARD ({p1Grave.length})</span>
                  </div>

                  {topCard ? (
                    <div className="w-full h-full p-1 flex flex-col items-center justify-center relative overflow-hidden rounded-lg">
                      <Card
                        card={topCard}
                        size="sm"
                        onInspect={onInspectCard}
                        onClick={() => setViewingGraveyardPlayer(1)}
                      />
                      <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors pointer-events-none" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-purple-400/50 p-1 text-center select-none">
                      <span className="text-xl sm:text-2xl">🪦</span>
                      <span className="text-[8px] sm:text-[10px] font-mono font-bold leading-tight">Graveyard</span>
                      <span className="text-[8px] font-mono text-slate-600">Empty (0)</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Player 1 Hand (Fanned Out with Hearthstone Arc & Green Playable Aura) */}
          {isMobileHandExpanded && (
            <div className="hand-container p1-hand flex justify-center items-center gap-[-14px] min-h-[105px] sm:min-h-[135px] py-1">
              {gameState.players[0].hand.map((card, idx) => {
                const isSelected = selectedHandCardId === card.instanceId && isPlayer1Turn;
                const total = gameState.players[0].hand.length;
                const mid = (total - 1) / 2;
                const fanAngle = total > 1 ? (idx - mid) * 3 : 0;
                const fanY = total > 1 ? Math.abs(idx - mid) * 2 : 0;

                // Hearthstone Playable Green Glow: card cost <= mana and friendly turn
                const isCardPlayable = !hideP1Hand && isPlayer1Turn && card.cost <= p1Mana;

                return (
                  <div
                    key={card.instanceId || `p1_card_${idx}`}
                    style={{
                      transform: isSelected
                        ? 'translateY(-24px) scale(1.15) rotate(0deg)'
                        : `translateY(${fanY}px) rotate(${fanAngle}deg)`,
                      transition: 'all 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                    className={`-mx-2 sm:-mx-2.5 z-20 hover:z-40 ${
                      isSelected ? 'z-40 ring-2 ring-amber-400 rounded-xl' : ''
                    }`}
                  >
                    <Card
                      card={card}
                      isFaceDown={hideP1Hand}
                      size={isPlayer1Turn ? 'md' : 'sm'}
                      isPlayable={isCardPlayable}
                      draggable={isPlayer1Turn && !hideP1Hand}
                      equippedCardBack={equippedCosmetics?.cardBack}
                      equippedFoilStyle={equippedCosmetics?.foilStyle}
                      onDragStart={() => {
                        if (isPlayer1Turn && !hideP1Hand) {
                          setDraggedCardId(card.instanceId);
                          setSelectedHandCardId(card.instanceId);
                        }
                      }}
                      onInspect={onInspectCard}
                      onClick={() => {
                        if (!hideP1Hand) handleCardClick(card, 1);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Player 1 Mat Row (Hearthstone Hero Portrait, Mana Tray, Wards) */}
          <div className="mat-row flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap pt-1">
            {/* Hearthstone Oval Hero Portrait Frame (P1) */}
            <div
              className={`champion-portrait-wrap flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-slate-900 to-slate-950 border-2 rounded-2xl p-1.5 sm:p-2 shadow-xl cursor-pointer transition-all ${
                selectedAttackerId && !isPlayer1Turn && p1Taunters.length === 0
                  ? 'border-red-500 ring-4 ring-red-500/60 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                  : isPlayer1Turn
                  ? 'border-amber-400/80 shadow-[0_0_18px_rgba(245,158,11,0.4)]'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
              onClick={() => handleChampionClick(1)}
              title={selectedAttackerId && !isPlayer1Turn ? 'Click to declare DIRECT ATTACK on enemy Champion!' : 'Champion Command Zone'}
            >
              {/* Hearthstone Oval Hero Token */}
              <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden border-2 border-amber-400 shadow-md flex-shrink-0 bg-slate-950">
                <Image
                  src={p1Champ.avatar}
                  alt={p1Champ.name}
                  fill
                  sizes="52px"
                  priority
                  className="object-cover"
                />
                {/* Hearthstone Blood-Red Health Badge */}
                <div className="absolute bottom-0 right-0 bg-gradient-to-br from-red-600 to-rose-700 text-white font-mono font-black text-[10px] sm:text-xs px-1.5 rounded-tl-md border-t border-l border-red-300 drop-shadow flex items-center justify-center">
                  {p1Champ.hp}
                </div>
              </div>

              {/* Name & Supporter Badge */}
              <div className="flex flex-col min-w-0 pr-1">
                <div className="flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[90px] sm:max-w-[130px]">
                    {gameState.players[0].name}
                  </span>
                  {totalSpentUSD > 0 && (
                    <span
                      className={`text-[8px] font-mono font-black px-1 rounded border ${getSupporterTier(totalSpentUSD).borderColor} ${getSupporterTier(totalSpentUSD).color} bg-slate-950`}
                      title={getSupporterTier(totalSpentUSD).name}
                    >
                      {getSupporterTier(totalSpentUSD).badge.split(' ')[0]}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-amber-300 font-mono truncate max-w-[90px] sm:max-w-[130px]">
                  {p1Champ.name}
                </span>
              </div>

              {/* Commander Power Medallion (P1) */}
              <button
                type="button"
                disabled={
                  p1Champ.heroPowerUsed ||
                  p1Mana < p1Champ.heroPower.cost ||
                  !isPlayer1Turn ||
                  !isMyTurn ||
                  (localPlayerNumber ? localPlayerNumber !== 1 : false)
                }
                onClick={() => {
                  if (isPlayer1Turn && isMyTurn && (localPlayerNumber ? localPlayerNumber === 1 : true)) {
                    dispatchAction({ type: 'activateHeroPower' });
                  }
                }}
                className={`commander-power-medallion w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 flex flex-col items-center justify-center relative transition-all ${
                  !p1Champ.heroPowerUsed &&
                  p1Mana >= p1Champ.heroPower.cost &&
                  isPlayer1Turn &&
                  isMyTurn &&
                  (localPlayerNumber ? localPlayerNumber === 1 : true)
                    ? 'bg-gradient-to-br from-indigo-900 to-blue-900 border-amber-400 text-sky-200 hover:scale-110 shadow-[0_0_15px_rgba(251,191,36,0.7)] cursor-pointer'
                    : 'bg-slate-950 border-slate-800 text-slate-600 opacity-60 cursor-not-allowed'
                }`}
                title={`Commander Power (2 Mana): ${p1Champ.heroPower.name} - ${p1Champ.heroPower.desc}`}
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold border border-blue-300 shadow">
                  2
                </span>
              </button>
            </div>

            {/* Secret Wards (P1) */}
            <div className="secret-wards-row flex items-center gap-1.5">
              {gameState.players[0].wards.map((ward, idx) => (
                <div
                  key={`p1_ward_${idx}`}
                  className={`ward-slot-chip w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center text-xs transition-all ${
                    ward
                      ? 'border-purple-500 bg-purple-950/80 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.6)] animate-pulse'
                      : 'border-dashed border-slate-800 bg-slate-950/40 text-slate-700'
                  }`}
                  title={ward ? `${ward.name}: ${ward.desc}` : 'Empty Ward Slot'}
                >
                  <ShieldAlert className={`w-3.5 h-3.5 ${ward ? 'text-purple-400' : 'text-slate-700'}`} />
                </div>
              ))}
            </div>

            {/* Hearthstone Chunky Mana Tray & Piles (P1) */}
            <div className="flex items-center gap-2">
              <div className="mana-tray-hearthstone flex items-center gap-1.5 bg-slate-950/90 border border-sky-500/40 px-2.5 py-1 rounded-xl shadow-inner">
                <span className="font-mono text-xs font-black text-sky-400 flex items-center gap-0.5">
                  💎 {p1Mana}/{p1MaxMana}
                </span>
                <div className="hidden sm:flex gap-1">
                  {Array.from({ length: p1MaxMana }).map((_, i) => (
                    <div
                      key={`p1_gem_${i}`}
                      className={`w-2 h-3 rounded-xs border ${
                        i < p1Mana
                          ? 'bg-gradient-to-b from-cyan-300 to-blue-600 border-cyan-200 shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                          : 'bg-slate-800/60 border-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Piles */}
              <div className="flex gap-1.5 text-[9px] font-mono">
                <div className="w-8 h-11 sm:w-9 sm:h-13 rounded bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400">
                  <span className="text-[8px]">DECK</span>
                  <span className="font-bold text-white text-[10px]">{gameState.players[0].deck.length}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingGraveyardPlayer(1)}
                  className="w-8 h-11 sm:w-9 sm:h-13 rounded bg-slate-900 border border-purple-900/60 hover:border-purple-400 flex flex-col items-center justify-center text-purple-300 transition-colors cursor-pointer shadow"
                  title="View Player 1 Graveyard"
                >
                  <span className="text-[8px] flex items-center gap-0.5">🪦 GRAVE</span>
                  <span className="font-bold text-white text-[10px]">{gameState.players[0].graveyard.length}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Action Combat Log (Collapsible on mobile) */}
        <div className="hidden md:flex battle-log-pane absolute top-3 left-3 w-60 max-h-40 bg-slate-950/85 border border-slate-800/80 rounded-xl p-2 overflow-y-auto font-mono text-[10px] flex-col gap-1 backdrop-blur-md shadow-2xl z-20 pointer-events-auto">
          {gameState.actionLogs.slice(0, 10).map(log => (
            <div
              key={log.id}
              className={`log-entry px-1.5 py-0.5 rounded leading-tight ${
                log.type === 'log-attack'
                  ? 'text-rose-300 bg-rose-950/40 border-l-2 border-rose-500'
                  : log.type === 'log-ascend'
                  ? 'text-amber-300 bg-amber-950/40 border-l-2 border-amber-400'
                  : log.type === 'log-trap'
                  ? 'text-purple-300 bg-purple-950/40 border-l-2 border-purple-500'
                  : log.type === 'log-turn'
                  ? 'text-sky-300 bg-sky-950/40 border-l-2 border-sky-400 font-bold'
                  : 'text-slate-400 bg-slate-900/30'
              }`}
            >
              <span className="log-time text-slate-600 mr-1">[{log.time}]</span>
              {log.text}
            </div>
          ))}
        </div>
      </div>

      {/* Graveyard Inspector Modal */}
      {viewingGraveyardPlayer !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-purple-500/50 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between bg-slate-950 px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-purple-300 font-bold font-serif text-lg">
                <span>🪦</span>
                <span>{gameState.players[viewingGraveyardPlayer - 1].name}&apos;s Graveyard</span>
                <span className="text-xs font-mono bg-purple-950 border border-purple-600/40 text-purple-300 px-2.5 py-0.5 rounded-full">
                  {gameState.players[viewingGraveyardPlayer - 1].graveyard.length} Cards Destroyed
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingGraveyardPlayer(null)}
                className="text-slate-400 hover:text-white text-xl font-bold font-mono px-3 py-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-wrap justify-center gap-4">
              {gameState.players[viewingGraveyardPlayer - 1].graveyard.length === 0 ? (
                <div className="text-slate-500 font-mono text-sm py-12 text-center">
                  No cards have been destroyed or sent to the Graveyard yet.
                </div>
              ) : (
                gameState.players[viewingGraveyardPlayer - 1].graveyard.map((card, idx) => (
                  <div key={`grave_card_${idx}_${card.instanceId}`} className="hover:scale-105 transition-transform cursor-pointer">
                    <Card
                      card={card}
                      size="sm"
                      onInspect={onInspectCard}
                      onClick={() => onInspectCard(card)}
                    />
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingGraveyardPlayer(null)}
                className="btn btn-outline border-purple-500/50 text-purple-300 hover:bg-purple-950 px-5 py-1.5 text-xs font-mono"
              >
                Close Graveyard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
