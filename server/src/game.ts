import { INVALID_MOVE } from 'boardgame.io/core';
import { Card, Suit, Pile, GameState } from './types';

const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  suits.forEach(suit => {
    for (let r = 1; r <= 13; r++) deck.push({ suit, rank: r, id: `${suit}-${r}` });
  });
  return deck.sort(() => Math.random() - 0.5);
};

const initialPiles = (): Record<Suit, Pile> => ({
  hearts: { low: 7, high: 7 },
  diamonds: { low: 7, high: 7 },
  clubs: { low: 7, high: 7 },
  spades: { low: 7, high: 7 }
});

interface CtxLike {
  numPlayers: number;
  currentPlayer: string;
}

export const Sevens = {
  name: 'sevens',
  minPlayers: 2,
  maxPlayers: 6,

  setup: (ctx: CtxLike) => {
    const numPlayers = typeof ctx.numPlayers === 'number' ? ctx.numPlayers : 2;
    const deck = createDeck();
    const handSize = Math.floor(52 / numPlayers);
    const hands: Card[][] = Array.from({ length: numPlayers }, (_, i) =>
      deck.slice(i * handSize, (i + 1) * handSize)
    );

    const piles = initialPiles();

    hands.forEach((hand: Card[]) => {
      const idx = hand.findIndex((c: Card) => c.suit === 'spades' && c.rank === 7);
      if (idx !== -1) {
        hand.splice(idx, 1);
        piles.spades = { low: 7, high: 7 };
      }
    });

    return {
      piles,
      hands,
      playedCards: [],
      players: Array.from({ length: numPlayers }, (_, i) => ({
        name: `Player ${i + 1}`,
        avatar: '🐶',
      }))
    };
  },

  turn: { minMoves: 1, maxMoves: 1 },

  moves: {
    playCard: (G: GameState, ctx: CtxLike, card: Card) => {
      const pid = parseInt(ctx.currentPlayer);
      const pile = G.piles[card.suit];
      const hand = G.hands[pid];
      if (!hand.some((c: Card) => c.id === card.id)) return INVALID_MOVE;
      if (card.rank !== pile.low - 1 && card.rank !== pile.high + 1) return INVALID_MOVE;

      const idx = hand.findIndex((c: Card) => c.id === card.id);
      hand.splice(idx, 1);
      G.playedCards.push(card);

      if (card.rank < pile.low) pile.low = card.rank;
      else pile.high = card.rank;
    },
    pass: () => {},
    autoPlay: (G: GameState, ctx: CtxLike) => {
      const pid = parseInt(ctx.currentPlayer);
      const hand = G.hands[pid];
      for (const card of hand) {
        const pile = G.piles[card.suit];
        if (card.rank === pile.low - 1 || card.rank === pile.high + 1) return { playCard: card };
      }
      return { pass: true };
    }
  },

  endIf: (ctx: any) => {
    const G: GameState | undefined = ctx?.G;
    if (!G || !Array.isArray(G.hands)) return;
    const winner = G.hands.findIndex((h: Card[]) => h.length === 0);
    if (winner !== -1) return { winner };
  }
} as any;
