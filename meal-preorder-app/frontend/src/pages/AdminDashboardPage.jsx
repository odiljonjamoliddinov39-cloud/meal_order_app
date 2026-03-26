import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboardPage() {
  const [days, setDays] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dayForm, setDayForm] = useState({ date: '' });

  const [itemForm, setItemForm] = useState({
    dayId: '',
    name: '',
    price: '',
    quantity: '',
    type: 'meal',
  });

  const API = import.meta.env.VITE_API_URL;

  const fetchData = async () => {
    try {
      setLoading(true);

      const [d, o] = await Promise.all([
        axios.get(`${API}/admin/menu/days`),
        axios.get(`${API}/admin/orders`),
      ]);

      setDays(Array.isArray(d.data) ? d.data : []);
      setOrders(Array.isArray(o.data) ? o.data : []);
    } catch (error) {
      console.error('ADMIN FETCH ERROR:', error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createDay = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/menu/days`, dayForm);
      setDayForm({ date: '' });
      fetchData();
    } catch (error) {
      console.error('CREATE DAY ERROR:', error?.response?.data || error.message);
    }
  };

  const createItem = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API}/admin/menu/items`, {
        ...itemForm,
        price: Number(itemForm.price),
        quantity: Number(itemForm.quantity),
        dayId: Number(itemForm.dayId),
      });

      setItemForm({
        dayId: '',
        name: '',
        price: '',
        quantity: '',
        type: 'meal',
      });

      fetchData();
    } catch (error) {
      console.error('CREATE ITEM ERROR:', error?.response?.data || error.message);
    }
  };

  const deleteDay = async (id) => {
    try {
      await axios.delete(`${API}/admin/menu/days/${id}`);
      fetchData();
    } catch (error) {
      console.error('DELETE DAY ERROR:', error?.response?.data || error.message);
    }
  };

  const deleteOrder = async (id) => {
    try {
      await axios.delete(`${API}/admin/orders/${id}`);
      fetchData();
    } catch (error) {
      console.error('DELETE ORDER ERROR:', error?.response?.data || error.message);
    }
  };

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0
  );
  const totalItems = orders.reduce(
    (sum, o) => sum + (Array.isArray(o.items) ? o.items.length : 0),
    0
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>Manage menu days, items, and orders</p>
        </div>

        <button onClick={fetchData} style={styles.primaryButton}>
          Refresh
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Menu Days</div>
          <div style={styles.statValue}>{days.length}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Orders</div>
          <div style={styles.statValue}>{totalOrders}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Items Ordered</div>
          <div style={styles.statValue}>{totalItems}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Revenue</div>
          <div style={styles.statValue}>{totalRevenue}</div>
        </div>
      </div>

      <div style={styles.formGrid}>
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Create Day</h2>

          <form onSubmit={createDay} style={styles.form}>
            <input
              type="date"
              value={dayForm.date}
              onChange={(e) => setDayForm({ date: e.target.value })}
              style={styles.input}
              required
            />

            <button type="submit" style={styles.primaryButton}>
              Create Day
            </button>
          </form>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Create Item</h2>

          <form onSubmit={createItem} style={styles.form}>
            <select
              value={itemForm.dayId}
              onChange={(e) =>
                setItemForm({ ...itemForm, dayId: e.target.value })
              }
              style={styles.input}
              required
            >
              <option value="">Select day</option>
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.date}
                </option>
              ))}
            </select>

            <input
              placeholder="Item name"
              value={itemForm.name}
              onChange={(e) =>
                setItemForm({ ...itemForm, name: e.target.value })
              }
              style={styles.input}
              required
            />

            <input
              placeholder="Price"
              type="number"
              value={itemForm.price}
              onChange={(e) =>
                setItemForm({ ...itemForm, price: e.target.value })
              }
              style={styles.input}
              required
            />

            <input
              placeholder="Quantity"
              type="number"
              value={itemForm.quantity}
              onChange={(e) =>
                setItemForm({ ...itemForm, quantity: e.target.value })
              }
              style={styles.input}
              required
            />

            <select
              value={itemForm.type}
              onChange={(e) =>
                setItemForm({ ...itemForm, type: e.target.value })
              }
              style={styles.input}
            >
              <option value="meal">Meal</option>
              <option value="coffee">Coffee</option>
              <option value="drink">Drink</option>
              <option value="dessert">Dessert</option>
            </select>

            <button type="submit" style={styles.primaryButton}>
              Create Item
            </button>
          </form>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Menu Days</h2>

        {days.length === 0 ? (
          <div style={styles.emptyCard}>No menu days yet.</div>
        ) : (
          <div style={styles.cardsGrid}>
            {days.map((day) => (
              <div key={day.id} style={styles.dayCard}>
                <div style={styles.cardTop}>
                  <strong style={styles.cardTitle}>{day.date}</strong>
                  <button
                    onClick={() => deleteDay(day.id)}
                    style={styles.dangerButton}
                  >
                    Delete
                  </button>
                </div>

                <div style={styles.itemsWrap}>
                  {(day.items || []).length === 0 ? (
                    <p style={styles.emptyText}>No items yet.</p>
                  ) : (
                    (day.items || []).map((item) => (
                      <div key={item.id} style={styles.itemRow}>
                        <span>
                          {item.name} <span style={styles.typeBadge}>({item.type})</span>
                        </span>
                        <span>{item.price}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Orders</h2>

        {loading ? (
          <div style={styles.emptyCard}>Loading...</div>
        ) : orders.length === 0 ? (
          <div style={styles.emptyCard}>No orders yet.</div>
        ) : (
          <div style={styles.orderList}>
            {orders.map((o) => (
              <div key={o.id} style={styles.orderCard}>
                <div style={styles.cardTop}>
                  <strong style={styles.cardTitle}>Order #{o.id}</strong>
                  <button
                    onClick={() => deleteOrder(o.id)}
                    style={styles.dangerButton}
                  >
                    Delete
                  </button>
                </div>

                <div style={styles.orderItems}>
                  {(o.items || []).map((i) => (
                    <div key={i.id} style={styles.orderItemRow}>
                      <span>{i.name}</span>
                      <span>x{i.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.orderMetaRow}>
                  <span style={styles.metaPill}>{o.customerName || '-'}</span>
                  <span style={styles.metaPill}>{o.totalAmount || 0} so'm</span>
                  <span style={styles.metaPill}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '24px',
    background: 'linear-gradient(180deg, #f7fbff 0%, #eef6ff 100%)',
    color: '#16324f',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 800,
  },
  subtitle: {
    margin: '6px 0 0 0',
    color: '#5b708a',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#ffffff',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
  },
  statLabel: {
    color: '#5b708a',
    fontSize: '14px',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 800,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  panel: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
  },
  panelTitle: {
    marginTop: 0,
    marginBottom: '16px',
    fontSize: '22px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #d9e4f1',
    background: '#fff',
    boxSizing: 'border-box',
    fontSize: '14px',
  },
  primaryButton: {
    border: 'none',
    background: '#1f7aec',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  dangerButton: {
    border: 'none',
    background: '#ff5b61',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '24px',
    marginBottom: '14px',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  },
  dayCard: {
    background: '#ffffff',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
  },
  orderCard: {
    background: '#ffffff',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
    marginBottom: '16px',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '18px',
  },
  itemsWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    background: '#f7fbff',
    padding: '10px 12px',
    borderRadius: '12px',
  },
  typeBadge: {
    color: '#5b708a',
  },
  emptyText: {
    margin: 0,
    color: '#70839b',
  },
  emptyCard: {
    background: '#ffffff',
    borderRadius: '18px',
    padding: '18px',
    color: '#70839b',
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
  },
  orderList: {
    display: 'flex',
    flexDirection: 'column',
  },
  orderItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  orderItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    background: '#f7fbff',
    padding: '10px 12px',
    borderRadius: '12px',
  },
  orderMetaRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  metaPill: {
    background: '#eef4fb',
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: '13px',
    color: '#44576d',
  },
};
