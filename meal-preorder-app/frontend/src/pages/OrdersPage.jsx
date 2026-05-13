import { useEffect, useState } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import api from '../api/client.js';

const labels = {
  ENG: {
    title: 'My Orders',
    subtitle: 'Orders loaded from backend',
    back: 'Home',
    empty: 'No orders yet',
    emptyText: 'Place an order from the cart page and it will appear here.',
    goCart: 'Go to cart',
    total: 'Total',
    statusPending: 'Pending',
    statusConfirmed: 'Confirmed',
    statusCancelled: 'Cancelled',
    loading: 'Loading orders...',
    failed: 'Failed to load orders',
    authRequired: 'Open this page from Telegram to load your orders',
  },
  RUS: {
    title: 'My orders',
    subtitle: 'Orders loaded from backend',
    back: 'Home',
    empty: 'No orders yet',
    emptyText: 'Place an order from the cart page and it will appear here.',
    goCart: 'Go to cart',
    total: 'Total',
    statusPending: 'Pending',
    statusConfirmed: 'Confirmed',
    statusCancelled: 'Cancelled',
    loading: 'Loading orders...',
    failed: 'Failed to load orders',
    authRequired: 'Open this page from Telegram to load your orders',
  },
  UZB: {
    title: 'Mening buyurtmalarim',
    subtitle: 'Buyurtmalar serverdan yuklandi',
    back: 'Bosh sahifa',
    empty: "Hozircha buyurtma yo'q",
    emptyText: 'Savatdan buyurtma bering, u shu yerda chiqadi.',
    goCart: "Savatga o'tish",
    total: 'Jami',
    statusPending: 'Kutilmoqda',
    statusConfirmed: 'Tasdiqlangan',
    statusCancelled: 'Bekor qilingan',
    loading: 'Buyurtmalar yuklanmoqda...',
    failed: "Buyurtmalarni yuklab bo'lmadi",
    authRequired: 'Buyurtmalarni yuklash uchun sahifani Telegram orqali oching',
  },
};

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('ru-RU')} so'm`;
}

function formatOrderDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapStatus(status, l) {
  if (status === 'PENDING') return l.statusPending;
  if (status === 'CANCELLED') return l.statusCancelled;
  return l.statusConfirmed;
}

function getStatusStyle(status) {
  if (status === 'PENDING') {
    return {
      background: '#fff4e5',
      color: '#b26a00',
    };
  }

  if (status === 'CANCELLED') {
    return {
      background: '#fdecea',
      color: '#b42318',
    };
  }

  return {
    background: '#e9f8ec',
    color: '#137333',
  };
}

export default function OrdersPage() {
  const { language } = useOutletContext();
  const l = labels[language] || labels.RUS;
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.success || '');

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setErrorMessage('');

        const res = await api.get('/orders/me');

        if (!mounted) return;
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        if (!mounted) return;
        setOrders([]);
        setErrorMessage(error?.response?.status === 401 ? l.authRequired : error?.response?.data?.message || l.failed);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [l.failed, l.authRequired]);

  useEffect(() => {
    if (!successMessage) return;

    const timeout = setTimeout(() => {
      setSuccessMessage('');
    }, 3500);

    return () => clearTimeout(timeout);
  }, [successMessage]);

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.heading}>{l.title}</div>
          <div style={styles.subheading}>{l.subtitle}</div>
        </div>

        <Link to="/web" style={styles.backLink}>
          Back: {l.back}
        </Link>
      </div>

      {successMessage ? <div style={styles.successBox}>{successMessage}</div> : null}
      {errorMessage ? <div style={styles.errorBox}>{errorMessage}</div> : null}

      <div style={styles.body}>
        {loading ? (
          <div style={styles.infoBox}>{l.loading}</div>
        ) : orders.length ? (
          <div style={styles.ordersList}>
            {orders.map((order) => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderTop}>
                  <div>
                    <div style={styles.orderTitle}>
                      Order #{String(order.id || '').slice(-6) || '------'}
                    </div>
                    <div style={styles.orderDate}>{formatOrderDate(order.createdAt)}</div>
                  </div>

                  <div style={{ ...styles.statusBadge, ...getStatusStyle(order.status) }}>
                    {mapStatus(order.status, l)}
                  </div>
                </div>

                <div style={styles.amountRow}>
                  <span>{l.total}</span>
                  <strong>{formatPrice(order.totalAmount)}</strong>
                </div>

                <div style={styles.itemsWrap}>
                  {(order.items || []).map((item) => (
                    <div key={item.id} style={styles.itemRow}>
                      <span style={styles.itemName}>{item.menuItem?.name || 'Item'}</span>
                      <span style={styles.itemQty}>x{item.quantity || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyBox}>
            <div style={styles.emptyTitle}>{l.empty}</div>
            <div style={styles.emptyText}>{l.emptyText}</div>
            <Link to="/web/cart" style={styles.emptyAction}>
              {l.goCart}
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
  successBox: {
    background: '#e9f8ec',
    color: '#137333',
    fontWeight: 800,
    borderRadius: '16px',
    padding: '12px 14px',
  },
  errorBox: {
    background: '#fdecea',
    color: '#b42318',
    fontWeight: 800,
    borderRadius: '16px',
    padding: '12px 14px',
  },
  infoBox: {
    background: 'rgba(255,255,255,0.9)',
    color: '#105760',
    fontWeight: 700,
    borderRadius: '18px',
    padding: '18px',
    textAlign: 'center',
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  ordersList: {
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    paddingRight: '2px',
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
    fontWeight: 800,
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    height: 'fit-content',
    whiteSpace: 'nowrap',
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
};
