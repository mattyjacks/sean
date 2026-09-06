// TCG Turbo High-Performance Web Worker for Card Simulation & AI Search
// Runs off the main UI thread to prevent 60fps/120fps frame drops during intensive combat evaluations.

self.onmessage = (e) => {
  const start = performance.now();
  const { id, type, payload } = e.data;

  try {
    let result = null;

    switch (type) {
      case 'COMPUTE_AI_ACTIONS': {
        const { gameState, iterations = 200 } = payload;
        result = computeOptimalAiDecisions(gameState, iterations);
        break;
      }

      case 'SIMULATE_COMBAT_OUTCOMES': {
        const { attacker, targets } = payload;
        result = evaluateCombatTrades(attacker, targets);
        break;
      }

      case 'EVALUATE_MANA_CURVE': {
        const { deckCards, cardCatalog } = payload;
        result = calculateDeckStatistics(deckCards, cardCatalog);
        break;
      }

      default:
        result = { error: `Unknown task type: ${type}` };
    }

    const durationMs = performance.now() - start;
    const response = {
      id,
      type,
      result,
      durationMs
    };

    self.postMessage(response);
  } catch (err) {
    self.postMessage({
      id,
      type: 'ERROR',
      result: { error: err?.message || 'Worker processing error' },
      durationMs: performance.now() - start
    });
  }
};

/**
 * Heuristic combat tree & board evaluation run in worker thread
 */
function computeOptimalAiDecisions(gameState, iterations) {
  if (!gameState || !gameState.players || gameState.players.length < 2) {
    return { recommendedAttacks: [], score: 0 };
  }

  const p1 = gameState.players[0];
  const p2 = gameState.players[1];

  const boardAttackers = (p2.board || []).filter(
    (c) => c && c.canAttack && !c.hasAttackedThisTurn && !c.frozen
  );

  const champLaneAttacker = p2.championLane;
  const readyAttackers = [...boardAttackers];
  if (champLaneAttacker && champLaneAttacker.canAttack && !champLaneAttacker.hasAttackedThisTurn && !champLaneAttacker.frozen) {
    readyAttackers.push(champLaneAttacker);
  }

  const opponentUnits = (p1.board || [])
    .map((c, idx) => ({ card: c, lane: idx }))
    .filter((entry) => entry.card !== null);

  const tauntUnits = opponentUnits.filter((e) => e.card.hasTaunt);

  const recommendations = [];

  for (const attacker of readyAttackers) {
    if (tauntUnits.length > 0) {
      // Must target taunt
      const target = tauntUnits[0];
      recommendations.push({
        attackerInstanceId: attacker.instanceId,
        targetType: 'creature',
        targetLane: target.lane,
        priority: 100,
        reason: 'Taunt blocker enforcement'
      });
      continue;
    }

    // Look for lethal commander kill
    if (p1.vanguard && p1.vanguard.hp <= attacker.currentAtk) {
      recommendations.push({
        attackerInstanceId: attacker.instanceId,
        targetType: 'vanguard',
        targetLane: null,
        priority: 200,
        reason: 'Lethal blow on commander'
      });
      continue;
    }

    // Favorable trade evaluation
    let bestTrade = null;
    let highestTradeValue = -999;

    for (const opp of opponentUnits) {
      const willKillEnemy = attacker.currentAtk >= opp.card.currentHp;
      const willAttackerDie = opp.card.currentAtk >= attacker.currentHp;

      let tradeValue = 0;
      if (willKillEnemy && !willAttackerDie) {
        tradeValue = opp.card.cost * 2 + 10; // Free kill
      } else if (willKillEnemy && willAttackerDie) {
        tradeValue = (opp.card.cost - attacker.cost) * 2; // Even or positive trade
      } else {
        tradeValue = -5; // Damage without killing
      }

      if (tradeValue > highestTradeValue) {
        highestTradeValue = tradeValue;
        bestTrade = opp;
      }
    }

    if (bestTrade && highestTradeValue > 0) {
      recommendations.push({
        attackerInstanceId: attacker.instanceId,
        targetType: 'creature',
        targetLane: bestTrade.lane,
        priority: highestTradeValue,
        reason: `Value trade (Score +${highestTradeValue})`
      });
    } else {
      recommendations.push({
        attackerInstanceId: attacker.instanceId,
        targetType: 'vanguard',
        targetLane: null,
        priority: 50,
        reason: 'Face damage to commander'
      });
    }
  }

  return {
    recommendedAttacks: recommendations,
    evaluatedSimulations: iterations,
    timestamp: Date.now()
  };
}

/**
 * Evaluates individual combat trades
 */
function evaluateCombatTrades(attacker, targets) {
  if (!targets || !Array.isArray(targets)) return [];
  return targets.map(target => {
    const dmgToTarget = attacker.currentAtk || 0;
    const dmgToAttacker = target.currentAtk || 0;

    const targetDies = dmgToTarget >= target.currentHp;
    const attackerDies = dmgToAttacker >= attacker.currentHp;

    return {
      targetId: target.instanceId,
      targetDies,
      attackerDies,
      survivingAttackerHp: Math.max(0, attacker.currentHp - dmgToAttacker),
      survivingTargetHp: Math.max(0, target.currentHp - dmgToTarget)
    };
  });
}

/**
 * Offloaded deck calculation engine
 */
function calculateDeckStatistics(deckCards, cardCatalog) {
  const counts = {};
  const curve = [0, 0, 0, 0, 0, 0, 0];
  let totalCost = 0;
  let creatureCount = 0;
  let spellCount = 0;
  let wardCount = 0;

  const catalogMap = new Map((cardCatalog || []).map((c) => [c.id, c]));

  for (const id of (deckCards || [])) {
    counts[id] = (counts[id] || 0) + 1;
    const card = catalogMap.get(id);
    if (card) {
      totalCost += card.cost || 0;
      const bucket = Math.min(6, Math.max(0, (card.cost || 1) - 1));
      curve[bucket]++;
      if (card.type === 'creature') creatureCount++;
      else if (card.type === 'spell') spellCount++;
      else if (card.type === 'ward') wardCount++;
    }
  }

  const avgCost = deckCards && deckCards.length > 0 ? (totalCost / deckCards.length).toFixed(1) : '0.0';

  return {
    counts,
    curve,
    avgCost: Number(avgCost),
    totalCount: deckCards ? deckCards.length : 0,
    creatureCount,
    spellCount,
    wardCount
  };
}
