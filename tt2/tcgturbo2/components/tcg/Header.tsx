'use client';

import React from 'react';
import Link from 'next/link';
import { GAME_TITLES } from '@/lib/tcg/titlesData';
import { soundEngine } from '@/lib/tcg/soundEngine';
import { getSupporterTier } from '@/lib/tcg/collectionEngine';
import { Volume2, VolumeX, Maximize, Swords, BookOpen, Layers, Sparkles, User, Gamepad2, Wand2 } from 'lucide-react';

export type MainNavTab = 'battle' | 'deckbuilder' | 'almanac' | 'lore' | 'arcade' | 'outfitter';

interface HeaderProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  gameTitle: string;
  setGameTitle: (title: string) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  unopenedPacks?: number;
  gemBalance?: number;
  totalSpentUSD?: number;
  onOpenPackModal?: () => void;
  onOpenTradeModal?: () => void;
  onOpenShopModal?: () => void;
  onOpenProfileModal?: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  gameTitle,
  setGameTitle,
  isMuted,
  setIsMuted,
  unopenedPacks = 0,
  gemBalance = 10000,
  totalSpentUSD = 0,
  onOpenPackModal,
  onOpenTradeModal,
  onOpenShopModal,
  onOpenProfileModal
}: HeaderProps) {
  const supporterTier = getSupporterTier(totalSpentUSD);
  const toggleSound = () => {
    const unmuted = soundEngine.toggleMute();
    setIsMuted(!unmuted);
  };

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="app-header flex flex-wrap items-center justify-between px-2.5 sm:px-4 md:px-8 py-2 sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl gap-2">
      {/* Brand */}
      <Link href="/" className="brand-section flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity">
        <div className="game-logo-gem flex-shrink-0" />
        <div className="brand-title-wrap">
          <h1 className="brand-title text-base sm:text-xl md:text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-amber-200 via-sky-300 to-indigo-300 bg-clip-text text-transparent font-serif truncate max-w-[140px] sm:max-w-none">
            {gameTitle}
          </h1>
          <span className="brand-subtitle hidden sm:inline-block text-[10px] text-slate-400 font-mono tracking-widest uppercase font-semibold">
            Tactical Conduit & Ascension TCG
          </span>
        </div>
      </Link>

      {/* Nav Tabs (Scrollable on small mobile screens) */}
      <nav className="nav-tabs flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 gap-1 overflow-x-auto max-w-full" aria-label="Main Navigation">
        <button
          className={`nav-tab-btn px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'battle'
              ? 'bg-gradient-to-r from-blue-600/50 to-indigo-600/50 text-sky-200 border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          onClick={() => {
            setActiveTab('battle');
            soundEngine.playHover();
          }}
        >
          <Swords className="w-3.5 h-3.5 text-amber-400" />
          <span>Battle Arena</span>
        </button>

        <button
          className={`nav-tab-btn px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'deckbuilder'
              ? 'bg-gradient-to-r from-blue-600/50 to-indigo-600/50 text-sky-200 border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          onClick={() => {
            setActiveTab('deckbuilder');
            soundEngine.playHover();
          }}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Deck Builder</span>
        </button>

        <button
          className={`nav-tab-btn px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'almanac'
              ? 'bg-gradient-to-r from-blue-600/50 to-indigo-600/50 text-sky-200 border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          onClick={() => {
            setActiveTab('almanac');
            soundEngine.playHover();
          }}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>3D Showcase</span>
        </button>

        <button
          className={`nav-tab-btn px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'lore'
              ? 'bg-gradient-to-r from-blue-600/50 to-indigo-600/50 text-sky-200 border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          onClick={() => {
            setActiveTab('lore');
            soundEngine.playHover();
          }}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-300" />
          <span>Rules & Lore</span>
        </button>

        <button
          className={`nav-tab-btn px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'arcade'
              ? 'bg-gradient-to-r from-blue-600/50 to-indigo-600/50 text-sky-200 border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          onClick={() => {
            setActiveTab('arcade');
            soundEngine.playHover();
          }}
        >
          <Gamepad2 className="w-3.5 h-3.5 text-rose-400" />
          <span>🎮 Arcade Hub</span>
        </button>

        <button
          className={`nav-tab-btn px-2.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'outfitter'
              ? 'bg-gradient-to-r from-blue-600/50 to-indigo-600/50 text-sky-200 border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          onClick={() => {
            setActiveTab('outfitter');
            soundEngine.playHover();
          }}
        >
          <Wand2 className="w-3.5 h-3.5 text-amber-400" />
          <span>🛠️ Outfitter</span>
        </button>
      </nav>

      {/* Action Utilities & Progression Features */}
      <div className="header-actions flex items-center gap-2 md:gap-3">
        {onOpenProfileModal && (
          <button
            type="button"
            onClick={onOpenProfileModal}
            className={`btn bg-slate-950 border ${supporterTier.borderColor} ${supporterTier.color} px-3 py-1.5 rounded-xl text-xs font-black font-mono flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform`}
            title={`View Player Profile & Supporter Status (${supporterTier.name} - $${totalSpentUSD.toFixed(2)} contributed)`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
            <span className="bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded-md font-extrabold text-[10px]">
              {supporterTier.badge.split(' ')[0]} ${totalSpentUSD.toFixed(2)}
            </span>
          </button>
        )}

        {onOpenShopModal && (
          <button
            type="button"
            onClick={onOpenShopModal}
            className="btn bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black font-mono flex items-center gap-1.5 shadow-lg hover:scale-105 transition-transform"
            title="Open Cosmetic Store & Gem Vault ($100.00 Credit Pre-loaded)"
          >
            <span>🛍️ Shop</span>
            <span className="bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-md font-extrabold text-[10px]">
              💎 {gemBalance.toLocaleString()} (${(gemBalance / 100).toFixed(0)})
            </span>
          </button>
        )}

        {onOpenPackModal && (
          <button
            type="button"
            onClick={onOpenPackModal}
            className="btn bg-slate-900 border border-amber-500/60 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-black font-mono flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
            title="Open Booster Packs"
          >
            <span>🎁 Packs</span>
            <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-md font-extrabold text-[10px]">
              {unopenedPacks}
            </span>
          </button>
        )}

        {onOpenTradeModal && (
          <button
            type="button"
            onClick={onOpenTradeModal}
            className="btn bg-purple-950/80 border border-purple-500/50 text-purple-200 px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 hover:bg-purple-900/80 transition-colors hidden sm:flex"
            title="Free Card Gifting & Trading ($0.00)"
          >
            <span>🔄 Trade</span>
          </button>
        )}

        {/* Title Switcher */}
        <select
          value={gameTitle}
          onChange={e => {
            setGameTitle(e.target.value);
            if (typeof document !== 'undefined') {
              document.title = `${e.target.value} | Modular Web TCG`;
            }
          }}
          className="title-select bg-slate-900 text-slate-300 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none hover:border-sky-500/60 transition-colors hidden xl:block"
          title="Switch Game Title Theme"
        >
          {GAME_TITLES.map((t, idx) => (
            <option key={t} value={t}>
              {idx + 1}. {t}
            </option>
          ))}
        </select>

        {/* Audio Mute Button */}
        <button
          type="button"
          onClick={toggleSound}
          className={`action-icon-btn p-2 rounded-lg border text-sm transition-all ${
            !isMuted
              ? 'bg-sky-950/60 border-sky-500/50 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={isMuted ? 'Unmute Sound (M)' : 'Mute Sound (M)'}
        >
          {!isMuted ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
        </button>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="action-icon-btn p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors hidden sm:flex"
          title="Toggle Fullscreen (F)"
        >
          <Maximize className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
}
