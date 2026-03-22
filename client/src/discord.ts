import { DiscordSDK } from '@discord/embedded-app-sdk';

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID as string | undefined;

// Detect if we're running inside Discord's iframe
function isInsideDiscord(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin access blocked — definitely inside an iframe
    return true;
  }
}

let sdk: DiscordSDK | null = null;

export function getDiscordSdk(): DiscordSDK | null {
  return sdk;
}

export async function initDiscord(): Promise<DiscordUser> {
  if (!isInsideDiscord() || !CLIENT_ID) {
    // Dev / browser fallback — generate a stable mock user per session
    const stored = sessionStorage.getItem('dev_user');
    if (stored) return JSON.parse(stored) as DiscordUser;

    const id = 'dev-' + Math.random().toString(36).slice(2, 9);
    const user: DiscordUser = {
      id,
      username: `DevUser_${id.slice(4, 8)}`,
      avatar: null,
    };
    sessionStorage.setItem('dev_user', JSON.stringify(user));
    return user;
  }

  sdk = new DiscordSDK(CLIENT_ID);
  await sdk.ready();

  const { code } = await sdk.commands.authorize({
    client_id: CLIENT_ID,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: ['identify'],
  });

  const tokenRes = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const auth = await sdk.commands.authenticate({ access_token });

  return {
    id: auth.user.id,
    username: auth.user.username,
    avatar: auth.user.avatar ?? null,
  };
}

export function getAvatarUrl(userId: string, avatar: string | null): string {
  if (!avatar) {
    // Safely derive a default avatar index (handles non-numeric dev IDs)
    let index = 0;
    try {
      index = Number(BigInt(userId) % 5n);
    } catch {
      // dev user IDs are not numeric — pick based on string hash
      index = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 5;
    }
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=64`;
}
