import { GameState, CardInstance } from './types';
import {
  playCard,
  activateHeroPower,
  declareAttack,
  endTurn,
  drawCardTurn,
  advancePhase,
  calculateAscensionCost
} from './gameEngine';
import { tcgWorkerManager } from './tcgWorkerManager';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function executeAiTurn(
  getGameState: () => GameState,
  updateGameState: (updater: (s: GameState) => GameState) => void
) {
  const initial = getGameState();
  if (initial.winner || initial.currentTurn !== 2) return;

  try {
    await sleep(600);

    // Phase 1: Draw Phase
    if (getGameState().phase === 'draw') {
      updateGameState(s => drawCardTurn(s));
      await sleep(600);
    }

    // Phase 2: Main Phase - Play Cards & Ascensions
    let keepPlaying = true;
    let iterations = 0;

    while (keepPlaying && iterations < 5) {
      iterations++;
      keepPlaying = false;
      const state = getGameState();
      if (state.winner || state.currentTurn !== 2) return;

      const ai = state.players[1];

      // 0. Play Champion Card into Dedicated Champion Lane if available
      if (ai.championLane === null) {
        const champCard = ai.hand.find(c => c.id.includes('_champion') || c.desc?.includes('Dedicated Champion Lane'));
        if (champCard && champCard.cost <= ai.mana) {
          updateGameState(s => playCard(s, champCard.instanceId, 'champion'));
          keepPlaying = true;
          await sleep(650);
          continue;
        }
      }

      // 1. Look for In-Place Ascension combos
      for (let laneIdx = 0; laneIdx < ai.board.length; laneIdx++) {
        const boardUnit = ai.board[laneIdx];
        if (boardUnit && boardUnit.form) {
          const ascensionCard = ai.hand.find(c => {
            if (c.type !== 'creature' || !c.form || c.form <= boardUnit.form!) return false;
            if (c.ascendsFrom && c.ascendsFrom !== boardUnit.element) return false;
            const cost = calculateAscensionCost(c, boardUnit);
            return cost <= ai.mana;
          });

          if (ascensionCard) {
            updateGameState(s => playCard(s, ascensionCard.instanceId, laneIdx));
            keepPlaying = true;
            await sleep(650);
            break;
          }
        }
      }

      if (keepPlaying) continue;

      // 2. Play Secret Wards
      const emptyWardSlot = ai.wards.indexOf(null);
      if (emptyWardSlot !== -1) {
        const wardCard = ai.hand.find(c => c.type === 'ward' && c.cost <= ai.mana);
        if (wardCard) {
          updateGameState(s => playCard(s, wardCard.instanceId));
          keepPlaying = true;
          await sleep(650);
          continue;
        }
      }

      // 3. Play Spells if affordable
      const spellCard = ai.hand.find(c => c.type === 'spell' && c.cost <= ai.mana);
      if (spellCard) {
        updateGameState(s => playCard(s, spellCard.instanceId));
        keepPlaying = true;
        await sleep(650);
        continue;
      }

      // 4. Play standard Form 1 creatures into empty lanes
      const emptyLane = ai.board.indexOf(null);
      if (emptyLane !== -1) {
        const affordableCreatures = ai.hand
          .filter(c => c.type === 'creature' && c.cost <= ai.mana)
          .sort((a, b) => (b.cost || 0) - (a.cost || 0));

        if (affordableCreatures.length > 0) {
          const best = affordableCreatures[0];
          updateGameState(s => playCard(s, best.instanceId, emptyLane));
          keepPlaying = true;
          await sleep(650);
          continue;
        }
      }
    }

    // Hero Power in Main Phase
    const stateAfterSummons = getGameState();
    if (stateAfterSummons.winner || stateAfterSummons.currentTurn !== 2) return;
    const aiPlayer = stateAfterSummons.players[1];

    if (!aiPlayer.vanguard.heroPowerUsed && aiPlayer.mana >= aiPlayer.vanguard.heroPower.cost) {
      updateGameState(s => activateHeroPower(s));
      await sleep(550);
    }

    // Transition from Main to Combat Phase
    if (getGameState().phase === 'main') {
      updateGameState(s => advancePhase(s));
      await sleep(600);
    }

    // Phase 3: Combat Phase - Declare Attacks (Optimized via Web Worker)
    const stateBeforeCombat = getGameState();
    if (stateBeforeCombat.winner || stateBeforeCombat.currentTurn !== 2) return;

    // Run decision tree off-thread via Web Worker
    interface RecommendedAttack {
      attackerInstanceId: string;
      targetType: 'champion' | 'vanguard' | 'creature' | 'champion_lane';
      targetLane: number | null;
      priority: number;
      reason: string;
    }

    let workerRecommendations: RecommendedAttack[] = [];
    try {
      const workerRes = await tcgWorkerManager.runTask<{ recommendedAttacks: RecommendedAttack[] }>('COMPUTE_AI_ACTIONS', {
        gameState: stateBeforeCombat,
        iterations: 150
      });
      if (workerRes.success && workerRes.data?.recommendedAttacks) {
        workerRecommendations = workerRes.data.recommendedAttacks;
      }
    } catch {
      workerRecommendations = [];
    }

    if (workerRecommendations.length > 0) {
      for (const rec of workerRecommendations) {
        const currentState = getGameState();
        if (currentState.winner || currentState.currentTurn !== 2) break;

        const liveAttacker = [
          ...currentState.players[1].board.filter((c): c is CardInstance => !!c),
          ...(currentState.players[1].championLane ? [currentState.players[1].championLane] : [])
        ].find(
          c => c.instanceId === rec.attackerInstanceId && c.canAttack && !c.hasAttackedThisTurn && !c.frozen
        );

        if (!liveAttacker) continue;

        updateGameState(s =>
          declareAttack(s, rec.attackerInstanceId, rec.targetType, rec.targetLane)
        );
        await sleep(700);
      }
    } else {
      // Fallback local heuristic
      const boardAttackers = getGameState().players[1].board.filter(
        (c): c is CardInstance => !!c && c.canAttack && !c.hasAttackedThisTurn && !c.frozen
      );
      const champLaneAttacker = getGameState().players[1].championLane;
      const readyAttackers: CardInstance[] = [...boardAttackers];
      if (champLaneAttacker && champLaneAttacker.canAttack && !champLaneAttacker.hasAttackedThisTurn && !champLaneAttacker.frozen) {
        readyAttackers.push(champLaneAttacker);
      }

      for (const attacker of readyAttackers) {
        const currentState = getGameState();
        if (currentState.winner || currentState.currentTurn !== 2) break;

        const liveAttacker = currentState.players[1].board.find(
          c => c && c.instanceId === attacker.instanceId && c.canAttack && !c.hasAttackedThisTurn && !c.frozen
        );
        if (!liveAttacker) continue;

        const opp = currentState.players[0];
        const tauntBlockers = opp.board
          .map((c, idx) => ({ card: c, lane: idx }))
          .filter(entry => entry.card && entry.card.hasTaunt);

        if (tauntBlockers.length > 0) {
          const target = tauntBlockers[0];
          updateGameState(s => declareAttack(s, attacker.instanceId, 'creature', target.lane));
          await sleep(700);
          continue;
        }

        const enemyUnits = opp.board
          .map((c, idx) => ({ card: c, lane: idx }))
          .filter(entry => entry.card !== null);

        const killableHighThreat = enemyUnits.find(
          e => e.card!.currentHp <= attacker.currentAtk && e.card!.currentAtk >= 3
        );

        if (killableHighThreat) {
          updateGameState(s => declareAttack(s, attacker.instanceId, 'creature', killableHighThreat.lane));
          await sleep(700);
        } else {
          updateGameState(s => declareAttack(s, attacker.instanceId, 'vanguard', null));
          await sleep(700);
        }
      }
    }

    // End AI Turn
    await sleep(600);
    updateGameState(s => endTurn(s));
  } catch (err) {
    console.error('AI execution error:', err);
    updateGameState(s => endTurn(s));
  }
}
