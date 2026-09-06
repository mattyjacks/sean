'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header, MainNavTab } from '@/components/tcg/Header';
import { BattleArena } from '@/components/tcg/BattleArena';
import { DeckBuilder } from '@/components/tcg/DeckBuilder';
import { CardAlmanac } from '@/components/tcg/CardAlmanac';
import { RulesCodex } from '@/components/tcg/RulesCodex';
import { ArcadeHub } from '@/components/arcade/ArcadeHub';
import { CardOutfitterStudio } from '@/components/tcg/CardOutfitterStudio';
import { CardInspectorModal } from '@/components/tcg/CardInspectorModal';
import { GameOverModal } from '@/components/tcg/GameOverModal';
import { AmbientBackground } from '@/components/tcg/AmbientBackground';
import { CosmeticsShopModal } from '@/components/tcg/CosmeticsShopModal';
import { PlayerProfileModal } from '@/components/tcg/PlayerProfileModal';
import { PackOpenerModal } from '@/components/tcg/PackOpenerModal';
import { TradeModal } from '@/components/tcg/TradeModal';

import { GameState, CardDef, CardInstance, GameAction } from '@/lib/tcg/types';
import { dispatchGameAction } from '@/lib/tcg/gameEngine';
import { PRESET_DECKS } from '@/lib/tcg/presetDecks';
import { GAME_TITLES } from '@/lib/tcg/titlesData';
import { soundEngine } from '@/lib/tcg/soundEngine';
import {
  PlayerCollection,
  getInitialCollection,
  loadPlayerCollection,
  openBoosterPack,
  addVictoryPackReward
} from '@/lib/tcg/collectionEngine';
import {
  Sparkles,
  ShieldCheck,
  Bot,
  Copy,
  Check,
  Users,
  Globe,
  Radio,
  Swords,
  ArrowRight,
  Zap
} from 'lucide-react';

export default function QuickplayPage() {
  const [activeTab, setActiveTab] = useState<MainNavTab>('battle');
  const [gameTitle, setGameTitle] = useState<string>(GAME_TITLES[0]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [inspectedCard, setInspectedCard] = useState<CardDef | CardInstance | null>(null);

  const [collection, setCollection] = useState<PlayerCollection>(() =>
    getInitialCollection('player_1')
  );

  useEffect(() => {
    setCollection(loadPlayerCollection('player_1'));
  }, []);

  const [isPackModalOpen, setIsPackModalOpen] = useState<boolean>(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState<boolean>(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // User & Deck configuration
  const [anonUserId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      let saved = localStorage.getItem('tcg_anon_user_id');
      if (!saved) {
        saved = `duellist_${Math.floor(1000 + Math.random() * 9000)}`;
        localStorage.setItem('tcg_anon_user_id', saved);
      }
      return saved;
    }
    return 'duellist_7777';
  });

  const [playerName, setPlayerName] = useState<string>('Duellist');
  const [selectedDeckKey, setSelectedDeckKey] = useState<string>('solar_pyre');
  const [customP1Deck, setCustomP1Deck] = useState<string[] | undefined>(undefined);

  // Online Room State
  const [roomView, setRoomView] = useState<'lobby' | 'in_game' | 'waiting_host'>('lobby');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerNumber, setPlayerNumber] = useState<1 | 2>(1);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Check URL query on mount for direct room invite links (e.g. ?room=XYZ)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom) {
        setJoinCodeInput(urlRoom.toUpperCase());
      }
    }
  }, []);

  // 1. MATCHMAKING QUEUE (AUTO)
  const handleQuickMatch = async (forceAi: boolean = false) => {
    setStatusMessage(forceAi ? 'Initializing AI Duel...' : 'Searching for available duellist...');
    try {
      const res = await fetch('/api/quickplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join_queue',
          userId: anonUserId,
          playerName,
          deckKey: selectedDeckKey,
          customCards: selectedDeckKey === 'custom' ? customP1Deck : undefined,
          forceAi
        })
      });

      const data = await res.json();
      if (data.success && data.gameState) {
        setRoomId(data.roomId);
        setRoomCode(data.roomCode || data.roomId);
        setPlayerNumber(data.playerNumber);
        setGameState(data.gameState);
        soundEngine.playTurnChime();

        if (data.isP2AI) {
          setStatusMessage('Matched with AI Tactician!');
        } else {
          setStatusMessage('Duellist connected!');
        }
        setRoomView('in_game');
      } else {
        setStatusMessage(data.message || 'Matchmaking failed. Retrying with AI...');
        setTimeout(() => handleQuickMatch(true), 1200);
      }
    } catch (err) {
      console.error('Matchmaking error:', err);
      setStatusMessage('Network error. Falling back to AI duel...');
      setTimeout(() => handleQuickMatch(true), 1200);
    }
  };

  // 2. CREATE PRIVATE ROOM
  const handleCreatePrivateRoom = async () => {
    setStatusMessage('Creating private duel chamber...');
    try {
      const res = await fetch('/api/quickplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_private_room',
          userId: anonUserId,
          playerName,
          deckKey: selectedDeckKey,
          customCards: selectedDeckKey === 'custom' ? customP1Deck : undefined
        })
      });

      const data = await res.json();
      if (data.success && data.gameState) {
        setRoomId(data.roomId);
        setRoomCode(data.roomCode);
        setPlayerNumber(1);
        setGameState(data.gameState);
        soundEngine.playTurnChime();
        setRoomView('waiting_host');
        setStatusMessage(`Room ${data.roomCode} created! Waiting for opponent to join...`);
      } else {
        setStatusMessage(data.message || 'Failed to create room.');
      }
    } catch (err) {
      console.error('Create room error:', err);
      setStatusMessage('Network error creating room.');
    }
  };

  // 3. JOIN PRIVATE ROOM BY CODE
  const handleJoinByCode = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      setStatusMessage('Please enter a valid room code.');
      return;
    }

    setStatusMessage(`Connecting to room ${code}...`);
    try {
      const res = await fetch('/api/quickplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join_by_code',
          roomCode: code,
          userId: anonUserId,
          playerName,
          deckKey: selectedDeckKey,
          customCards: selectedDeckKey === 'custom' ? customP1Deck : undefined
        })
      });

      const data = await res.json();
      if (data.success && data.gameState) {
        setRoomId(data.roomId);
        setRoomCode(data.roomCode);
        setPlayerNumber(data.playerNumber);
        setGameState(data.gameState);
        soundEngine.playTurnChime();
        setRoomView('in_game');
        setStatusMessage(`Joined Room ${data.roomCode}!`);
      } else {
        setStatusMessage(data.message || 'Could not join room.');
      }
    } catch (err) {
      console.error('Join room error:', err);
      setStatusMessage('Network error joining room.');
    }
  };

  // Copy Invite Link Helper
  const handleCopyInviteLink = () => {
    if (!roomCode || typeof window === 'undefined') return;
    const url = `${window.location.origin}/battle/quickplay?room=${roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      soundEngine.playHover();
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Turn Change Sound Tracker
  const prevTurnRef = useRef<number | null>(null);
  useEffect(() => {
    if (!gameState) return;
    if (prevTurnRef.current !== null && prevTurnRef.current !== gameState.currentTurn) {
      if (gameState.currentTurn === playerNumber) {
        soundEngine.playTurnChime();
      }
    }
    prevTurnRef.current = gameState.currentTurn;
  }, [gameState, playerNumber]);

  // Polling Server State Loop (1000ms) with anti-cheat protection
  useEffect(() => {
    if (!roomId || roomView === 'lobby') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/quickplay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'poll_state',
            roomId,
            playerNumber
          })
        });

        const data = await res.json();
        if (data.success && data.gameState) {
          setGameState(data.gameState);

          // If host was waiting and opponent has connected, move into game
          if (roomView === 'waiting_host' && data.isOpponentConnected) {
            setRoomView('in_game');
            soundEngine.playTurnChime();
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [roomId, playerNumber, roomView]);

  // REAL ACTION DISPATCHER: Optimistic local update + authoritative server dispatch
  const handleDispatchAction = async (action: GameAction) => {
    if (!roomId || !gameState) return;

    // 1. Optimistic local state update
    setGameState(current => (current ? dispatchGameAction(current, action) : current));

    // 2. Dispatch to server
    try {
      const res = await fetch('/api/quickplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch_action',
          roomId,
          playerNumber,
          gameAction: action
        })
      });

      const data = await res.json();
      if (data.success && data.gameState) {
        setGameState(data.gameState);
      }
    } catch (err) {
      console.error('Dispatch action error:', err);
    }
  };

  // Victory Reward Listener
  const rewardedRef = useRef<boolean>(false);
  useEffect(() => {
    if (gameState?.winner === playerNumber && !rewardedRef.current) {
      rewardedRef.current = true;
      soundEngine.playVictory();
      setCollection(current => addVictoryPackReward(current));
    } else if (gameState?.winner === null) {
      rewardedRef.current = false;
    }
  }, [gameState?.winner, playerNumber]);

  return (
    <div id="app" className="relative flex flex-col min-h-screen w-full bg-[#080911] text-slate-100 overflow-x-hidden">
      {/* Ambient Cosmic Background */}
      <AmbientBackground />

      {/* Top Header Navigation & Utilities */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gameTitle={gameTitle}
        setGameTitle={setGameTitle}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        unopenedPacks={collection.unopenedPacks}
        gemBalance={collection.gemBalance}
        totalSpentUSD={collection.totalSpentUSD}
        onOpenPackModal={() => setIsPackModalOpen(true)}
        onOpenTradeModal={() => setIsTradeModalOpen(true)}
        onOpenShopModal={() => setIsShopModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 flex flex-col w-full relative z-10 py-2">
        {/* =========================================================================
            ONLINE LOBBY SELECTION VIEW
            ========================================================================= */}
        {activeTab === 'battle' && roomView === 'lobby' && (
          <div className="online-lobby flex flex-col flex-1 w-full max-w-[1100px] mx-auto p-4 md:p-8 gap-8 animate-in fade-in duration-500">
            {/* Banner */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-sky-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(56,189,248,0.15)] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sky-400 font-mono text-xs uppercase font-bold tracking-wider">
                <Globe className="w-4 h-4" />
                <span>Online Tactical Arena</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black font-serif text-white">
                Online Multiplayer & Matchmaking
              </h1>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl font-sans">
                Duel players across the world in real-time. Choose your deck archetype, jump into matchmaking, or create a private room code to challenge a friend.
              </p>
            </div>

            {/* Deck & Player Setup Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6 backdrop-blur-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-mono font-bold text-amber-400 uppercase tracking-widest mb-1.5">
                    Your Duellist Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    maxLength={20}
                    className="w-full bg-slate-950/90 border border-slate-700 focus:border-sky-400 rounded-xl px-4 py-2.5 font-bold text-white text-base outline-none transition-colors font-serif"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-sky-400 uppercase tracking-widest mb-1.5">
                    Selected Deck Archetype
                  </label>
                  <select
                    value={selectedDeckKey}
                    onChange={e => setSelectedDeckKey(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-700 focus:border-sky-400 rounded-xl px-4 py-2.5 font-bold text-white text-sm outline-none transition-colors font-mono"
                  >
                    {Object.keys(PRESET_DECKS).map(key => (
                      <option key={key} value={key}>
                        {PRESET_DECKS[key].name} ({PRESET_DECKS[key].element.toUpperCase()})
                      </option>
                    ))}
                    {customP1Deck && customP1Deck.length >= 10 && (
                      <option value="custom">Custom Built Deck ({customP1Deck.length} Cards)</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Status Banner */}
              {statusMessage && (
                <div className="bg-sky-950/60 border border-sky-500/40 p-3 rounded-xl font-mono text-xs text-sky-300 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-sky-400 animate-pulse flex-shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>

            {/* Match Option Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Option 1: Quick Match */}
              <div className="bg-slate-900/80 border border-amber-500/40 hover:border-amber-400 rounded-2xl p-6 flex flex-col justify-between gap-4 backdrop-blur-md transition-all shadow-lg hover:scale-102">
                <div className="flex flex-col gap-2">
                  <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-black text-xl text-white">Quick Match</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Instantly queue for an online match against an available player, with automatic AI fallback.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickMatch(false)}
                  className="btn bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-mono text-sm font-black py-3 rounded-xl flex items-center justify-center gap-2 hover:from-amber-400 hover:to-yellow-400 transition-all shadow-md"
                >
                  <Swords className="w-4 h-4" />
                  <span>Find Match</span>
                </button>
              </div>

              {/* Option 2: Create Private Room */}
              <div className="bg-slate-900/80 border border-sky-500/40 hover:border-sky-400 rounded-2xl p-6 flex flex-col justify-between gap-4 backdrop-blur-md transition-all shadow-lg hover:scale-102">
                <div className="flex flex-col gap-2">
                  <div className="w-12 h-12 rounded-xl bg-sky-950/80 border border-sky-500/60 flex items-center justify-center text-sky-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-black text-xl text-white">Create Private Room</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Generate a unique 6-character room code and copyable invite link to challenge a friend.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreatePrivateRoom}
                  className="btn bg-sky-600 hover:bg-sky-500 text-white font-mono text-sm font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Create Room</span>
                </button>
              </div>

              {/* Option 3: Join by Room Code */}
              <div className="bg-slate-900/80 border border-purple-500/40 hover:border-purple-400 rounded-2xl p-6 flex flex-col justify-between gap-4 backdrop-blur-md transition-all shadow-lg hover:scale-102">
                <div className="flex flex-col gap-2">
                  <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/60 flex items-center justify-center text-purple-400">
                    <Radio className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-black text-xl text-white">Join by Code</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Have a code from a friend? Enter it below to join their room chamber.
                  </p>
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. NEXUS7"
                    maxLength={10}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-purple-400 rounded-xl px-3 py-2 font-mono text-sm font-bold text-center uppercase tracking-widest text-purple-200 outline-none mt-1"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleJoinByCode}
                  className="btn bg-purple-600 hover:bg-purple-500 text-white font-mono text-sm font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Join Room</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            WAITING HOST LOBBY VIEW
            ========================================================================= */}
        {activeTab === 'battle' && roomView === 'waiting_host' && (
          <div className="waiting-host-screen flex flex-col items-center justify-center flex-1 max-w-lg mx-auto p-6 text-center gap-6 animate-in fade-in duration-500">
            <div className="bg-slate-900/90 border-2 border-sky-500/50 rounded-3xl p-8 flex flex-col items-center gap-6 shadow-[0_0_60px_rgba(56,189,248,0.25)] backdrop-blur-2xl w-full">
              <div className="w-16 h-16 rounded-full bg-sky-950 border-2 border-sky-400 flex items-center justify-center text-sky-400 animate-spin">
                <Radio className="w-8 h-8" />
              </div>

              <div className="flex flex-col gap-1">
                <h2 className="font-serif text-2xl font-black text-white">Private Duel Room Created</h2>
                <span className="font-mono text-xs text-sky-300">Waiting for your opponent to connect...</span>
              </div>

              {/* Room Code Badge */}
              <div className="flex flex-col items-center gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 w-full">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-bold">Room Code</span>
                <span className="text-3xl font-mono font-black text-amber-300 tracking-wider">
                  {roomCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="btn bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold px-4 py-2 rounded-xl flex items-center gap-2 mt-1"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Direct Invite Link'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center gap-2 text-left">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Anti-Cheat active: Private card data is sanitized by the server.</span>
              </div>

              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => handleQuickMatch(true)}
                  className="btn bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Bot className="w-4 h-4 text-amber-400" />
                  <span>Duel AI Instead</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoomView('lobby')}
                  className="btn bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono py-2.5 px-4 rounded-xl hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ACTIVE IN-GAME DUEL
            ========================================================================= */}
        {activeTab === 'battle' && roomView === 'in_game' && gameState && (
          <BattleArena
            gameState={gameState}
            setGameState={updater => {
              setGameState(prev => {
                if (!prev) return prev;
                return typeof updater === 'function' ? updater(prev) : updater;
              });
            }}
            onAction={handleDispatchAction}
            onInspectCard={card => setInspectedCard(card)}
            onNewDuel={() => setRoomView('lobby')}
            onChangeDecks={() => setRoomView('lobby')}
            equippedCosmetics={collection.equippedCosmetics}
            totalSpentUSD={collection.totalSpentUSD}
            localPlayerNumber={playerNumber}
            roomCode={roomCode || undefined}
          />
        )}

        {activeTab === 'deckbuilder' && (
          <DeckBuilder
            onInspectCard={card => setInspectedCard(card)}
            onSaveP1Deck={cards => {
              setCustomP1Deck(cards);
              setSelectedDeckKey('custom');
            }}
            onSaveP2Deck={() => {}}
            onTestBattle={cards => {
              setCustomP1Deck(cards);
              setSelectedDeckKey('custom');
              handleQuickMatch(true);
            }}
          />
        )}

        {activeTab === 'almanac' && (
          <CardAlmanac onInspectCard={card => setInspectedCard(card)} />
        )}

        {activeTab === 'lore' && <RulesCodex />}

        {activeTab === 'arcade' && (
          <ArcadeHub
            onLaunchGame={gameId => {
              if (gameId === 'tcg_turbo') {
                setActiveTab('battle');
              }
            }}
          />
        )}

        {activeTab === 'outfitter' && (
          <CardOutfitterStudio
            onInspectCard={card => setInspectedCard(card)}
          />
        )}
      </main>

      {/* Card Inspector Modal */}
      <CardInspectorModal
        card={inspectedCard}
        onClose={() => setInspectedCard(null)}
      />

      {/* Booster Pack Opener Modal */}
      <PackOpenerModal
        isOpen={isPackModalOpen}
        unopenedPacks={collection.unopenedPacks}
        onOpenPack={() => {
          const { updatedCollection, unlockedCards } = openBoosterPack(collection);
          setCollection(updatedCollection);
          return unlockedCards;
        }}
        onClose={() => setIsPackModalOpen(false)}
      />

      {/* Free Card Gifting & Trading Modal */}
      <TradeModal
        isOpen={isTradeModalOpen}
        collection={collection}
        onUpdateCollection={updated => setCollection(updated)}
        onClose={() => setIsTradeModalOpen(false)}
      />

      {/* Real-Money Cosmetics Shop Modal */}
      <CosmeticsShopModal
        isOpen={isShopModalOpen}
        collection={collection}
        onUpdateCollection={updated => setCollection(updated)}
        onClose={() => setIsShopModalOpen(false)}
      />

      {/* Player Profile Modal */}
      <PlayerProfileModal
        isOpen={isProfileModalOpen}
        collection={collection}
        onOpenShop={() => setIsShopModalOpen(true)}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* GameOver Modal */}
      {gameState && (
        <GameOverModal
          gameState={gameState}
          onRematch={() => setRoomView('lobby')}
          onDeckBuilder={() => {
            setGameState(s => (s ? { ...s, winner: null } : null));
            setActiveTab('deckbuilder');
          }}
        />
      )}
    </div>
  );
}
