import { prisma } from './prisma.js';

const MAX_EVENTS = 300;
const events = [];
let installed = false;
let lastPruneAt = 0;

function sanitizeText(value) {
  return String(value || '')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/bot\d+:[A-Za-z0-9_-]+/gi, 'bot[redacted]')
    .replace(/telegram\/webhook\/[^/?\s]+/gi, 'telegram/webhook/[redacted]')
    .slice(0, 2000);
}

function serializeArg(arg) {
  if (arg instanceof Error) {
    return sanitizeText(`${arg.name}: ${arg.message}\n${arg.stack || ''}`);
  }

  if (typeof arg === 'string') return sanitizeText(arg);

  try {
    return sanitizeText(JSON.stringify(arg));
  } catch {
    return sanitizeText(String(arg));
  }
}

function pushEvent(event) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    time: new Date().toISOString(),
    ...event,
  };

  events.unshift(entry);

  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS;
  }

  persistEvent(entry);
}

function persistEvent(entry) {
  prisma.diagnosticLog.create({
    data: {
      level: entry.level || 'info',
      source: entry.source || 'server',
      method: entry.method || null,
      path: entry.path || null,
      status: entry.status || null,
      durationMs: entry.durationMs == null ? null : Number(entry.durationMs),
      origin: entry.origin || null,
      telegramUserId: entry.telegramUserId || null,
      message: sanitizeText(entry.message || entry.path || '-'),
      createdAt: new Date(entry.time),
    },
  }).catch(() => {
    // Diagnostics must never break the app path that produced them.
  });

  const now = Date.now();
  if (now - lastPruneAt > 60 * 60 * 1000) {
    lastPruneAt = now;
    const cutoff = new Date(now - 35 * 24 * 60 * 60 * 1000);
    prisma.diagnosticLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    }).catch(() => {});
  }
}

export function recordRequestLog(req, res, durationMs) {
  const status = Number(res.statusCode || 0);
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
  const originalUrl = String(req.originalUrl || req.url || '');
  const safeUrl = originalUrl.startsWith('/telegram/webhook/')
    ? '/telegram/webhook/[redacted]'
    : originalUrl;

  pushEvent({
    level,
    source: 'request',
    method: req.method,
    path: safeUrl,
    status,
    durationMs,
    origin: req.get('origin') || '',
    telegramUserId: req.get('x-telegram-user-id') || '',
    message: `${req.method} ${safeUrl} ${status} ${durationMs}ms`,
  });
}

export function installConsoleDiagnostics(consoleObject = console) {
  if (installed) return;
  installed = true;

  const originalError = consoleObject.error.bind(consoleObject);

  consoleObject.error = (...args) => {
    pushEvent({
      level: 'error',
      source: 'server',
      message: args.map(serializeArg).join(' '),
    });

    originalError(...args);
  };
}

export async function getDiagnostics(options = {}) {
  const limit = Math.max(1, Math.min(Number(options.limit) || 500, 5000));
  const since = options.since ? new Date(options.since) : null;
  const where = {};

  if (since && !Number.isNaN(since.getTime())) {
    where.createdAt = { gte: since };
  }

  if (options.level && options.level !== 'all') {
    where.level = options.level;
  }

  if (options.source && options.source !== 'all') {
    where.source = options.source;
  }

  if (options.telegramUserId) {
    where.telegramUserId = String(options.telegramUserId);
  }

  if (options.search) {
    where.OR = [
      { message: { contains: String(options.search), mode: 'insensitive' } },
      { path: { contains: String(options.search), mode: 'insensitive' } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.diagnosticLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.diagnosticLog.count({ where }),
  ]);

  return {
    logs: rows.map((row) => ({
      id: row.id,
      time: row.createdAt.toISOString(),
      level: row.level,
      source: row.source,
      method: row.method,
      path: row.path,
      status: row.status,
      durationMs: row.durationMs,
      origin: row.origin || '',
      telegramUserId: row.telegramUserId || '',
      message: row.message,
    })),
    total,
    limit,
    hasMore: total > rows.length,
  };
}

export async function clearDiagnostics() {
  events.length = 0;
  await prisma.diagnosticLog.deleteMany({});
}
