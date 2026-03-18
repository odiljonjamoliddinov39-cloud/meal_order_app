import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'change_me',
  miniAppUrl: process.env.MINI_APP_URL || 'http://localhost:5173',
  adminSeedEmail: process.env.ADMIN_SEED_EMAIL || 'admin@example.com',
  adminSeedPassword: process.env.ADMIN_SEED_PASSWORD || '12345678',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN
};
