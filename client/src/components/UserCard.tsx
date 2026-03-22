import { useEffect, useState } from 'react';
import { getAvatarUrl } from '../discord';
import type { QueueEntry } from '../useQueue';

interface Props {
  entry: QueueEntry;
  position: number;
  isSelf: boolean;
  onLower: (userId: string) => void;
}

function formatElapsed(raisedAt: number): string {
  const seconds = Math.floor((Date.now() - raisedAt) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function useElapsed(raisedAt: number): string {
  const [elapsed, setElapsed] = useState(() => formatElapsed(raisedAt));

  useEffect(() => {
    const id = setInterval(() => setElapsed(formatElapsed(raisedAt)), 10_000);
    return () => clearInterval(id);
  }, [raisedAt]);

  return elapsed;
}

export function UserCard({ entry, position, isSelf, onLower }: Props) {
  const elapsed = useElapsed(entry.raisedAt);
  const avatarUrl = getAvatarUrl(entry.userId, entry.avatar);

  return (
    <div className={`user-card ${isSelf ? 'user-card--self' : ''}`}>
      <div className="user-card__position">#{position}</div>

      <img
        className="user-card__avatar"
        src={avatarUrl}
        alt={entry.username}
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://cdn.discordapp.com/embed/avatars/0.png';
        }}
      />

      <div className="user-card__info">
        <span className="user-card__name">
          {entry.username}
          {isSelf && <span className="user-card__you-badge">you</span>}
        </span>
        <span className="user-card__time">{elapsed}</span>
      </div>

      <button
        className="user-card__lower-btn"
        onClick={() => onLower(entry.userId)}
        title={isSelf ? 'Lower your hand' : `Lower ${entry.username}'s hand`}
      >
        ✕
      </button>
    </div>
  );
}
