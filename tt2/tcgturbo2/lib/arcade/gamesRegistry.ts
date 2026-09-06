export interface ArcadeGame {
  id: string;
  title: string;
  tagline: string;
  description: string;
  genre: 'TCG' | 'Casino' | 'Solitaire' | 'Puzzle' | 'Roguelike';
  players: '1P / 2P' | '1P' | 'Online 2P';
  tags: string[];
  thumbnail: string;
  badge?: string;
  isFlagship?: boolean;
  status: 'active' | 'playable' | 'coming_soon';
  releaseDate: string;
  playsCount: number;
  rating: number; // e.g. 4.9
}

export const ARCADE_GAMES: ArcadeGame[] = [
  {
    id: 'tcg_turbo',
    title: 'TCG Turbo: Astral Conduit',
    tagline: 'Flagship In-Place Ascension & Tactical Conduit TCG',
    description:
      'The premier competitive card battle arena. 5 creature lanes, Dedicated Champion Command Lane, secret runic wards, in-place form evolution, and 3D specular foil physics.',
    genre: 'TCG',
    players: '1P / 2P',
    tags: ['Ascension', 'Tactical', 'Competitive', '3D Foil', 'Traps'],
    thumbnail: '/assets/cards/card_ignis.jpg',
    badge: '🔥 FLAGSHIP GAME',
    isFlagship: true,
    status: 'active',
    releaseDate: 'Season 1 Live',
    playsCount: 142850,
    rating: 4.98
  },
  {
    id: 'astral_blackjack',
    title: 'Astral 21: Cosmic Blackjack',
    tagline: 'High-Stakes Blackjack with Elemental Multipliers',
    description:
      'Challenge the Astral Nexus dealer in a high-speed card count duel! Trigger Solar Double-Downs, Void Splits, and Tide Surges to multiply virtual Astral Gems.',
    genre: 'Casino',
    players: '1P',
    tags: ['Table Game', 'Cosmic Odds', 'Instant Play', 'Casual'],
    thumbnail: '/assets/cards/card_valkyrie.jpg',
    badge: '⚡ NEW ARCADE MINI-GAME',
    status: 'playable',
    releaseDate: 'Available Now',
    playsCount: 28410,
    rating: 4.85
  },
  {
    id: 'chrono_solitaire',
    title: 'Chrono Rift Solitaire',
    tagline: 'Speed Klondike fueled by Temporal Mana',
    description:
      'Stack astral suits and race against the ticking temporal clock. Rewind moves with Chronos magic and unlock mythical cosmic card backs.',
    genre: 'Solitaire',
    players: '1P',
    tags: ['Classic', 'Klondike', 'Time Attack', 'Relaxing'],
    thumbnail: '/assets/cards/card_time.jpg',
    badge: '🔮 PLAYABLE ARCADE',
    status: 'playable',
    releaseDate: 'Available Now',
    playsCount: 18900,
    rating: 4.79
  },
  {
    id: 'rune_memory_match',
    title: 'Verdant Rune Match',
    tagline: 'Memory Tile Match Duel with Astral Bosses',
    description:
      'Uncover matching celestial runes and ancient elder sigils before time runs out. Gain elemental combos to defeat guardian bosses.',
    genre: 'Puzzle',
    players: '1P',
    tags: ['Memory', 'Brain Training', 'Puzzles'],
    thumbnail: '/assets/cards/card_titan.jpg',
    badge: '🌿 PLAYABLE ARCADE',
    status: 'playable',
    releaseDate: 'Available Now',
    playsCount: 9400,
    rating: 4.67
  }
];
