import { runBot } from '../botRunner';
import { updateGameRecord } from '../services/game-record.service';
import {
  fetchGameDetails,
  joinGame,
} from '../services/game.service';
import type { JoinRouteContext, RouteNext } from '../types/route.types';
import type { GameDetails, JoinGameResponse } from '../types/service.types';
import { readJsonBody } from '../utils/common.util';

const BOT_NAME_PREFIX = '🤖 ';
const BOT_CELEBRITY_NAMES = [
  'Tom Hanks',
  'John Cena',
  'Taylor Swift',
  'Dwayne Johnson',
  'Beyonce',
  'Keanu Reeves',
  'Rihanna',
  'Leonardo DiCaprio',
  'Ariana Grande',
  'Will Smith',
  'Emma Stone',
  'Chris Evans',
  'Scarlett Johansson',
  'Bruno Mars',
  'Jennifer Lawrence',
  'Shah Rukh Khan',
  'Zendaya',
  'Ryan Reynolds',
  'Margot Robbie',
  'Selena Gomez',
  'Robert Downey Jr',
  'Lady Gaga',
  'Pedro Pascal',
  'Billie Eilish',
  'Chris Hemsworth',
  'Megan Fox',
  'Drake',
  'Daniel Craig',
  'Priyanka Chopra',
  'Miley Cyrus',
  'Jason Momoa',
  'Gal Gadot',
  'Anne Hathaway',
  'Hugh Jackman',
  'Dua Lipa',
  'Idris Elba',
  'Sandra Bullock',
  'Tom Cruise',
  'Katy Perry',
  'Morgan Freeman',
]

function normalizeBotCandidate(name?: string | null) {
  return String(name ?? '')
    .replace(BOT_NAME_PREFIX, '')
    .trim()
    .toLowerCase()
}

function pickBotNames(existingNames: Array<string | null | undefined>, count: number) {
  const used = new Set(existingNames.map(normalizeBotCandidate).filter(Boolean))
  const available = BOT_CELEBRITY_NAMES.filter((name) => !used.has(name.toLowerCase()))
  return Array.from({ length: count }, (_, index) => {
    const name = available[index] ?? `Celebrity Bot ${index + 1}`
    used.add(name.toLowerCase())
    return `${BOT_NAME_PREFIX}${name}`
  })
}

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

    const botNames = pickBotNames(players.map((player) => player.name), botsToJoin)

    for (let index = 0; index < botsToJoin; index += 1) {
      const slot = emptySlots[index];
      const botName = botNames[index]
      const joinRes = await joinGame(matchID, {
        playerID: String(slot.id),
        playerName: botName,
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
      await updateGameRecord(matchID, {
        joined_player: {
          player_id: joinData.playerID,
          display_name: botName,
          is_bot: true,
          joined_at: new Date().toISOString(),
        },
      });

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
