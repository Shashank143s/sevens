export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export interface Card {
  suit: Suit;
  rank: number;
  id: string;
}

export interface Pile {
  low: number;
  high: number;
}

export interface Player {
  name: string;
  avatar: string;
}

export interface GameState {
  piles: Record<Suit, Pile>;
  hands: Card[][];
  playedCards: Card[];
  players: Player[];
}
