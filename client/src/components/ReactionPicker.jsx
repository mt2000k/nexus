const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

export default function ReactionPicker({ onSelect, onClose }) {
  return (
    <div className="reaction-picker" onClick={(e) => e.stopPropagation()}>
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          className="reaction-option"
          onClick={() => { onSelect(emoji); onClose(); }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export function ReactionBar({ reactions, currentUserId, onToggle }) {
  if (!reactions || reactions.length === 0) return null;

  const grouped = {};
  reactions.forEach((r) => {
    if (!grouped[r.emoji]) grouped[r.emoji] = { emoji: r.emoji, users: [], count: 0 };
    grouped[r.emoji].users.push(r.username);
    grouped[r.emoji].count++;
  });

  const hasUserReacted = (emoji) =>
    reactions.some((r) => r.emoji === emoji && r.userId === currentUserId);

  return (
    <div className="reaction-bar">
      {Object.values(grouped).map((g) => (
        <button
          key={g.emoji}
          className={`reaction-badge ${hasUserReacted(g.emoji) ? 'active' : ''}`}
          onClick={() => onToggle(g.emoji)}
          title={g.users.join(', ')}
        >
          {g.emoji} {g.count}
        </button>
      ))}
    </div>
  );
}
