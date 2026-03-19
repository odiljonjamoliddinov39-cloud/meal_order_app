import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const STORAGE_CART_KEY = 'meal_preorder_cart_v1';
const STORAGE_ORDERS_KEY = 'meal_preorder_orders_v1';

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

function readOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
}

function formatPrice(value) {
  return `${Number(value).toLocaleString('ru-RU')} so'm`;
}

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setCart(readCart());
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const serviceFee = cart.length ? 5000 : 0;
  const total = subtotal + serviceFee;

  const updateQty = (id, diff) => {
    const nextCart = readCart()
      .map((item) =>
        item.id === id ? { ...item, qty: Math.max(0, item.qty + diff) } : item
      )
      .filter((item) => item.qty > 0);

    writeCart(nextCart);
    setCart(nextCart);
  };

  const clearCart = () => {
    writeCart([]);
    setCart([]);
    setMessage('Cart cleared');
  };

  const placeDemoOrder = () => {
    if (!cart.length) {
      setMessage('Cart is empty');
      return;
    }

    const orders = readOrders();

    const newOrder = {
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Pending',
      totalAmount: total,
      items: cart,
    };

    const nextOrders = [newOrder, ...orders];
    writeOrders(nextOrders);
    writeCart([]);
    setCart([]);
    navigate('/web/orders');
  };

  return (
    <div style={styles.page}>
      <div style={styles.phone}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.heading}>Cart</div>
            <div style={styles.subheading}>Review your selected items</div>
          </div>
          <Link to="/web" style={styles.backLink}>
            ← Back
          </Link>
        </div>

        {cart.length ? (
          <>
            <div style={styles.list}>
              {cart.map((item) => (
                <div key={item.id} style={styles.card}>
                  <div style={styles.left}>
                    <div style={styles.itemEmoji}>{item.emoji}</div>
                    <div>
                      <div style={styles.itemName}>{item.name}</div>
                      <div style={styles.itemPrice}>{formatPrice(item.price)}</div>
                    </div>
                  </div>

                  <div style={styles.right}>
                    <div style={styles.counter}>
                      <button
                        style={styles.counterBtn}
                        onClick={() => updateQty(item.id, -1)}
                      >
                        −
                      </button>
                      <span style={styles.counterValue}>{item.qty}</span>
                      <button
                        style={styles.counterBtn}
                        onClick={() => updateQty(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                    <div style={styles.lineTotal}>
                      {formatPrice(item.price * item.qty)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.summary}>
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Service fee</span>
                <strong>{formatPrice(serviceFee)}</strong>
              </div>
              <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>

              <button style={styles.primaryBtn} onClick={placeDemoOrder}>
                Place Demo Order
              </button>
              <button style={styles.secondaryBtn} onClick={clearCart}>
                Clear Cart
              </button>
            </div>
          </>
        ) : (
          <div style={styles.emptyBox}>
            <div style={styles.emptyTitle}>Your cart is empty</div>
            <div style={styles.emptyText}>
              Add some meals, drinks, coffee or dessert from the home page.
            </div>
            <Link to="/web" style={styles.emptyAction}>
              Go to menu
            </Link>
          </div>
        )}

        {message ? <div style={styles.message}>{message}</div> : null}

        <div style={styles.bottomNav}>
          <Link to="/web" style={styles.navItem}>
            <span style={styles.navIcon}>⌂</span>
            <span style={styles.navLabel}>Home</span>
          </Link>

          <Link to="/web/cart" style={{ ...styles.navItem, ...styles.navActive }}>
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
    padding: '22px 16px 110px',
    position: 'relative',
    overflow: 'hidden',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '18px',
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
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
    marginTop: '18px',
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
    fontWeight: 600,
  },
  summaryTotal: {
    fontSize: '18px',
    marginTop: '6px',
    paddingTop: '12px',
    borderTop: '1px solid #d7f0f5',
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
  message: {
    marginTop: '12px',
    background: '#eaf8fb',
    color: '#155c66',
    borderRadius: '14px',
    padding: '10px 12px',
    textAlign: 'center',
    fontWeight: 700,
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