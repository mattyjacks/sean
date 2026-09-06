'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/tcg/Header';
import { LandingHomepage } from '@/components/tcg/LandingHomepage';
import { DeckBuilder } from '@/components/tcg/DeckBuilder';
import { CardAlmanac } from '@/components/tcg/CardAlmanac';
import { RulesCodex } from '@/components/tcg/RulesCodex';
import { ArcadeHub } from '@/components/arcade/ArcadeHub';
import { CardOutfitterStudio } from '@/components/tcg/CardOutfitterStudio';
import { CardInspectorModal } from '@/components/tcg/CardInspectorModal';
import { AmbientBackground } from '@/components/tcg/AmbientBackground';
import { GAME_TITLES } from '@/lib/tcg/titlesData';
import { CardDef, CardInstance } from '@/lib/tcg/types';
import { MainNavTab } from '@/components/tcg/Header';

import { PackOpenerModal } from '@/components/tcg/PackOpenerModal';
import { TradeModal } from '@/components/tcg/TradeModal';
import { CosmeticsShopModal } from '@/components/tcg/CosmeticsShopModal';
import { PlayerProfileModal } from '@/components/tcg/PlayerProfileModal';
import {
  PlayerCollection,
  getInitialCollection,
  loadPlayerCollection,
  openBoosterPack
} from '@/lib/tcg/collectionEngine';

export default function Home() {
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
      <main className="flex-1 flex flex-col w-full relative z-10 py-4">
        {activeTab === 'battle' && (
          <LandingHomepage
            onOpenShopModal={() => setIsShopModalOpen(true)}
            onInspectCard={card => setInspectedCard(card)}
          />
        )}

        {activeTab === 'deckbuilder' && (
          <DeckBuilder
            onInspectCard={card => setInspectedCard(card)}
            onSaveP1Deck={() => {}}
            onSaveP2Deck={() => {}}
            onTestBattle={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/battle/splitscreen';
              }
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
            onTestCardInBattle={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/battle/splitscreen';
              }
            }}
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

      {/* Real-Money Cosmetics Shop & Gem Exchange Modal */}
      <CosmeticsShopModal
        isOpen={isShopModalOpen}
        collection={collection}
        onUpdateCollection={updated => setCollection(updated)}
        onClose={() => setIsShopModalOpen(false)}
      />

      {/* Player Profile & Supporter Status Modal */}
      <PlayerProfileModal
        isOpen={isProfileModalOpen}
        collection={collection}
        onOpenShop={() => setIsShopModalOpen(true)}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
