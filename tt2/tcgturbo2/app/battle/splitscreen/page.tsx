'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header, MainNavTab } from '@/components/tcg/Header';
import { BattleArena } from '@/components/tcg/BattleArena';
import { DeckSelectLobby } from '@/components/tcg/DeckSelectLobby';
import { DeckBuilder } from '@/components/tcg/DeckBuilder';
import { CardAlmanac } from '@/components/tcg/CardAlmanac';
import { RulesCodex } from '@/components/tcg/RulesCodex';
import { ArcadeHub } from '@/components/arcade/ArcadeHub';
import { CardOutfitterStudio } from '@/components/tcg/CardOutfitterStudio';
import { PrivacyCurtainModal } from '@/components/tcg/PrivacyCurtainModal';
import { CardInspectorModal } from '@/components/tcg/CardInspectorModal';
import { GameOverModal } from '@/components/tcg/GameOverModal';
import { AmbientBackground } from '@/components/tcg/AmbientBackground';

import {
  createInitialGame,
  revealPrivacyAndStartTurn,
  endTurn
} from '@/lib/tcg/gameEngine';
import { executeAiTurn } from '@/lib/tcg/aiPlayer';
import { GameState, CardDef, CardInstance } from '@/lib/tcg/types';
import { GAME_TITLES } from '@/lib/tcg/titlesData';
import { PRESET_DECKS } from '@/lib/tcg/presetDecks';
import { soundEngine } from '@/lib/tcg/soundEngine';

import { PackOpenerModal } from '@/components/tcg/PackOpenerModal';
import { TradeModal } from '@/components/tcg/TradeModal';
import { CosmeticsShopModal } from '@/components/tcg/CosmeticsShopModal';
import { PlayerProfileModal } from '@/components/tcg/PlayerProfileModal';
import {
  PlayerCollection,
  getInitialCollection,
  loadPlayerCollection,
  openBoosterPack,
  addVictoryPackReward
} from '@/lib/tcg/collectionEngine';

export default function SplitscreenPage() {
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

  const [customP1Deck, setCustomP1Deck] = useState<string[] | undefined>(undefined);
  const [customP2Deck, setCustomP2Deck] = useState<string[] | undefined>(undefined);

  // Deck Selection Lobby State (opens by default in Couch Co-Op)
  const [isDeckSelectOpen, setIsDeckSelectOpen] = useState<boolean>(true);
  const [privacyCurtainEnabled, setPrivacyCurtainEnabled] = useState<boolean>(true);

  const [lastDeckConfig, setLastDeckConfig] = useState<{
    p1DeckKey: string;
    p2DeckKey: string;
    p1Name: string;
    p2Name: string;
    isP2AI?: boolean;
  }>({
    p1DeckKey: 'solar_pyre',
    p2DeckKey: 'void_shadow',
    p1Name: 'Player 1',
    p2Name: 'AI Tactician',
    isP2AI: true
  });

  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGame('solo_ai', 'solar_pyre', 'void_shadow')
  );

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Launch Duel with Selected Decks (Solo vs AI or Couch 2P)
  const handleStartCustomDuel = useCallback(
    (config: {
      p1DeckKey: string;
      p2DeckKey: string;
      p1Name: string;
      p2Name: string;
      privacyCurtain: boolean;
      customP1Cards?: string[];
      customP2Cards?: string[];
      isP2AI?: boolean;
    }) => {
      soundEngine.playTurnChime();
      const isAI = !!config.isP2AI;
      setLastDeckConfig({
        p1DeckKey: config.p1DeckKey,
        p2DeckKey: config.p2DeckKey,
        p1Name: config.p1Name,
        p2Name: config.p2Name,
        isP2AI: isAI
      });
      setPrivacyCurtainEnabled(isAI ? false : config.privacyCurtain);

      const newGame = createInitialGame(
        isAI ? 'solo_ai' : 'couch_2p',
        config.p1DeckKey,
        config.p2DeckKey,
        config.customP1Cards || customP1Deck,
        config.customP2Cards || customP2Deck
      );

      newGame.players[0].name = config.p1Name;
      newGame.players[1].name = config.p2Name;
      newGame.players[1].isAI = isAI;
      if (isAI) {
        newGame.isPrivacyCurtainActive = false;
      }

      setGameState(newGame);
      setIsDeckSelectOpen(false);
      setActiveTab('battle');
    },
    [customP1Deck, customP2Deck]
  );

  // Rematch with previous deck config
  const handleRematch = useCallback(() => {
    handleStartCustomDuel({
      ...lastDeckConfig,
      privacyCurtain: privacyCurtainEnabled,
      customP1Cards: customP1Deck,
      customP2Cards: customP2Deck,
      isP2AI: lastDeckConfig.isP2AI
    });
  }, [handleStartCustomDuel, lastDeckConfig, privacyCurtainEnabled, customP1Deck, customP2Deck]);

  // Victory Reward listener
  const rewardedRef = useRef<boolean>(false);
  useEffect(() => {
    if (gameState.winner === 1 && !rewardedRef.current) {
      rewardedRef.current = true;
      setCollection(current => addVictoryPackReward(current));
    } else if (gameState.winner === null) {
      rewardedRef.current = false;
    }
  }, [gameState.winner]);

  // AI Turn Execution in Solo Mode
  useEffect(() => {
    if (
      gameState.mode === 'solo_ai' &&
      gameState.currentTurn === 2 &&
      !gameState.winner &&
      !gameState.isPrivacyCurtainActive
    ) {
      const timer = setTimeout(() => {
        executeAiTurn(
          () => gameStateRef.current,
          updater => setGameState(updater)
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [gameState.mode, gameState.currentTurn, gameState.winner, gameState.isPrivacyCurtainActive]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Space to end turn or pass privacy curtain
      if (e.code === 'Space') {
        if (
          isPackModalOpen ||
          isTradeModalOpen ||
          isShopModalOpen ||
          isProfileModalOpen ||
          inspectedCard ||
          activeTab !== 'battle' ||
          isDeckSelectOpen
        ) {
          return;
        }
        e.preventDefault();
        setGameState(current => {
          if (current.winner) return current;
          if (current.isPrivacyCurtainActive) {
            return revealPrivacyAndStartTurn(current);
          } else if (!current.players[current.currentTurn - 1].isAI) {
            const next = endTurn(current);
            // Only activate privacy curtain if enabled in match settings
            if (!privacyCurtainEnabled) {
              return { ...next, isPrivacyCurtainActive: false };
            }
            return next;
          }
          return current;
        });
      }

      // M to toggle audio
      if (e.key === 'm' || e.key === 'M') {
        const unmuted = soundEngine.toggleMute();
        setIsMuted(!unmuted);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPackModalOpen,
    isTradeModalOpen,
    isShopModalOpen,
    isProfileModalOpen,
    inspectedCard,
    activeTab,
    isDeckSelectOpen,
    privacyCurtainEnabled
  ]);

  return (
    <div id="app" className="relative flex flex-col min-h-screen w-full bg-[#080911] text-slate-100 overflow-x-hidden">
      {/* Ambient Cosmic Background */}
      <AmbientBackground />

      {/* Top Header Navigation & Utilities */}
      <Header
        activeTab={activeTab}
        setActiveTab={tab => {
          setActiveTab(tab);
          if (tab !== 'battle') {
            setIsDeckSelectOpen(false);
          }
        }}
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
        {activeTab === 'battle' && (
          <>
            {isDeckSelectOpen ? (
              <DeckSelectLobby
                onStartGame={handleStartCustomDuel}
                savedCustomP1Deck={customP1Deck}
                savedCustomP2Deck={customP2Deck}
              />
            ) : (
              <BattleArena
                gameState={gameState}
                setGameState={setGameState}
                onInspectCard={card => setInspectedCard(card)}
                onNewDuel={handleRematch}
                onChangeDecks={() => setIsDeckSelectOpen(true)}
                equippedCosmetics={collection.equippedCosmetics}
                totalSpentUSD={collection.totalSpentUSD}
              />
            )}
          </>
        )}

        {activeTab === 'deckbuilder' && (
          <DeckBuilder
            onInspectCard={card => setInspectedCard(card)}
            onSaveP1Deck={cards => {
              setCustomP1Deck(cards);
            }}
            onSaveP2Deck={cards => {
              setCustomP2Deck(cards);
            }}
            onTestBattle={cards => {
              setCustomP1Deck(cards);
              handleStartCustomDuel({
                p1DeckKey: 'custom',
                p2DeckKey: 'void_shadow',
                p1Name: 'Player 1',
                p2Name: 'AI Tactician',
                privacyCurtain: false,
                customP1Cards: cards,
                isP2AI: true
              });
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
            onTestCardInBattle={customCard => {
              handleStartCustomDuel({
                p1DeckKey: 'custom',
                p2DeckKey: 'void_shadow',
                p1Name: 'Player 1',
                p2Name: 'AI Tactician',
                privacyCurtain: false,
                customP1Cards: [customCard.id, ...PRESET_DECKS.solar_pyre.cards.slice(1)],
                isP2AI: true
              });
            }}
          />
        )}
      </main>

      {/* Privacy Curtain Overlay for Pass-the-Device Local 2P */}
      {privacyCurtainEnabled && (
        <PrivacyCurtainModal
          isOpen={gameState.isPrivacyCurtainActive && !isDeckSelectOpen}
          playerName={gameState.players[gameState.currentTurn - 1].name}
          onRevealAndStart={() => setGameState(s => revealPrivacyAndStartTurn(s))}
        />
      )}

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

      {/* Player Profile & Supporter Status Modal */}
      <PlayerProfileModal
        isOpen={isProfileModalOpen}
        collection={collection}
        onOpenShop={() => setIsShopModalOpen(true)}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* GameOver Modal */}
      <GameOverModal
        gameState={gameState}
        onRematch={handleRematch}
        onDeckBuilder={() => {
          setGameState(s => ({ ...s, winner: null }));
          setIsDeckSelectOpen(true);
        }}
      />
    </div>
  );
}
