# ⚔️ TCG Turbo

<p align="center">
  <img src="tt2/tcgturbo2/public/opengraph-image.png" alt="TCG Turbo Banner" width="100%" style="border-radius: 10px;" />
</p>

<p align="center">
  <strong>A fast-paced, high-octane Web Trading Card Game featuring 3D holographic physics, Vanguard Champion powers, tactical creature ascension, and couch co-op / AI modes.</strong>
</p>

<p align="center">
  <a href="#-key-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-game-mechanics">Game Mechanics</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a>
</p>

---

## 🌟 Key Features

* **🎴 3D Holographic Card Physics**: Interactive 3D tilt, dynamic mouse parallax reflection, foil shimmers, and micro-animations.
* **🛡️ Vanguard Champion Powers**: Unique hero avatars equipped with specialized passive abilities, dynamic power cooldowns, and tactical ultimate skills.
* **⚡ Tactical Creature Ascension**: Evolve and ascend low-tier creatures mid-combat into legendary powerhouse entities with boosted ATK/HP and empowered traits.
* **🎮 Multiple Game Modes**:
  * **Pass & Play Couch Co-Op**: Local head-to-head battle with built-in Privacy Shield curtain mode for secret hand management.
  * **Solo vs AI**: Multi-difficulty smart AI featuring aggressive, defensive, and tactical strategic algorithms.
  * **Quickplay & Ranked Ladder**: Instant action matchmaking with ranking tracking.
* **🛠️ Deck Construction & Analysis**: Built-in deck editor with mana curve visualization, archetype validation, and card filtering by element, rarity, and mechanics.
* **🎁 Booster Pack Opening & Collection**: Immersive card pack unboxing animations, rarity guarantees, interactive Card Almanac, and card trading system.
* **🎨 Shop & Customization**: Unlockable card back skins, battlefield playmats, player titles, avatars, and daily rotating shop items.
* **🎵 Dynamic Audio & Sound Engine**: Synthesized Web Audio API SFX for card playing, combat impact, spell casting, pack opening, and ambient soundtrack.

---

## 🚀 Quick Start

### Option A: Next.js 15 App (`tt2/tcgturbo2`)

The primary full-stack web application powered by **Next.js 15**, **React 19**, **Tailwind CSS**, and **Supabase**.

```bash
# 1. Navigate to the Next.js app directory
cd tt2/tcgturbo2

# 2. Install dependencies
npm install

# 3. Setup Environment Variables (Optional for Supabase Auth/Database)
cp .env.example .env.local

# 4. Launch development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to play.

### Option B: Standalone Web App (`s1`)

A lightweight, zero-dependency browser build with custom HTML5/CSS3 and Vanilla JS.

```bash
# Simply open s1/index.html in any modern web browser or serve with a static server:
npx serve s1
```

---

## 🏗️ Architecture

```
tcgturbo/
├── README.md                  # Main repository documentation
├── tt2/                       # Next.js 15 Full-Stack Implementation
│   └── tcgturbo2/
│       ├── app/               # Next.js App Router (pages, api, battle routes)
│       ├── components/tcg/    # Modular React TCG components
│       │   ├── BattleArena.tsx       # Interactive battlefield & combat interface
│       │   ├── Card.tsx              # 3D holographic card component
│       │   ├── DeckBuilder.tsx       # Custom deck builder & mana curve graph
│       │   ├── PackOpenerModal.tsx   # Pack opening animation modal
│       │   ├── CosmeticsShopModal.tsx# Shop & customization engine
│       │   └── RulesCodex.tsx        # Interactive rulebook & keyword reference
│       └── lib/tcg/           # Pure TCG game logic, AI heuristics, card database
│           ├── gameEngine.ts         # Turn execution, phase management, state
│           ├── aiPlayer.ts           # Decision-making heuristics for AI modes
│           ├── collectionEngine.ts   # Card packs, inventory & trading
│           └── soundEngine.ts        # Synthesized audio effects
└── s1/                        # HTML5 Canvas & CSS3 standalone prototype
    ├── index.html
    ├── css/                   # Modular CSS stylesheets (animations, cards, battlefield)
    └── js/                    # Client-side engine scripts
```

---

## ⚔️ Game Mechanics

### Turn Flow & Phases
1. **Draw Phase**: Gain +1 Maximum Mana (up to 10) and restore all available Mana. Draw 1 card from deck.
2. **Main Phase**: Play creatures, cast tactical spells, trigger Vanguard Champion powers, or ascend deployed creatures.
3. **Combat Phase**: Command active creatures to strike opposing minion targets or direct attack the enemy Vanguard Champion.
4. **End Turn**: Pass priority to the opposing commander.

### Card Types & Keywords
* **Creatures**: Tactical units with Attack (ATK) and Health (HP).
* **Spells**: Single-use tactical effects (burn, healing, buffing, board wipes).
* **Ascension Units**: Require sacrificing an active creature on the battlefield to summon an upgraded form with extra abilities.
* **Keywords**:
  * `Taunt`: Enemies must attack creatures with Taunt first.
  * `Rush`: Can attack enemy creatures on the same turn it is summoned.
  * `Lifesteal`: Healing dealt to owner equal to damage inflicted.
  * `Flying`: Can bypass non-flying creatures without Taunt.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI & View**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), Lucide Icons
- **Backend & Auth**: [Supabase](https://supabase.com/) (`@supabase/ssr`, `@supabase/supabase-js`)
- **Audio**: Web Audio API Synthesized Audio Engine

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
