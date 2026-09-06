import { GameState, CardInstance, PlayerState, GameAction } from './types';
import {
  createInitialGame,
  dispatchGameAction,
  endTurn,
  drawCardTurn,
  playCard,
  declareAttack,
  activateHeroPower,
  canAscendOnUnit,
  calculateAscensionCost
} from './gameEngine';
import { PRESET_DECKS } from './presetDecks';

export interface QuickplayRoom {
  roomId: string;
  roomCode: string;
  createdAt: number;
  player1Id: string;
  player2Id: string;
  p1Name: string;
  p2Name: string;
  isP2AI: boolean;
  p1DeckKey: string;
  p2DeckKey: string;
  gameState: GameState;
}

// In-memory store for active Quickplay rooms
const ACTIVE_ROOMS = new Map<string, QuickplayRoom>();

// Clean up rooms older than 2 hours
function cleanupStaleRooms() {
  const twoHoursAgo = Date.now() - 7200000;
  for (const [id, room] of ACTIVE_ROOMS.entries()) {
    if (room.createdAt < twoHoursAgo) {
      ACTIVE_ROOMS.delete(id);
    }
  }
}

// Hidden placeholder card definition for anti-cheat sanitization
const DUMMY_HIDDEN_CARD: CardInstance = {
  id: 'hidden_card',
  instanceId: 'hidden_instance',
  name: 'Hidden Card',
  element: 'astral',
  type: 'creature',
  cost: 0,
  rarity: 'common',
  art: '/assets/cards/card_ignis.jpg',
  desc: 'Card in opponent hand.',
  currentAtk: 0,
  currentHp: 0,
  maxHp: 0,
  canAttack: false,
  hasAttackedThisTurn: false,
  frozen: false,
  hasAegis: false
};

/**
 * Anti-Cheat State Sanitizer:
 * Completely strips private opponent hand card details before payload delivery to client.
 * Network packet inspection & DevTools memory inspection will reveal ZERO information about opponent's hand cards.
 */
export function sanitizeStateForPlayer(state: GameState, forPlayerId: 1 | 2): GameState {
  const opponentIndex = forPlayerId === 1 ? 1 : 0;
  const sanitizedPlayers = state.players.map((player, idx) => {
    if (idx === opponentIndex) {
      return {
        ...player,
        hand: player.hand.map((card, handIdx) => ({
          ...DUMMY_HIDDEN_CARD,
          instanceId: card.instanceId || `hidden_${handIdx}`
        }))
      };
    }
    return player;
  }) as [PlayerState, PlayerState];

  return {
    ...state,
    players: sanitizedPlayers
  };
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createCustomRoom(
  userId: string,
  p1Name: string = 'Host Duellist',
  p1DeckKey: string = 'solar_pyre',
  customP1Cards?: string[],
  requestedRoomCode?: string
): QuickplayRoom {
  cleanupStaleRooms();
  const roomCode = (requestedRoomCode || generateRoomCode()).toUpperCase();
  const roomId = `room_${roomCode}_${Date.now()}`;

  const initialGame = createInitialGame(
    'couch_2p',
    p1DeckKey,
    'void_shadow',
    customP1Cards,
    undefined
  );

  initialGame.players[0].name = p1Name;
  initialGame.players[1].name = 'Waiting for Duellist...';
  initialGame.players[1].isAI = false;

  const room: QuickplayRoom = {
    roomId,
    roomCode,
    createdAt: Date.now(),
    player1Id: userId,
    player2Id: 'waiting_opponent',
    p1Name,
    p2Name: 'Waiting for Duellist...',
    isP2AI: false,
    p1DeckKey,
    p2DeckKey: 'void_shadow',
    gameState: initialGame
  };

  ACTIVE_ROOMS.set(roomId, room);
  ACTIVE_ROOMS.set(roomCode, room); // Also index by roomCode for fast lookup
  return room;
}

export function joinRoomByCode(
  roomCodeOrId: string,
  userId: string,
  p2Name: string = 'Guest Duellist',
  p2DeckKey: string = 'void_shadow',
  customP2Cards?: string[]
): { success: boolean; room?: QuickplayRoom; message?: string } {
  cleanupStaleRooms();
  const query = roomCodeOrId.toUpperCase();
  const room = ACTIVE_ROOMS.get(query) || ACTIVE_ROOMS.get(roomCodeOrId);

  if (!room) {
    return { success: false, message: 'Room not found. Check code and try again.' };
  }

  // If user is already player 1 reconnecting
  if (room.player1Id === userId) {
    return { success: true, room };
  }

  // If user is player 2 reconnecting
  if (room.player2Id === userId) {
    return { success: true, room };
  }

  // Connect as player 2
  room.player2Id = userId;
  room.p2Name = p2Name;
  room.p2DeckKey = p2DeckKey;
  room.isP2AI = false;

  // Reinitialize player 2 with chosen deck if game hasn't made moves yet
  if (room.gameState.round === 1 && room.gameState.players[1].board.every(b => b === null)) {
    const p2Preset = PRESET_DECKS[p2DeckKey] || PRESET_DECKS.void_shadow;
    const cards = customP2Cards && customP2Cards.length >= 10 ? customP2Cards : p2Preset.cards;
    const newGame = createInitialGame(
      'couch_2p',
      room.p1DeckKey,
      p2DeckKey,
      room.gameState.players[0].deck.map(c => c.id),
      cards
    );
    newGame.players[0].name = room.p1Name;
    newGame.players[1].name = p2Name;
    newGame.players[1].isAI = false;
    room.gameState = newGame;
  } else {
    room.gameState.players[1].name = p2Name;
    room.gameState.players[1].isAI = false;
  }

  return { success: true, room };
}

export function getOrCreateQuickplayRoom(
  playerUserId: string = 'anon_duellist',
  forceAi: boolean = false,
  p1Name: string = 'Duellist',
  p1DeckKey: string = 'solar_pyre',
  customP1Cards?: string[]
): QuickplayRoom {
  cleanupStaleRooms();

  // Find open room waiting for opponent if not forcing AI
  if (!forceAi) {
    for (const room of ACTIVE_ROOMS.values()) {
      if (
        room.player2Id === 'waiting_opponent' &&
        room.player1Id !== playerUserId &&
        !room.gameState.winner
      ) {
        // Match player 2 into existing room
        room.player2Id = playerUserId;
        room.p2Name = p1Name || `Duellist_${playerUserId.slice(-4)}`;
        room.isP2AI = false;
        room.gameState.players[1].name = room.p2Name;
        room.gameState.players[1].isAI = false;
        return room;
      }
    }
  }

  // Create new room
  const roomCode = generateRoomCode();
  const roomId = `room_${roomCode}_${Date.now()}`;
  const resolvedP1Name = p1Name || `Duellist_${playerUserId.slice(-4)}`;
  const resolvedP2Name = forceAi ? 'AI Tactician' : 'Waiting for Duellist...';

  const initialGame = createInitialGame(
    forceAi ? 'solo_ai' : 'couch_2p',
    p1DeckKey,
    'void_shadow',
    customP1Cards
  );

  initialGame.players[0].name = resolvedP1Name;
  initialGame.players[1].name = resolvedP2Name;
  initialGame.players[1].isAI = forceAi;

  const newRoom: QuickplayRoom = {
    roomId,
    roomCode,
    createdAt: Date.now(),
    player1Id: playerUserId,
    player2Id: forceAi ? 'ai_opponent' : 'waiting_opponent',
    p1Name: resolvedP1Name,
    p2Name: resolvedP2Name,
    isP2AI: forceAi,
    p1DeckKey,
    p2DeckKey: 'void_shadow',
    gameState: initialGame
  };

  ACTIVE_ROOMS.set(roomId, newRoom);
  ACTIVE_ROOMS.set(roomCode, newRoom);
  return newRoom;
}

export function getQuickplayRoom(roomIdOrCode: string): QuickplayRoom | undefined {
  cleanupStaleRooms();
  return ACTIVE_ROOMS.get(roomIdOrCode) || ACTIVE_ROOMS.get(roomIdOrCode.toUpperCase());
}

/**
 * Executes a full AI turn synchronously on the server state.
 */
export function runServerAiTurn(state: GameState): GameState {
  if (state.winner || state.currentTurn !== 2) return state;

  let s = state;

  // Phase 0: Draw Phase
  if (s.phase === 'draw') {
    s = drawCardTurn(s, false);
  }

  // Phase 1: In-place Evolution & Creature Summons & Spells
  for (let iter = 0; iter < 5; iter++) {
    const ai = s.players[1];
    let actionTaken = false;

    // 0. Dedicated Champion Lane Summon
    if (ai.championLane === null) {
      const champCard = ai.hand.find(c => c.id.includes('_champion') || c.desc?.includes('Dedicated Champion Lane'));
      if (champCard && champCard.cost <= ai.mana) {
        s = playCard(s, champCard.instanceId, 'champion');
        continue;
      }
    }

    // 1. In-place Evolution
    for (let laneIdx = 0; laneIdx < ai.board.length; laneIdx++) {
      const boardUnit = ai.board[laneIdx];
      if (boardUnit) {
        const evoCard = ai.hand.find(c => {
          if (!canAscendOnUnit(c, boardUnit)) return false;
          return calculateAscensionCost(c, boardUnit) <= ai.mana;
        });
        if (evoCard) {
          s = playCard(s, evoCard.instanceId, laneIdx);
          actionTaken = true;
          break;
        }
      }
    }
    if (actionTaken) continue;

    // 2. Creature summon into empty lane
    const emptyLane = ai.board.indexOf(null);
    if (emptyLane !== -1) {
      const creature = ai.hand
        .filter(c => c.type === 'creature' && c.cost <= ai.mana)
        .sort((a, b) => b.cost - a.cost)[0];
      if (creature) {
        s = playCard(s, creature.instanceId, emptyLane);
        actionTaken = true;
        continue;
      }
    }

    // 3. Spells
    const spell = ai.hand.find(c => c.type === 'spell' && c.cost <= ai.mana);
    if (spell) {
      s = playCard(s, spell.instanceId);
      actionTaken = true;
      continue;
    }

    break;
  }

  // Phase 2: Hero Power
  const aiPlayer = s.players[1];
  if (
    !aiPlayer.vanguard.heroPowerUsed &&
    aiPlayer.mana >= aiPlayer.vanguard.heroPower.cost &&
    !s.winner
  ) {
    s = activateHeroPower(s);
  }

  // Phase 3: Attacks
  const boardAttackers = s.players[1].board.filter(
    (c): c is CardInstance => !!c && c.canAttack && !c.hasAttackedThisTurn && !c.frozen
  );
  const champLaneAttacker = s.players[1].championLane;
  const readyAttackers: CardInstance[] = [...boardAttackers];
  if (champLaneAttacker && champLaneAttacker.canAttack && !champLaneAttacker.hasAttackedThisTurn && !champLaneAttacker.frozen) {
    readyAttackers.push(champLaneAttacker);
  }

  for (const att of readyAttackers) {
    if (s.winner || s.currentTurn !== 2) break;

    const opp = s.players[0];
    const tauntGuardians = opp.board
      .map((c, idx) => ({ card: c, lane: idx }))
      .filter(e => e.card && e.card.hasTaunt);

    if (tauntGuardians.length > 0) {
      s = declareAttack(s, att.instanceId, 'creature', tauntGuardians[0].lane);
    } else {
      // Prioritize killing high attack enemies or strike Vanguard directly
      const enemies = opp.board
        .map((c, idx) => ({ card: c, lane: idx }))
        .filter(e => e.card !== null);
      const favorableTarget = enemies.find(
        e => e.card!.currentHp <= att.currentAtk && e.card!.currentAtk >= 3
      );

      if (favorableTarget) {
        s = declareAttack(s, att.instanceId, 'creature', favorableTarget.lane);
      } else {
        s = declareAttack(s, att.instanceId, 'vanguard', null);
      }
    }
  }

  // Phase 4: End turn
  s = endTurn(s);
  return s;
}

export function executeRoomAction(
  roomIdOrCode: string,
  playerNumber: 1 | 2,
  action: GameAction
): { success: boolean; message?: string; room?: QuickplayRoom } {
  const room = getQuickplayRoom(roomIdOrCode);
  if (!room) return { success: false, message: 'Room not found.' };

  if (room.gameState.winner) return { success: false, message: 'Game has concluded.' };
  if (room.gameState.currentTurn !== playerNumber) {
    return { success: false, message: 'Not your turn!' };
  }

  // Deterministically execute the action
  let nextState = dispatchGameAction(room.gameState, action);

  // If Player 1 ended their turn and Player 2 is AI, execute AI moves automatically
  if (action.type === 'endTurn' && room.isP2AI && nextState.currentTurn === 2 && !nextState.winner) {
    nextState = runServerAiTurn(nextState);
  }

  room.gameState = nextState;
  ACTIVE_ROOMS.set(room.roomId, room);
  ACTIVE_ROOMS.set(room.roomCode, room);

  return { success: true, room };
}
