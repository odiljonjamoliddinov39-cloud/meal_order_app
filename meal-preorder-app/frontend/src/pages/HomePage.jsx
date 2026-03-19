import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_CART_KEY = 'meal_preorder_cart_v1';

const categories = ['Meal', 'Coffee', 'Drinks', 'Dessert'];

const menuItems = [
  {
    id: 'meal-1',
    name: 'Chicken Meal',
    category: 'Meal',
    price: 28000,
    emoji: '🍗',
    gradient: 'linear-gradient(135deg, #ffd36e 0%, #ff9f43 100%)',
  },
  {
    id: 'meal-2',
    name: 'Burger Combo',
    category: 'Meal',
    price: 32000,
    emoji: '🍔',
    gradient: 'linear-gradient(135deg, #ffcf7d 0%, #ff7f50 100%)',
  },
  {
    id: 'coffee-1',
    name: 'Latte',
    category: 'Coffee',
    price: 18000,
    emoji: '☕',
    gradient: 'linear-gradient(135deg, #d9c2a3 0%, #a67c52 100%)',
  },
  {
    id: 'coffee-2',
    name: 'Iced Coffee',
    category: 'Coffee',
    price: 20000,
    emoji: '🧋',
    gradient: 'linear-gradient(135deg, #d7ccc8 0%, #8d6e63 100%)',
  },
  {
    id: 'drink-1',
    name: 'Fresh Juice',
    category: 'Drinks',
    price: 16000,
    emoji: '🧃',
    gradient: 'linear-gradient(135deg, #ffe082 0%, #ff7043 100%)',
  },
  {
    id: 'drink-2',
    name: 'Cold Drink',
    category: 'Drinks',
    price: 14000,
    emoji: '🥤',
    gradient: 'linear-gradient(135deg, #90caf9 0%, #81c784 100%)',
  },
  {
    id: 'dessert-1',
    name: 'Chocolate Cake',
    category: 'Dessert',
    price: 22000,
    emoji: '🍰',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  },
  {
    id: 'dessert-2',
    name: 'Ice Cream',
    category: 'Dessert',
    price: 17000,
    emoji: '🍨',
    gradient: 'linear-gradient(135deg, #c3cfe2 0%, #f5f7fa 100%)',
  },
];

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_CART_KEY);
    return raw ? JSON.parse(raw) : [];
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

function getQty(cart, id) {
  return cart.find((item) => item.id === id)?.qty || 0;
}

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('Meal');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(readCart());
  }, []);

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const changeQty = (product, diff) => {
    const currentCart = readCart();
    const existing = currentCart.find((item) => item.id === product.id);

    let nextCart;

    if (existing) {
      nextCart = currentCart
        .map((item) =>
          item.id === product.id
            ? { ...item, qty: Math.max(0, item.qty + diff) }
            : item
        )
        .filter((item) => item.qty > 0);
    } else if (diff > 0) {
      nextCart = [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          emoji: product.emoji,
          qty: 1,
        },
      ];
    } else {
      nextCart = currentCart;
    }

    writeCart(nextCart);
    setCart(nextCart);
  };

  return (
    <div style={styles.page}>
      <div style={styles.phone}>
        <div style={styles.header}>
          <button style={styles.langButton}>ENG</button>
        </div>

        <div style={styles.tabsRow}>
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                style={{
                  ...styles.tab,
                  ...(isActive ? styles.tabActive : {}),
                }}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div style={styles.grid}>
          {filteredItems.map((item) => {
            const qty = getQty(cart, item.id);

            return (
              <div key={item.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div
                    style={{
                      ...styles.imageCircle,
                      background: item.gradient,
                    }}
                  >
                    <span style={styles.emoji}>{item.emoji}</span>
                  </div>
                </div>

                <div style={styles.itemMeta}>
                  <div style={styles.itemName}>{item.name}</div>
                  <div style={styles.itemPrice}>{formatPrice(item.price)}</div>
                </div>

                <div style={styles.counter}>
                  <button
                    style={styles.counterBtn}
                    onClick={() => changeQty(item, -1)}
                  >
                    −
                  </button>
                  <div style={styles.counterValue}>{qty}</div>
                  <button
                    style={styles.counterBtn}
                    onClick={() => changeQty(item, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.summaryBox}>
          <div style={styles.summaryTop}>
            <div>
              <div style={styles.summaryTitle}>Your Order</div>
              <div style={styles.summarySub}>
                {cartCount ? `${cartCount} item(s) selected` : 'Ordered meals and drinks'}
              </div>
            </div>
            <div style={styles.totalBadge}>{formatPrice(totalPrice)}</div>
          </div>

          {cart.length ? (
            <div style={styles.selectedList}>
              {cart.slice(0, 4).map((item) => (
                <div key={item.id} style={styles.selectedRow}>
                  <span style={styles.selectedName}>
                    {item.emoji} {item.name}
                  </span>
                  <span style={styles.selectedQty}>x{item.qty}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyText}>
              Choose items from the menu to preview your order here.
            </div>
          )}
        </div>

        <div style={styles.bottomNav}>
          <Link to="/web" style={{ ...styles.navItem, ...styles.navActive }}>
            <span style={styles.navIcon}>⌂</span>
            <span style={styles.navLabel}>Home</span>
          </Link>

          <Link to="/web/cart" style={styles.navItem}>
            <span style={styles.navIcon}>🛒</span>
            <span style={styles.navLabel}>Cart</span>
          </Link>

          <Link to="/web/orders" style={styles.navItem}>
            <span style={styles.navIcon}>☰</span>
            <span style={styles.navLabel}>Orders</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #8be9ea 0%, #59d9e0 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px 10px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  phone: {
    width: '100%',
    maxWidth: '420px',
    minHeight: '820px',
    background: 'linear-gradient(180deg, #79e4e8 0%, #57d6df 100%)',
    borderRadius: '34px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
    padding: '18px 16px 110px',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '18px',
  },
  langButton: {
    border: 'none',
    background: 'rgba(255,255,255,0.55)',
    color: '#0d5b66',
    fontWeight: 800,
    padding: '8px 14px',
    borderRadius: '999px',
    cursor: 'pointer',
    boxShadow: '0 8px 18px rgba(0,0,0,0.08)',
  },
  tabsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '18px',
  },
  tab: {
    flex: 1,
    minWidth: '84px',
    border: 'none',
    background: 'transparent',
    color: '#166f7a',
    fontWeight: 700,
    borderRadius: '999px',
    padding: '12px 10px',
    cursor: 'pointer',
  },
  tabActive: {
    background: 'rgba(255,255,255,0.75)',
    color: '#0d5b66',
    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '16px',
  },
  card: {
    background: 'linear-gradient(180deg, #32abf4 0%, #1a8ef0 100%)',
    borderRadius: '28px',
    padding: '16px 14px 14px',
    minHeight: '250px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 16px 28px rgba(14, 97, 168, 0.24)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '14px',
  },
  imageCircle: {
    width: '108px',
    height: '108px',
    borderRadius: '50%',
    border: '4px solid rgba(255,255,255,0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 'inset 0 6px 14px rgba(255,255,255,0.25), 0 10px 18px rgba(0,0,0,0.15)',
  },
  emoji: {
    fontSize: '52px',
    lineHeight: 1,
  },
  itemMeta: {
    textAlign: 'center',
    color: '#fff',
    marginBottom: '12px',
  },
  itemName: {
    fontWeight: 800,
    fontSize: '15px',
    marginBottom: '6px',
  },
  itemPrice: {
    fontSize: '13px',
    fontWeight: 600,
    opacity: 0.95,
  },
  counter: {
    background: 'rgba(255,255,255,0.16)',
    borderRadius: '999px',
    padding: '8px 10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
  },
  counterBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: '#fff',
    color: '#1182d8',
    fontSize: '24px',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 6px 12px rgba(0,0,0,0.12)',
  },
  counterValue: {
    minWidth: '20px',
    textAlign: 'center',
    color: '#fff',
    fontWeight: 800,
    fontSize: '18px',
  },
  summaryBox: {
    marginTop: '18px',
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '24px',
    padding: '16px',
    boxShadow: '0 14px 28px rgba(0,0,0,0.08)',
  },
  summaryTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '12px',
  },
  summaryTitle: {
    color: '#155c66',
    fontWeight: 800,
    fontSize: '18px',
    marginBottom: '4px',
  },
  summarySub: {
    color: '#5c8790',
    fontWeight: 600,
    fontSize: '13px',
  },
  totalBadge: {
    background: '#1a93f1',
    color: '#fff',
    padding: '10px 12px',
    borderRadius: '14px',
    fontWeight: 800,
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  selectedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  selectedRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#eefbfd',
    borderRadius: '14px',
    padding: '10px 12px',
  },
  selectedName: {
    color: '#165962',
    fontWeight: 700,
    fontSize: '14px',
  },
  selectedQty: {
    color: '#1a93f1',
    fontWeight: 800,
    fontSize: '14px',
  },
  emptyText: {
    color: '#6c949c',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  bottomNav: {
    position: 'absolute',
    left: '16px',
    right: '16px',
    bottom: '16px',
    background: '#fff',
    borderRadius: '22px',
    padding: '12px 8px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: '0 12px 26px rgba(0,0,0,0.12)',
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
  },
  navActive: {
    color: '#1a93f1',
  },
  navIcon: {
    fontSize: '20px',
    lineHeight: 1,
  },
  navLabel: {
    fontSize: '12px',
  },
};