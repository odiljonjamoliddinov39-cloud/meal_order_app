import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import api from '../api/client.js';

const STORAGE_CART_KEY = 'meal_preorder_cart_v2';

const labels = {
  ENG: {
    title: 'Cart',
    subtitle: 'Review your selected items',
    back: 'Back',
    empty: 'Your cart is empty',
    emptyText: 'Add items from the menu first.',
    goMenu: 'Go to menu',
    subtotal: 'Subtotal',
    placeOrder: 'Place Order',
    clearCart: 'Clear Cart',
    ordered: 'Order placed successfully',
    failed: 'Failed to place order',
    cartMismatch: 'Cart contains mixed or invalid day data. Re-add items from one day.',
    submitting: 'Placing...',
  },
  RUS: {
    title: 'Корзина',
    subtitle: 'Проверьте выбранные позиции',
    back: 'Назад',
    empty: 'Корзина пуста',
    emptyText: 'Сначала добавьте позиции из меню.',
    goMenu: 'Перейти в меню',
    subtotal: 'Сумма',
    placeOrder: 'Оформить заказ',
    clearCart: 'Очистить корзину',
    ordered: 'Заказ успешно создан',
    failed: 'Не удалось создать заказ',
    cartMismatch: 'В корзине смешаны или неверные данные дня. Добавьте заново товары одного дня.',
    submitting: 'Отправка...',
  },
  UZB: {
    title: 'Savat',
    subtitle: 'Tanlangan mahsulotlarni tekshiring',
    back: 'Orqaga',
    empty: 'Savatcha bo‘sh',
    emptyText: 'Avval menyudan mahsulot qo‘shing.',
    goMenu: 'Menyuga o‘tish',
    subtotal: 'Jami',
    placeOrder: 'Buyurtma berish',
    clearCart: 'Savatni tozalash',
    ordered: 'Buyurtma muvaffaqiyatli yaratildi',
    failed: 'Buyurtma yaratilmadi',
    cartMismatch: 'Savatchada turli kun yoki noto‘g‘ri ma’lumotlar bor. Bitta kun uchun qayta qo‘shing.',
    submitting: 'Yuborilmoqda...',
  },
};

function normalizeCart(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => ({
      ...item,
      qty: Math.max(1, Number(item?.qty) || 1),
      price: Number(item?.price) || 0,
      menuItemId: String(item?.menuItemId || item?.id || ''),
      menuDayId: String(item?.menuDayId || ''),
    }))
    .filter((item) => item.menuItemId && item.menuDayId);
}

function readCart() {
  try {
    return normalizeCart(JSON.parse(localStorage.getItem(STORAGE_CART_KEY) || '[]'));
  } catch {
    return [];
  }
}

function writeCart(cart) {
  try {
    localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
  } catch {
    // Some Telegram WebViews block storage; keep in-memory cart state working.
  }
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('ru-RU')} so'm`;
}

export default function CartPage() {
  const { language } = useOutletContext();
  const l = labels[language] || labels.RUS;

  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setCart(readCart());
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0),
    [cart]
  );

  function syncCart(next) {
    writeCart(next);
    setCart(next);
  }

  function updateQty(itemKey, diff) {
    if (submitting) return;

    const next = readCart()
      .map((item) =>
        `${item.menuDayId}_${item.menuItemId}` === itemKey
          ? { ...item, qty: Math.max(0, Number(item.qty) + diff) }
          : item
      )
      .filter((item) => item.qty > 0);

    syncCart(next);
    setMessage('');
  }

  function clearCart() {
    if (submitting) return;
    syncCart([]);
    setMessage('');
  }

  async function placeOrder() {
    if (!cart.length || submitting) return;

    const firstDayId = String(cart[0]?.menuDayId || '');
    const sameDay = cart.every(
      (item) =>
        String(item.menuDayId || '') === firstDayId &&
        String(item.menuItemId || '') &&
        Number(item.qty || 0) > 0
    );

    if (!sameDay || !firstDayId) {
      setMessage(l.cartMismatch);
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');

      const payload = {
        menuDayId: firstDayId,
        items: cart.map((item) => ({
          itemId: String(item.menuItemId),
          quantity: Number(item.qty),
        })),
      };

      console.log('PLACE ORDER PAYLOAD:', payload);

      const response = await api.post('/orders', payload);
      console.log('PLACE ORDER RESPONSE:', response?.data);

      syncCart([]);
      navigate('/web/orders', { state: { success: l.ordered } });
    } catch (error) {
      console.error('PLACE ORDER ERROR:', error?.response?.data || error.message);
      const backendMessage = error?.response?.data?.message;
      setMessage(backendMessage || l.failed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.heading}>{l.title}</div>
          <div style={styles.subheading}>{l.subtitle}</div>
        </div>

        <Link to="/web" style={styles.backLink}>
          ← {l.back}
        </Link>
      </div>

      <div style={styles.body}>
        {cart.length ? (
          <>
            <div style={styles.list}>
              {cart.map((item) => {
                const itemKey = `${item.menuDayId}_${item.menuItemId}`;
                return (
                  <div key={itemKey} style={styles.card}>
                    <div style={styles.left}>
                      <div style={styles.itemEmoji}>{item.emoji || '🍽️'}</div>

                      <div>
                        <div style={styles.itemName}>{item.name}</div>
                        {item.description ? (
                          <div style={styles.itemDescription}>{item.description}</div>
                        ) : null}
                        <div style={styles.itemPrice}>{formatPrice(item.price)}</div>
                      </div>
                    </div>

                    <div style={styles.right}>
                      <div style={styles.counter}>
                        <button
                          type="button"
                          style={styles.counterBtn}
                          onClick={() => updateQty(itemKey, -1)}
                          disabled={submitting}
                        >
                          −
                        </button>

                        <span style={styles.counterValue}>{item.qty}</span>

                        <button
                          type="button"
                          style={styles.counterBtn}
                          onClick={() => updateQty(itemKey, 1)}
                          disabled={submitting}
                        >
                          +
                        </button>
                      </div>

                      <div style={styles.lineTotal}>
                        {formatPrice(Number(item.price) * Number(item.qty))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={styles.summary}>
              <div style={styles.summaryRow}>
                <span>{l.subtotal}</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <button
                type="button"
                style={styles.primaryBtn}
                onClick={placeOrder}
                disabled={submitting}
              >
                {submitting ? l.submitting : l.placeOrder}
              </button>

              <button
                type="button"
                style={styles.secondaryBtn}
                onClick={clearCart}
                disabled={submitting}
              >
                {l.clearCart}
              </button>

              {message ? <div style={styles.message}>{message}</div> : null}
            </div>
          </>
        ) : (
          <div style={styles.emptyBox}>
            <div style={styles.emptyTitle}>{l.empty}</div>
            <div style={styles.emptyText}>{l.emptyText}</div>
            <Link to="/web" style={styles.emptyAction}>
              {l.goMenu}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#0f5a65',
    marginBottom: '4px',
  },
  subheading: {
    fontSize: '14px',
    color: '#2e7881',
    fontWeight: 600,
  },
  backLink: {
    textDecoration: 'none',
    background: 'rgba(255,255,255,0.55)',
    color: '#0f5a65',
    fontWeight: 700,
    padding: '10px 14px',
    borderRadius: '999px',
  },
  body: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  list: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingRight: '2px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '22px',
    padding: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
  },
  itemEmoji: {
    width: '54px',
    height: '54px',
    borderRadius: '16px',
    background: '#eefbfd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    flexShrink: 0,
  },
  itemName: {
    fontWeight: 800,
    color: '#105760',
    marginBottom: '4px',
  },
  itemDescription: {
    color: '#6a8b92',
    fontSize: '12px',
    marginBottom: '4px',
  },
  itemPrice: {
    color: '#5d8790',
    fontSize: '13px',
    fontWeight: 600,
  },
  right: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px',
  },
  counter: {
    background: '#eefbfd',
    borderRadius: '999px',
    padding: '6px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  counterBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: 'none',
    background: '#1a93f1',
    color: '#fff',
    fontSize: '20px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  counterValue: {
    minWidth: '18px',
    textAlign: 'center',
    color: '#105760',
    fontWeight: 800,
  },
  lineTotal: {
    fontWeight: 800,
    color: '#1a93f1',
    fontSize: '14px',
  },
  summary: {
    background: 'rgba(255,255,255,0.92)',
    borderRadius: '24px',
    padding: '16px',
    boxShadow: '0 14px 28px rgba(0,0,0,0.08)',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#105760',
    marginBottom: '12px',
    fontWeight: 700,
    fontSize: '16px',
  },
  primaryBtn: {
    width: '100%',
    border: 'none',
    background: 'linear-gradient(180deg, #32abf4 0%, #1a8ef0 100%)',
    color: '#fff',
    fontWeight: 800,
    borderRadius: '18px',
    padding: '14px 16px',
    cursor: 'pointer',
    marginTop: '10px',
    fontSize: '15px',
  },
  secondaryBtn: {
    width: '100%',
    border: 'none',
    background: '#eaf8fb',
    color: '#155c66',
    fontWeight: 800,
    borderRadius: '18px',
    padding: '14px 16px',
    cursor: 'pointer',
    marginTop: '10px',
    fontSize: '15px',
  },
  message: {
    marginTop: '12px',
    background: '#eaf8fb',
    color: '#155c66',
    borderRadius: '14px',
    padding: '10px 12px',
    textAlign: 'center',
    fontWeight: 700,
  },
  emptyBox: {
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '24px',
    padding: '24px 18px',
    textAlign: 'center',
    marginTop: '30px',
  },
  emptyTitle: {
    fontWeight: 800,
    fontSize: '22px',
    color: '#105760',
    marginBottom: '10px',
  },
  emptyText: {
    color: '#5e8790',
    lineHeight: 1.5,
    marginBottom: '16px',
  },
  emptyAction: {
    display: 'inline-block',
    textDecoration: 'none',
    background: '#1a93f1',
    color: '#fff',
    fontWeight: 800,
    padding: '12px 18px',
    borderRadius: '16px',
  },
};
