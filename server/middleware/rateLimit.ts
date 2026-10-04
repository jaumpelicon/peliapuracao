const windows = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 120; // 120 req/min por IP nas rotas /api

export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/')) return;
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  const now = Date.now();
  const record = windows.get(ip);
  if (!record || now > record.resetAt) {
    windows.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  record.count++;
  if (record.count > LIMIT) {
    throw createError({ statusCode: 429, statusMessage: 'muitas requisições' });
  }
});
