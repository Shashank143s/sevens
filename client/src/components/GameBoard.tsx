import { motion, AnimatePresence } from 'framer-motion';
import { Card, Suit } from '../types';

type GameBoardProps = {
  G: {
    piles: Record<Suit, { low: number; high: number }>;
    hands: Card[][];
    playedCards: Card[];
  };
  ctx: { currentPlayer: string };
  moves: Record<string, (...args: any[]) => void>;
  playerID?: string | null;
};

export default function GameBoard({ G, ctx, moves, playerID }: GameBoardProps) {
  const { piles, hands } = G;
  const playerIndex = playerID != null ? parseInt(playerID, 10) : -1;
  const myHand = playerIndex >= 0 ? hands[playerIndex] || [] : [];
  const currentPlayerIndex = parseInt(ctx.currentPlayer);

  const suitSymbols: Record<Suit, string> = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
  };

  const ranks = Array.from({ length: 13 }, (_, i) => i + 1);

  const getCardImageSrc = (card: { suit: Suit; rank: number }) =>
    `/cards/${card.suit}-${card.rank}.png`;

  const renderCardSlot = (card: Card | null, inPile: boolean) => {
    if (card && inPile) {
      return (
        <motion.img
          key={card.id}
          src={getCardImageSrc(card)}
          alt={`${card.rank} of ${card.suit}`}
          initial={{ scale: 0.92, y: -6 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full h-full rounded-md shadow-lg bg-white object-contain"
        />
      );
    }

    // Empty slot – very subtle, like the tutorial
    return (
      <div className="w-full h-full rounded-md bg-white/10 shadow-inner" />
    );
  };

  const renderHeartsColumn = () => {
    const pile = piles.hearts;

    return (
      <div className="flex flex-col items-center gap-2">
        {ranks.map(rank => {
          const inPile = rank >= pile.low && rank <= pile.high;
          const card: Card = { suit: 'hearts', rank, id: `hearts-${rank}` };

          return (
            <div
              key={rank}
              className="w-16 h-24 rounded-md flex items-center justify-center"
            >
              {renderCardSlot(card, inPile)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSuitLane = (suit: Exclude<Suit, 'hearts'>) => {
    const pile = piles[suit];

    return (
      <div className="flex gap-2">
        {ranks.map(rank => {
          const inPile = rank >= pile.low && rank <= pile.high;
          const card: Card = { suit, rank, id: `${String(suit)}-${rank}` };

          return (
            <div
              key={rank}
              className="w-16 h-24 rounded-md flex items-center justify-center"
            >
              {renderCardSlot(card, inPile)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: "url('https://assets.sevens.game/wood-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: 16,
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
      className="fixed inset-0 bg-[url('https://assets.sevens.game/wood-bg.jpg')] bg-cover bg-center p-4 font-sans flex flex-col"
    >
      {/* Top Banner */}
      <div className="bg-white/90 text-center py-3 rounded-2xl shadow mb-6 text-2xl font-bold text-slate-800 flex items-center justify-center gap-4">
        {playerIndex === currentPlayerIndex ? '🕒 You must play a card' : 'Waiting for player...'}
        {playerIndex === currentPlayerIndex && <div className="text-3xl font-mono text-red-500">29s</div>}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 24,
          maxWidth: 1120,
          margin: '0 auto',
          width: '100%',
          flex: 1,
        }}
        className="flex gap-6 max-w-7xl mx-auto"
      >
        {/* CENTRAL TABLE – open wood with cross-shaped layout like the tutorial */}
        <div
          style={{ flex: 1, position: 'relative', minHeight: 460 }}
          className="flex-1 relative min-h-[460px]"
        >
          {/* Hearts vertical column in the middle */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            {renderHeartsColumn()}
          </div>

          {/* Spades lane above hearts */}
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            className="absolute left-1/2 -translate-x-1/2 top-10"
          >
            {renderSuitLane('spades')}
          </div>

          {/* Diamonds lane below hearts */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, 80px)',
            }}
            className="absolute left-1/2 -translate-x-1/2 top-1/2 translate-y-20"
          >
            {renderSuitLane('diamonds')}
          </div>

          {/* Clubs lane further down */}
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            className="absolute left-1/2 -translate-x-1/2 bottom-4"
          >
            {renderSuitLane('clubs')}
          </div>
        </div>

        {/* RIGHT SIDEBAR – EXACTLY like your screenshot */}
        <div className="w-80 bg-white/95 rounded-3xl shadow-xl p-4 flex flex-col h-[520px]">
          <div className="space-y-4 flex-1 overflow-y-auto">
            {Array.from({ length: G.hands.length }).map((_, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl ${i === currentPlayerIndex ? 'ring-4 ring-yellow-400 bg-yellow-50' : 'bg-gray-50'}`}>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-2xl shadow">
                  👤
                </div>
                <div className="flex-1">
                  <div className="font-bold">{i === 0 ? 'You' : `Player ${i}`}</div>
                  <div className="text-sm text-gray-500">0 ★ • {G.hands[i].length} cards</div>
                </div>
                <div className="text-2xl">👋</div>
              </div>
            ))}
          </div>

          {/* Move Log (bottom of sidebar) */}
          <div className="mt-4 border-t pt-4 text-xs text-gray-600 max-h-40 overflow-y-auto">
            <div className="font-bold mb-2">Game Log</div>
            {G.playedCards.slice(-5).map((c: Card, i: number) => (
              <div key={i} className="mb-1">
                Player {i % 3} played {c.rank}
                {suitSymbols[c.suit]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM HAND – translucent band across the table */}
      <div
        style={{
          marginTop: 40,
          background: 'rgba(255,255,255,0.8)',
          borderRadius: 12,
          padding: '12px 24px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.6)',
          maxWidth: 1120,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
        className="mt-10 bg-white/70 rounded-xl px-6 py-4 shadow-lg border border-white/40 max-w-6xl mx-auto"
      >
        <div className="flex justify-between mb-4 text-lg font-bold text-slate-700">
          <span>My hand</span>
          <span className="text-blue-600 cursor-pointer">Sort cards by number ↓</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
          <AnimatePresence>
            {myHand.map((card: Card) => (
              <motion.div
                key={card.id}
                draggable
                whileHover={{ scale: 1.15, rotate: 5, zIndex: 50 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-28 bg-transparent rounded-2xl shadow-2xl flex-shrink-0 flex items-center justify-center border-4 border-transparent cursor-grab active:cursor-grabbing snap-center"
                onClick={() => playerIndex === currentPlayerIndex && moves.playCard(card)}
              >
                <img
                  src={getCardImageSrc(card)}
                  alt={`${card.rank} of ${card.suit}`}
                  className="w-full h-full rounded-2xl shadow-xl object-contain"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* PASS BUTTON (auto if no moves) */}
      {playerIndex === currentPlayerIndex && (
        <button
          onClick={() => moves.pass()}
          className="fixed bottom-8 right-8 bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-2xl transition"
        >
          PASS
        </button>
      )}
    </div>
  );
}