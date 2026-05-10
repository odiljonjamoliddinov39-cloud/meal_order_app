import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const token = process.env.BOT_TOKEN;

function normalizeMiniAppUrl(value) {
  const productionUrl = 'https://meal-order-app-mauve.vercel.app/web';
  const fallbackUrl = process.env.NODE_ENV === 'production' ? productionUrl : 'http://localhost:5173/web';
  const rawUrl = (value || fallbackUrl).trim();

  try {
    const url = new URL(rawUrl);

    if (url.hostname === 'brunchorder.netlify.app') {
      return productionUrl;
    }

    if (!url.pathname || url.pathname === '/') {
      url.pathname = '/web';
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

const miniAppUrl = normalizeMiniAppUrl(process.env.MINI_APP_URL);

if (!token) {
  throw new Error('BOT_TOKEN is required');
}

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(msg.chat.id, 'Welcome ðŸ‘‹ Open the meal menu below.', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'Open Meal App',
          web_app: { url: miniAppUrl }
        }
      ]]
    }
  });
});

bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) return;
  await bot.sendMessage(msg.chat.id, 'Use /start to open the Mini App.');
});

console.log('Telegram bot is running');
