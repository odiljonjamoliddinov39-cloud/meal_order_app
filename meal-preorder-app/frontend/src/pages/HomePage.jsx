import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api from '../api/client.js';

const STORAGE_CART_KEY = 'meal_preorder_cart_v2';

const labels = {
  ENG: {
    allDays: 'Available Days',
    todayMenu: 'Menu',
    yourOrder: 'Your Order',
    selected: 'selected',
    emptyOrder: 'Choose items from the menu',
    loading: 'Loading menu...',
    failed: 'Failed to load menu',
    noDays: 'No menu day found',
    noItems: 'No active items for this day',
    meal: 'Meal',
    coffee: 'Coffee',
    drinks: 'Drinks',
    dessert: 'Dessert',
    account: 'Account',
    cart: 'Cart',
    orders: 'Orders',
  },
  RUS: {
    allDays: 'Доступные дни',
    todayMenu: 'Меню',
    yourOrder: 'Ваш заказ',
    selected: 'выбрано',
    emptyOrder: 'Выберите позиции из меню',
    loading: 'Загрузка меню...',
    failed: 'Не удалось загрузить меню',
    noDays: 'Дни меню не найдены',
    noItems: 'Нет активных блюд на этот день',
    meal: 'Еда',
    coffee: 'Кофе',
    drinks: 'Напитки',
    dessert: 'Десерт',
    account: 'Аккаунт',
    cart: 'Корзина',
    orders: 'Заказы',
  },
  UZB: {
    allDays: 'Mavjud kunlar',
    todayMenu: 'Menyu',
    yourOrder: 'Buyurtmangiz',
    selected: 'tanlandi',
    emptyOrder: 'Menyudan mahsulot tanlang',
    loading: 'Menyu yuklanmoqda...',
    failed: 'Menyuni yuklab bo‘lmadi',
    noDays: 'Menyu kuni topilmadi',
    noItems: 'Bu kunda faol mahsulot yo‘q',
    meal: 'Ovqat',
    coffee: 'Qahva',
    drinks: 'Ichimlik',
    dessert: 'Shirinlik',
    account: 'Akkaunt',
    cart: 'Savat',
    orders: 'Buyurtmalar',
  },
};

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeCart(cart) {
  localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
}

function formatPrice(value) {
  return `${Number(value).toLocaleString('ru-RU')} so'm`;
}

function detectCategory(item) {
  const text = `${item.name || ''} ${item.description || ''}`.toLowerCase();

  if (text.includes('coffee') || text.includes('latte') || text.includes('espresso') || text.includes('капуч') || text.includes('коф')) {
    return 'coffee';
  }
  if (text.includes('cake') || text.includes('ice cream') || text.includes('dessert') || text.includes('торт') || text.includes('морож')) {
    return 'dessert';
  }
  if (text.includes('juice') || text.includes('cola') || text.includes('drink') || text.includes('water') || text.includes('чай') || text.includes('напит')) {
    return 'drinks';
  }
  return 'meal';
}

function getEmoji(item) {
  const text = `${item.name || ''} ${item.description || ''}`.toLowerCase();
  if (text.includes('coffee') || text.includes('латте') || text.includes('коф')) return '☕';
  if (text.includes('juice')) return '🧃';
  if (text.includes('cola') || text.includes('drink')) return '🥤';
  if (text.includes('cake') || text.includes('dessert') || text.includes('торт')) return '🍰';
  if (text.includes('ice cream') || text.includes('морож')) return '🍨';
  if (text.includes('burger')) return '🍔';
  if (text.includes('chicken')) return '🍗';
  return '🍽️';
}

function getGradient(item) {
  const category = detectCategory(item);
  if (category === 'coffee') return 'linear-gradient(135deg, #d8c3a5 0%, #a67c52 100%)';
  if (category === 'dessert') return 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
  if (category === 'drinks') return 'linear-gradient(135deg, #8fd3f4 0%, #84fab0 100%)';
  return 'linear-gradient(135deg, #ffd36e 0%, #ff9f43 100%)';
}

function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function HomePage() {
  const { language } = useOutletContext();
  const l = labels[language] || labels.ENG;

  const [days, setDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [menuDayId, setMenuDayId] = useState('');
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('meal');
  const [cart, setCart] = useState(readCart());
  const [loadingDays, setLoadingDays] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState('');

  const categories = useMemo(
    () => [
      { key: 'meal', label: l.meal },
      { key: 'coffee', label: l.coffee },
      { key: 'drinks', label: l.drinks },
      { key: 'dessert', label: l.dessert },
    ],
    [l]
  );

  useEffect(() => {
    let mounted = true;

    async function loadDays() {
      try {
        setLoadingDays(true);
        setError('');
        const res = await api.get('/menu/days');
        if (!mounted) return;

        const safeDays = Array.isArray(res.data) ? res.data.filter((d) => d.isOpen) : [];
        setDays(safeDays);

        if (safeDays.length) {
          const firstDate = new Date(safeDays[0].date).toISOString().slice(0, 10);
          setSelectedDate(firstDate);
          setMenuDayId(safeDays[0].id);
        }
      } catch (err) {
        if (!mounted) return;
        setError(l.failed);
      } finally {
        if (mounted) setLoadingDays(false);
      }
    }

    loadDays();
    return () => {
      mounted = false;
    };
  }, [l.failed]);

  useEffect(() => {
    let mounted = true;
    if (!selectedDate) return;

    async function loadItems() {
      try {
        setLoadingItems(true);
        setError('');
        const res = await api.get(`/menu/items?date=${selectedDate}`);
        if (!mounted) return;

        const dayData = res.data || {};
        setMenuDayId(dayData.id || '');
        const activeItems = Array.isArray(dayData.items)
          ? dayData.items.filter((item) => item.isActive)
          : [];
        setItems(activeItems);
      } catch (err) {
        if (!mounted) return;
        setError(l.failed);
        setItems([]);
      } finally {
        if (mounted) setLoadingItems(false);
      }
    }

    loadItems();
    return () => {
      mounted = false;
    };
  }, [selectedDate, l.failed]);

  const filteredItems = useMemo(
    () => items.filter((item) => detectCategory(item) === activeCategory),
    [items, activeCategory]
  );

  const currentCart = useMemo(() => {
    return readCart().filter((item) => item.menuDayId === menuDayId);
  }, [cart, menuDayId]);

  const cartCount = currentCart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = currentCart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);

  function getQty(id) {
    return currentCart.find((item) => item.id === id)?.qty || 0;
  }

  function changeQty(item, diff) {
    const raw = readCart().filter((x) => x.menuDayId === menuDayId);
    const existing = raw.find((x) => x.id === item.id);
    let next;

    if (existing) {
      next = raw
        .map((x) => (x.id === item.id ? { ...x, qty: Math.max(0, x.qty + diff) } : x))
        .filter((x) => x.qty > 0);
    } else if (diff > 0) {
      next = [
        ...raw,
        {
          id: item.id,
          menuItemId: item.id,
          menuDayId,
          date: selectedDate,
          name: item.name,
          description: item.description || '',
          price: Number(item.price),
          qty: 1,
          imageUrl: item.imageUrl || '',
          emoji: getEmoji(item),
        },
      ];
    } else {
      next = raw;
    }

    writeCart(next);
    setCart(next);
  }

  return (
    <div style={styles.page}>
      <div style={styles.daysRow}>
        <div style={styles.sectionTitle}>{l.allDays}</div>
        <div style={styles.daysChips}>
          {days.map((day) => {
            const dateKey = new Date(day.date).toISOString().slice(0, 10);
            const active = selectedDate === dateKey;
            return (
              <button
                key={day.id}
                onClick={() => {
                  setSelectedDate(dateKey);
                  setMenuDayId(day.id);
                  writeCart([]);
                  setCart([]);
                }}
                style={{
                  ...styles.dayChip,
                  ...(active ? styles.dayChipActive : {}),
                }}
              >
                {formatDate(day.date)}
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.tabsWrap}>
        {categories.map((category) => {
          const active = activeCategory === category.key;
          return (
            <button
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              style={{
                ...styles.tabButton,
                ...(active ? styles.tabButtonActive : {}),
              }}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      <div style={styles.menuArea}>
        <div style={styles.menuHeader}>
          <div>
            <div style={styles.menuTitle}>{l.todayMenu}</div>
            <div style={styles.menuSub}>
              {cartCount} {l.selected}
            </div>
          </div>

          <Link to="/web/cart" style={styles.cartBubble}>
            🛒 {cartCount}
          </Link>
        </div>

        <div style={styles.scrollArea}>
          {loadingDays || loadingItems ? (
            <div style={styles.infoBox}>{l.loading}</div>
          ) : error ? (
            <div style={styles.infoBox}>{error}</div>
          ) : !days.length ? (
            <div style={styles.infoBox}>{l.noDays}</div>
          ) : !filteredItems.length ? (
            <div style={styles.infoBox}>{l.noItems}</div>
          ) : (
            <div style={styles.grid}>
              {filteredItems.map((item) => {
                const qty = getQty(item.id);
                const imageSrc = item.imageUrl?.trim();
                return (
                  <div key={item.id} style={styles.card}>
                    <div style={styles.cardVisualWrap}>
                      <div style={{ ...styles.cardCircle, background: getGradient(item) }}>
                        {imageSrc ? (
                          <img src={imageSrc} alt={item.name} style={styles.foodImage} />
                        ) : (
                          <span style={styles.emoji}>{getEmoji(item)}</span>
                        )}
                      </div>
                    </div>

                    <div style={styles.itemInfo}>
                      <div style={styles.itemName}>{item.name}</div>
                      <div style={styles.itemPrice}>{formatPrice(item.price)}</div>
                    </div>

                    <div style={styles.counterWrap}>
                      <button style={styles.counterBtn} onClick={() => changeQty(item, -1)}>
                        −
                      </button>
                      <span style={styles.counterValue}>{qty}</span>
                      <button style={styles.counterBtn} onClick={() => changeQty(item, 1)}>
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={styles.summaryCard}>
        <div style={styles.summaryTop}>
          <div>
            <div style={styles.summaryTitle}>{l.yourOrder}</div>
            <div style={styles.summarySubtitle}>
              {cartCount ? `${cartCount} ${l.selected}` : l.emptyOrder}
            </div>
          </div>
          <div style={styles.totalBadge}>{formatPrice(totalPrice)}</div>
        </div>

        <div style={styles.selectedList}>
          {currentCart.slice(0, 3).map((item) => (
            <div key={item.id} style={styles.selectedRow}>
              <span style={styles.selectedName}>
                {item.emoji} {item.name}
              </span>
              <span style={styles.selectedQty}>x{item.qty}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.bottomNav}>
        <button style={{ ...styles.navItem, ...styles.navActive }}>
          <span style={styles.navIcon}>👤</span>
          <span style={styles.navText}>{l.account}</span>
        </button>

        <Link to="/web/cart" style={styles.navItem}>
          <span style={styles.navIcon}>🛒</span>
          <span style={styles.navText}>{l.cart}</span>
        </Link>

        <Link to="/web/orders" style={styles.navItem}>
          <span style={styles.navIcon}>☰</span>
          <span style={styles.navText}>{l.orders}</span>
        </Link>
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
    gap: '10px',
  },
  daysRow: {
    background: 'rgba(255,255,255,0.48)',
    borderRadius: '20px',
    padding: '12px',
  },
  sectionTitle: {
    color: '#115a64',
    fontSize: '13px',
    fontWeight: 800,
    marginBottom: '10px',
  },
  daysChips: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '2px',
  },
  dayChip: {
    border: 'none',
    borderRadius: '999px',
    background: '#eefbfd',
    color: '#145962',
    fontWeight: 800,
    padding: '10px 14px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  dayChipActive: {
    background: '#1a93f1',
    color: '#ffffff',
  },
  tabsWrap: {
    display: 'flex',
    gap: '8px',
  },
  tabButton: {
    flex: 1,
    border: 'none',
    background: 'rgba(255,255,255,0.2)',
    color: '#12646f',
    fontWeight: 800,
    borderRadius: '16px',
    padding: '12px 8px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  tabButtonActive: {
    background: '#ffffff',
    color: '#0f5a65',
    boxShadow: '0 8px 18px rgba(0,0,0,0.08)',
  },
  menuArea: {
    flex: 1,
    minHeight: 0,
    background: 'rgba(255,255,255,0.22)',
    borderRadius: '26px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
  },
  menuHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '10px',
  },
  menuTitle: {
    color: '#0f5a65',
    fontWeight: 800,
    fontSize: '18px',
  },
  menuSub: {
    color: '#2e7881',
    fontWeight: 700,
    fontSize: '12px',
  },
  cartBubble: {
    textDecoration: 'none',
    background: '#ffffff',
    color: '#0f5a65',
    fontWeight: 800,
    borderRadius: '14px',
    padding: '10px 12px',
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    paddingRight: '2px',
  },
  infoBox: {
    background: '#ffffff',
    borderRadius: '18px',
    padding: '18px',
    color: '#145962',
    fontWeight: 700,
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '14px',
  },
  card: {
    background: 'linear-gradient(180deg, #34aaf4 0%, #198ff0 100%)',
    borderRadius: '24px',
    padding: '14px 12px',
    minHeight: '220px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 14px 24px rgba(10, 96, 176, 0.20)',
  },
  cardVisualWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  cardCircle: {
    width: '94px',
    height: '94px',
    borderRadius: '50%',
    border: '4px solid rgba(255,255,255,0.78)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 6px 16px rgba(255,255,255,0.25), 0 10px 18px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  foodImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  emoji: {
    fontSize: '42px',
  },
  itemInfo: {
    textAlign: 'center',
    color: '#ffffff',
    marginBottom: '10px',
  },
  itemName: {
    fontWeight: 800,
    fontSize: '14px',
    lineHeight: 1.2,
    marginBottom: '5px',
  },
  itemPrice: {
    fontSize: '12px',
    fontWeight: 700,
    opacity: 0.96,
  },
  counterWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'rgba(255,255,255,0.16)',
    borderRadius: '999px',
    padding: '7px 8px',
  },
  counterBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: 'none',
    background: '#ffffff',
    color: '#1180d8',
    fontSize: '22px',
    fontWeight: 800,
    cursor: 'pointer',
    lineHeight: 1,
  },
  counterValue: {
    minWidth: '20px',
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '17px',
  },
  summaryCard: {
    background: 'rgba(255,255,255,0.88)',
    borderRadius: '22px',
    padding: '14px',
    boxShadow: '0 12px 22px rgba(0,0,0,0.08)',
  },
  summaryTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '10px',
  },
  summaryTitle: {
    color: '#135e69',
    fontSize: '16px',
    fontWeight: 800,
    marginBottom: '4px',
  },
  summarySubtitle: {
    color: '#51818a',
    fontSize: '12px',
    fontWeight: 700,
  },
  totalBadge: {
    background: '#1993f1',
    color: '#ffffff',
    padding: '10px 12px',
    borderRadius: '14px',
    fontWeight: 800,
    fontSize: '12px',
    whiteSpace: 'nowrap',
  },
  selectedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  selectedRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#effbfd',
    borderRadius: '12px',
    padding: '10px 12px',
  },
  selectedName: {
    color: '#145a64',
    fontWeight: 700,
    fontSize: '13px',
  },
  selectedQty: {
    color: '#1993f1',
    fontWeight: 800,
    fontSize: '13px',
  },
  bottomNav: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '10px 8px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: '0 12px 24px rgba(0,0,0,0.10)',
  },
  navItem: {
    textDecoration: 'none',
    color: '#7aa3ab',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    minWidth: '72px',
    fontWeight: 700,
    border: 'none',
    background: 'transparent',
  },
  navActive: {
    color: '#1892f1',
  },
  navIcon: {
    fontSize: '18px',
    lineHeight: 1,
  },
  navText: {
    fontSize: '11px',
  },
};