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

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ` +
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

const PORT = process.env.PORT || 4000;
const HOST = '::';

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
