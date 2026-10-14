const botToken = () => process.env.BOT_TOKEN || '';

export async function callTelegram(method, payload) {
  const token = botToken();
  if (!token) return false;

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error(`Telegram ${method} failed:`, response.status, await response.text());
    return false;
  }

  return true;
}

// Sends a photo and returns the Telegram message on success, or null. Images uploaded from
// the admin panel are stored as data URLs, which Telegram cannot fetch, so those are sent
// as a multipart upload instead.
async function sendPhoto(chatId, imageUrl, caption, replyMarkup) {
  const token = botToken();
  const dataMatch = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(imageUrl);
  let response;

  if (dataMatch) {
    const form = new FormData();
    form.append('chat_id', String(chatId));
    form.append('caption', caption);
    if (replyMarkup) form.append('reply_markup', JSON.stringify(replyMarkup));
    form.append(
      'photo',
      new Blob([Buffer.from(dataMatch[2], 'base64')], { type: dataMatch[1] }),
      'item.jpg'
    );
    response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: form,
    });
  } else {
    response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: imageUrl,
        caption,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });
  }

  if (!response.ok) {
    const body = await response.text();
    console.error('Telegram sendPhoto failed:', response.status, body);
    return { ok: false, status: response.status, body };
  }

  const json = await response.json();
  return { ok: true, message: json.result };
}

const formatMoney = (value) => `${Number(value || 0).toLocaleString('ru-RU')} UZS`;

// Sends one message per ordered item (with its image when it has one), then a total.
export async function notifyOrderPlaced(order) {
  const chatId = order?.user?.telegramId;
  if (!botToken() || !chatId) return;

  for (const item of order.items || []) {
    const name = item.menuItem?.name || 'Item';
    const caption =
      `${name} x ${item.quantity}\n${formatMoney(Number(item.priceAtOrderTime) * item.quantity)}`;
    const imageUrl = item.menuItem?.imageUrl;

    const sent = imageUrl
      ? (await sendPhoto(chatId, imageUrl, caption).catch(() => null))?.ok
      : false;

    if (!sent) {
      await callTelegram('sendMessage', { chat_id: chatId, text: caption }).catch(() => false);
    }
  }

  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: `Order placed. Total: ${formatMoney(order.totalAmount)}`,
  }).catch(() => false);
}

export function getMiniAppUrl() {
  const raw = String(
    process.env.MINI_APP_URL || 'https://meal-order-app-mauve.vercel.app/web?v=32'
  ).trim();
  const url = new URL(raw);
  if (!url.pathname || url.pathname === '/') url.pathname = '/web';
  return url.toString();
}

const categoryLabels = { meal: 'Еда', coffee: 'Кофе', dessert: 'Десерт', drink: 'Напиток' };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Announces a newly created menu item to every user who has started the bot.
export async function broadcastNewMenuItem(item, chatIds) {
  if (!botToken() || chatIds.length === 0) return { sent: 0, failed: 0 };

  const category = categoryLabels[item.type] || categoryLabels.meal;
  const caption = `${category}: ${item.name}`;
  const replyMarkup = {
    inline_keyboard: [[{ text: 'Order', web_app: { url: getMiniAppUrl() } }]],
  };

  let photo = item.imageUrl || null;
  let sent = 0;
  let failed = 0;

  for (const chatId of chatIds) {
    try {
      let ok = false;

      if (photo) {
        const result = await sendPhoto(chatId, photo, caption, replyMarkup);
        ok = result.ok;

        // Reuse Telegram's file_id so the image is uploaded only once.
        const fileId = result.message?.photo?.at(-1)?.file_id;
        if (ok && fileId) photo = fileId;
      } else {
        ok = await callTelegram('sendMessage', {
          chat_id: chatId,
          text: caption,
          reply_markup: replyMarkup,
        });
      }

      if (ok) sent += 1;
      else failed += 1;
    } catch (error) {
      failed += 1;
      console.error('Menu item broadcast error:', error?.message || error);
    }

    // Stay under Telegram's ~30 messages/second broadcast limit.
    await sleep(50);
  }

  console.log(`Menu item broadcast done item=${item.id} sent=${sent} failed=${failed}`);
  return { sent, failed };
}
