import { CARDS_DATA } from './cardsData';
import { CHAMPIONS_DATA, VANGUARDS_DATA, getChampionCardDef } from './vanguardsData';
import { PRESET_DECKS } from './presetDecks';
import { soundEngine } from './soundEngine';
import {
  CardDef,
  CardInstance,
  GameState,
  PlayerState,
  GameMode,
  ActionLog,
  FloatingCombatText,
  GameAction
} from './types';

let instanceCounter = 1;
let rngSeed = 1337;

export function pseudoRandom(): number {
  rngSeed = (rngSeed * 1664525 + 1013904223) % 4294967296;
  return rngSeed / 4294967296;
}

export function instantiateCard(cardDef: CardDef): CardInstance {
  return {
    ...cardDef,
    instanceId: `card_${instanceCounter++}`,
    currentAtk: cardDef.atk || 0,
    currentHp: cardDef.hp || 0,
    maxHp: cardDef.hp || 0,
    canAttack: false,
    frozen: false,
    hasAttackedThisTurn: false,
    hasAegis: !!cardDef.hasAegis
  };
}

export function createPlayer(
  id: 1 | 2,
  name: string,
  isAI: boolean,
  deckCardIds: string[],
  championOrVanguardId: string
): PlayerState {
  const championDef =
    CHAMPIONS_DATA.find(v => v.id === championOrVanguardId) ||
    VANGUARDS_DATA.find(v => v.id === championOrVanguardId) ||
    CHAMPIONS_DATA[0];

  const deck: CardInstance[] = [];
  deckCardIds.forEach(cardId => {
    const def = CARDS_DATA.find(c => c.id === cardId);
    if (def) {
      deck.push(instantiateCard(def));
    }
  });

  // Deterministic shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const champInst = {
    ...championDef,
    heroPowerUsed: false
  };

  const championCardDef = getChampionCardDef(champInst);
  const championCardInstance = instantiateCard(championCardDef);

  return {
    id,
    name,
    isAI,
    champion: champInst,
    vanguard: champInst,
    mana: 1,
    maxMana: 1,
    deck,
    hand: [championCardInstance],
    board: [null, null, null, null, null],
    championLane: null,
    wards: [null, null, null],
    graveyard: [],
    extraTurns: 0
  };
}

export function createInitialGame(
  mode: GameMode = 'solo_ai',
  p1DeckKey: string = 'solar_pyre',
  p2DeckKey: string = 'void_shadow',
  customP1Cards?: string[],
  customP2Cards?: string[]
): GameState {
  rngSeed = 1337;
  const p1Preset = PRESET_DECKS[p1DeckKey] || PRESET_DECKS.solar_pyre;
  const p2Preset = PRESET_DECKS[p2DeckKey] || PRESET_DECKS.void_shadow;

  const p1Cards = customP1Cards && customP1Cards.length >= 10 ? customP1Cards : p1Preset.cards;
  const p2Cards = customP2Cards && customP2Cards.length >= 10 ? customP2Cards : p2Preset.cards;

  const p1 = createPlayer(1, 'Player 1', false, p1Cards, p1Preset.champion || p1Preset.vanguard);
  const p2 = createPlayer(2, mode === 'solo_ai' ? 'AI Tactician' : 'Player 2', mode === 'solo_ai', p2Cards, p2Preset.champion || p2Preset.vanguard);

  let state: GameState = {
    mode,
    round: 1,
    currentTurn: 1,
    phase: 'draw',
    isPrivacyCurtainActive: false,
    winner: null,
    players: [p1, p2],
    actionLogs: [],
    floatingTexts: []
  };

  // Draw 4 cards for each player
  for (let i = 0; i < 4; i++) {
    state = drawCardInternal(state, 1, false);
    state = drawCardInternal(state, 2, false);
  }

  state = logMessage(state, `Duel begins! ${state.players[0].name} vs ${state.players[1].name}`, 'log-turn');
  return state;
}

export function logMessage(
  state: GameState,
  text: string,
  type: ActionLog['type'] = 'log-info'
): GameState {
  const newLog: ActionLog = {
    id: `log_${instanceCounter++}`,
    text,
    type,
    time: typeof window !== 'undefined' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '00:00:00'
  };
  return {
    ...state,
    actionLogs: [newLog, ...state.actionLogs.slice(0, 40)]
  };
}

export function addFloatingText(
  state: GameState,
  text: string,
  type: FloatingCombatText['type'],
  x: number = 0,
  y: number = 0
): GameState {
  const fct: FloatingCombatText = {
    id: `fct_${instanceCounter++}`,
    text,
    type,
    x,
    y
  };
  return {
    ...state,
    floatingTexts: [...state.floatingTexts, fct]
  };
}

export function clearFloatingTexts(state: GameState): GameState {
  if (state.floatingTexts.length === 0) return state;
  return {
    ...state,
    floatingTexts: []
  };
}

export function drawCardInternal(
  state: GameState,
  playerId: 1 | 2,
  playSound: boolean = true
): GameState {
  const playerIndex = playerId - 1;
  const player = state.players[playerIndex];

  // Fatigue
  if (player.deck.length === 0) {
    const nextHp = player.vanguard.hp - 2;
    let nextState = {
      ...state,
      players: state.players.map((p, idx) =>
        idx === playerIndex
          ? { ...p, vanguard: { ...p.vanguard, hp: Math.max(0, nextHp) } }
          : p
      ) as [PlayerState, PlayerState]
    };
    nextState = logMessage(nextState, `${player.name} takes 2 Fatigue damage! (Deck Empty)`, 'log-attack');
    return checkWinCondition(nextState);
  }

  const [drawn, ...remainingDeck] = player.deck;

  // Hand limit of 8
  if (player.hand.length >= 8) {
    let nextState = {
      ...state,
      players: state.players.map((p, idx) =>
        idx === playerIndex
          ? {
              ...p,
              deck: remainingDeck,
              graveyard: [...p.graveyard, drawn]
            }
          : p
      ) as [PlayerState, PlayerState]
    };
    nextState = logMessage(nextState, `${player.name}'s hand is full! ${drawn.name} was burned to Graveyard.`, 'log-trap');
    return nextState;
  }

  if (playSound) soundEngine.playCardDraw();

  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === playerIndex
        ? {
            ...p,
            deck: remainingDeck,
            hand: [...p.hand, drawn]
          }
        : p
    ) as [PlayerState, PlayerState]
  };
}

export function startTurn(state: GameState, playSound: boolean = true): GameState {
  const activeId = state.currentTurn;
  const activeIndex = activeId - 1;
  const active = state.players[activeIndex];

  const currentMax = active.maxMana ?? 1;

  // Increase Max Mana (up to 10)
  let nextMax = currentMax;
  if (state.round > 1 || activeId === 2) {
    nextMax = Math.min(10, currentMax + 1);
  }

  // Ready all friendly creatures, thaw frozen units & trigger Regen
  const nextBoard = active.board.map(creature => {
    if (!creature) return null;

    let currentHp = creature.currentHp;
    if (creature.keywords?.includes('Regen') && currentHp < creature.maxHp) {
      currentHp = Math.min(creature.maxHp, currentHp + 2);
    }

    if (creature.frozen) {
      return {
        ...creature,
        currentHp,
        frozen: false,
        canAttack: false,
        hasAttackedThisTurn: false
      };
    }
    return {
      ...creature,
      currentHp,
      canAttack: true,
      hasAttackedThisTurn: false
    };
  });

  let nextChampLane = active.championLane;
  if (nextChampLane) {
    let currentHp = nextChampLane.currentHp;
    if (nextChampLane.keywords?.includes('Regen') && currentHp < nextChampLane.maxHp) {
      currentHp = Math.min(nextChampLane.maxHp, currentHp + 2);
    }
    if (nextChampLane.frozen) {
      nextChampLane = {
        ...nextChampLane,
        currentHp,
        frozen: false,
        canAttack: false,
        hasAttackedThisTurn: false
      };
    } else {
      nextChampLane = {
        ...nextChampLane,
        currentHp,
        canAttack: true,
        hasAttackedThisTurn: false
      };
    }
  }

  let nextState: GameState = {
    ...state,
    phase: 'draw',
    isPrivacyCurtainActive: false,
    players: state.players.map((p, idx) =>
      idx === activeIndex
        ? {
            ...p,
            maxMana: nextMax,
            mana: nextMax,
            board: nextBoard,
            championLane: nextChampLane,
            hasDrawnThisTurn: false,
            champion: {
              ...(p.champion || p.vanguard),
              heroPowerUsed: false
            },
            vanguard: {
              ...(p.vanguard || p.champion),
              heroPowerUsed: false
            }
          }
        : p
    ) as [PlayerState, PlayerState]
  };

  nextState = logMessage(
    nextState,
    `${active.name}'s turn begins - Draw Phase (Mana: ${nextMax}/${nextMax})`,
    'log-turn'
  );

  if (playSound) soundEngine.playTurnChime();
  return nextState;
}

export function drawCardTurn(state: GameState, playSound: boolean = true): GameState {
  if (state.winner) return state;

  const activeId = state.currentTurn;
  const activeIndex = activeId - 1;
  const active = state.players[activeIndex];

  if (active.hasDrawnThisTurn) {
    if (state.phase === 'draw') {
      return { ...state, phase: 'main' };
    }
    return state;
  }

  let nextState = drawCardInternal(state, activeId, playSound);
  const updatedPlayers = nextState.players.map((p, idx) =>
    idx === activeIndex ? { ...p, hasDrawnThisTurn: true } : p
  ) as [PlayerState, PlayerState];

  nextState = {
    ...nextState,
    phase: 'main',
    players: updatedPlayers
  };

  nextState = logMessage(
    nextState,
    `${active.name} drew a card during Draw Phase ➔ Entering Main Phase!`,
    'log-info'
  );

  return nextState;
}

export function advancePhase(state: GameState): GameState {
  if (state.winner) return state;

  const activeIndex = state.currentTurn - 1;
  const active = state.players[activeIndex];

  if (state.phase === 'draw') {
    return drawCardTurn(state);
  } else if (state.phase === 'main') {
    const nextState: GameState = {
      ...state,
      phase: 'combat'
    };
    soundEngine.playTurnChime();
    return logMessage(nextState, `${active.name} enters Combat Phase! Declare your attacks.`, 'log-turn');
  } else if (state.phase === 'combat') {
    const nextState: GameState = {
      ...state,
      phase: 'end'
    };
    return endTurn(nextState);
  } else if (state.phase === 'end') {
    return endTurn(state);
  }

  return state;
}

export function canAscendOnUnit(
  card: CardDef | CardInstance,
  existingUnit: CardDef | CardInstance | null
): boolean {
  if (!existingUnit || card.type !== 'creature' || existingUnit.type !== 'creature') return false;
  if (card.element !== existingUnit.element) return false;
  return (
    card.cost > existingUnit.cost ||
    (!!card.form && !!existingUnit.form && card.form > existingUnit.form)
  );
}

export function calculateAscensionCost(
  card: CardDef | CardInstance,
  existingUnit: CardDef | CardInstance | null
): number {
  if (canAscendOnUnit(card, existingUnit) && existingUnit) {
    return Math.max(1, card.cost - existingUnit.cost);
  }
  return card.cost;
}

export function playCard(
  state: GameState,
  instanceId: string,
  targetLaneIndex: number | 'champion' | null = null,
  targetUnitId: string | null = null
): GameState {
  if (state.winner) return state;

  // Auto-complete draw phase if player attempts to play card during Draw Phase
  if (state.phase === 'draw') {
    state = drawCardTurn(state, false);
  }

  const activeIndex = state.currentTurn - 1;
  const opponentIndex = state.currentTurn === 1 ? 1 : 0;
  const active = state.players[activeIndex];

  const cardIndex = active.hand.findIndex(c => c.instanceId === instanceId);
  if (cardIndex === -1) return state;

  const card = active.hand[cardIndex];

  // Dedicated Champion Lane play
  const isChampionCard = targetLaneIndex === 'champion' || card.id.includes('_champion') || card.desc?.includes('Dedicated Champion Lane');

  if (isChampionCard) {
    if (active.championLane !== null) {
      return logMessage(state, 'Dedicated Champion Lane is already occupied!', 'log-trap');
    }
    const currentMana = active.mana ?? 0;
    if (currentMana < card.cost) {
      return logMessage(state, `Not enough Mana! Champion requires ${card.cost} Mana.`, 'log-trap');
    }

    const nextHand = active.hand.filter((_, idx) => idx !== cardIndex);
    const nextMana = currentMana - card.cost;
    const champUnit: CardInstance = {
      ...card,
      canAttack: !!card.canAttackOnSummon,
      hasAttackedThisTurn: false,
      frozen: false
    };

    soundEngine.playSummon();
    let nextState: GameState = {
      ...state,
      players: state.players.map((p, idx) =>
        idx === activeIndex
          ? {
              ...p,
              mana: nextMana,
              hand: nextHand,
              championLane: champUnit
            }
          : p
      ) as [PlayerState, PlayerState]
    };

    nextState = logMessage(
      nextState,
      `${active.name} summoned Champion ${card.name} into the Dedicated Champion Lane!`,
      'log-summon'
    );

    return checkWinCondition(nextState);
  }

  // Check lane & ascension
  let lane: number | null = typeof targetLaneIndex === 'number' && targetLaneIndex >= 0 && targetLaneIndex <= 4 ? targetLaneIndex : null;
  let existingUnit = lane !== null ? active.board[lane] : null;
  const isAscending = existingUnit ? canAscendOnUnit(card, existingUnit) : false;

  // If targeted lane is occupied and cannot ascend, redirect to an empty lane or reject safely
  if (existingUnit && !isAscending) {
    const emptyLaneIdx = active.board.findIndex(slot => slot === null);
    if (emptyLaneIdx !== -1) {
      lane = emptyLaneIdx;
      existingUnit = null;
    } else {
      return logMessage(state, 'Creature lane is occupied and card cannot ascend on selected unit!', 'log-trap');
    }
  }

  if (lane === null || lane < 0 || lane > 4) {
    lane = active.board.findIndex(slot => slot === null);
  }

  const actualCost = calculateAscensionCost(card, existingUnit);
  const currentMana = active.mana ?? 0;

  if (currentMana < actualCost) {
    return logMessage(state, `Not enough Mana! (Requires ${actualCost})`, 'log-trap');
  }

  // Remove card from hand and deduct cost
  const nextHand = active.hand.filter((_, idx) => idx !== cardIndex);
  const nextMana = currentMana - actualCost;

  const nextPlayers = [...state.players] as [PlayerState, PlayerState];
  nextPlayers[activeIndex] = {
    ...active,
    mana: nextMana,
    hand: nextHand
  };

  let nextState: GameState = {
    ...state,
    players: nextPlayers
  };

  // 1. SPELL CARD
  if (card.type === 'spell') {
    soundEngine.playSpell();
    nextState = logMessage(nextState, `${active.name} casts ${card.name}!`, 'log-summon');

    // Handle Spell Effects
    if (card.id === 'spell_solar_lance') {
      // Deal 3 damage to target enemy
      nextState = dealDirectOrUnitDamage(nextState, opponentIndex, 3, targetUnitId);
    } else if (card.id === 'spell_void_drain') {
      // Deal 3 damage to enemy unit and heal vanguard 3
      nextState = dealDirectOrUnitDamage(nextState, opponentIndex, 3, targetUnitId);
      nextState = healVanguard(nextState, activeIndex, 3);
    } else if (card.id === 'spell_feral_surge') {
      // Buff friendly unit +2/+3
      nextState = buffFriendlyUnit(nextState, activeIndex, 2, 3, targetUnitId);
    } else if (card.id === 'spell_tidal_wave') {
      // Deal 2 damage to all enemy units and freeze them
      nextState = aoeDamageAndFreezeEnemies(nextState, opponentIndex, 2);
    } else if (card.id === 'spell_temporal_rewind') {
      // Heal vanguard 6 and draw 1
      nextState = healVanguard(nextState, activeIndex, 6);
      nextState = drawCardInternal(nextState, (activeIndex + 1) as 1 | 2);
    }

    // Add to graveyard
    nextState = {
      ...nextState,
      players: nextState.players.map((p, idx) =>
        idx === activeIndex
          ? { ...p, graveyard: [...p.graveyard, card] }
          : p
      ) as [PlayerState, PlayerState]
    };

    return checkWinCondition(nextState);
  }

  // 2. SECRET WARD
  if (card.type === 'ward') {
    const emptyWardSlot = active.wards.findIndex(w => w === null);
    if (emptyWardSlot === -1) {
      return logMessage(state, 'All Secret Ward rune slots are full!', 'log-trap');
    }

    soundEngine.playSpell();
    nextState = logMessage(nextState, `${active.name} places a facedown Secret Ward!`, 'log-trap');

    const nextWards = [...active.wards];
    nextWards[emptyWardSlot] = card;

    nextState = {
      ...nextState,
      players: nextState.players.map((p, idx) =>
        idx === activeIndex ? { ...p, wards: nextWards } : p
      ) as [PlayerState, PlayerState]
    };

    return nextState;
  }

  // 3. CREATURE SUMMON OR ASCENSION
  if (card.type === 'creature') {
    if (lane === -1 && !isAscending) {
      return logMessage(state, 'All battlefield creature lanes are occupied!', 'log-trap');
    }

    const nextBoard = [...active.board];

    if (isAscending && existingUnit) {
      // IN-PLACE ASCENSION
      soundEngine.playAscend();
      const ascendedUnit: CardInstance = {
        ...card,
        currentAtk: Math.max(card.atk || 0, existingUnit.currentAtk + 1),
        currentHp: card.hp || 0,
        maxHp: card.hp || 0,
        canAttack: !existingUnit.hasAttackedThisTurn && !existingUnit.frozen, // Instant Ascension Rush if not already exhausted/frozen!
        hasAttackedThisTurn: existingUnit.hasAttackedThisTurn,
        frozen: existingUnit.frozen,
        hasAegis: card.hasAegis || existingUnit.hasAegis,
        isAscended: true
      };

      // Trigger Ascension Burst Abilities
      if (card.id === 'sol_paladin') {
        // Ascension: Gain +2 ATK
        ascendedUnit.currentAtk += 2;
      } else if (card.id === 'nyx_valkyrie') {
        // Ascension: Gain +2 HP
        ascendedUnit.currentHp += 2;
        ascendedUnit.maxHp += 2;
      }

      nextBoard[lane] = ascendedUnit;
      nextState = logMessage(
        nextState,
        `${active.name} ASCENDED ${existingUnit.name} into ${card.name}! (Cost Discount Applied)`,
        'log-ascend'
      );

      nextState = {
        ...nextState,
        players: nextState.players.map((p, idx) =>
          idx === activeIndex
            ? { ...p, board: nextBoard, graveyard: [...p.graveyard, existingUnit] }
            : p
        ) as [PlayerState, PlayerState]
      };

      if (card.id === 'ignis_apex') {
        // AoE 3 to all enemy units
        nextState = aoeDamageEnemies(nextState, opponentIndex, 3);
      } else if (card.id === 'void_reaper_apex') {
        // Destroy lowest health enemy creature
        nextState = destroyLowestHealthEnemy(nextState, opponentIndex);
      } else if (card.id === 'yggdrasil_titan') {
        // Heal 4 to all friendly units and vanguard
        nextState = healAllFriendly(nextState, activeIndex, 4);
      } else if (card.id === 'verdant_hydra_apex') {
        // +1 permanent max mana
        nextState = grantPermanentMana(nextState, activeIndex, 1);
      } else if (card.id === 'tethys_tide_weaver') {
        // Draw 2 and freeze all enemy units
        nextState = drawCardInternal(nextState, (activeIndex + 1) as 1 | 2);
        nextState = drawCardInternal(nextState, (activeIndex + 1) as 1 | 2);
        nextState = freezeAllEnemies(nextState, opponentIndex);
      } else if (card.id === 'kraken_apex') {
        // Bounce enemy creature
        nextState = bounceOpponentUnit(nextState, opponentIndex);
      } else if (card.id === 'astral_seer') {
        // Discover card
        nextState = discoverCard(nextState, activeIndex);
      } else if (card.id === 'astral_chronos_apex') {
        // Extra turn
        nextState = grantExtraTurn(nextState, activeIndex);
      }

      // Check opponent wards: on_enemy_ascend
      nextState = checkAndTriggerWards(nextState, opponentIndex, 'on_enemy_ascend', ascendedUnit);

      return checkWinCondition(nextState);
    } else {
      // FRESH SUMMON
      soundEngine.playSummon();
      const summonedUnit: CardInstance = {
        ...card,
        canAttack: !!card.canAttackOnSummon, // Rush units attack immediately
        hasAttackedThisTurn: false,
        frozen: false
      };

      nextBoard[lane] = summonedUnit;
      nextState = logMessage(
        nextState,
        `${active.name} summoned ${card.name} into Lane ${lane + 1}`,
        'log-summon'
      );

      nextState = {
        ...nextState,
        players: nextState.players.map((p, idx) =>
          idx === activeIndex ? { ...p, board: nextBoard } : p
        ) as [PlayerState, PlayerState]
      };

      // Battlecries
      if (card.id === 'sol_initiate') {
        nextState = dealDirectOrLowestDamage(nextState, opponentIndex, 1);
      } else if (card.id === 'tide_siren_initiate') {
        nextState = freezeTargetCreature(nextState, opponentIndex);
      } else if (card.id === 'aurelius_chronomancer') {
        nextState = reduceHandCosts(nextState, activeIndex, 1);
      } else if (card.id === 'verdant_sprout') {
        nextState = healVanguard(nextState, activeIndex, 2);
      }

      return checkWinCondition(nextState);
    }
  }

  return nextState;
}

export function declareAttack(
  state: GameState,
  attackerInstanceId: string,
  targetType: 'champion' | 'vanguard' | 'creature' | 'champion_lane',
  targetLaneOrId: number | string | null = null
): GameState {
  if (state.winner) return state;

  // Auto-advance to Combat Phase if attack is declared in Draw or Main Phase
  if (state.phase === 'draw') {
    state = drawCardTurn(state, false);
  }
  if (state.phase === 'main') {
    state = {
      ...state,
      phase: 'combat'
    };
    state = logMessage(state, `${state.players[state.currentTurn - 1].name} transitions to Combat Phase!`, 'log-turn');
  }

  const activeIndex = state.currentTurn - 1;
  const opponentIndex = state.currentTurn === 1 ? 1 : 0;
  const active = state.players[activeIndex];
  const opponent = state.players[opponentIndex];

  const attackerLane = active.board.findIndex(c => c && c.instanceId === attackerInstanceId);
  let isAttackerInChampLane = false;
  let attacker: CardInstance | null = null;

  if (attackerLane !== -1) {
    attacker = active.board[attackerLane];
  } else if (active.championLane && active.championLane.instanceId === attackerInstanceId) {
    attacker = active.championLane;
    isAttackerInChampLane = true;
  }

  if (!attacker || !attacker.canAttack || attacker.hasAttackedThisTurn || attacker.frozen) {
    return logMessage(state, `${attacker?.name || 'Creature'} cannot attack right now!`, 'log-trap');
  }

  const tauntCreatures = [
    ...opponent.board.filter(c => c && c.hasTaunt),
    ...(opponent.championLane && opponent.championLane.hasTaunt ? [opponent.championLane] : [])
  ];

  // 1. ATTACK ENEMY CHAMPION (COMMANDER)
  if (targetType === 'champion' || targetType === 'vanguard') {
    if (tauntCreatures.length > 0) {
      return logMessage(state, `Taunt guardian is blocking direct attacks! Destroy it first.`, 'log-trap');
    }

    // Check direct attack ward triggers (e.g. Glacial Stasis Ward negates & freezes)
    const { state: wardState, negated } = checkWardNegation(
      state,
      opponentIndex,
      'on_direct_attack',
      attacker
    );
    if (negated) {
      soundEngine.playTrap();
      let s = logMessage(wardState, `Direct strike negated by Secret Ward!`, 'log-trap');
      // Attacker exhausts
      s = exhaustCreature(s, activeIndex, isAttackerInChampLane ? 'champion' : attackerLane);
      return s;
    }

    // Check champion/vanguard attacked wards (e.g. Sunfire Sigil deals 4 to attacker)
    let nextState = checkAndTriggerWards(wardState, opponentIndex, 'on_champion_attacked', attacker);
    nextState = checkAndTriggerWards(nextState, opponentIndex, 'on_vanguard_attacked', attacker);

    soundEngine.playAttack();
    const damage = attacker.currentAtk;
    const oppChamp = opponent.champion || opponent.vanguard;
    const nextOppHp = oppChamp.hp - damage;

    nextState = logMessage(
      nextState,
      `${attacker.name} strikes Champion ${oppChamp.name} directly for ${damage} damage!`,
      'log-attack'
    );

    nextState = {
      ...nextState,
      players: nextState.players.map((p, idx) =>
        idx === opponentIndex
          ? {
              ...p,
              champion: { ...(p.champion || p.vanguard), hp: Math.max(0, nextOppHp) },
              vanguard: { ...(p.vanguard || p.champion), hp: Math.max(0, nextOppHp) }
            }
          : p
      ) as [PlayerState, PlayerState]
    };

    // Lifesteal
    if (attacker.lifesteal) {
      nextState = healVanguard(nextState, activeIndex, damage);
    }

    // Check lethal ward (Continuum Collapse Ward)
    if (nextOppHp <= 0) {
      nextState = checkLethalWard(nextState, opponentIndex);
    }

    nextState = exhaustCreature(nextState, activeIndex, isAttackerInChampLane ? 'champion' : attackerLane);
    return checkWinCondition(nextState);
  }

  // 2. ATTACK ENEMY CREATURE IN LANE
  if (targetType === 'creature') {
    let defenderLane = -1;
    if (typeof targetLaneOrId === 'number') {
      defenderLane = targetLaneOrId;
    } else if (typeof targetLaneOrId === 'string') {
      const foundIdx = opponent.board.findIndex(c => c && c.instanceId === targetLaneOrId);
      if (foundIdx !== -1) {
        defenderLane = foundIdx;
      } else {
        const parsed = parseInt(targetLaneOrId, 10);
        if (!isNaN(parsed)) defenderLane = parsed;
      }
    }

    if (defenderLane < 0 || defenderLane >= opponent.board.length) return state;
    const defender = opponent.board[defenderLane];
    if (!defender) return state;

    if (defender.keywords?.includes('Stealth')) {
      return logMessage(state, `${defender.name} has Stealth and cannot be targeted!`, 'log-trap');
    }

    if (tauntCreatures.length > 0 && !defender.hasTaunt) {
      return logMessage(state, `Must attack the Taunt guardian first!`, 'log-trap');
    }

    // Check on_creature_attack ward (e.g. Thornsnare destroys attacker if <= 3 HP)
    let nextState = checkAndTriggerWards(state, opponentIndex, 'on_creature_attack', attacker);

    // If attacker died from ward before damage
    const liveAttacker = nextState.players[activeIndex].board[attackerLane];
    if (!liveAttacker || liveAttacker.currentHp <= 0) {
      return checkWinCondition(nextState);
    }

    soundEngine.playAttack();
    nextState = logMessage(
      nextState,
      `${attacker.name} attacks ${defender.name}! (Simultaneous Clash)`,
      'log-attack'
    );

    let defenderHp = defender.currentHp;
    let attackerHp = liveAttacker.currentHp;
    let defHasAegis = defender.hasAegis;
    let attHasAegis = liveAttacker.hasAegis;

    // Defender takes damage
    if (defHasAegis) {
      defHasAegis = false;
      nextState = logMessage(nextState, `${defender.name}'s Aegis absorbed the blow!`, 'log-summon');
    } else {
      defenderHp -= liveAttacker.currentAtk;
    }

    // Attacker takes retribution damage
    if (attHasAegis) {
      attHasAegis = false;
      nextState = logMessage(nextState, `${liveAttacker.name}'s Aegis absorbed the retribution!`, 'log-summon');
    } else {
      attackerHp -= defender.currentAtk;
    }

    // Update attacker & defender states
    const nextActiveBoard = [...nextState.players[activeIndex].board];
    const nextOppBoard = [...nextState.players[opponentIndex].board];
    const nextActiveGrave = [...nextState.players[activeIndex].graveyard];
    const nextOppGrave = [...nextState.players[opponentIndex].graveyard];

    if (defenderHp <= 0) {
      if (liveAttacker.keywords?.includes('Overpower') && !defender.hasAegis) {
        const excess = Math.abs(defenderHp);
        if (excess > 0) {
          const vHp = Math.max(0, nextState.players[opponentIndex].vanguard.hp - excess);
          nextState = logMessage(
            nextState,
            `OVERPOWER: ${excess} spillover damage strikes ${nextState.players[opponentIndex].vanguard.name}!`,
            'log-attack'
          );
          nextState = {
            ...nextState,
            players: nextState.players.map((p, idx) =>
              idx === opponentIndex ? { ...p, vanguard: { ...p.vanguard, hp: vHp } } : p
            ) as [PlayerState, PlayerState]
          };
        }
      }

      nextOppBoard[defenderLane] = null;
      nextOppGrave.push(defender);
      nextState = logMessage(nextState, `${defender.name} was destroyed!`, 'log-attack');
      if (defender.keywords?.includes('Deathrattle') || defender.id === 'void_stalker') {
        nextState = drawCardInternal(nextState, (opponentIndex + 1) as 1 | 2);
      }
    } else {
      nextOppBoard[defenderLane] = {
        ...defender,
        currentHp: defenderHp,
        hasAegis: defHasAegis
      };
    }

    let nextActiveChampLane = nextState.players[activeIndex].championLane;

    if (attackerHp <= 0) {
      if (isAttackerInChampLane) {
        nextActiveChampLane = null;
      } else if (attackerLane >= 0) {
        nextActiveBoard[attackerLane] = null;
      }
      nextActiveGrave.push(liveAttacker);
      nextState = logMessage(nextState, `${liveAttacker.name} was destroyed!`, 'log-attack');
      if (liveAttacker.keywords?.includes('Deathrattle') || liveAttacker.id === 'void_stalker') {
        nextState = drawCardInternal(nextState, (activeIndex + 1) as 1 | 2);
      }
    } else {
      if (isAttackerInChampLane) {
        nextActiveChampLane = {
          ...liveAttacker,
          currentHp: attackerHp,
          hasAegis: attHasAegis,
          canAttack: false,
          hasAttackedThisTurn: true
        };
      } else if (attackerLane >= 0) {
        nextActiveBoard[attackerLane] = {
          ...liveAttacker,
          currentHp: attackerHp,
          hasAegis: attHasAegis,
          canAttack: false,
          hasAttackedThisTurn: true
        };
      }
    }

    if (liveAttacker.lifesteal) {
      nextState = healVanguard(nextState, activeIndex, liveAttacker.currentAtk);
    }

    nextState = {
      ...nextState,
      players: nextState.players.map((p, idx) => {
        if (idx === activeIndex) {
          return { ...p, board: nextActiveBoard, championLane: nextActiveChampLane, graveyard: nextActiveGrave };
        }
        if (idx === opponentIndex) {
          return { ...p, board: nextOppBoard, graveyard: nextOppGrave };
        }
        return p;
      }) as [PlayerState, PlayerState]
    };

    return checkWinCondition(nextState);
  }

  // 3. ATTACK ENEMY CHAMPION IN CHAMPION LANE
  if (targetType === 'champion_lane') {
    const defender = opponent.championLane;
    if (!defender) return state;

    if (defender.keywords?.includes('Stealth')) {
      return logMessage(state, `${defender.name} has Stealth and cannot be targeted!`, 'log-trap');
    }

    if (tauntCreatures.length > 0 && !defender.hasTaunt) {
      return logMessage(state, `Must attack the Taunt guardian first!`, 'log-trap');
    }

    let nextState = checkAndTriggerWards(state, opponentIndex, 'on_creature_attack', attacker);
    soundEngine.playAttack();

    nextState = logMessage(
      nextState,
      `${attacker.name} attacks Champion ${defender.name} in Champion Lane!`,
      'log-attack'
    );

    const defenderHp = defender.currentHp - attacker.currentAtk;
    const attackerHp = attacker.currentHp - defender.currentAtk;

    const nextActiveBoard = [...nextState.players[activeIndex].board];
    let nextActiveChampLane = nextState.players[activeIndex].championLane;
    const nextOppBoard = [...nextState.players[opponentIndex].board];
    let nextOppChampLane = nextState.players[opponentIndex].championLane;

    const nextActiveGrave = [...nextState.players[activeIndex].graveyard];
    const nextOppGrave = [...nextState.players[opponentIndex].graveyard];

    if (defenderHp <= 0) {
      nextOppChampLane = null;
      nextOppGrave.push(defender);
      nextState = logMessage(nextState, `Champion ${defender.name} was defeated and sent to Graveyard!`, 'log-attack');
    } else {
      nextOppChampLane = { ...defender, currentHp: defenderHp };
    }

    if (attackerHp <= 0) {
      if (isAttackerInChampLane) {
        nextActiveChampLane = null;
      } else if (attackerLane >= 0) {
        nextActiveBoard[attackerLane] = null;
      }
      nextActiveGrave.push(attacker);
      nextState = logMessage(nextState, `${attacker.name} was destroyed!`, 'log-attack');
    } else {
      if (isAttackerInChampLane) {
        nextActiveChampLane = { ...attacker, currentHp: attackerHp, canAttack: false, hasAttackedThisTurn: true };
      } else if (attackerLane >= 0) {
        nextActiveBoard[attackerLane] = { ...attacker, currentHp: attackerHp, canAttack: false, hasAttackedThisTurn: true };
      }
    }

    nextState = {
      ...nextState,
      players: nextState.players.map((p, idx) => {
        if (idx === activeIndex) {
          return { ...p, board: nextActiveBoard, championLane: nextActiveChampLane, graveyard: nextActiveGrave };
        }
        if (idx === opponentIndex) {
          return { ...p, board: nextOppBoard, championLane: nextOppChampLane, graveyard: nextOppGrave };
        }
        return p;
      }) as [PlayerState, PlayerState]
    };

    return checkWinCondition(nextState);
  }

  return state;
}

export function activateHeroPower(state: GameState): GameState {
  if (state.winner) return state;

  const activeIndex = state.currentTurn - 1;
  const opponentIndex = state.currentTurn === 1 ? 1 : 0;
  const active = state.players[activeIndex];

  if (active.vanguard.heroPowerUsed) {
    return logMessage(state, 'Hero Power already used this turn!', 'log-trap');
  }

  const powerCost = active.vanguard.heroPower.cost;
  const currentMana = active.mana ?? 0;

  if (currentMana < powerCost) {
    return logMessage(state, `Not enough Mana! (Requires ${powerCost})`, 'log-trap');
  }

  soundEngine.playSpell();
  let nextState: GameState = {
    ...state,
    players: state.players.map((p, idx) =>
      idx === activeIndex
        ? {
            ...p,
            mana: currentMana - powerCost,
            champion: { ...(p.champion || p.vanguard), heroPowerUsed: true },
            vanguard: { ...(p.vanguard || p.champion), heroPowerUsed: true }
          }
        : p
    ) as [PlayerState, PlayerState]
  };

  nextState = logMessage(
    nextState,
    `${active.name} activated Hero Power: ${active.vanguard.heroPower.name}!`,
    'log-summon'
  );

  // Execute Specific Champion Power
  if (active.vanguard.id === 'sol_champion') {
    // 2 damage to enemy vanguard or lowest unit
    nextState = dealDirectOrLowestDamage(nextState, opponentIndex, 2);
  } else if (active.vanguard.id === 'void_champion') {
    // Give random friendly unit +2 ATK
    nextState = buffRandomFriendlyUnitAtk(nextState, activeIndex, 2);
  } else if (active.vanguard.id === 'verdant_champion') {
    // Restore 3 HP to Vanguard
    nextState = healVanguard(nextState, activeIndex, 3);
  } else if (active.vanguard.id === 'tide_champion') {
    // Grant friendly creature Aegis
    nextState = grantRandomFriendlyAegis(nextState, activeIndex);
  } else if (active.vanguard.id === 'astral_champion') {
    // Gain +1 temporary mana and draw 1
    nextState = grantTemporaryMana(nextState, activeIndex, 1);
    nextState = drawCardInternal(nextState, (activeIndex + 1) as 1 | 2);
  }

  return checkWinCondition(nextState);
}

export function endTurn(state: GameState): GameState {
  if (state.winner) return state;

  const activeIndex = state.currentTurn - 1;
  const active = state.players[activeIndex];

  // Check extra turns (Chronos Lord of Eternity)
  if (active.extraTurns > 0) {
    const nextPlayers = state.players.map((p, idx) =>
      idx === activeIndex ? { ...p, extraTurns: p.extraTurns - 1 } : p
    ) as [PlayerState, PlayerState];
    const nextState = logMessage(
      { ...state, players: nextPlayers },
      `CHRONO SURGE: ${active.name} takes an EXTRA TURN!`,
      'log-ascend'
    );
    return startTurn(nextState);
  }

  const nextTurnId = state.currentTurn === 1 ? 2 : 1;
  const nextRound = nextTurnId === 1 ? state.round + 1 : state.round;

  if (state.mode === 'couch_2p') {
    return {
      ...state,
      currentTurn: nextTurnId,
      round: nextRound,
      isPrivacyCurtainActive: true
    };
  } else {
    const nextState: GameState = {
      ...state,
      currentTurn: nextTurnId,
      round: nextRound,
      isPrivacyCurtainActive: false
    };
    return startTurn(nextState);
  }
}

export function revealPrivacyAndStartTurn(state: GameState): GameState {
  return startTurn({
    ...state,
    isPrivacyCurtainActive: false
  });
}

function exhaustCreature(
  state: GameState,
  playerIndex: number,
  laneIndex: number | 'champion'
): GameState {
  const player = state.players[playerIndex];
  if (laneIndex === 'champion') {
    if (!player.championLane) return state;
    return {
      ...state,
      players: state.players.map((p, idx) =>
        idx === playerIndex
          ? {
              ...p,
              championLane: { ...p.championLane!, canAttack: false, hasAttackedThisTurn: true }
            }
          : p
      ) as [PlayerState, PlayerState]
    };
  }

  const nextBoard = [...player.board];
  if (typeof laneIndex === 'number' && laneIndex >= 0 && nextBoard[laneIndex]) {
    nextBoard[laneIndex] = {
      ...nextBoard[laneIndex]!,
      canAttack: false,
      hasAttackedThisTurn: true
    };
  }

  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === playerIndex ? { ...p, board: nextBoard } : p
    ) as [PlayerState, PlayerState]
  };
}

export function checkWinCondition(state: GameState): GameState {
  const p1Hp = state.players[0].vanguard.hp;
  const p2Hp = state.players[1].vanguard.hp;

  if (p1Hp <= 0 && p2Hp <= 0) {
    soundEngine.playTrap();
    return logMessage({ ...state, winner: 'draw' }, 'Stalemate! Both Vanguards have fallen.', 'log-trap');
  } else if (p2Hp <= 0) {
    soundEngine.playVictory();
    return logMessage(
      { ...state, winner: 1 },
      `VICTORY! ${state.players[0].name} has conquered the Astral Nexus!`,
      'log-ascend'
    );
  } else if (p1Hp <= 0) {
    soundEngine.playAttack();
    return logMessage(
      { ...state, winner: 2 },
      `DEFEAT! ${state.players[1].name} claims supremacy!`,
      'log-attack'
    );
  }

  return state;
}

// ==========================================
// EFFECT HELPERS
// ==========================================

function healVanguard(state: GameState, playerIndex: number, amount: number): GameState {
  const player = state.players[playerIndex];
  const newHp = Math.min(player.vanguard.maxHp, player.vanguard.hp + amount);
  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === playerIndex
        ? { ...p, vanguard: { ...p.vanguard, hp: newHp } }
        : p
    ) as [PlayerState, PlayerState]
  };
}

function dealDirectOrUnitDamage(
  state: GameState,
  targetPlayerIndex: number,
  amount: number,
  targetUnitId: string | null
): GameState {
  const targetPlayer = state.players[targetPlayerIndex];

  if (targetUnitId) {
    const laneIdx = targetPlayer.board.findIndex(c => c && c.instanceId === targetUnitId);
    if (laneIdx !== -1) {
      const unit = targetPlayer.board[laneIdx]!;
      const nextBoard = [...targetPlayer.board];
      const nextGrave = [...targetPlayer.graveyard];

      if (unit.hasAegis) {
        nextBoard[laneIdx] = { ...unit, hasAegis: false };
      } else {
        const nextHp = unit.currentHp - amount;
        if (nextHp <= 0) {
          nextBoard[laneIdx] = null;
          nextGrave.push(unit);
        } else {
          nextBoard[laneIdx] = { ...unit, currentHp: nextHp };
        }
      }

      return {
        ...state,
        players: state.players.map((p, idx) =>
          idx === targetPlayerIndex ? { ...p, board: nextBoard, graveyard: nextGrave } : p
        ) as [PlayerState, PlayerState]
      };
    }
  }

  // Default: hit vanguard
  const nextHp = targetPlayer.vanguard.hp - amount;
  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === targetPlayerIndex
        ? { ...p, vanguard: { ...p.vanguard, hp: Math.max(0, nextHp) } }
        : p
    ) as [PlayerState, PlayerState]
  };
}

function dealDirectOrLowestDamage(
  state: GameState,
  targetPlayerIndex: number,
  amount: number
): GameState {
  const targetPlayer = state.players[targetPlayerIndex];
  const liveUnits = targetPlayer.board
    .map((unit, idx) => ({ unit, idx }))
    .filter((entry): entry is { unit: CardInstance; idx: number } => entry.unit !== null);

  if (liveUnits.length > 0) {
    liveUnits.sort((a, b) => a.unit.currentHp - b.unit.currentHp);
    const target = liveUnits[0];
    const nextBoard = [...targetPlayer.board];
    const nextGrave = [...targetPlayer.graveyard];

    if (target.unit.hasAegis) {
      nextBoard[target.idx] = { ...target.unit, hasAegis: false };
    } else {
      const nextHp = target.unit.currentHp - amount;
      if (nextHp <= 0) {
        nextBoard[target.idx] = null;
        nextGrave.push(target.unit);
      } else {
        nextBoard[target.idx] = { ...target.unit, currentHp: nextHp };
      }
    }

    return {
      ...state,
      players: state.players.map((p, idx) =>
        idx === targetPlayerIndex ? { ...p, board: nextBoard, graveyard: nextGrave } : p
      ) as [PlayerState, PlayerState]
    };
  }

  // Hit hero directly
  const nextHp = targetPlayer.vanguard.hp - amount;
  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === targetPlayerIndex
        ? { ...p, vanguard: { ...p.vanguard, hp: Math.max(0, nextHp) } }
        : p
    ) as [PlayerState, PlayerState]
  };
}

function buffFriendlyUnit(
  state: GameState,
  playerIndex: number,
  atkBuff: number,
  hpBuff: number,
  targetUnitId: string | null
): GameState {
  const player = state.players[playerIndex];
  const nextBoard = [...player.board];

  const targetIdx = targetUnitId
    ? player.board.findIndex(c => c && c.instanceId === targetUnitId)
    : player.board.findIndex(c => c !== null);

  if (targetIdx !== -1 && nextBoard[targetIdx]) {
    const unit = nextBoard[targetIdx]!;
    nextBoard[targetIdx] = {
      ...unit,
      currentAtk: unit.currentAtk + atkBuff,
      currentHp: unit.currentHp + hpBuff,
      maxHp: unit.maxHp + hpBuff
    };
  }

  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === playerIndex ? { ...p, board: nextBoard } : p
    ) as [PlayerState, PlayerState]
  };
}

function aoeDamageEnemies(state: GameState, oppIndex: number, amount: number): GameState {
  const opponent = state.players[oppIndex];
  const nextBoard = [...opponent.board];
  const nextGrave = [...opponent.graveyard];

  opponent.board.forEach((unit, idx) => {
    if (!unit) return;
    if (unit.hasAegis) {
      nextBoard[idx] = { ...unit, hasAegis: false };
    } else {
      const nextHp = unit.currentHp - amount;
      if (nextHp <= 0) {
        nextBoard[idx] = null;
        nextGrave.push(unit);
      } else {
        nextBoard[idx] = { ...unit, currentHp: nextHp };
      }
    }
  });

  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === oppIndex ? { ...p, board: nextBoard, graveyard: nextGrave } : p
    ) as [PlayerState, PlayerState]
  };
}

function aoeDamageAndFreezeEnemies(state: GameState, oppIndex: number, amount: number): GameState {
  const opponent = state.players[oppIndex];
  const nextBoard = [...opponent.board];
  const nextGrave = [...opponent.graveyard];

  opponent.board.forEach((unit, idx) => {
    if (!unit) return;
    if (unit.hasAegis) {
      nextBoard[idx] = { ...unit, hasAegis: false, frozen: true };
    } else {
      const nextHp = unit.currentHp - amount;
      if (nextHp <= 0) {
        nextBoard[idx] = null;
        nextGrave.push(unit);
      } else {
        nextBoard[idx] = { ...unit, currentHp: nextHp, frozen: true };
      }
    }
  });

  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === oppIndex ? { ...p, board: nextBoard, graveyard: nextGrave } : p
    ) as [PlayerState, PlayerState]
  };
}

function freezeAllEnemies(state: GameState, oppIndex: number): GameState {
  const opponent = state.players[oppIndex];
  const nextBoard = opponent.board.map(u => (u ? { ...u, frozen: true } : null));
  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === oppIndex ? { ...p, board: nextBoard } : p
    ) as [PlayerState, PlayerState]
  };
}

function freezeTargetCreature(state: GameState, oppIndex: number): GameState {
  const opponent = state.players[oppIndex];
  const unfrozenIndices = opponent.board
    .map((c, idx) => (c !== null && !c.frozen ? idx : -1))
    .filter(idx => idx !== -1);
  const targetIdx = unfrozenIndices.length > 0
    ? unfrozenIndices[0]
    : opponent.board.findIndex(c => c !== null);

  if (targetIdx === -1) return state;

  const nextBoard = [...opponent.board];
  nextBoard[targetIdx] = {
    ...nextBoard[targetIdx]!,
    frozen: true
  };

  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === oppIndex ? { ...p, board: nextBoard } : p
    ) as [PlayerState, PlayerState]
  };
}

function destroyLowestHealthEnemy(state: GameState, oppIndex: number): GameState {
  const opponent = state.players[oppIndex];
  const liveUnits = opponent.board
    .map((unit, idx) => ({ unit, idx }))
    .filter((entry): entry is { unit: CardInstance; idx: number } => entry.unit !== null);

  if (liveUnits.length === 0) return state;
  liveUnits.sort((a, b) => a.unit.currentHp - b.unit.currentHp);

  const target = liveUnits[0];
  const nextBoard = [...opponent.board];
  nextBoard[target.idx] = null;

  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === oppIndex
        ? {
            ...p,
            board: nextBoard,
            graveyard: [...p.graveyard, target.unit]
          }
        : p
    ) as [PlayerState, PlayerState]
  };
}

function healAllFriendly(state: GameState, playerIndex: number, amount: number): GameState {
  const player = state.players[playerIndex];
  const nextVanguardHp = Math.min(player.vanguard.maxHp, player.vanguard.hp + amount);
  const nextBoard = player.board.map(u =>
    u ? { ...u, currentHp: Math.min(u.maxHp, u.currentHp + amount) } : null
  );

  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === playerIndex
        ? { ...p, vanguard: { ...p.vanguard, hp: nextVanguardHp }, board: nextBoard }
        : p
    ) as [PlayerState, PlayerState]
  };
}

function grantPermanentMana(state: GameState, playerIndex: number, amount: number): GameState {
  return {
    ...state,
    players: state.players.map((p, idx) => {
      if (idx !== playerIndex) return p;
      const cMax = p.maxMana ?? 1;
      const cMana = p.mana ?? 1;
      return {
        ...p,
        maxMana: Math.min(10, cMax + amount),
        mana: Math.min(10, cMana + amount)
      };
    }) as [PlayerState, PlayerState]
  };
}

function grantTemporaryMana(state: GameState, playerIndex: number, amount: number): GameState {
  return {
    ...state,
    players: state.players.map((p, idx) => {
      if (idx !== playerIndex) return p;
      const cMana = p.mana ?? 1;
      return { ...p, mana: cMana + amount };
    }) as [PlayerState, PlayerState]
  };
}

function reduceHandCosts(state: GameState, playerIndex: number, amount: number): GameState {
  const player = state.players[playerIndex];
  const nextHand = player.hand.map(c => ({
    ...c,
    cost: Math.max(0, c.cost - amount)
  }));
  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === playerIndex ? { ...p, hand: nextHand } : p
    ) as [PlayerState, PlayerState]
  };
}

function discoverCard(state: GameState, playerIndex: number): GameState {
  const highTierCards = CARDS_DATA.filter(c => c.form === 3 || c.rarity === 'legendary');
  const picked = highTierCards[Math.floor(pseudoRandom() * highTierCards.length)];
  const cardInst = instantiateCard(picked);
  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === playerIndex ? { ...p, hand: [...p.hand, cardInst] } : p
    ) as [PlayerState, PlayerState]
  };
}

function grantExtraTurn(state: GameState, playerIndex: number): GameState {
  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === playerIndex ? { ...p, extraTurns: p.extraTurns + 1 } : p
    ) as [PlayerState, PlayerState]
  };
}

function bounceOpponentUnit(state: GameState, oppIndex: number): GameState {
  const opponent = state.players[oppIndex];
  const nonApexUnits = opponent.board
    .map((unit, idx) => ({ unit, idx }))
    .filter((entry): entry is { unit: CardInstance; idx: number } => entry.unit !== null && (entry.unit.form || 1) < 3);

  if (nonApexUnits.length === 0) return state;
  const target = nonApexUnits[Math.floor(pseudoRandom() * nonApexUnits.length)];

  const nextBoard = [...opponent.board];
  nextBoard[target.idx] = null;
  const nextHand = [...opponent.hand, target.unit];

  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === oppIndex ? { ...p, board: nextBoard, hand: nextHand } : p
    ) as [PlayerState, PlayerState]
  };
}

function buffRandomFriendlyUnitAtk(state: GameState, playerIndex: number, amount: number): GameState {
  const player = state.players[playerIndex];
  const eligibleIndices = player.board
    .map((c, idx) => (c !== null ? idx : -1))
    .filter(idx => idx !== -1);
  if (eligibleIndices.length === 0) return state;

  const targetIdx = eligibleIndices[Math.floor(pseudoRandom() * eligibleIndices.length)];
  const nextBoard = [...player.board];
  nextBoard[targetIdx] = {
    ...nextBoard[targetIdx]!,
    currentAtk: nextBoard[targetIdx]!.currentAtk + amount
  };

  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === playerIndex ? { ...p, board: nextBoard } : p
    ) as [PlayerState, PlayerState]
  };
}

function grantRandomFriendlyAegis(state: GameState, playerIndex: number): GameState {
  const player = state.players[playerIndex];
  const candidateIdx = player.board.findIndex(c => c !== null && !c.hasAegis);
  if (candidateIdx === -1) return state;

  const nextBoard = [...player.board];
  nextBoard[candidateIdx] = {
    ...nextBoard[candidateIdx]!,
    hasAegis: true
  };

  return {
    ...state,
    players: state.players.map((p, idx) =>
      idx === playerIndex ? { ...p, board: nextBoard } : p
    ) as [PlayerState, PlayerState]
  };
}

function checkAndTriggerWards(
  state: GameState,
  wardOwnerIndex: number,
  triggerType: CardDef['trigger'],
  triggeringPayload: CardInstance
): GameState {
  const wardOwner = state.players[wardOwnerIndex];
  const wardIdx = wardOwner.wards.findIndex(w => w && w.trigger === triggerType);
  if (wardIdx === -1) return state;

  const ward = wardOwner.wards[wardIdx]!;
  soundEngine.playTrap();

  let nextState = logMessage(
    state,
    `SECRET WARD REVEALED: ${ward.name}! (${ward.desc})`,
    'log-trap'
  );

  // Consume ward
  const nextWards = [...wardOwner.wards];
  nextWards[wardIdx] = null;
  const nextGrave = [...wardOwner.graveyard, ward];

  nextState = {
    ...nextState,
    players: nextState.players.map((p, idx) =>
      idx === wardOwnerIndex ? { ...p, wards: nextWards, graveyard: nextGrave } : p
    ) as [PlayerState, PlayerState]
  };

  // Execute specific ward effects
  if (ward.id === 'ward_sunfire_retribution') {
    // Deal 4 damage to attacker
    const attackerOwnerIndex = wardOwnerIndex === 0 ? 1 : 0;
    const attackerBoard = [...nextState.players[attackerOwnerIndex].board];
    const attackerLane = attackerBoard.findIndex(c => c && c.instanceId === triggeringPayload.instanceId);
    if (attackerLane !== -1 && attackerBoard[attackerLane]) {
      const attUnit = attackerBoard[attackerLane]!;
      const nextHp = attUnit.currentHp - 4;
      if (nextHp <= 0) {
        attackerBoard[attackerLane] = null;
        nextState = {
          ...nextState,
          players: nextState.players.map((p, idx) =>
            idx === attackerOwnerIndex
              ? { ...p, board: attackerBoard, graveyard: [...p.graveyard, attUnit] }
              : p
          ) as [PlayerState, PlayerState]
        };
      } else {
        attackerBoard[attackerLane] = { ...attUnit, currentHp: nextHp };
        nextState = {
          ...nextState,
          players: nextState.players.map((p, idx) =>
            idx === attackerOwnerIndex ? { ...p, board: attackerBoard } : p
          ) as [PlayerState, PlayerState]
        };
      }
    }
  } else if (ward.id === 'ward_shadow_rift') {
    // Reduce ascended enemy unit's ATK to 1
    const ascOwnerIndex = wardOwnerIndex === 0 ? 1 : 0;
    const ascBoard = [...nextState.players[ascOwnerIndex].board];
    const ascLane = ascBoard.findIndex(c => c && c.instanceId === triggeringPayload.instanceId);
    if (ascLane !== -1 && ascBoard[ascLane]) {
      ascBoard[ascLane] = { ...ascBoard[ascLane]!, currentAtk: 1 };
      nextState = {
        ...nextState,
        players: nextState.players.map((p, idx) =>
          idx === ascOwnerIndex ? { ...p, board: ascBoard } : p
        ) as [PlayerState, PlayerState]
      };
    }
  } else if (ward.id === 'ward_briar_trap') {
    // Destroy attacker if HP <= 3
    if (triggeringPayload.currentHp <= 3) {
      const attackerOwnerIndex = wardOwnerIndex === 0 ? 1 : 0;
      const attackerBoard = [...nextState.players[attackerOwnerIndex].board];
      const attackerLane = attackerBoard.findIndex(c => c && c.instanceId === triggeringPayload.instanceId);
      if (attackerLane !== -1 && attackerBoard[attackerLane]) {
        const att = attackerBoard[attackerLane]!;
        attackerBoard[attackerLane] = null;
        nextState = {
          ...nextState,
          players: nextState.players.map((p, idx) =>
            idx === attackerOwnerIndex
              ? { ...p, board: attackerBoard, graveyard: [...p.graveyard, att] }
              : p
          ) as [PlayerState, PlayerState]
        };
      }
    }
  }

  return nextState;
}

function checkWardNegation(
  state: GameState,
  wardOwnerIndex: number,
  triggerType: CardDef['trigger'],
  attacker: CardInstance
): { state: GameState; negated: boolean } {
  const wardOwner = state.players[wardOwnerIndex];
  const wardIdx = wardOwner.wards.findIndex(w => w && w.trigger === triggerType);
  if (wardIdx === -1) return { state, negated: false };

  const ward = wardOwner.wards[wardIdx]!;
  if (ward.id === 'ward_frozen_tide') {
    // Negate attack and freeze attacker
    const nextWards = [...wardOwner.wards];
    nextWards[wardIdx] = null;
    const nextGrave = [...wardOwner.graveyard, ward];

    const attackerOwnerIndex = wardOwnerIndex === 0 ? 1 : 0;
    const attackerBoard = [...state.players[attackerOwnerIndex].board];
    const attackerLane = attackerBoard.findIndex(c => c && c.instanceId === attacker.instanceId);
    if (attackerLane !== -1 && attackerBoard[attackerLane]) {
      attackerBoard[attackerLane] = {
        ...attackerBoard[attackerLane]!,
        frozen: true,
        canAttack: false,
        hasAttackedThisTurn: true
      };
    }

    const nextState: GameState = {
      ...state,
      players: state.players.map((p, idx) => {
        if (idx === wardOwnerIndex) return { ...p, wards: nextWards, graveyard: nextGrave };
        if (idx === attackerOwnerIndex) return { ...p, board: attackerBoard };
        return p;
      }) as [PlayerState, PlayerState]
    };

    return {
      state: logMessage(nextState, `GLACIAL STASIS WARD: Direct attack negated! Attacker is frozen.`, 'log-trap'),
      negated: true
    };
  }

  return { state, negated: false };
}

function checkLethalWard(state: GameState, playerIndex: number): GameState {
  const player = state.players[playerIndex];
  const wardIdx = player.wards.findIndex(w => w && w.trigger === 'on_lethal_damage');
  if (wardIdx === -1) return state;

  const ward = player.wards[wardIdx]!;
  soundEngine.playTrap();

  const nextWards = [...player.wards];
  nextWards[wardIdx] = null;
  const nextGrave = [...player.graveyard, ward];

  let nextState: GameState = {
    ...state,
    players: state.players.map((p, idx) =>
      idx === playerIndex
        ? {
            ...p,
            vanguard: { ...p.vanguard, hp: 1 },
            wards: nextWards,
            graveyard: nextGrave
          }
        : p
    ) as [PlayerState, PlayerState]
  };

  nextState = logMessage(
    nextState,
    `CONTINUUM COLLAPSE WARD: Fatal blow prevented! Vanguard HP locked at 1. Drawing 2 emergency cards.`,
    'log-ascend'
  );

  nextState = drawCardInternal(nextState, (playerIndex + 1) as 1 | 2);
  nextState = drawCardInternal(nextState, (playerIndex + 1) as 1 | 2);

  return nextState;
}

export function dispatchGameAction(state: GameState, action: GameAction): GameState {
  if (state.winner) return state;

  switch (action.type) {
    case 'playCard':
      return playCard(
        state,
        action.instanceId,
        action.targetLaneIndex ?? null,
        action.targetUnitId ?? null
      );
    case 'declareAttack':
      return declareAttack(
        state,
        action.attackerInstanceId,
        action.targetType,
        action.targetLaneOrId ?? null
      );
    case 'activateHeroPower':
      return activateHeroPower(state);
    case 'drawCard':
      return drawCardTurn(state);
    case 'advancePhase':
      return advancePhase(state);
    case 'endTurn':
      return endTurn(state);
    default:
      return state;
  }
}
