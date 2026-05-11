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

bot.on('polling_error', (error) => {
  console.error('Telegram polling error:', error?.message || error);
});

bot.on('error', (error) => {
  console.error('Telegram bot error:', error?.message || error);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat?.id;
  const text = String(msg.text || '');

  if (!chatId) return;

  console.log(`Telegram message received chat=${chatId} text=${text || '[non-text]'}`);

  try {
    if (text.startsWith('/start')) {
      await bot.sendMessage(chatId, 'Welcome. Open the meal menu below.', {
        reply_markup: {
          inline_keyboard: [[
            {
              text: 'Open Meal App',
              web_app: { url: miniAppUrl },
            },
          ]],
        },
      });
      console.log(`Telegram /start response sent chat=${chatId}`);
      return;
    }

    await bot.sendMessage(chatId, 'Use /start to open the Mini App.');
    console.log(`Telegram help response sent chat=${chatId}`);
  } catch (error) {
    console.error('Telegram sendMessage failed:', error?.response?.body || error?.message || error);
  }
});

bot.getMe()
  .then((me) => {
    console.log(`Telegram bot is running username=@${me.username} miniAppUrl=${miniAppUrl}`);
  })
  .catch((error) => {
    console.error('Telegram getMe failed:', error?.response?.body || error?.message || error);
  });
