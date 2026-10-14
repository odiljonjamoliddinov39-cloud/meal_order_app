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

async function sendPhoto(chatId, imageUrl, caption) {
  const token = botToken();
  const dataMatch = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(imageUrl);

  // Images uploaded from the admin panel are stored as data URLs, which Telegram
  // cannot fetch, so they are sent as a multipart upload instead.
  if (dataMatch) {
    const form = new FormData();
    form.append('chat_id', String(chatId));
    form.append('caption', caption);
    form.append(
      'photo',
      new Blob([Buffer.from(dataMatch[2], 'base64')], { type: dataMatch[1] }),
      'item.jpg'
    );

    const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      console.error('Telegram sendPhoto upload failed:', response.status, await response.text());
    }

    return response.ok;
  }

  return callTelegram('sendPhoto', { chat_id: chatId, photo: imageUrl, caption });
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

    const sent = imageUrl ? await sendPhoto(chatId, imageUrl, caption).catch(() => false) : false;

    if (!sent) {
      await callTelegram('sendMessage', { chat_id: chatId, text: caption }).catch(() => false);
    }
  }

  await callTelegram('sendMessage', {
    chat_id: chatId,
    text: `Order placed. Total: ${formatMoney(order.totalAmount)}`,
  }).catch(() => false);
}
