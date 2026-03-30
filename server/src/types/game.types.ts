export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export interface Card {
  suit: Suit;
  rank: number;
  id: string;
}

export interface Pile {
  started: boolean;
  low: number | null;
  high: number | null;
}

export interface GameState {
  piles: Record<Suit, Pile>;
  hands: Card[][];
  passedPlayers: number[];
  firstPlayer: number;
}
