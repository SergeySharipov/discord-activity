import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

export interface QueueEntry {
  userId: string;
  username: string;
  avatar: string | null;
  raisedAt: number;
}

// In-memory queue — source of truth for new connections
const queue: QueueEntry[] = [];

// Exchange Discord OAuth code for access token
app.post('/api/token', async (req, res) => {
  const { code } = req.body as { code: string };
  const clientId = process.env.VITE_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Discord credentials not configured' });
  }

  try {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
      }),
    });

    const data = await response.json() as { access_token: string };
    return res.json({ access_token: data.access_token });
  } catch (err) {
    return res.status(500).json({ error: 'Token exchange failed' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, queueLength: queue.length });
});

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`);

  // Send current queue to newly joined client
  socket.emit('queue:init', [...queue]);

  socket.on('hand:raise', (entry: QueueEntry) => {
    if (!entry.userId || queue.find((e) => e.userId === entry.userId)) return;
    queue.push({ ...entry, raisedAt: Date.now() });
    io.emit('hand:raised', entry);
    console.log(`[↑] ${entry.username} raised hand — queue: ${queue.length}`);
  });

  socket.on('hand:lower', (userId: string) => {
    const idx = queue.findIndex((e) => e.userId === userId);
    if (idx === -1) return;
    const [removed] = queue.splice(idx, 1);
    io.emit('hand:lowered', userId);
    console.log(`[↓] ${removed.username} lowered hand — queue: ${queue.length}`);
  });

  socket.on('queue:clear', () => {
    queue.splice(0, queue.length);
    io.emit('queue:cleared');
    console.log('[✕] Queue cleared');
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} disconnected`);
    // Deliberately NOT removing from queue on disconnect:
    // user must explicitly lower their hand
  });
});

const PORT = Number(process.env.PORT ?? 3001);
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
