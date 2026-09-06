'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ARCADE_GAMES } from '@/lib/arcade/gamesRegistry';
import { soundEngine } from '@/lib/tcg/soundEngine';
import { AstralBlackjackGame } from './AstralBlackjackGame';
import { ChronoSolitaireGame } from './ChronoSolitaireGame';
import { VerdantRuneMatchGame } from './VerdantRuneMatchGame';
import {
  Gamepad2,
  Users,
  Play,
  Star,
  Flame,
  Compass
} from 'lucide-react';

interface ArcadeHubProps {
  onLaunchGame: (gameId: string) => void;
}

export function ArcadeHub({ onLaunchGame }: ArcadeHubProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeMiniGame, setActiveMiniGame] = useState<string | null>(null);

  const categories = ['All', 'TCG', 'Casino', 'Solitaire', 'Puzzle'];

  const filteredGames = ARCADE_GAMES.filter(game => {
    if (selectedCategory === 'All') return true;
    return game.genre === selectedCategory;
  });

  const flagship = ARCADE_GAMES.find(g => g.isFlagship) || ARCADE_GAMES[0];

  if (activeMiniGame === 'astral_blackjack') {
    return (
      <AstralBlackjackGame
        onBackToArcade={() => setActiveMiniGame(null)}
        onLaunchMainGame={() => {
          setActiveMiniGame(null);
          onLaunchGame('tcg_turbo');
        }}
      />
    );
  }

  if (activeMiniGame === 'chrono_solitaire') {
    return (
      <ChronoSolitaireGame
        onBackToArcade={() => setActiveMiniGame(null)}
        onLaunchMainGame={() => {
          setActiveMiniGame(null);
          onLaunchGame('tcg_turbo');
        }}
      />
    );
  }

  if (activeMiniGame === 'rune_memory_match') {
    return (
      <VerdantRuneMatchGame
        onBackToArcade={() => setActiveMiniGame(null)}
        onLaunchMainGame={() => {
          setActiveMiniGame(null);
          onLaunchGame('tcg_turbo');
        }}
      />
    );
  }

  return (
    <div className="arcade-hub-view flex flex-col flex-1 w-full max-w-[1560px] mx-auto p-4 md:p-8 gap-8 h-[calc(100vh-70px)] overflow-y-auto">
      {/* Top Arcade Portal Hero */}
      <div className="arcade-hero-banner bg-gradient-to-r from-slate-950 via-indigo-950/80 to-purple-950/90 border border-purple-500/40 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-3 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 self-center md:self-start bg-purple-950/80 border border-purple-500/60 px-3.5 py-1 rounded-full text-purple-300 font-mono text-xs font-bold uppercase tracking-wider shadow">
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              <span>Multi-Game Card Arcade Portal (Miniclip & AddictingGames Style)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-serif uppercase tracking-wide bg-gradient-to-r from-white via-amber-200 to-purple-300 bg-clip-text text-transparent">
              Cosmic Card Games Arcade Hub
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Welcome to the premier portal for astral card games. Play our flagship competitive tactical battle arena, test your odds in Astral Blackjack, solve chrono rifts in speed solitaire, and challenge elemental AI opponents with instant zero-install browser play.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-inner font-mono text-xs">
            <div className="text-center px-3 border-r border-slate-800">
              <span className="text-amber-400 font-bold block text-lg">4</span>
              <span className="text-slate-400">Games</span>
            </div>
            <div className="text-center px-3 border-r border-slate-800">
              <span className="text-emerald-400 font-bold block text-lg">100%</span>
              <span className="text-slate-400">Free Play</span>
            </div>
            <div className="text-center px-3">
              <span className="text-sky-400 font-bold block text-lg">200K+</span>
              <span className="text-slate-400">Plays</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Flagship Game Banner (TCG Turbo) */}
      <div className="flagship-card bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/50 border-2 border-amber-500/50 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-mono font-black text-xs uppercase tracking-widest rounded-bl-2xl shadow">
          {flagship.badge}
        </div>

        <div className="flex flex-col gap-4 max-w-2xl text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2 text-amber-400 font-mono text-xs font-bold">
            <Flame className="w-4 h-4 text-amber-400 fill-current" />
            <span>PRIMARY TOURNAMENT BATTLE ARENA</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black font-serif text-white tracking-wide">
            {flagship.title}
          </h2>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            {flagship.description}
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
            {flagship.tags.map(tag => (
              <span
                key={tag}
                className="bg-slate-900/90 border border-slate-700/80 text-slate-300 text-xs px-2.5 py-1 rounded-lg font-mono font-semibold"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playTurnChime();
                onLaunchGame('tcg_turbo');
              }}
              className="btn bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono text-sm font-black px-6 py-3 rounded-2xl flex items-center gap-2.5 shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>PLAY FLAGSHIP GAME NOW</span>
            </button>
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" /> {flagship.playsCount.toLocaleString()} duels played
            </span>
          </div>
        </div>

        {/* Art Thumbnail Box */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-2xl flex-shrink-0 group">
          <Image
            src={flagship.thumbnail}
            alt={flagship.title}
            fill
            sizes="300px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-white">
            <span className="flex items-center gap-1 text-amber-300 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" /> {flagship.rating} / 5.0
            </span>
            <span className="bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded text-[10px]">
              {flagship.players}
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1 mr-2">
            <Compass className="w-4 h-4 text-purple-400" />
            CATEGORIES:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                soundEngine.playHover();
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border border-purple-400'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing {filteredGames.length} card arcade games
        </div>
      </div>

      {/* Games Catalog Grid (AddictingGames / Miniclip Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
        {filteredGames.map(game => {
          const isFlagshipGame = game.id === 'tcg_turbo';
          const isPlayableMiniGame = game.status === 'playable' || game.id === 'astral_blackjack' || game.id === 'chrono_solitaire' || game.id === 'rune_memory_match';

          return (
            <div
              key={game.id}
              className="game-card bg-slate-900/80 border border-slate-800 hover:border-purple-500/60 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 backdrop-blur-sm"
            >
              <div>
                {/* Thumbnail Header */}
                <div className="relative w-full h-44 overflow-hidden bg-slate-950">
                  <Image
                    src={game.thumbnail}
                    alt={game.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 350px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Badge */}
                  {game.badge && (
                    <span className="absolute top-2.5 left-2.5 bg-purple-950/90 border border-purple-500/60 text-purple-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow">
                      {game.badge}
                    </span>
                  )}

                  <span className="absolute top-2.5 right-2.5 bg-slate-950/90 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-800 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current text-amber-400" /> {game.rating}
                  </span>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-slate-300">
                    <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                      {game.genre}
                    </span>
                    <span className="text-slate-400">{game.players}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col gap-2">
                  <h3 className="font-serif font-black text-base md:text-lg text-white group-hover:text-amber-300 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                    {game.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {game.tags.slice(0, 3).map(t => (
                      <span
                        key={t}
                        className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 pt-0">
                {isFlagshipGame ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playTurnChime();
                      onLaunchGame('tcg_turbo');
                    }}
                    className="w-full btn bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono text-xs font-black py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 transition-transform hover:scale-102"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>PLAY MAIN ARENA</span>
                  </button>
                ) : isPlayableMiniGame ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playCardDraw();
                      setActiveMiniGame(game.id);
                    }}
                    className="w-full btn bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-mono text-xs font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 transition-transform hover:scale-102"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>LAUNCH MINI-GAME</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full btn bg-slate-950 border border-slate-800 text-slate-500 font-mono text-xs font-bold py-2.5 rounded-xl cursor-not-allowed text-center"
                  >
                    <span>{game.releaseDate}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
