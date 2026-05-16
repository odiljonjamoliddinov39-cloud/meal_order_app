const MAX_EVENTS = 300;
const events = [];
let installed = false;

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
  events.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    time: new Date().toISOString(),
    ...event,
  });

  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS;
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

export function getDiagnostics(limit = 120) {
  return events.slice(0, Math.max(1, Math.min(Number(limit) || 120, MAX_EVENTS)));
}

export function clearDiagnostics() {
  events.length = 0;
}
