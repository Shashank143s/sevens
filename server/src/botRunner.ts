import { Client } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { RandomBot } from 'boardgame.io/ai';
import { Sevens } from './game';
import { SERVER_URL } from './config';

function createSevensBot() {
  const enumerate = (Sevens as { ai?: { enumerate: (G: unknown, ctx: { currentPlayer: string }, playerID: string) => unknown[] } }).ai?.enumerate;
  if (!enumerate) {
    throw new Error('Sevens game must define ai.enumerate');
  }
  return new RandomBot({
    enumerate: enumerate as (G: unknown, ctx: { currentPlayer: string }, playerID: string) => Array<{ move: string; args: unknown[] }>,
    seed: Math.random().toString(36).slice(2),
  });
}

/**
 * Run a bot client that joins the match and makes moves when it's the bot's turn.
 */
export function runBot(matchID: string, playerID: string, credentials: string): void {
  const client = Client({
    game: Sevens,
    multiplayer: SocketIO({ server: SERVER_URL }),
    matchID,
    playerID,
    credentials,
    debug: false,
  });

  const bot = createSevensBot();
  const enumerate = (Sevens as any)?.ai?.enumerate as
    | ((G: unknown, ctx: unknown, playerID: string) => Array<{ move: string; args: unknown[] }>)
    | undefined;

  let stepping = false;
  let lastTurnKey: string | null = null;
  let latestState: any = null;
  let tickTimer: ReturnType<typeof setTimeout> | null = null;
  let lastAttemptKey: string | null = null;
  let attemptsThisTurn = 0;

  function stopTick() {
    if (tickTimer) {
      clearTimeout(tickTimer);
      tickTimer = null;
    }
  }

  function scheduleTick(ms: number) {
    stopTick();
    tickTimer = setTimeout(() => {
      tickTimer = null;
      void tick();
    }, ms);
  }

  function isMyTurn(state: any): boolean {
    const ctx = state?.ctx as { currentPlayer?: string; gameover?: unknown };
    if (!state || !ctx) return false;
    if (ctx.gameover) return false;
    if (state.isActive === false) return false;
    return ctx.currentPlayer === playerID;
  }

  async function tick(): Promise<void> {
    const state = latestState;
    if (!state) return;
    if (!isMyTurn(state)) return;
    if (stepping) return;

    const ctx = state.ctx as { currentPlayer?: string; turn?: number };
    const turnKey = `${matchID}:${ctx.turn ?? 'unknown'}:${ctx.currentPlayer ?? 'unknown'}`;

    if (turnKey !== lastAttemptKey) {
      lastAttemptKey = turnKey;
      attemptsThisTurn = 0;
    }
    attemptsThisTurn += 1;

    stepping = true;
    try {
      const moves = enumerate ? enumerate(state.G, state.ctx, playerID) : [];
      if (!moves || moves.length === 0) {
        console.warn(`[Sevens Bot] No moves enumerated: match=${matchID} player=${playerID}`);
        return;
      }

      const choice = moves[Math.floor(Math.random() * moves.length)];
      const moveName = choice.move;
      const fn = (client as any).moves?.[moveName] as ((...args: any[]) => any) | undefined;
      if (!fn) {
        console.error(`[Sevens Bot] Move not found on client: ${moveName}`);
        return;
      }
      fn(...(choice.args ?? []));
    } catch (err) {
      console.error('[Sevens Bot] Move error:', err);
    } finally {
      stepping = false;
    }

    // If the move was rejected, we may not get a new state push.
    // Keep nudging while it's still our turn, with gentle backoff.
    const delay = Math.min(900, 120 + attemptsThisTurn * 120);
    scheduleTick(delay);
  }

  client.subscribe((state) => {
    if (!state) return;
    latestState = state;
    if (stepping) return;
    const ctx = state.ctx as { currentPlayer?: string; gameover?: unknown; turn?: number };
    if (ctx.gameover) return;
    const currentPlayer = ctx.currentPlayer;
    if (state.isActive === false) return;
    if (currentPlayer !== playerID) {
      stopTick();
      return;
    }

    const turnKey = `${matchID}:${ctx.turn ?? 'unknown'}:${currentPlayer}`;
    if (turnKey !== lastTurnKey) {
      lastTurnKey = turnKey;
      let nMoves = 0;
      try {
        if (enumerate) {
          nMoves = enumerate(state.G, state.ctx, playerID)?.length ?? 0;
        }
      } catch (e) {
        console.error('[Sevens Bot] enumerate error:', e);
      }
      console.log(`[Sevens Bot] My turn: match=${matchID} player=${playerID} turn=${ctx.turn ?? 'unknown'} moves=${nMoves}`);
    }
    // Attempt immediately, then keep retrying if needed.
    scheduleTick(80);
  });

  client.start();
  console.log(`🤖 Bot started for match ${matchID} as player ${playerID}`);
}
