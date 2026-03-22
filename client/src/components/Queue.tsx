import { UserCard } from './UserCard';
import type { QueueEntry } from '../useQueue';

interface Props {
  queue: QueueEntry[];
  currentUserId: string | null;
  onLower: (userId: string) => void;
  onClear: () => void;
}

export function Queue({ queue, currentUserId, onLower, onClear }: Props) {
  if (queue.length === 0) {
    return (
      <div className="queue-empty">
        <span className="queue-empty__icon">🙌</span>
        <p>No hands raised yet.</p>
        <p className="queue-empty__sub">Be the first!</p>
      </div>
    );
  }

  return (
    <div className="queue">
      <div className="queue__header">
        <span className="queue__count">
          {queue.length} {queue.length === 1 ? 'person' : 'people'} in queue
        </span>
        <button className="queue__clear-btn" onClick={onClear} title="Clear entire queue">
          Clear all
        </button>
      </div>
      <ul className="queue__list">
        {queue.map((entry, i) => (
          <li key={entry.userId} className="queue__item">
            <UserCard
              entry={entry}
              position={i + 1}
              isSelf={entry.userId === currentUserId}
              onLower={onLower}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
