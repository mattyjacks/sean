export type ElementType = 'solar' | 'void' | 'verdant' | 'tide' | 'astral';
export type CardType = 'creature' | 'spell' | 'ward';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Keyword = 'Taunt' | 'Aegis' | 'Rush' | 'Lifesteal' | 'Freeze' | 'Deathrattle' | 'Resonance' | 'Overpower' | 'Stealth' | 'Regen';

export type GameMode = 'couch_2p' | 'solo_ai';
export type TurnPhase = 'draw' | 'main' | 'combat' | 'end';

export interface CardDef {
  id: string;
  name: string;
  element: ElementType;
  form?: 1 | 2 | 3;
  ascendsFrom?: ElementType;
  type: CardType;
  cost: number;
  atk?: number;
  hp?: number;
  rarity: Rarity;
  art: string;
  cropOffset?: string;
  keywords?: Keyword[];
  desc?: string;
  lore?: string;
  hasTaunt?: boolean;
  hasAegis?: boolean;
  canAttackOnSummon?: boolean;
  lifesteal?: boolean;
  targetType?: 'any_enemy' | 'enemy_unit' | 'friendly_unit' | 'none';
  trigger?: 'on_champion_attacked' | 'on_vanguard_attacked' | 'on_enemy_ascend' | 'on_creature_attack' | 'on_direct_attack' | 'on_lethal_damage';
}

export interface CardInstance extends CardDef {
  instanceId: string;
  currentAtk: number;
  currentHp: number;
  maxHp: number;
  canAttack: boolean;
  hasAttackedThisTurn: boolean;
  frozen: boolean;
  hasAegis: boolean;
  isAscended?: boolean;
}

export interface HeroPower {
  name: string;
  cost: number;
  desc: string;
  icon?: string;
}

export interface ChampionHero {
  id: string;
  name: string;
  title: string;
  element: ElementType;
  avatar: string;
  hp: number;
  maxHp: number;
  heroPower: HeroPower;
  heroPowerUsed?: boolean;
}

// Backwards compatibility alias
export type VanguardHero = ChampionHero;

export interface PlayerState {
  id: 1 | 2;
  name: string;
  isAI: boolean;
  champion: ChampionHero;
  vanguard: ChampionHero; // compatibility alias
  mana: number;
  maxMana: number;
  deck: CardInstance[];
  hand: CardInstance[];
  board: (CardInstance | null)[]; // 5 creature lanes
  championLane: CardInstance | null; // Dedicated Champion Lane
  wards: (CardInstance | null)[]; // 3 secret trap slots
  graveyard: CardInstance[];
  extraTurns: number;
  hasDrawnThisTurn?: boolean;
}

export interface ActionLog {
  id: string;
  text: string;
  type: 'log-attack' | 'log-summon' | 'log-ascend' | 'log-trap' | 'log-turn' | 'log-info';
  time: string;
}

export interface FloatingCombatText {
  id: string;
  text: string;
  type: 'damage' | 'heal' | 'ascend' | 'shield';
  x: number;
  y: number;
}

export interface PresetDeck {
  name: string;
  champion: string;
  vanguard: string; // compatibility alias
  description: string;
  element: ElementType;
  cards: string[];
}

export interface GameState {
  mode: GameMode;
  round: number;
  currentTurn: 1 | 2;
  phase: TurnPhase;
  isPrivacyCurtainActive: boolean;
  winner: null | 1 | 2 | 'draw';
  players: [PlayerState, PlayerState];
  actionLogs: ActionLog[];
  floatingTexts: FloatingCombatText[];
}

export type CosmeticType = 'card_back' | 'avatar_border' | 'board_theme' | 'foil_style';

export interface CosmeticItem {
  id: string;
  name: string;
  type: CosmeticType;
  rarity: Rarity;
  priceGems: number;
  priceUSD: number;
  desc: string;
  previewColor: string;
  assetUrl?: string;
  badge?: string;
}

export interface CurrencyPackage {
  id: string;
  name: string;
  gems: number;
  bonusGems: number;
  priceUSD: number;
  badge?: string;
  popular?: boolean;
}

export interface EquippedCosmetics {
  cardBack: string;
  avatarBorder: string;
  boardTheme: string;
  foilStyle: string;
}

export type GameAction =
  | { type: 'playCard'; instanceId: string; targetLaneIndex?: number | 'champion' | null; targetUnitId?: string | null }
  | { type: 'declareAttack'; attackerInstanceId: string; targetType: 'champion' | 'vanguard' | 'creature' | 'champion_lane'; targetLaneOrId?: number | string | null }
  | { type: 'activateHeroPower' }
  | { type: 'drawCard' }
  | { type: 'advancePhase' }
  | { type: 'endTurn' };
