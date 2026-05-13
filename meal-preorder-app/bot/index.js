import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const token = process.env.BOT_TOKEN;

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
      await bot.setChatMenuButton({
        chat_id: chatId,
        menu_button: {
          type: 'web_app',
          text: 'Open Meal App',
          web_app: { url: miniAppUrl },
        },
      });

      await bot.sendMessage(chatId, "Welcome. Tap Open Meal App to load today's menu.", {
        reply_markup: {
          keyboard: [
            [{ text: 'Open Meal App', web_app: { url: miniAppUrl } }],
          ],
          resize_keyboard: true,
          is_persistent: true,
        },
      });

      await bot.sendMessage(chatId, `If the Telegram button does not load, open the same menu link here: ${miniAppUrl}`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Open Direct Link', url: miniAppUrl }],
          ],
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
