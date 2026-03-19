import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

const STORAGE_ORDERS_KEY = 'meal_preorder_orders_v1';

function readOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function formatPrice(value) {
  return `${Number(value).toLocaleString('ru-RU')} so'm`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [source, setSource] = useState('local');

  useEffect(() => {
    let mounted = true;

    api
      .get('/orders/me')
      .then((res) => {
        if (!mounted) return;
        const safeOrders = Array.isArray(res.data) ? res.data : [];
        setOrders(safeOrders);
        setSource('api');
      })
      .catch(() => {
        if (!mounted) return;
        setOrders(readOrders());
        setSource('local');
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.phone}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.heading}>My Orders</div>
            <div style={styles.subheading}>
              {source === 'api'
                ? 'Loaded from backend'
                : 'Showing local demo orders'}
            </div>
          </div>

          <Link to="/web" style={styles.backLink}>
            ← Home
          </Link>
        </div>

        {orders.length ? (
          <div style={styles.ordersList}>
            {orders.map((order, index) => {
              const orderId =
                typeof order.id === 'string'
                  ? order.id
                  : `ORD-${String(index + 1).padStart(4, '0')}`;

              const createdAt = order.createdAt
                ? new Date(order.createdAt).toLocaleString()
                : 'Unknown time';

              const totalAmount =
                order.totalAmount ?? order.total ?? 0;

              const items = Array.isArray(order.items) ? order.items : [];

              return (
                <div key={orderId} style={styles.orderCard}>
                  <div style={styles.orderTop}>
                    <div>
                      <div style={styles.orderTitle}>Order #{orderId.slice(-6)}</div>
                      <div style={styles.orderDate}>{createdAt}</div>
                    </div>
                    <div style={styles.statusBadge}>
                      {order.status || 'Pending'}
                    </div>
                  </div>

                  <div style={styles.amountRow}>
                    <span>Total</span>
                    <strong>{formatPrice(totalAmount)}</strong>
                  </div>

                  {items.length ? (
                    <div style={styles.itemsWrap}>
                      {items.map((item) => (
                        <div key={`${orderId}-${item.id}`} style={styles.itemRow}>
                          <span style={styles.itemName}>
                            {item.emoji || '🍽️'} {item.name}
                          </span>
                          <span style={styles.itemQty}>x{item.qty}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={styles.emptyBox}>
            <div style={styles.emptyTitle}>No orders yet</div>
            <div style={styles.emptyText}>
              Place a demo order from the cart page and it will appear here.
            </div>
            <Link to="/web/cart" style={styles.emptyAction}>
              Go to cart
            </Link>
          </div>
        )}

        <div style={styles.bottomNav}>
          <Link to="/web" style={styles.navItem}>
            <span style={styles.navIcon}>⌂</span>
            <span style={styles.navLabel}>Home</span>
          </Link>

          <Link to="/web/cart" style={styles.navItem}>
            <span style={styles.navIcon}>🛒</span>
            <span style={styles.navLabel}>Cart</span>
          </Link>

          <Link to="/web/orders" style={{ ...styles.navItem, ...styles.navActive }}>
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
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  orderCard: {
    background: '#fff',
    borderRadius: '22px',
    padding: '16px',
    boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
  },
  orderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '14px',
  },
  orderTitle: {
    color: '#105760',
    fontWeight: 800,
    marginBottom: '4px',
  },
  orderDate: {
    color: '#6b8f97',
    fontSize: '13px',
    fontWeight: 600,
  },
  statusBadge: {
    background: '#e9f8ec',
    color: '#137333',
    fontWeight: 800,
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    height: 'fit-content',
  },
  amountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#eefbfd',
    padding: '12px 14px',
    borderRadius: '16px',
    color: '#105760',
    fontWeight: 700,
    marginBottom: '12px',
  },
  itemsWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '14px',
    background: '#fafefe',
  },
  itemName: {
    color: '#165962',
    fontWeight: 700,
    fontSize: '14px',
  },
  itemQty: {
    color: '#1a93f1',
    fontWeight: 800,
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