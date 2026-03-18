import { runBot } from '../botRunner';
import {
  fetchGameDetails,
  joinGame,
} from '../services/game.service';
import type { JoinRouteContext, RouteNext } from '../types/route.types';
import type { GameDetails, JoinGameResponse } from '../types/service.types';
import { readJsonBody } from '../utils/common.util';

export async function joinRoute(ctx: JoinRouteContext, next: RouteNext): Promise<void> {
  const match = ctx.path.match(/^\/api\/bot\/join\/([^/]+)$/);
  if (ctx.method !== 'POST' || !match) {
    await next();
    return;
  }

  const matchID = match[1];

  try {
    const body = await readJsonBody(ctx);
    const aiBots = Number(body.aiBots ?? 0);

    if (aiBots < 1 || !Number.isInteger(aiBots)) {
      ctx.status = 400;
      ctx.body = { error: 'aiBots must be a positive integer' };
      return;
    }

    const metaRes = await fetchGameDetails(matchID);
    if (!metaRes.ok) {
      ctx.status = metaRes.status;
      ctx.body = { error: 'Match not found' };
      return;
    }

    const meta = (await metaRes.json()) as GameDetails;

    const players = meta.players ?? [];
    const emptySlots = players
      .map((player, index) => ({ id: index, name: player.name }))
      .filter((player) => player.name == null || player.name === '');
    const botsToJoin = Math.min(aiBots, emptySlots.length);

    if (botsToJoin === 0) {
      ctx.status = 400;
      ctx.body = { error: 'No empty slots for bots' };
      return;
    }

    for (let index = 0; index < botsToJoin; index += 1) {
      const slot = emptySlots[index];
      const joinRes = await joinGame(matchID, {
        playerID: String(slot.id),
        playerName: `Bot ${index + 1}`,
        data: {},
      });

      if (!joinRes.ok) {
        const text = await joinRes.text();
        console.error('[join-bots] Join failed:', joinRes.status, text);
        ctx.status = 502;
        ctx.body = { error: 'Failed to join bot' };
        return;
      }

      const joinData = (await joinRes.json()) as JoinGameResponse;

      runBot(matchID, joinData.playerID, joinData.playerCredentials);
    }

    ctx.status = 200;
    ctx.body = { joined: botsToJoin };
  } catch (error) {
    console.error('[join-bots] Error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
}
