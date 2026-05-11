import express from 'express';
import cors from 'cors';

import customerRoutes from './routes/customerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const miniAppUrl = 'https://meal-order-app-mauve.vercel.app/web';

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

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
  });

  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Meal order backend is running' });
});

app.post('/telegram/webhook/:telegramBotToken', async (req, res) => {
  const { telegramBotToken } = req.params;
  const message = req.body?.message;
  const chatId = message?.chat?.id;
  const text = String(message?.text || '');

  if (!chatId) {
    return res.sendStatus(200);
  }

  const payload = text.startsWith('/start')
    ? {
        chat_id: chatId,
        text: 'Welcome. Open the meal menu below.',
        reply_markup: {
          inline_keyboard: [[
            {
              text: 'Open Meal App',
              web_app: { url: miniAppUrl },
            },
          ]],
        },
      }
    : {
        chat_id: chatId,
        text: 'Use /start to open the Mini App.',
      };

  try {
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!telegramResponse.ok) {
      const body = await telegramResponse.text();
      console.error('Telegram webhook sendMessage failed:', telegramResponse.status, body);
    }
  } catch (error) {
    console.error('Telegram webhook error:', error);
  }

  return res.sendStatus(200);
});

app.use('/api', customerRoutes);
app.use('/api', adminRoutes);

const PORT = process.env.PORT || 4000;
const HOST = '::';

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
