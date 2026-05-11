import express from 'express';
import cors from 'cors';

import customerRoutes from './routes/customerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

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

app.use('/api', customerRoutes);
app.use('/api', adminRoutes);

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
