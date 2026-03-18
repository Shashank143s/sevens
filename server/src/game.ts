import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import type { Ctx, DefaultPluginAPIs, FnContext, Game } from 'boardgame.io';
import type { Card, GameState, Pile, Suit } from './types/game.types';

/**
 * -----------------------------
 * Helpers
 * -----------------------------
 */

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

/**
 * Create a standard 52-card deck.
 * NOTE: No shuffling here — boardgame.io handles randomness.
 */
function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank, id: `${suit}-${rank}` });
    }
  }
  return deck;
}

/**
 * Initialize piles.
 * All suits are locked until their 7 is played.
 */
function initialPiles(): Record<Suit, Pile> {
  return {
    hearts:   { started: false, low: null, high: null },
    diamonds:{ started: false, low: null, high: null },
    clubs:   { started: false, low: null, high: null },
    spades:  { started: false, low: null, high: null },
  };
}

/**
 * Deal cards round-robin so ALL 52 cards are used.
 *
 * Example with 3 players:
 * P0: 18 cards
 * P1: 17 cards
 * P2: 17 cards
 */
function dealCards(deck: Card[], numPlayers: number): Card[][] {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  deck.forEach((card, i) => {
    hands[i % numPlayers].push(card);
  });
  return hands;
}

/**
 * Check if a card is playable according to Sevens rules.
 */
export function isPlayable(card: Card, pile: Pile): boolean {
  // Suit not started → ONLY 7 allowed
  if (!pile.started) {
    return card.rank === 7;
  }

  // Suit started → extend low or high
  return (
    card.rank === (pile.low! - 1) ||
    card.rank === (pile.high! + 1)
  );
}

/**
 * Check if a player has ANY legal move.
 * Used to determine if passing is allowed.
 */
export function hasPlayableMove(hand: Card[], piles: GameState['piles']): boolean {
  return hand.some(card => isPlayable(card, piles[card.suit]));
}

/**
 * Enumerate all legal moves for a player. Used by the AI bot.
 */
export function enumerateSevensMoves(G: GameState, ctx: { currentPlayer: string }, playerID: string): Array<{ move: string; args: unknown[] }> {
  const pid = Number(playerID);
  const hand = G.hands[pid];
  if (!hand || !Array.isArray(hand)) return [];
  // Hand may contain { hidden: true } for other players; bot only sees own hand as full cards
  const realHand = hand.filter((c): c is Card => c && typeof c === 'object' && 'suit' in c && 'rank' in c);
  const moves: Array<{ move: string; args: unknown[] }> = [];
  for (const card of realHand) {
    const pile = G.piles[card.suit];
    if (pile && isPlayable(card, pile)) {
      moves.push({ move: 'playCard', args: [card] });
    }
  }
  if (moves.length === 0 && hasPlayableMove(realHand, G.piles) === false) {
    moves.push({ move: 'pass', args: [] });
  }
  return moves;
}

/**
 * -----------------------------
 * The Sevens Game
 * -----------------------------
 */

export const Sevens: Game<GameState> = {
  name: 'sevens',

  minPlayers: 2,
  maxPlayers: 6,

  /**
   * SETUP
   * Runs ONCE when a match is created.
   */
  setup: ({ ctx, random }: DefaultPluginAPIs & { ctx: Ctx }): GameState => {
    // Create and shuffle deck using boardgame.io RNG plugin
    const deck = random.Shuffle(createDeck());

    // Deal cards fairly
    const hands = dealCards(deck, ctx.numPlayers);

    // Initialize piles
    const piles = initialPiles();

    // Find who has 7♠ — they MUST start
    let firstPlayer = 0;
    hands.forEach((hand, pid) => {
      if (hand.some(c => c.suit === 'spades' && c.rank === 7)) {
        firstPlayer = pid;

        // Remove 7♠ from their hand
        hands[pid] = hand.filter(c => !(c.suit === 'spades' && c.rank === 7));

        // Play 7♠ to the spades pile
        piles.spades = { started: true, low: 7, high: 7 };
      }
    });

    return {
      piles,
      hands,
      passedPlayers: [],
      firstPlayer,
    };
  },

  /**
   * TURN CONFIGURATION
   */
  turn: {
    // Ensure the first turn starts with the 7♠ holder.
    // (Using `setActivePlayers` does not change `ctx.currentPlayer`, so bots/clients can get stuck.)
    order: {
      ...TurnOrder.DEFAULT,
      first: ({ G, ctx }) =>
        ctx.turn === 0
          ? G.firstPlayer
          : (ctx.playOrderPos + 1) % ctx.playOrder.length,
    },

    minMoves: 1,
    maxMoves: 1,
  },

  /**
   * MOVES
   * Only these can mutate game state.
   */
  moves: {
    /**
     * Play a card from hand onto the table.
     */
    playCard({ G, ctx }: FnContext<GameState> & { playerID: string }, card: Card) {
      const pid = Number(ctx.currentPlayer);
      const hand = G.hands[pid];
      const pile = G.piles[card.suit];

      // Anti-cheat: card must be in player's hand
      if (!hand.some(c => c.id === card.id)) {
        return INVALID_MOVE;
      }

      // Validate Sevens rules
      if (!isPlayable(card, pile)) {
        return INVALID_MOVE;
      }

      // Remove card from hand
      G.hands[pid] = hand.filter(c => c.id !== card.id);

      // Apply card to pile
      if (!pile.started) {
        // First card of a suit MUST be 7
        pile.started = true;
        pile.low = 7;
        pile.high = 7;
      } else if (card.rank < pile.low!) {
        pile.low = card.rank;
      } else {
        pile.high = card.rank;
      }

      // Clear pass history since game progressed
      G.passedPlayers = [];
    },

    /**
     * Pass turn (ONLY allowed if no legal moves exist).
     */
    pass({ G, ctx }: FnContext<GameState> & { playerID: string }) {
      const pid = Number(ctx.currentPlayer);
      const hand = G.hands[pid];

      if (hasPlayableMove(hand, G.piles)) {
        // You had a move → passing is illegal
        return INVALID_MOVE;
      }

      if (!G.passedPlayers.includes(pid)) {
        G.passedPlayers.push(pid);
      }
    },
  },

  /**
   * GAME END CONDITION
   */
  endIf: ({ G }: FnContext<GameState>) => {
    const winner = G.hands.findIndex(hand => hand.length === 0);
    if (winner !== -1) {
      return { winner };
    }
  },

  /**
   * Hide other players' hands from each client.
   */
  playerView: ({ G, playerID }: { G: GameState; ctx: Ctx; playerID: string | null }) => {
    if (playerID === null) return G;

    return {
      ...G,
      hands: G.hands.map((hand, i) =>
        i === Number(playerID) ? hand : hand.map(() => ({ hidden: true }))
      ),
    };
  },

  /**
   * AI: enumerate legal moves for bot players.
   */
  ai: {
    enumerate: (G: GameState, ctx: { currentPlayer: string }, playerID: string) =>
      enumerateSevensMoves(G, ctx, playerID),
  },
};
