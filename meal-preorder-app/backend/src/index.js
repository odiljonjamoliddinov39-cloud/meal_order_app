import express from 'express';
import cors from 'cors';

import customerRoutes from './routes/customerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { warmMenuCache } from './controllers/customerController.js';
import { installConsoleDiagnostics, recordRequestLog } from './lib/diagnostics.js';

const app = express();

installConsoleDiagnostics();

function normalizeMiniAppUrl(value) {
  const rawUrl = String(value || '').trim();

  if (!rawUrl) {
    throw new Error('MINI_APP_URL is required');
  }

  const url = new URL(rawUrl);

  if (!url.pathname || url.pathname === '/') {
    url.pathname = '/web';
  }

  return url.toString();
}

const miniAppUrl = normalizeMiniAppUrl(process.env.MINI_APP_URL || 'https://meal-order-app-mauve.vercel.app/web?v=32');
const telegramBotToken = process.env.BOT_TOKEN || '';
const telegramWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || '';

async function callTelegram(method, payload) {
  const telegramResponse = await fetch(
    `https://api.telegram.org/bot${telegramBotToken}/${method}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  if (!telegramResponse.ok) {
    const body = await telegramResponse.text();
    console.error(`Telegram ${method} failed:`, telegramResponse.status, body);
    return false;
  }

  return true;
}

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

app.use('/api/menu', (req, res, next) => {
  res.set('cache-control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('pragma', 'no-cache');
  res.set('expires', '0');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const telegramUserId = req.get('x-telegram-user-id') || 'MISSING';
    const telegramName = req.get('x-telegram-user-name') ? 'PRESENT' : 'MISSING';
    const origin = req.get('origin') || '-';
    const safeUrl = req.originalUrl.startsWith('/telegram/webhook/')
      ? '/telegram/webhook/[redacted]'
      : req.originalUrl;

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${safeUrl} ` +
        `${res.statusCode} ${durationMs}ms ` +
        `origin=${origin} tgId=${telegramUserId} tgName=${telegramName}`
    );

    recordRequestLog(req, res, durationMs);
  });

  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Meal order backend is running' });
});

app.post('/telegram/webhook/:secret', async (req, res) => {
  if (!telegramBotToken || !telegramWebhookSecret || req.params.secret !== telegramWebhookSecret) {
    return res.sendStatus(404);
  }

  const message = req.body?.message;
  const chatId = message?.chat?.id;
  const text = String(message?.text || '');

  if (!chatId) {
    return res.sendStatus(200);
  }

  const payloads = text.startsWith('/start')
    ? [
      {
        chat_id: chatId,
        text: `Welcome. Tap Open Meal App to load today's menu.`,
        reply_markup: {
          keyboard: [
            [{ text: 'Open Meal App', web_app: { url: miniAppUrl } }],
          ],
          resize_keyboard: true,
          is_persistent: true,
        },
      },
      {
        chat_id: chatId,
        text: `If the Telegram button does not load, open the same menu link here: ${miniAppUrl}`,
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Open Direct Link', url: miniAppUrl }],
          ],
        },
      },
    ]
    : [{
        chat_id: chatId,
        text: 'Use /start to open the Mini App.',
      }];

  try {
    if (text.startsWith('/start')) {
      await callTelegram('setChatMenuButton', {
        chat_id: chatId,
        menu_button: {
          type: 'web_app',
          text: 'Open Meal App',
          web_app: { url: miniAppUrl },
        },
      });
    }

    for (const payload of payloads) {
      await callTelegram('sendMessage', payload);
    }

    console.log(`Telegram webhook response sent chat=${chatId}`);
  } catch (error) {
    console.error('Telegram webhook error:', error?.message || error);
  }

  return res.sendStatus(200);
});

app.use('/api', customerRoutes);
app.use('/api', adminRoutes);

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ message: 'Invalid JSON request body' });
  }

  console.error('Unhandled request error:', error);
  return res.status(500).json({ message: 'Internal server error' });
});

const ports = Array.from(new Set([
  Number(process.env.PORT || 4000),
  8080,
  4000,
])).filter((port) => Number.isInteger(port) && port > 0);
const HOST = '0.0.0.0';

ports.forEach((port) => {
  app.listen(port, HOST, () => {
    console.log(`Server running on ${HOST}:${port}`);
  });
});

warmMenuCache().catch((error) => {
  console.error('Initial menu cache warm failed:', error?.message || error);
});

setInterval(() => {
  warmMenuCache().catch((error) => {
    console.error('Scheduled menu cache warm failed:', error?.message || error);
  });
}, 60_000);
