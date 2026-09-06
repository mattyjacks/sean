'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { CardDef, ElementType, CardType, Rarity, Keyword } from '@/lib/tcg/types';
import { soundEngine } from '@/lib/tcg/soundEngine';
import {
  Wand2,
  Sparkles,
  Save,
  Trash2,
  Download,
  RotateCcw,
  Layers,
  Sword,
  Swords,
  Heart
} from 'lucide-react';

const AVAILABLE_KEYWORDS: Keyword[] = [
  'Taunt',
  'Aegis',
  'Rush',
  'Lifesteal',
  'Freeze',
  'Deathrattle',
  'Resonance',
  'Overpower',
  'Stealth',
  'Regen'
];

const ART_PRESETS = [
  { label: 'Solar Dragon', url: '/assets/cards/card_ignis.jpg' },
  { label: 'Pyre Vanguard', url: '/assets/cards/card_pyre_vanguard.jpg' },
  { label: 'Void Valkyrie', url: '/assets/cards/card_valkyrie.jpg' },
  { label: 'Verdant Colossus', url: '/assets/cards/card_titan.jpg' },
  { label: 'Tide Siren', url: '/assets/cards/card_tide.jpg' },
  { label: 'Chronos Lord', url: '/assets/cards/card_time.jpg' },
  { label: 'Solar Lance', url: '/assets/cards/spell_solar_lance.jpg' },
  { label: 'Sunfire Sigil', url: '/assets/cards/ward_sunfire_sigil.jpg' }
];

const LOCAL_STORAGE_KEY = 'tcg_custom_cards_v1';

interface CardOutfitterStudioProps {
  onTestCardInBattle?: (card: CardDef) => void;
  onInspectCard?: (card: CardDef) => void;
}

export function CardOutfitterStudio({ onTestCardInBattle, onInspectCard }: CardOutfitterStudioProps) {
  const [name, setName] = useState<string>('Supernova Archon');
  const [element, setElement] = useState<ElementType>('solar');
  const [type, setType] = useState<CardType>('creature');
  const [form, setForm] = useState<1 | 2 | 3>(2);
  const [cost, setCost] = useState<number>(5);
  const [atk, setAtk] = useState<number>(6);
  const [hp, setHp] = useState<number>(6);
  const [rarity, setRarity] = useState<Rarity>('epic');
  const [selectedKeywords, setSelectedKeywords] = useState<Keyword[]>(['Rush', 'Aegis']);
  const [desc, setDesc] = useState<string>('Rush. Aegis. Ascension Burst: Deal 2 damage to all enemy units.');
  const [lore, setLore] = useState<string>('Forged in the heart of a collapsed nebula to herald a new age of cosmic order.');
  const [artUrl, setArtUrl] = useState<string>('/assets/cards/card_pyre_vanguard.jpg');

  const [savedCards, setSavedCards] = useState<CardDef[]>([]);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setSavedCards(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const previewCard: CardDef = {
    id: `custom_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
    name: name || 'Unnamed Card',
    element,
    type,
    form: type === 'creature' ? form : undefined,
    ascendsFrom: type === 'creature' && form > 1 ? element : undefined,
    cost: Math.max(0, cost),
    atk: type === 'creature' ? atk : undefined,
    hp: type === 'creature' ? hp : undefined,
    rarity,
    keywords: selectedKeywords,
    desc,
    lore,
    art: artUrl,
    hasTaunt: selectedKeywords.includes('Taunt'),
    hasAegis: selectedKeywords.includes('Aegis'),
    canAttackOnSummon: selectedKeywords.includes('Rush'),
    lifesteal: selectedKeywords.includes('Lifesteal'),
    targetType: type === 'spell' ? 'any_enemy' : undefined,
    trigger: type === 'ward' ? 'on_vanguard_attacked' : undefined
  };

  const toggleKeyword = (kw: Keyword) => {
    soundEngine.playHover();
    if (selectedKeywords.includes(kw)) {
      setSelectedKeywords(selectedKeywords.filter(k => k !== kw));
    } else {
      setSelectedKeywords([...selectedKeywords, kw]);
    }
  };

  const handleSaveCard = () => {
    soundEngine.playTurnChime();
    const newSaved = [previewCard, ...savedCards.filter(c => c.name !== previewCard.name)];
    setSavedCards(newSaved);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSaved));
    } catch (e) {
      console.error(e);
    }
    showToast(`Saved "${previewCard.name}" to Outfitter Workshop!`);
  };

  const handleDeleteCard = (cardId: string) => {
    soundEngine.playTrap();
    const filtered = savedCards.filter(c => c.id !== cardId);
    setSavedCards(filtered);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error(e);
    }
    showToast('Card deleted from Outfitter.');
  };

  const handleLoadCard = (card: CardDef) => {
    soundEngine.playCardDraw();
    setName(card.name);
    setElement(card.element);
    setType(card.type);
    if (card.form) setForm(card.form);
    setCost(card.cost);
    if (card.atk !== undefined) setAtk(card.atk);
    if (card.hp !== undefined) setHp(card.hp);
    setRarity(card.rarity);
    setSelectedKeywords(card.keywords || []);
    setDesc(card.desc || '');
    setLore(card.lore || '');
    setArtUrl(card.art);
    showToast(`Loaded "${card.name}" into editor!`);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(previewCard, null, 2);
    navigator.clipboard.writeText(jsonStr);
    showToast('Card JSON copied to clipboard!');
  };

  return (
    <div className="card-outfitter-view flex flex-col flex-1 w-full max-w-[1560px] mx-auto p-4 md:p-6 gap-6 h-[calc(100vh-70px)] overflow-y-auto">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-purple-950/70 border border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl relative backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-2 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 self-center md:self-start bg-amber-950/80 border border-amber-500/60 px-3 py-1 rounded-full text-amber-300 font-mono text-xs font-bold uppercase tracking-wider">
              <Wand2 className="w-4 h-4 text-amber-400" />
              <span>Card Creator & Outfitter Workshop</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-white uppercase tracking-wide">
              Design & Forge Custom Astral Cards
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Tailor new Initiates, Form II Champions, and Form III Apex Titans. Set exact Mana curves, ATK/HP stat balances, keywords, and ascension bursts. Test changes instantly in real-time 3D physics preview.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onTestCardInBattle && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTurnChime();
                  onTestCardInBattle(previewCard);
                }}
                className="btn bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Swords className="w-4 h-4 text-sky-200" />
                <span>Test in Battle</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveCard}
              className="btn bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-mono text-xs sm:text-sm font-black px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Save className="w-4 h-4" />
              <span>Save to Workshop</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="btn bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5"
              title="Copy JSON to Clipboard"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Copy JSON</span>
            </button>
          </div>
        </div>
      </div>

      {feedbackToast && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-300 px-4 py-2 rounded-xl text-xs font-mono font-bold text-center shadow-lg animate-in fade-in">
          {feedbackToast}
        </div>
      )}

      {/* Main Studio 2-Column Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 flex flex-col gap-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-black font-serif uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <span>🛠️ Card Attributes & Specifications</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setName('Starlight Phoenix');
                setElement('solar');
                setType('creature');
                setForm(3);
                setCost(7);
                setAtk(8);
                setHp(7);
                setSelectedKeywords(['Rush', 'Lifesteal']);
                setDesc('Rush. Lifesteal. Ascension Burst: Deal 3 damage to all enemy creatures.');
                setLore('A mythic celestial bird that is reborn every million cycles.');
                setArtUrl('/assets/cards/card_ignis.jpg');
                soundEngine.playCardDraw();
              }}
              className="text-[11px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Load Preset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card Name */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-mono font-bold text-slate-300">Card Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Solaris Ancient"
                className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-serif outline-none focus:border-amber-400"
              />
            </div>

            {/* Element */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-slate-300">Element Identity</label>
              <select
                value={element}
                onChange={e => setElement(e.target.value as ElementType)}
                className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-amber-400 capitalize"
              >
                <option value="solar">☀️ Solar / Pyre</option>
                <option value="void">🌑 Void / Shadow</option>
                <option value="verdant">🌿 Verdant / Nature</option>
                <option value="tide">🌊 Tide / Water</option>
                <option value="astral">✨ Astral / Chrono</option>
              </select>
            </div>

            {/* Card Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-slate-300">Card Classification</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as CardType)}
                className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-amber-400 capitalize"
              >
                <option value="creature">Creature Minion</option>
                <option value="spell">Arcane Spell</option>
                <option value="ward">Secret Runic Ward</option>
              </select>
            </div>

            {/* Form (If Creature) */}
            {type === 'creature' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-bold text-slate-300">Ascension Form Tier</label>
                <div className="flex gap-2">
                  {([1, 2, 3] as const).map(tier => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setForm(tier)}
                      className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                        form === tier
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Form {tier === 1 ? 'I' : tier === 2 ? 'II' : 'III'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rarity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-slate-300">Rarity Gem</label>
              <select
                value={rarity}
                onChange={e => setRarity(e.target.value as Rarity)}
                className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-amber-400 capitalize"
              >
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>

            {/* Mana Cost */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-slate-300">Mana Cost: 💎 {cost}</label>
              <input
                type="range"
                min="0"
                max="10"
                value={cost}
                onChange={e => setCost(parseInt(e.target.value, 10))}
                className="accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Stats (If Creature) */}
            {type === 'creature' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1">
                    <Sword className="w-3.5 h-3.5" /> ATK Stat: {atk}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={atk}
                    onChange={e => setAtk(parseInt(e.target.value, 10))}
                    className="accent-amber-400 cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> HP Stat: {hp}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={hp}
                    onChange={e => setHp(parseInt(e.target.value, 10))}
                    className="accent-rose-500 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* Artwork Presets */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-mono font-bold text-slate-300">Artwork Preset</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ART_PRESETS.map(preset => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setArtUrl(preset.url)}
                    className={`p-2 rounded-xl border text-[11px] font-mono text-left truncate transition-all ${
                      artUrl === preset.url
                        ? 'bg-purple-950 border-purple-400 text-purple-200 font-bold shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Keywords Selector */}
            {type === 'creature' && (
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-mono font-bold text-slate-300">Combat Keywords & Traits</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_KEYWORDS.map(kw => {
                    const active = selectedKeywords.includes(kw);
                    return (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => toggleKeyword(kw)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                          active
                            ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        [{kw}]
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ability Description */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-mono font-bold text-slate-300">Ability Rules Text</label>
              <textarea
                rows={2}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Enter ability mechanics..."
                className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-sans outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {/* Lore Text */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-mono font-bold text-slate-300">Flavor / Lore Quote</label>
              <textarea
                rows={2}
                value={lore}
                onChange={e => setLore(e.target.value)}
                placeholder="Enter story quote..."
                className="bg-slate-950 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs italic font-serif outline-none focus:border-amber-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live 3D Parallax Card Preview & Saved Cards */}
        <div className="lg:col-span-5 flex flex-col gap-6 items-center">
          <div className="flex flex-col items-center gap-3 w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Live Specular 3D Foil Preview
            </span>

            <div className="my-2 py-4">
              <Card
                card={previewCard}
                size="lg"
                onInspect={onInspectCard}
              />
            </div>

            <p className="text-[11px] font-mono text-slate-400 text-center">
              Hover & move cursor over the card to experience responsive 3D tilt perspective and multi-layer holographic refraction.
            </p>
          </div>

          {/* Saved Cards in Workshop */}
          <div className="w-full flex flex-col gap-3 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                <Layers className="w-4 h-4 text-purple-400" />
                Workshop Cards ({savedCards.length})
              </span>
            </div>

            {savedCards.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-slate-500">
                No custom cards saved yet. Click &quot;Save to Workshop&quot; above to store designs.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {savedCards.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl gap-2 transition-all"
                  >
                    <div
                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                      onClick={() => handleLoadCard(c)}
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black font-mono flex items-center justify-center flex-shrink-0">
                        {c.cost}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white font-serif truncate">{c.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 capitalize">
                          {c.element} {c.type} {c.form ? `Form ${c.form}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLoadCard(c)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-mono rounded"
                        title="Load into editor"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(c.id)}
                        className="p-1 hover:bg-red-950/80 text-red-400 rounded"
                        title="Delete card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
