const avatars = ['🐶','🐱','🦊','🐻','🐼','🐨','🐯','🦁','🐸','🐵'];

export default function AvatarPicker({ onSelect }: { onSelect: (a: string) => void }) {
  return (
    <div className="grid grid-cols-5 gap-4">
      {avatars.map(a => (
        <button key={a} onClick={() => onSelect(a)} className="text-5xl hover:scale-125 transition p-2 rounded-2xl active:bg-slate-100">{a}</button>
      ))}
    </div>
  );
}
