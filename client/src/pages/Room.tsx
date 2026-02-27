import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { Sevens } from '../../../server/src/game';
import GameBoard from '../components/GameBoard';
import AvatarPicker from '../components/AvatarPicker';

const SevensClient = Client({
  game: Sevens,
  board: GameBoard,
  multiplayer: SocketIO({ server: 'http://localhost:8000' }),
  debug: false,
});

export default function Room() {
  const { matchID } = useParams<{ matchID: string }>();
  const [joined, setJoined] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [avatar, setAvatar] = useState('🐶');

  if (!joined) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-slate-900 max-w-sm w-full">
          <h2 className="text-3xl mb-6">Join Room {matchID}</h2>
          <input
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Your alias"
            className="w-full border-2 border-slate-300 p-4 rounded-2xl mb-6"
          />
          <AvatarPicker onSelect={setAvatar} />
          <div className="mt-4 text-lg">
            Selected avatar: <span className="text-3xl">{avatar}</span>
          </div>
          <button
            onClick={() => setJoined(true)}
            className="mt-8 bg-emerald-500 text-white w-full py-6 rounded-3xl text-xl font-bold"
          >
            ENTER GAME
          </button>
        </div>
      </div>
    );
  }

  return <SevensClient matchID={matchID!} />;
}
