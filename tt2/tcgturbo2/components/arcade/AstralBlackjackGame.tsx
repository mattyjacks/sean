'use client';

import React, { useState } from 'react';
import { soundEngine } from '@/lib/tcg/soundEngine';
import { ArrowLeft, Sparkles, Zap, ShieldAlert } from 'lucide-react';

interface BlackjackCard {
  suit: '🔥' | '🌑' | '🌿' | '🌊';
  name: string;
  value: number;
}

const SUITS: ('🔥' | '🌑' | '🌿' | '🌊')[] = ['🔥', '🌑', '🌿', '🌊'];
const CARD_RANKS = [
  { name: 'A', value: 11 },
  { name: '2', value: 2 },
  { name: '3', value: 3 },
  { name: '4', value: 4 },
  { name: '5', value: 5 },
  { name: '6', value: 6 },
  { name: '7', value: 7 },
  { name: '8', value: 8 },
  { name: '9', value: 9 },
  { name: '10', value: 10 },
  { name: 'J', value: 10 },
  { name: 'Q', value: 10 },
  { name: 'K', value: 10 }
];

function drawRandomCard(): BlackjackCard {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const rank = CARD_RANKS[Math.floor(Math.random() * CARD_RANKS.length)];
  return { suit, name: rank.name, value: rank.value };
}

function calculateHandScore(hand: BlackjackCard[]): number {
  let score = hand.reduce((sum, c) => sum + c.value, 0);
  let aces = hand.filter(c => c.name === 'A').length;
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
}

interface AstralBlackjackGameProps {
  onBackToArcade: () => void;
  onLaunchMainGame: () => void;
}

export function AstralBlackjackGame({ onBackToArcade, onLaunchMainGame }: AstralBlackjackGameProps) {
  const [playerGems, setPlayerGems] = useState<number>(1000);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [playerHand, setPlayerHand] = useState<BlackjackCard[]>([]);
  const [dealerHand, setDealerHand] = useState<BlackjackCard[]>([]);
  const [gameStatus, setGameStatus] = useState<'betting' | 'playing' | 'dealer_turn' | 'finished'>('betting');
  const [resultMessage, setResultMessage] = useState<string>('');
  const [winStreak, setWinStreak] = useState<number>(0);

  const startRound = () => {
    if (playerGems < betAmount) {
      soundEngine.playTrap();
      setResultMessage('Not enough Astral Gems to place this bet!');
      return;
    }

    soundEngine.playCardDraw();
    setPlayerGems(prev => prev - betAmount);

    const p1 = drawRandomCard();
    const d1 = drawRandomCard();
    const p2 = drawRandomCard();
    const d2 = drawRandomCard();

    const initialPlayer = [p1, p2];
    const initialDealer = [d1, d2];

    setPlayerHand(initialPlayer);
    setDealerHand(initialDealer);
    setGameStatus('playing');
    setResultMessage('');

    // Instant Natural 21
    if (calculateHandScore(initialPlayer) === 21) {
      soundEngine.playVictory();
      setGameStatus('finished');
      const payout = Math.floor(betAmount * 2.5);
      setPlayerGems(prev => prev + payout);
      setWinStreak(s => s + 1);
      setResultMessage(`🌟 NATURAL COSMIC 21! You won +${payout} Astral Gems!`);
    }
  };

  const hitCard = () => {
    if (gameStatus !== 'playing') return;
    soundEngine.playCardDraw();

    const newCard = drawRandomCard();
    const nextHand = [...playerHand, newCard];
    setPlayerHand(nextHand);

    const newScore = calculateHandScore(nextHand);
    if (newScore > 21) {
      soundEngine.playAttack();
      setGameStatus('finished');
      setWinStreak(0);
      setResultMessage('💥 BUST! Your hand exceeded 21.');
    }
  };

  const standHand = () => {
    if (gameStatus !== 'playing') return;
    soundEngine.playHover();
    setGameStatus('dealer_turn');

    const currentDealer = [...dealerHand];
    let dealerScore = calculateHandScore(currentDealer);

    while (dealerScore < 17) {
      currentDealer.push(drawRandomCard());
      dealerScore = calculateHandScore(currentDealer);
    }

    setDealerHand(currentDealer);
    const playerScore = calculateHandScore(playerHand);

    setGameStatus('finished');

    if (dealerScore > 21) {
      soundEngine.playVictory();
      const payout = betAmount * 2;
      setPlayerGems(prev => prev + payout);
      setWinStreak(s => s + 1);
      setResultMessage(`🎉 Dealer BUSTS! You won +${payout} Gems!`);
    } else if (playerScore > dealerScore) {
      soundEngine.playVictory();
      const payout = betAmount * 2;
      setPlayerGems(prev => prev + payout);
      setWinStreak(s => s + 1);
      setResultMessage(`🏆 Victory! ${playerScore} beats Dealer's ${dealerScore}. (+${payout} Gems)`);
    } else if (playerScore === dealerScore) {
      soundEngine.playHover();
      setPlayerGems(prev => prev + betAmount);
      setResultMessage(`🤝 Cosmic Push! Both scored ${playerScore}. Bet refunded.`);
    } else {
      soundEngine.playAttack();
      setWinStreak(0);
      setResultMessage(`💀 Defeat! Dealer's ${dealerScore} beats your ${playerScore}.`);
    }
  };

  const playerScore = calculateHandScore(playerHand);
  const dealerScore = calculateHandScore(dealerHand);

  return (
    <div className="astral-blackjack-container flex flex-col flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-6 gap-6 h-[calc(100vh-70px)] overflow-y-auto select-none">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-purple-500/40 rounded-2xl p-4 shadow-xl backdrop-blur-xl gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToArcade}
            className="btn bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            <span>Back to Arcade</span>
          </button>
          <div>
            <h2 className="text-lg md:text-xl font-black font-serif uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <span>🃏 Astral 21: Cosmic Blackjack</span>
              <span className="text-[10px] bg-purple-950 border border-purple-500 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                ARCADE EDITION
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 border border-amber-500/50 px-3 py-1.5 rounded-xl flex items-center gap-2 font-mono text-xs">
            <span className="text-amber-400 font-black">💎 {playerGems.toLocaleString()} Gems</span>
            {winStreak > 1 && (
              <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black px-1.5 py-0.5 rounded text-[10px]">
                🔥 {winStreak}x STREAK
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onLaunchMainGame}
            className="btn bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-xl shadow hover:scale-105 transition-transform"
          >
            ⚔️ Launch Main TCG Turbo
          </button>
        </div>
      </div>

      {/* Duel Table Mat */}
      <div className="blackjack-table bg-gradient-to-b from-[#0c1024] via-[#0f1738] to-[#080b18] border-2 border-purple-500/30 rounded-3xl p-6 md:p-8 flex flex-col justify-between gap-8 relative shadow-[0_0_80px_rgba(139,92,246,0.15)] min-h-[500px]">
        {/* Decorative Table Felt Stamp */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <div className="w-80 h-80 rounded-full border-8 border-dashed border-white" />
        </div>

        {/* Dealer Area */}
        <div className="dealer-row flex flex-col items-center gap-3 relative z-10">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Astral Dealer</span>
            {gameStatus !== 'betting' && (
              <span className="bg-slate-900 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-full">
                Score: {gameStatus === 'playing' ? '?' : dealerScore}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 min-h-[110px]">
            {dealerHand.length === 0 ? (
              <div className="w-20 h-28 rounded-xl border border-dashed border-slate-700 flex items-center justify-center text-slate-600 font-mono text-xs">
                Dealer
              </div>
            ) : (
              dealerHand.map((c, i) => {
                const isHidden = i === 1 && gameStatus === 'playing';
                return (
                  <div
                    key={`dealer_${i}`}
                    className={`w-20 h-28 rounded-xl border-2 shadow-xl flex flex-col items-center justify-between p-2 font-mono transition-transform hover:-translate-y-1 ${
                      isHidden
                        ? 'bg-gradient-to-br from-indigo-950 to-slate-950 border-purple-500/60 text-purple-400'
                        : 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    {isHidden ? (
                      <div className="flex flex-col items-center justify-center h-full gap-1">
                        <Sparkles className="w-6 h-6 text-purple-400 animate-spin" />
                        <span className="text-[10px] font-bold text-purple-300">SECRET</span>
                      </div>
                    ) : (
                      <>
                        <div className="self-start text-xs font-black">{c.name}</div>
                        <div className="text-2xl">{c.suit}</div>
                        <div className="self-end text-xs font-black">{c.name}</div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Result Banner */}
        {resultMessage && (
          <div className="relative z-20 text-center py-2 px-4 rounded-xl bg-slate-950/90 border border-amber-500/60 shadow-lg text-sm md:text-base font-serif font-black tracking-wide text-amber-200 animate-in fade-in zoom-in-95 max-w-md mx-auto">
            {resultMessage}
          </div>
        )}

        {/* Player Area */}
        <div className="player-row flex flex-col items-center gap-3 relative z-10">
          <div className="flex items-center gap-3 min-h-[110px]">
            {playerHand.length === 0 ? (
              <div className="w-20 h-28 rounded-xl border border-dashed border-slate-700 flex items-center justify-center text-slate-600 font-mono text-xs">
                Your Hand
              </div>
            ) : (
              playerHand.map((c, i) => (
                <div
                  key={`player_${i}`}
                  className="w-20 h-28 rounded-xl border-2 border-amber-400/80 bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] flex flex-col items-center justify-between p-2 font-mono transition-transform hover:-translate-y-1.5"
                >
                  <div className="self-start text-xs font-black text-amber-300">{c.name}</div>
                  <div className="text-2xl">{c.suit}</div>
                  <div className="self-end text-xs font-black text-amber-300">{c.name}</div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
            <span>Your Hand</span>
            {gameStatus !== 'betting' && (
              <span className="bg-slate-900 border border-amber-500/50 text-amber-300 px-2 py-0.5 rounded-full">
                Score: {playerScore}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls & Bet Sizing */}
        <div className="controls-row flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-800/80 relative z-10">
          {gameStatus === 'betting' || gameStatus === 'finished' ? (
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-xs">
                <span className="text-slate-400 px-2">Bet:</span>
                {[25, 50, 100, 250].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setBetAmount(val);
                      soundEngine.playHover();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      betAmount === val
                        ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    💎 {val}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={startRound}
                className="btn bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-mono text-sm font-black px-6 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform"
              >
                {gameStatus === 'finished' ? 'Deal Next Round 🔄' : 'Deal Hand 🃏'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={hitCard}
                className="btn bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-mono text-sm font-black px-6 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>HIT (Draw Card)</span>
              </button>

              <button
                type="button"
                onClick={standHand}
                className="btn bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-sm font-black px-6 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>STAND (Hold)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
