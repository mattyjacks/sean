'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './Card';
import { CARDS_DATA } from '@/lib/tcg/cardsData';
import { PRESET_DECKS } from '@/lib/tcg/presetDecks';
import { CardDef, CardInstance } from '@/lib/tcg/types';
import { soundEngine } from '@/lib/tcg/soundEngine';
import { tcgWorkerManager } from '@/lib/tcg/tcgWorkerManager';
import { Search, Plus, Trash2, Swords, CheckCircle2 } from 'lucide-react';

interface DeckBuilderProps {
  onInspectCard: (card: CardDef | CardInstance) => void;
  onSaveP1Deck: (deckCards: string[]) => void;
  onSaveP2Deck: (deckCards: string[]) => void;
  onTestBattle: (deckCards: string[]) => void;
}

export function DeckBuilder({
  onInspectCard,
  onSaveP1Deck,
  onSaveP2Deck,
  onTestBattle
}: DeckBuilderProps) {
  const [selectedElement, setSelectedElement] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deckName, setDeckName] = useState<string>('Solar Flare Aggro');
  const [currentDeck, setCurrentDeck] = useState<string[]>([
    ...PRESET_DECKS.solar_pyre.cards
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showFeedbackToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filter cards catalog
  const filteredCards = useMemo(() => {
    return CARDS_DATA.filter(card => {
      const matchElem = selectedElement === 'all' || card.element === selectedElement;
      const matchType = selectedType === 'all' || card.type === selectedType;
      const matchSearch =
        !searchQuery ||
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.desc && card.desc.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchElem && matchType && matchSearch;
    });
  }, [selectedElement, selectedType, searchQuery]);

  // Deck counts grouping
  const deckCardCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    currentDeck.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [currentDeck]);

  // Mana Curve histogram calculations (1 to 7+) with instant local memo and worker sync
  const [workerCurve, setWorkerCurve] = useState<number[] | null>(null);

  useEffect(() => {
    let active = true;
    tcgWorkerManager
      .runTask<{ curve: number[] }>('EVALUATE_MANA_CURVE', {
        deckCards: currentDeck,
        cardCatalog: CARDS_DATA
      })
      .then(res => {
        if (active && res.success && res.data?.curve) {
          setWorkerCurve(res.data.curve);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [currentDeck]);

  const fallbackCurve = useMemo(() => {
    const curve = [0, 0, 0, 0, 0, 0, 0]; // 1, 2, 3, 4, 5, 6, 7+
    currentDeck.forEach(id => {
      const def = CARDS_DATA.find(c => c.id === id);
      if (def) {
        const costIdx = Math.min(6, Math.max(0, def.cost - 1));
        curve[costIdx]++;
      }
    });
    return curve;
  }, [currentDeck]);

  const manaCurve = workerCurve || fallbackCurve;
  const maxCurveCount = Math.max(1, ...manaCurve);

  // Add card to deck
  const handleAddCard = (cardId: string) => {
    if (currentDeck.length >= 20) {
      showFeedbackToast('Maximum deck size is 20 cards!');
      return;
    }

    const currentCount = currentDeck.filter(id => id === cardId).length;
    if (currentCount >= 3) {
      showFeedbackToast('Maximum 3 copies per card allowed!');
      return;
    }

    soundEngine.playCardDraw();
    setCurrentDeck([...currentDeck, cardId]);
  };

  // Remove card from deck
  const handleRemoveCard = (cardId: string) => {
    const idx = currentDeck.lastIndexOf(cardId);
    if (idx !== -1) {
      soundEngine.playHover();
      const updated = [...currentDeck];
      updated.splice(idx, 1);
      setCurrentDeck(updated);
    }
  };

  // Load Preset
  const handleLoadPreset = (key: string) => {
    const preset = PRESET_DECKS[key];
    if (preset) {
      soundEngine.playTurnChime();
      setDeckName(preset.name);
      setCurrentDeck([...preset.cards]);
      showFeedbackToast(`Loaded Archetype: ${preset.name}`);
    }
  };

  return (
    <div className="deckbuilder-view flex flex-col lg:flex-row flex-1 w-full max-w-[1560px] mx-auto p-3 md:p-6 gap-6 h-[calc(100vh-70px)] overflow-hidden">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-sky-400 text-sky-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 font-mono text-sm backdrop-blur-md animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Left Catalog Pane */}
      <div className="library-pane flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        {/* Filter Bar */}
        <div className="library-filter-bar flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
          {/* Element Filter */}
          <div className="filter-group flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 font-mono">ELEMENT:</span>
            {['all', 'solar', 'void', 'verdant', 'tide', 'astral'].map(elem => (
              <button
                key={elem}
                type="button"
                className={`filter-chip px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  selectedElement === elem
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                    : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
                onClick={() => {
                  setSelectedElement(elem);
                  soundEngine.playHover();
                }}
              >
                {elem}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="filter-group flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 font-mono">TYPE:</span>
            {['all', 'creature', 'spell', 'ward'].map(type => (
              <button
                key={type}
                type="button"
                className={`filter-chip px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  selectedType === type
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                    : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
                onClick={() => {
                  setSelectedType(type);
                  soundEngine.playHover();
                }}
              >
                {type}s
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="search-input bg-slate-950/80 border border-slate-800 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl outline-none focus:border-sky-500 transition-colors w-44 md:w-56"
            />
          </div>
        </div>

        {/* Card Catalog Scroll Grid */}
        <div className="card-catalog-scroll flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 content-start">
          {filteredCards.map(cardDef => {
            const countInDeck = deckCardCounts[cardDef.id] || 0;
            return (
              <div key={cardDef.id} className="relative group flex flex-col items-center">
                <Card card={cardDef} onInspect={onInspectCard} onClick={() => handleAddCard(cardDef.id)} />

                {/* Quick Add Overlay Button */}
                <button
                  type="button"
                  onClick={() => handleAddCard(cardDef.id)}
                  disabled={countInDeck >= 3 || currentDeck.length >= 20}
                  className="mt-2 w-full py-1 bg-slate-900/90 hover:bg-blue-600/80 disabled:opacity-40 disabled:hover:bg-slate-900 border border-slate-800 hover:border-blue-400 text-slate-200 text-xs font-mono rounded-lg flex items-center justify-center gap-1 transition-all"
                  title="Add copy to deck"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{countInDeck > 0 ? `${countInDeck}/3 in deck` : 'Add to Deck'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Deck Drawer */}
      <aside className="deck-drawer-pane w-full lg:w-[380px] bg-slate-900/90 border border-slate-800/80 rounded-2xl flex flex-col shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Drawer Header */}
        <div className="drawer-header p-4 border-b border-slate-800 flex flex-col gap-3 bg-slate-950/50">
          <div className="drawer-title-row flex items-center justify-between gap-2">
            <input
              type="text"
              value={deckName}
              onChange={e => setDeckName(e.target.value)}
              className="deck-name-input bg-transparent border-b border-transparent focus:border-sky-400 font-serif font-bold text-slate-100 text-base outline-none flex-1 transition-colors"
              placeholder="Deck Name..."
            />
            <span
              className={`deck-count-pill font-mono text-xs font-black px-3 py-1 rounded-full border ${
                currentDeck.length >= 14 && currentDeck.length <= 20
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
              }`}
            >
              {currentDeck.length} / 20 cards
            </span>
          </div>

          {/* Preset Archetypes Selector */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-mono font-bold text-slate-400">PRESET:</label>
            <select
              onChange={e => handleLoadPreset(e.target.value)}
              className="title-select flex-1 bg-slate-950 border border-slate-800 text-slate-300 text-xs py-1.5 px-2.5 rounded-lg outline-none hover:border-sky-500/60 transition-colors"
            >
              <option value="solar_pyre">Solar Flare Aggro</option>
              <option value="void_shadow">Void Eclipse Control</option>
              <option value="verdant_ramp">Verdant Overgrowth Ramp</option>
              <option value="tide_astral">Tidal Chrono Combo</option>
            </select>
          </div>

          {/* Dynamic Mana Curve Histogram */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">MANA CURVE:</span>
            <div className="mana-curve-container flex items-end gap-1.5 h-12 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800/80">
              {manaCurve.map((count, idx) => {
                const heightPct = (count / maxCurveCount) * 100;
                return (
                  <div key={`curve_${idx}`} className="curve-col flex-1 flex flex-col items-center h-full justify-end gap-1">
                    <div
                      className="curve-bar w-full bg-gradient-to-t from-blue-700 to-sky-400 rounded-t-sm transition-all"
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                      title={`Cost ${idx === 6 ? '7+' : idx + 1}: ${count} cards`}
                    />
                    <span className="curve-label font-mono text-[9px] text-slate-400">
                      {idx === 6 ? '7+' : idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Deck Cards List */}
        <div className="deck-card-list flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
          {Object.keys(deckCardCounts)
            .sort((a, b) => {
              const cardA = CARDS_DATA.find(c => c.id === a);
              const cardB = CARDS_DATA.find(c => c.id === b);
              return (cardA?.cost || 0) - (cardB?.cost || 0);
            })
            .map(id => {
              const card = CARDS_DATA.find(c => c.id === id);
              if (!card) return null;
              const count = deckCardCounts[id];

              return (
                <div
                  key={id}
                  onClick={() => handleRemoveCard(id)}
                  className="deck-list-item flex items-center justify-between bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-sky-500/50 rounded-xl p-2 cursor-pointer transition-all group"
                  title="Click to remove 1 copy"
                >
                  <div className="deck-item-left flex items-center gap-2.5">
                    <div className="deck-item-cost w-5 h-5 rounded-full bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center border border-blue-400">
                      {card.cost}
                    </div>
                    <span className="deck-item-name font-semibold text-xs text-slate-200 group-hover:text-sky-300">
                      {card.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="deck-item-count font-mono font-bold text-xs text-amber-400">
                      x{count}
                    </span>
                    <Trash2 className="w-3.5 h-3.5 text-slate-600 group-hover:text-rose-400 transition-colors" />
                  </div>
                </div>
              );
            })}
        </div>

        {/* Drawer Action Footer */}
        <div className="drawer-footer p-3.5 border-t border-slate-800 bg-slate-950/60 flex flex-col gap-2">
          <div className="drawer-actions-row flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (currentDeck.length < 10) {
                  showFeedbackToast('⚠️ Deck requires at least 10 cards!');
                  soundEngine.playTrap();
                  return;
                }
                onSaveP1Deck(currentDeck);
                showFeedbackToast('Deck saved as Player 1 Loadout!');
              }}
              className="btn btn-primary flex-1 py-2 text-xs font-semibold"
            >
              Set P1 Deck
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentDeck.length < 10) {
                  showFeedbackToast('⚠️ Deck requires at least 10 cards!');
                  soundEngine.playTrap();
                  return;
                }
                onSaveP2Deck(currentDeck);
                showFeedbackToast('Deck saved as Player 2 Loadout!');
              }}
              className="btn btn-gold flex-1 py-2 text-xs font-semibold"
            >
              Set P2 Deck
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (currentDeck.length < 10) {
                  showFeedbackToast('⚠️ Deck requires at least 10 cards!');
                  soundEngine.playTrap();
                  return;
                }
                onTestBattle(currentDeck);
              }}
              className="btn bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Swords className="w-3.5 h-3.5 text-emerald-200" />
              Test Deck in Arena
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentDeck([]);
                soundEngine.playHover();
              }}
              className="btn btn-outline py-2 px-3 text-xs text-slate-400 hover:text-rose-400"
              title="Clear all cards"
            >
              Clear
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
