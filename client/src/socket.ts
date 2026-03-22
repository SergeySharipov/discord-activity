import { io, type Socket } from 'socket.io-client';

// In dev, Vite proxies /socket.io → localhost:3001.
// In production, it connects to the same origin.
const socket: Socket = io(window.location.origin, {
  path: '/socket.io',
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

export default socket;
