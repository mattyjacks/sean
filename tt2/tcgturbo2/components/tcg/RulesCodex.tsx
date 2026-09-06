'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  Flame,
  Zap,
  Droplets,
  Sparkles,
  Sword,
  Compass,
  PlayCircle,
  Layers,
  Award
} from 'lucide-react';

export function RulesCodex() {
  const [activeWalkthroughStep, setActiveWalkthroughStep] = useState<number>(1);

  return (
    <div className="lore-view flex flex-col flex-1 w-full max-w-[1150px] mx-auto p-4 md:p-8 gap-8 h-[calc(100vh-70px)] overflow-y-auto">
      {/* Hero Header */}
      <div className="codex-hero-banner bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-700/80 rounded-2xl p-6 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 text-amber-300 font-mono text-xs uppercase tracking-widest font-bold mb-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          Official Rulebook & Tactical Codex
        </div>
        <div className="codex-intro flex flex-col gap-2 border-b border-slate-800 pb-6 relative z-10">
          <h2 className="text-2xl md:text-4xl font-black font-serif text-white tracking-wide">
            The Complete Rules Codex & How-To-Play Guide
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl">
            TCG Turbo weaves the finest mechanics of competitive card gaming into a fast, fluid experience:
            the lane tactics and secret wards of <strong className="text-purple-300">Yu-Gi-Oh!</strong>, the strategic Champion powers of{' '}
            <strong className="text-sky-300">Magic: The Gathering Commander</strong>, the clean mana curve and direct trades of{' '}
            <strong className="text-amber-300">Hearthstone</strong>, and the exciting mid-battle in-place evolution of{' '}
            <strong className="text-emerald-300">Pokémon</strong>.
          </p>
        </div>

        {/* Quick Jump Bar */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono">
          <a href="#sec-objective" className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-sky-900/60 text-sky-300 border border-slate-700 transition-colors">1. Objective & Setup</a>
          <a href="#sec-turn-phases" className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-900/60 text-amber-300 border border-slate-700 transition-colors">2. Turn Structure</a>
          <a href="#sec-how-played" className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 font-bold transition-colors">⚡ How It&apos;s Played</a>
          <a href="#sec-ascension" className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-900/60 text-amber-300 border border-slate-700 transition-colors">3. In-Place Ascension</a>
          <a href="#sec-keywords" className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-emerald-900/60 text-emerald-300 border border-slate-700 transition-colors">4. Keyword Glossary</a>
          <a href="#sec-wards" className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-purple-900/60 text-purple-300 border border-slate-700 transition-colors">5. Secret Wards</a>
          <a href="#sec-vanguards" className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/60 text-rose-300 border border-slate-700 transition-colors">6. Vanguard Champions</a>
          <a href="#sec-compliance" className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-teal-900/60 text-teal-300 border border-slate-700 transition-colors">7. Fair Play Charter</a>
        </div>
      </div>

      {/* SECTION 1: OBJECTIVE & MATCH SETUP */}
      <section id="sec-objective" className="codex-section bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-5 shadow-lg backdrop-blur-md">
        <h3 className="codex-heading text-lg md:text-xl font-bold font-serif text-sky-400 flex items-center gap-2">
          <Sword className="w-5 h-5 text-sky-400" />
          1. Objective of the Game & Match Setup
        </h3>
        <p className="codex-text text-slate-300 text-sm leading-relaxed">
          Each player takes command of an Astral <strong className="text-white">Champion Commander</strong> holding <strong className="text-rose-400">30 Health Points (HP)</strong>. Your primary victory condition is to deplete the enemy Commander&apos;s HP to <strong className="text-rose-400">0</strong> before they defeat yours.
        </p>

        {/* Visual Battlefield Layout Map */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <span className="text-xs uppercase font-mono tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> The 4 Battlefield Zones & Graveyard
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <strong className="text-sky-300 block mb-1">1. Command Zone (Avatar)</strong>
              <p className="text-slate-400">Houses your Champion portrait (30 HP) and 2-Mana Hero Power.</p>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-amber-500/40">
              <strong className="text-amber-300 block mb-1">2. Dedicated Champion Lane 👑</strong>
              <p className="text-slate-400">A special dedicated lane for your Champion Commander card (5 Mana to summon).</p>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <strong className="text-emerald-300 block mb-1">3. Five Combat Lanes (Frontline)</strong>
              <p className="text-slate-400">5 standard creature lanes for initiates and evolved Apex titans.</p>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-lg border border-purple-500/40">
              <strong className="text-purple-300 block mb-1">4. Wards & Graveyard 🪦</strong>
              <p className="text-slate-400">3 secret Rune slots for traps + a viewable Graveyard for destroyed cards.</p>
            </div>
          </div>
        </div>

        <div className="codex-step-list flex flex-col gap-3">
          <div className="codex-step-item flex gap-4 bg-slate-950/60 p-4 rounded-xl border-l-4 border-sky-400">
            <span className="codex-step-num font-mono font-black text-sky-400 text-lg">01</span>
            <div className="text-xs md:text-sm">
              <strong className="text-white block mb-1">Deck Construction Rules:</strong>
              <p className="text-slate-400 leading-relaxed">
                Standard tournament and casual decks contain <strong className="text-white">14 to 20 cards</strong>. A maximum of <strong className="text-white">3 copies</strong> of any specific card is allowed per deck. Each deck is anchored to 1 Vanguard Champion Commander whose color identity guides your synergy.
              </p>
            </div>
          </div>

          <div className="codex-step-item flex gap-4 bg-slate-950/60 p-4 rounded-xl border-l-4 border-amber-400">
            <span className="codex-step-num font-mono font-black text-amber-400 text-lg">02</span>
            <div className="text-xs md:text-sm">
              <strong className="text-white block mb-1">Starting Hand (4 Deck Cards + Champion Card):</strong>
              <p className="text-slate-400 leading-relaxed">
                Both players start with an opening hand containing <strong className="text-white">4 deck cards PLUS their guaranteed Champion Card</strong> (5 cards total). Champion cards require 5 Mana to summon into the <strong className="text-amber-300">Dedicated Champion Lane</strong>.
              </p>
            </div>
          </div>

          <div className="codex-step-item flex gap-4 bg-slate-950/60 p-4 rounded-xl border-l-4 border-purple-400">
            <span className="codex-step-num font-mono font-black text-purple-400 text-lg">03</span>
            <div className="text-xs md:text-sm">
              <strong className="text-white block mb-1">Graveyard System & Hand Overdraw:</strong>
              <p className="text-slate-400 leading-relaxed">
                Hand size is capped at <strong className="text-white">8 cards</strong> (excess drawn cards are burned directly to the Graveyard). Any creature defeated in combat, spell cast, or secret ward triggered is sent to your <strong className="text-purple-300">Graveyard</strong>. Click the Graveyard pile at any time to open the full interactive Graveyard Inspector.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE 4 TURN PHASES */}
      <section id="sec-turn-phases" className="codex-section bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-4 shadow-lg backdrop-blur-md">
        <h3 className="codex-heading text-lg md:text-xl font-bold font-serif text-sky-400 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          2. Turn Structure & Step Flow
        </h3>
        <p className="codex-text text-slate-300 text-sm leading-relaxed">
          Turns alternate sequentially. Within your turn, you have complete tactical freedom to summon, cast spells, use Commander powers, and declare attacks in any sequence that maximizes your strategy.
        </p>

        <div className="flex flex-col gap-3">
          <div className="bg-slate-950/60 p-4 rounded-xl border-l-4 border-blue-400 text-xs md:text-sm">
            <div className="flex items-center justify-between mb-1">
              <strong className="text-blue-300 font-bold text-sm">Phase 1: Mana Surge & Awaken Step</strong>
              <span className="text-blue-400 font-mono text-xs">Automatic at turn start</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              • <strong>Maximum Mana Growth:</strong> Your Max Mana increases by <strong className="text-white">+1</strong> every round until reaching the hard cap of <strong className="text-white">10 Mana</strong>.<br />
              • <strong>Full Mana Replenishment:</strong> Available Mana refills to 100% of your current maximum.<br />
              • <strong>Draw Step:</strong> Automatically draw 1 card from your deck (subject to 8-card hand limit and fatigue).<br />
              • <strong>Awaken & Thaw:</strong> Friendly creatures recover from being <strong className="text-amber-300">Exhausted</strong> and ready their attacks. Any creature frozen from the prior turn thaws out.<br />
              • <strong>Persistent Damage:</strong> Health and battle damage taken by creatures and commanders are <strong className="text-rose-400">permanent</strong> across turns—damage does not reset at the end of the round!
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border-l-4 border-yellow-400 text-xs md:text-sm">
            <div className="flex items-center justify-between mb-1">
              <strong className="text-yellow-300 font-bold text-sm">Phase 2: Main Tactical Phase</strong>
              <span className="text-yellow-400 font-mono text-xs">Active player priority</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Execute any of the following plays in any order as long as you have the required Mana:<br />
              • <strong>Summon Form I Initiates:</strong> Drag and drop a Form I creature onto any of your 5 battlefield lanes.<br />
              • <strong>In-Place Ascension (Evolution):</strong> Drop a higher-tier creature onto an existing ally of the same element to evolve it at a discounted Mana cost.<br />
              • <strong>Cast Spells:</strong> Activate instant damage, card draws, single-target heals, or battlefield wipes.<br />
              • <strong>Set Secret Wards:</strong> Pay 2 Mana to lay a facedown trap into one of your 3 Rune slots.<br />
              • <strong>Champion Power (Surge):</strong> Pay 2 Mana to activate your Commander&apos;s unique skill (usable once per turn).
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border-l-4 border-rose-400 text-xs md:text-sm">
            <div className="flex items-center justify-between mb-1">
              <strong className="text-rose-300 font-bold text-sm">Phase 3: Combat / Battle Engagements</strong>
              <span className="text-rose-400 font-mono text-xs">Simultaneous Damage</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              • <strong>Ready Units:</strong> Any creature highlighted with a pulsing green ring is ready to attack.<br />
              • <strong>Targeting Reticle:</strong> Click a ready creature to initiate the targeting laser, then click an enemy creature or the enemy Commander.<br />
              • <strong>Simultaneous Retaliation:</strong> When two creatures clash, both deal their ATK to each other&apos;s HP simultaneously.<br />
              • <strong>Taunt Rule:</strong> If an opposing creature possesses <strong className="text-amber-300">[Taunt]</strong>, all direct strikes to the enemy Commander and non-taunt targets are blocked until the Taunt creature is destroyed.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border-l-4 border-purple-400 text-xs md:text-sm">
            <div className="flex items-center justify-between mb-1">
              <strong className="text-purple-300 font-bold text-sm">Phase 4: End Turn & Pass Priority</strong>
              <span className="text-purple-400 font-mono text-xs">Spacebar or Click Button</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              • Any unspent Mana expires. Turn buffs expire.<br />
              • In <strong className="text-purple-300">Local Couch Co-Op Mode</strong>, the <strong className="text-white">Privacy Shield Curtain</strong> instantly drops over the screen so secret hands and facedown wards are completely concealed before passing control to Player 2!
            </p>
          </div>
        </div>
      </section>

      {/* NEW INTERACTIVE SECTION: HOW IT'S PLAYED (STEP-BY-STEP) */}
      <section id="sec-how-played" className="codex-section bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-800/80 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-xl relative">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg md:text-2xl font-bold font-serif text-emerald-400 flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-400" />
            How It&apos;s Played: Complete Match Walkthrough
          </h3>
          <span className="text-xs font-mono uppercase bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-full border border-emerald-700/60">
            Step-by-Step Tactical Flow
          </span>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Whether you are facing the smart Solo AI, competing on the ranked ladder, or playing Pass & Play Couch Co-op, every match flows through four distinct phases:
        </p>

        {/* Step Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { step: 1, title: 'Step 1: Setup', time: 'Pre-Match' },
            { step: 2, title: 'Step 2: Early Game', time: 'Turns 1–3' },
            { step: 3, title: 'Step 3: Mid Game', time: 'Turns 4–6' },
            { step: 4, title: 'Step 4: Endgame', time: 'Turns 7+' }
          ].map(item => (
            <button
              key={item.step}
              onClick={() => setActiveWalkthroughStep(item.step)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                activeWalkthroughStep === item.step
                  ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={activeWalkthroughStep === item.step ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  Phase {item.step}
                </span>
                <span className="text-[10px] text-slate-500">{item.time}</span>
              </div>
              <strong className="text-xs md:text-sm font-semibold">{item.title}</strong>
            </button>
          ))}
        </div>

        {/* Dynamic Walkthrough Content Box */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 md:p-6 text-sm">
          {activeWalkthroughStep === 1 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-serif text-base">
                <PlayCircle className="w-5 h-5" /> Step 1: Pre-Match Setup & Opening Draws
              </div>
              <p className="text-slate-300 leading-relaxed">
                Before battle begins, each player selects their <strong className="text-white">Champion Commander</strong> and custom or preset deck (Solar Pyre, Void Shadow, Verdant Nature, Tide Water, or Astral Chrono).
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs md:text-sm">
                <li>Both Commanders start with <strong className="text-rose-400">30 HP</strong> in their Command Zone.</li>
                <li>Each player draws an opening hand of <strong className="text-white">4 cards</strong>.</li>
                <li>Both players start on <strong className="text-amber-300">Turn 1 with 1 Maximum Mana</strong>.</li>
                <li>Determine first turn priority automatically (Player 1 initiates).</li>
              </ul>
            </div>
          )}

          {activeWalkthroughStep === 2 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-serif text-base">
                <Zap className="w-5 h-5" /> Step 2: Early Game Board Development (Turns 1 – 3)
              </div>
              <p className="text-slate-300 leading-relaxed">
                The early turns focus on claiming lane control, managing your growing Mana curve, and placing foundational units:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2 text-xs">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-amber-400 font-bold block mb-1">Turn 1 (1 Mana)</span>
                  <p className="text-slate-400">Summon a 1-cost initiate (e.g., <em>Flame Drake</em> or <em>Moss Sprite</em>) into an open lane.</p>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-amber-400 font-bold block mb-1">Turn 2 (2 Mana)</span>
                  <p className="text-slate-400">Decide between summoning a 2-cost minion, laying a facedown <strong>Secret Ward</strong>, or using your 2-Mana Hero Power.</p>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-amber-400 font-bold block mb-1">Turn 3 (3 Mana)</span>
                  <p className="text-slate-400">Prior units awaken! Trade into opposing minions or strike the enemy Commander directly if no Taunt blocks you.</p>
                </div>
              </div>
            </div>
          )}

          {activeWalkthroughStep === 3 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold font-serif text-base">
                <Sparkles className="w-5 h-5" /> Step 3: Mid-Game In-Place Ascension (Turns 4 – 6)
              </div>
              <p className="text-slate-300 leading-relaxed">
                Mana pools expand to 4–6. This is where TCG Turbo&apos;s signature <strong className="text-amber-300">In-Place Ascension</strong> changes the flow of battle:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs md:text-sm">
                <li><strong className="text-white">Discounted Evolution:</strong> Instead of spending 6 Mana for a fresh Apex titan, evolve a 2-cost minion for just <strong className="text-amber-300">4 Mana</strong> ($6 - 2$).</li>
                <li><strong className="text-white">Instant Ascension Rush:</strong> Evolved units can attack the exact turn they evolve—no summoning sickness!</li>
                <li><strong className="text-white">Baiting Traps:</strong> Before committing your biggest attacker to the enemy Vanguard, test their backrow with a smaller unit to trigger any hidden <em className="text-purple-300">Sunfire Sigils</em> or <em className="text-sky-300">Glacial Stasis</em> wards.</li>
              </ul>
            </div>
          )}

          {activeWalkthroughStep === 4 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold font-serif text-base">
                <Award className="w-5 h-5" /> Step 4: Late Game & Victory Climax (Turns 7 – 10+)
              </div>
              <p className="text-slate-300 leading-relaxed">
                With 7 to 10 Mana available, commanders unleash game-ending combinations, mass board freezes, and ultimate abilities:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs md:text-sm">
                <li><strong className="text-white">High-Tier Apex Titans:</strong> Form III titans boast massive ATK and crushing passive traits like multi-target splash damage or total board freezes.</li>
                <li><strong className="text-white">Overcoming Taunt Walls:</strong> Utilize direct-damage arcane spells or tactical Aegis shields to punch through high-HP defenders.</li>
                <li><strong className="text-white">Victory:</strong> Reduce the opposing Vanguard Champion&apos;s HP to 0 to claim victory, earn Astral Gems, and unlock new booster packs!</li>
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: ASCENSION SYSTEM */}
      <section id="sec-ascension" className="codex-section bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-4 shadow-lg backdrop-blur-md">
        <h3 className="codex-heading text-lg md:text-xl font-bold font-serif text-sky-400 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          3. In-Place Ascension & Evolution Engine
        </h3>
        <p className="codex-text text-slate-300 text-sm leading-relaxed">
          Ascension is TCG Turbo&apos;s hallmark mechanic: low-cost initiates evolve directly in their lane into titanic powerhouses without forfeiting tempo:
        </p>

        <div className="bg-slate-950/80 border-l-4 border-amber-400 p-4 rounded-r-xl">
          <strong className="text-amber-300 text-sm md:text-base block mb-2">The Intuitive Evolution Discount Formula</strong>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-2">
            Summoning a creature onto an <em>empty lane</em> requires paying its full printed Mana cost. However, dropping it onto a friendly allied creature of the <strong className="text-white">same element</strong> triggers an Evolution discount:
          </p>
          <code className="bg-slate-900 text-yellow-300 px-3 py-1.5 rounded-lg font-mono text-xs font-bold inline-block border border-slate-800">
            Actual Mana Cost = Max(1, New Creature Cost - Base Creature Cost)
          </code>
          <p className="text-slate-400 text-xs mt-2">
            <em>Example:</em> Dropping 7-Mana Ignis onto a 1-Mana Drake costs only <strong>6 Mana</strong>. Dropping Ignis onto a 4-Mana Pyre Vanguard costs only <strong>3 Mana</strong>! The battlefield highlights valid evolution targets with a pulsing gold badge.
          </p>
        </div>

        <div className="bg-slate-950/80 border-l-4 border-sky-400 p-4 rounded-r-xl">
          <strong className="text-sky-300 text-sm md:text-base block mb-2">Ascension Rush & Ascension Bursts</strong>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            • <strong>Immediate Attack (Ascension Rush):</strong> Unlike freshly summoned units that enter the battlefield <strong className="text-amber-300">Exhausted</strong>, an Ascended creature can attack immediately on the turn it evolves!<br />
            • <strong>Ascension Bursts:</strong> High-tier titans trigger catastrophic board effects upon arrival (e.g., <em>Ignis Apex</em> deals 3 AoE damage to all enemy units; <em>Tethys</em> freezes all enemy lanes).
          </p>
        </div>
      </section>

      {/* SECTION 4: KEYWORDS */}
      <section id="sec-keywords" className="codex-section bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-4 shadow-lg backdrop-blur-md">
        <h3 className="codex-heading text-lg md:text-xl font-bold font-serif text-sky-400 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          4. Keyword Glossary & Combat Mechanics
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-950/60 text-amber-300 font-serif">
                <th className="p-3">Keyword</th>
                <th className="p-3">Combat Mechanic & Interaction</th>
                <th className="p-3">Example Card</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="p-3 text-amber-300 font-bold font-mono">[Taunt]</td>
                <td className="p-3 text-slate-300">Enemies MUST attack this unit before attacking other friendly minions or declaring direct strikes on your Champion Commander.</td>
                <td className="p-3 text-slate-400">Moss Sprite, Yggdrasil Ancient</td>
              </tr>
              <tr>
                <td className="p-3 text-yellow-400 font-bold font-mono">[Aegis]</td>
                <td className="p-3 text-slate-300">A divine energy barrier. Completely absorbs and negates the next instance of combat or spell damage, then breaks.</td>
                <td className="p-3 text-slate-400">Pyre Paladin, Chronos</td>
              </tr>
              <tr>
                <td className="p-3 text-rose-400 font-bold font-mono">[Rush]</td>
                <td className="p-3 text-slate-300">Can attack enemy creatures or the Champion Commander immediately on the turn it is placed onto the field.</td>
                <td className="p-3 text-slate-400">Nyx Valkyrie, Ignis Apex</td>
              </tr>
              <tr>
                <td className="p-3 text-purple-400 font-bold font-mono">[Lifesteal]</td>
                <td className="p-3 text-slate-300">Whenever this creature deals damage, an equal amount of HP is restored directly to your Champion Commander.</td>
                <td className="p-3 text-slate-400">Nyx Eclipse Valkyrie, Dreadlord</td>
              </tr>
              <tr>
                <td className="p-3 text-sky-400 font-bold font-mono">[Freeze]</td>
                <td className="p-3 text-slate-300">Frozen units cannot declare attacks on their next turn. They naturally thaw out at the start of their controller&apos;s following turn.</td>
                <td className="p-3 text-slate-400">Coral Nymph, Abyssal Deluge</td>
              </tr>
              <tr>
                <td className="p-3 text-emerald-400 font-bold font-mono">[Deathrattle]</td>
                <td className="p-3 text-slate-300">Triggers an automatic effect when this creature is destroyed and sent to the Graveyard (e.g., drawing cards, dealing death damage).</td>
                <td className="p-3 text-slate-400">Voidling Assassin (Draws 1 Card)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 5: SECRET WARDS */}
      <section id="sec-wards" className="codex-section bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-4 shadow-lg backdrop-blur-md">
        <h3 className="codex-heading text-lg md:text-xl font-bold font-serif text-sky-400 flex items-center gap-2">
          <Droplets className="w-5 h-5 text-purple-400" />
          5. Secret Wards & Trap Timing Rules
        </h3>
        <p className="codex-text text-slate-300 text-sm leading-relaxed">
          Wards cost <strong className="text-white">2 Mana</strong> and are placed facedown into your 3 Rune slots. Opponents only see a shimmering runic seal. When the opposing player meets the trigger condition, the Ward reveals and resolves immediately:
        </p>

        <div className="flex flex-col gap-3">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border-l-4 border-amber-400 text-xs md:text-sm">
            <strong className="text-amber-400 block font-bold mb-1">☀️ Sunfire Sigil (Solar)</strong>
            <p className="text-slate-300"><em>Trigger:</em> When your Commander is attacked directly.<br /><em>Effect:</em> Deals 4 retaliatory damage to the attacking unit before combat damage resolves.</p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border-l-4 border-purple-400 text-xs md:text-sm">
            <strong className="text-purple-400 block font-bold mb-1">🌑 Shadow Mirror Ward (Void)</strong>
            <p className="text-slate-300"><em>Trigger:</em> When an opponent Ascends a Form II or Form III Apex monster.<br /><em>Effect:</em> Siphons the titan&apos;s strength, immediately reducing its ATK to 1.</p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border-l-4 border-emerald-400 text-xs md:text-sm">
            <strong className="text-emerald-400 block font-bold mb-1">🌿 Thornsnare Ward (Verdant)</strong>
            <p className="text-slate-300"><em>Trigger:</em> When an enemy creature declares an attack.<br /><em>Effect:</em> Instantly destroys the attacker if it has 3 or less remaining HP.</p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border-l-4 border-sky-400 text-xs md:text-sm">
            <strong className="text-sky-400 block font-bold mb-1">🌊 Glacial Stasis Ward (Tide)</strong>
            <p className="text-slate-300"><em>Trigger:</em> When an enemy declares a direct strike on your Commander.<br /><em>Effect:</em> Completely negates the incoming attack and Freezes the attacker.</p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border-l-4 border-rose-400 text-xs md:text-sm">
            <strong className="text-rose-400 block font-bold mb-1">✨ Continuum Collapse Ward (Astral)</strong>
            <p className="text-slate-300"><em>Trigger:</em> When your Commander would take fatal lethal damage.<br /><em>Effect:</em> Prevents death, locks Commander HP at 1, and draws 2 emergency cards.</p>
          </div>
        </div>
      </section>

      {/* SECTION 6: VANGUARD CHAMPIONS */}
      <section id="sec-vanguards" className="codex-section bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-4 shadow-lg backdrop-blur-md">
        <h3 className="codex-heading text-lg md:text-xl font-bold font-serif text-sky-400 flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400" />
          6. The 5 Vanguard Champions & Hero Powers
        </h3>
        <p className="codex-text text-slate-300 text-sm leading-relaxed">
          Every Vanguard Champion has 30 HP and a 2-Mana Hero Power (Surge) that can be activated once per turn:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-950/60 text-amber-300 font-serif">
                <th className="p-3">Champion</th>
                <th className="p-3">Element</th>
                <th className="p-3">Hero Power</th>
                <th className="p-3">Cost & Effect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="p-3 text-white font-bold">Sol Invictus</td>
                <td className="p-3 text-amber-400 font-semibold">Solar / Pyre</td>
                <td className="p-3 text-slate-200">Solar Flare</td>
                <td className="p-3 text-slate-400"><strong>(2 Mana)</strong> Deal 2 direct damage to enemy Commander or lowest minion.</td>
              </tr>
              <tr>
                <td className="p-3 text-white font-bold">Lady Nyx</td>
                <td className="p-3 text-purple-400 font-semibold">Void / Shadow</td>
                <td className="p-3 text-slate-200">Shadow Infusion</td>
                <td className="p-3 text-slate-400"><strong>(2 Mana)</strong> Grant a friendly unit +2 ATK this turn.</td>
              </tr>
              <tr>
                <td className="p-3 text-white font-bold">Yggdra Heartwarden</td>
                <td className="p-3 text-emerald-400 font-semibold">Verdant / Nature</td>
                <td className="p-3 text-slate-200">Living Growth</td>
                <td className="p-3 text-slate-400"><strong>(2 Mana)</strong> Restore 3 HP to your Champion Commander.</td>
              </tr>
              <tr>
                <td className="p-3 text-white font-bold">Empress Tethys</td>
                <td className="p-3 text-sky-400 font-semibold">Tide / Water</td>
                <td className="p-3 text-slate-200">Ocean Ward</td>
                <td className="p-3 text-slate-400"><strong>(2 Mana)</strong> Grant a friendly creature an Aegis shield.</td>
              </tr>
              <tr>
                <td className="p-3 text-white font-bold">Grand Chronomancer</td>
                <td className="p-3 text-rose-400 font-semibold">Astral / Time</td>
                <td className="p-3 text-slate-200">Time Surge</td>
                <td className="p-3 text-slate-400"><strong>(2 Mana)</strong> Gain +1 temporary Mana and draw 1 card.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 7: US LEGAL COMPLIANCE & FAIR PLAY CHARTER */}
      <section id="sec-compliance" className="codex-section bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-4 shadow-lg backdrop-blur-md mb-8">
        <h3 className="codex-heading text-lg md:text-xl font-bold font-serif text-emerald-400 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          7. US Legal Compliance & Free Fair Play Charter
        </h3>
        <div className="bg-slate-950/80 border-l-4 border-emerald-400 p-4 rounded-r-xl text-xs md:text-sm text-slate-300 leading-relaxed flex flex-col gap-3">
          <p>
            <strong>100% Free-to-Play Entertainment Software:</strong> TCG Turbo is operated strictly as a non-gambling, free-to-play video game. Under United States federal and state laws (including UIGEA, FTC Gaming Guidelines, and COPPA):
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
            <li><strong>100% Cosmetic-Only Purchases:</strong> Real-money purchases are restricted exclusively to visual cosmetics (Card Backs, Avatar Frames, Arena Skins, and Foil Sheens). No cards, stats, or competitive gameplay advantages can be bought.</li>
            <li><strong>$100 Starting Credit:</strong> Every player receives $100 worth of pre-loaded virtual Cosmetic Currency (10,000 Astral Gems) upon initial launch.</li>
            <li><strong>Zero Cash Cashout Value ($0.00 USD):</strong> All virtual gems and cosmetic items are non-exchangeable for fiat currency and carry zero real-world cash value.</li>
            <li><strong>No Gameplay Microtransactions / No Pay-to-Win:</strong> Booster packs cannot be purchased with real money or gems; cards are unlocked exclusively through duel gameplay.</li>
            <li><strong>Free Peer-to-Peer Trading:</strong> Card gifting and duplicate card transfers between players remain 100% free with no cash transactions permitted.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
