import { useEffect, useState } from 'react';
import { initDiscord, type DiscordUser } from './discord';
import { useQueue } from './useQueue';
import { Queue } from './components/Queue';

type Status = 'loading' | 'ready' | 'error';

export default function App() {
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    initDiscord()
      .then((u) => {
        setUser(u);
        setStatus('ready');
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to initialize');
        setStatus('error');
      });
  }, []);

  const { queue, connected, raiseHand, lowerHand, clearQueue, isRaised } = useQueue(user);

  if (status === 'loading') {
    return (
      <div className="screen screen--center">
        <div className="spinner" />
        <p className="screen__label">Connecting…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="screen screen--center">
        <p className="screen__error">⚠ {errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">✋ Hand Queue</h1>
        <div className={`connection-dot ${connected ? 'connection-dot--on' : 'connection-dot--off'}`}
          title={connected ? 'Connected' : 'Reconnecting…'}
        />
      </header>

      <main className="app__main">
        <Queue
          queue={queue}
          currentUserId={user?.id ?? null}
          onLower={lowerHand}
          onClear={clearQueue}
        />
      </main>

      <footer className="app__footer">
        {isRaised ? (
          <button
            className="hand-btn hand-btn--lower"
            onClick={() => user && lowerHand(user.id)}
            disabled={!connected}
          >
            Lower Hand
          </button>
        ) : (
          <button
            className="hand-btn hand-btn--raise"
            onClick={raiseHand}
            disabled={!connected}
          >
            ✋ Raise Hand
          </button>
        )}
        {!connected && (
          <p className="footer__reconnecting">Reconnecting…</p>
        )}
      </footer>
    </div>
  );
}
