'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PRESET_DECKS } from '@/lib/tcg/presetDecks';
import { CHAMPIONS_DATA, VANGUARDS_DATA } from '@/lib/tcg/vanguardsData';
import { CARDS_DATA } from '@/lib/tcg/cardsData';
import { soundEngine } from '@/lib/tcg/soundEngine';
import {
  Swords,
  Lock,
  Unlock,
  Sparkles,
  ArrowLeft,
  Crown,
  Bot,
  Users
} from 'lucide-react';

interface DeckSelectLobbyProps {
  onStartGame: (config: {
    p1DeckKey: string;
    p2DeckKey: string;
    p1Name: string;
    p2Name: string;
    privacyCurtain: boolean;
    customP1Cards?: string[];
    customP2Cards?: string[];
    isP2AI?: boolean;
  }) => void;
  onBackToMenu?: () => void;
  savedCustomP1Deck?: string[];
  savedCustomP2Deck?: string[];
}

export function DeckSelectLobby({
  onStartGame,
  onBackToMenu,
  savedCustomP1Deck,
  savedCustomP2Deck
}: DeckSelectLobbyProps) {
  const [isP2AI, setIsP2AI] = useState<boolean>(true);
  const [p1Name, setP1Name] = useState<string>('Player 1');
  const [p2Name, setP2Name] = useState<string>('AI Tactician');
  const [p1DeckKey, setP1DeckKey] = useState<string>('solar_pyre');
  const [p2DeckKey, setP2DeckKey] = useState<string>('void_shadow');
  const [privacyCurtain, setPrivacyCurtain] = useState<boolean>(false);

  // Preset deck options
  const deckKeys = Object.keys(PRESET_DECKS);

  const getDeckInfo = (deckKey: string, customCards?: string[]) => {
    if (deckKey === 'custom' && customCards && customCards.length > 0) {
      const defaultChamp = CHAMPIONS_DATA[0];
      return {
        name: 'Custom Built Deck',
        champion: defaultChamp,
        vanguard: defaultChamp,
        element: 'solar',
        description: 'Your tailored deck designed in the Deck Builder.',
        cards: customCards
      };
    }
    const preset = PRESET_DECKS[deckKey] || PRESET_DECKS.solar_pyre;
    const champId = preset.champion || preset.vanguard;
    const champion = CHAMPIONS_DATA.find(v => v.id === champId) || VANGUARDS_DATA.find(v => v.id === champId) || CHAMPIONS_DATA[0];
    return {
      name: preset.name,
      champion,
      vanguard: champion,
      element: preset.element,
      description: preset.description,
      cards: preset.cards
    };
  };

  const p1Deck = getDeckInfo(p1DeckKey, savedCustomP1Deck);
  const p2Deck = getDeckInfo(p2DeckKey, savedCustomP2Deck);

  const handleLaunch = () => {
    soundEngine.playTurnChime();
    onStartGame({
      p1DeckKey,
      p2DeckKey,
      p1Name: p1Name.trim() || 'Player 1',
      p2Name: p2Name.trim() || (isP2AI ? 'AI Tactician' : 'Player 2'),
      privacyCurtain: isP2AI ? false : privacyCurtain,
      customP1Cards: p1DeckKey === 'custom' ? savedCustomP1Deck : undefined,
      customP2Cards: p2DeckKey === 'custom' ? savedCustomP2Deck : undefined,
      isP2AI
    });
  };

  return (
    <div className="deck-select-lobby flex flex-col flex-1 w-full max-w-[1440px] mx-auto p-4 md:p-8 gap-8 animate-in fade-in duration-500 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          {onBackToMenu && (
            <button
              type="button"
              onClick={onBackToMenu}
              className="btn bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl transition-all"
              title="Return to Main Menu"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-amber-400 font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Combat Chamber Configuration</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-serif text-white">
              Choose Your Champions & Combat Decks
            </h1>
          </div>
        </div>

        {/* Game Mode & Privacy Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Selector */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                soundEngine.playHover();
                setIsP2AI(true);
                setP2Name('AI Tactician');
                setPrivacyCurtain(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                isP2AI
                  ? 'bg-sky-600 text-white shadow-[0_0_10px_rgba(2,132,199,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Solo vs AI</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playHover();
                setIsP2AI(false);
                setP2Name('Player 2');
                setPrivacyCurtain(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                !isP2AI
                  ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pass & Play 2P</span>
            </button>
          </div>

          {/* Privacy Curtain Toggle (only relevant in Pass & Play 2P) */}
          {!isP2AI && (
            <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playHover();
                  setPrivacyCurtain(!privacyCurtain);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  privacyCurtain
                    ? 'bg-purple-900/70 border border-purple-500/60 text-purple-200'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {privacyCurtain ? <Lock className="w-3.5 h-3.5 text-purple-400" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>Privacy Shield: {privacyCurtain ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Duel Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* =========================================================================
            PLAYER 1 CARD (LEFT)
            ========================================================================= */}
        <div className="player-deck-card flex flex-col bg-slate-900/70 border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 gap-6 backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

          {/* Player Name Input */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest mb-1">
                Player 1 Identity
              </label>
              <input
                type="text"
                value={p1Name}
                onChange={e => setP1Name(e.target.value)}
                maxLength={20}
                className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-amber-400 rounded-xl px-3.5 py-2 font-serif text-lg font-bold text-white outline-none transition-colors"
                placeholder="Player 1"
              />
            </div>
            <div className="bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-amber-300">
              Turn 1 Initiator
            </div>
          </div>

          {/* Deck Selection Tabs */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Combat Archetype
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {deckKeys.map(key => {
                const isSelected = p1DeckKey === key;
                const preset = PRESET_DECKS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      soundEngine.playHover();
                      setP1DeckKey(key);
                    }}
                    className={`text-left p-2.5 rounded-xl border text-xs font-mono transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold font-sans text-white truncate">{preset.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{preset.element}</span>
                  </button>
                );
              })}

              {savedCustomP1Deck && savedCustomP1Deck.length >= 10 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playHover();
                    setP1DeckKey('custom');
                  }}
                  className={`text-left p-2.5 rounded-xl border text-xs font-mono transition-all flex flex-col gap-1 ${
                    p1DeckKey === 'custom'
                      ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'bg-slate-950/60 border-slate-800 text-purple-300 hover:border-purple-700'
                  }`}
                >
                  <span className="font-bold font-sans text-purple-200">Custom Deck</span>
                  <span className="text-[10px] text-purple-400">Builder Spec</span>
                </button>
              )}
            </div>
          </div>

          {/* Champion Commander Showcase */}
          <div className="bg-slate-950/80 border border-amber-500/40 rounded-2xl p-4 flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md flex-shrink-0">
              <Image
                src={p1Deck.champion.avatar}
                alt={p1Deck.champion.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col flex-1 min-w-0 gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="font-serif font-black text-base text-white truncate">
                    {p1Deck.champion.name}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400 flex-shrink-0">
                  {p1Deck.champion.hp} HP
                </span>
              </div>
              <p className="text-xs text-slate-400 italic truncate">{p1Deck.champion.title}</p>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-300 font-bold">⚡ {p1Deck.champion.heroPower.name} (2 Mana):</span>
                <span className="text-slate-400 text-[10px] ml-2 truncate">
                  {p1Deck.champion.heroPower.desc}
                </span>
              </div>
            </div>
          </div>

          {/* Deck Breakdown & Description */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{p1Deck.description}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {p1Deck.cards.slice(0, 7).map((cardId, i) => {
                const card = CARDS_DATA.find(c => c.id === cardId);
                return (
                  <span
                    key={`${cardId}_${i}`}
                    className="bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono"
                  >
                    {card ? card.name : cardId}
                  </span>
                );
              })}
              {p1Deck.cards.length > 7 && (
                <span className="text-slate-500 text-[11px] font-mono self-center">
                  +{p1Deck.cards.length - 7} more cards
                </span>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            PLAYER 2 CARD (RIGHT)
            ========================================================================= */}
        <div className="player-deck-card flex flex-col bg-slate-900/70 border-2 border-sky-500/40 rounded-3xl p-6 md:p-8 gap-6 backdrop-blur-xl shadow-[0_0_50px_rgba(56,189,248,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-400 to-purple-600" />

          {/* Player Name Input */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-[11px] font-mono font-bold text-sky-400 uppercase tracking-widest mb-1">
                Player 2 Identity
              </label>
              <input
                type="text"
                value={p2Name}
                onChange={e => setP2Name(e.target.value)}
                maxLength={20}
                className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-sky-400 rounded-xl px-3.5 py-2 font-serif text-lg font-bold text-white outline-none transition-colors"
                placeholder="Player 2"
              />
            </div>
            <div className="bg-sky-950/60 border border-sky-500/40 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-sky-300">
              Turn 2 Challenger
            </div>
          </div>

          {/* Deck Selection Tabs */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Combat Archetype
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {deckKeys.map(key => {
                const isSelected = p2DeckKey === key;
                const preset = PRESET_DECKS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      soundEngine.playHover();
                      setP2DeckKey(key);
                    }}
                    className={`text-left p-2.5 rounded-xl border text-xs font-mono transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold font-sans text-white truncate">{preset.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{preset.element}</span>
                  </button>
                );
              })}

              {savedCustomP2Deck && savedCustomP2Deck.length >= 10 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playHover();
                    setP2DeckKey('custom');
                  }}
                  className={`text-left p-2.5 rounded-xl border text-xs font-mono transition-all flex flex-col gap-1 ${
                    p2DeckKey === 'custom'
                      ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'bg-slate-950/60 border-slate-800 text-purple-300 hover:border-purple-700'
                  }`}
                >
                  <span className="font-bold font-sans text-purple-200">Custom Deck</span>
                  <span className="text-[10px] text-purple-400">Builder Spec</span>
                </button>
              )}
            </div>
          </div>

          {/* Champion Commander Showcase */}
          <div className="bg-slate-950/80 border border-purple-500/40 rounded-2xl p-4 flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-purple-400 shadow-md flex-shrink-0">
              <Image
                src={p2Deck.champion.avatar}
                alt={p2Deck.champion.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col flex-1 min-w-0 gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <Crown className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="font-serif font-black text-base text-white truncate">
                    {p2Deck.champion.name}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400 flex-shrink-0">
                  {p2Deck.champion.hp} HP
                </span>
              </div>
              <p className="text-xs text-slate-400 italic truncate">{p2Deck.champion.title}</p>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-purple-300 font-bold">⚡ {p2Deck.champion.heroPower.name} (2 Mana):</span>
                <span className="text-slate-400 text-[10px] ml-2 truncate">
                  {p2Deck.champion.heroPower.desc}
                </span>
              </div>
            </div>
          </div>

          {/* Deck Breakdown & Description */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{p2Deck.description}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {p2Deck.cards.slice(0, 7).map((cardId, i) => {
                const card = CARDS_DATA.find(c => c.id === cardId);
                return (
                  <span
                    key={`${cardId}_${i}`}
                    className="bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono"
                  >
                    {card ? card.name : cardId}
                  </span>
                );
              })}
              {p2Deck.cards.length > 7 && (
                <span className="text-slate-500 text-[11px] font-mono self-center">
                  +{p2Deck.cards.length - 7} more cards
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Launch CTA Button */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <button
          type="button"
          onClick={handleLaunch}
          className="btn bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono text-base md:text-lg font-black px-12 py-5 rounded-2xl flex items-center gap-3 shadow-[0_0_50px_rgba(245,158,11,0.6)] transition-all hover:scale-105"
        >
          <Swords className="w-6 h-6 text-slate-950" />
          <span>START COUCH DUEL</span>
        </button>
        <span className="text-xs font-mono text-slate-400">
          Both duellists ready • 30 HP Vanguard showdown with in-place evolution
        </span>
      </div>
    </div>
  );
}
