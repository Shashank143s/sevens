import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');

  const createRoom = () => navigate('/room/' + Math.random().toString(36).substring(2, 10));
  const joinRoom = () => roomCode && navigate(`/room/${roomCode}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-black mb-4 tracking-tighter">SEVENS</h1>
        <p className="text-xl mb-12 text-slate-400">First to empty hand wins!</p>
        <button onClick={createRoom} className="bg-emerald-500 hover:bg-emerald-600 w-full py-6 text-3xl font-bold rounded-3xl mb-8">Create New Room</button>
        <div className="flex gap-3">
          <input value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} placeholder="Room code" className="bg-slate-800 px-6 py-4 rounded-3xl flex-1 text-xl" />
          <button onClick={joinRoom} className="bg-white text-slate-900 px-10 py-4 rounded-3xl font-bold">Join</button>
        </div>
      </div>
    </div>
  );
}
