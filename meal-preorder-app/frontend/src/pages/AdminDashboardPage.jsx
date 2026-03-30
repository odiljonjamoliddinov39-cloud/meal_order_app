import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

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

  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editOrderForm, setEditOrderForm] = useState({
    customerName: '',
    telegramId: '',
    itemsText: '',
  });

  const API = import.meta.env.VITE_API_URL;

  const fetchData = async () => {
    try {
      setLoading(true);

      const [daysRes, ordersRes] = await Promise.all([
        axios.get(`${API}/admin/menu/days`),
        axios.get(`${API}/admin/orders`),
      ]);

      setDays(Array.isArray(daysRes.data) ? daysRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch (error) {
      console.error('ADMIN FETCH ERROR:', error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0
  );
  const totalItems = orders.reduce(
    (sum, order) => sum + (Array.isArray(order.items) ? order.items.length : 0),
    0
  );

  const sortedMenuDays = useMemo(() => {
    return [...days].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [days]);

  const createDay = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API}/admin/menu/days`, dayForm);
      setDayForm({ date: '' });
      await fetchData();
    } catch (error) {
      console.error('CREATE DAY ERROR:', error?.response?.data || error.message);
    }
  };

  const createItem = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API}/admin/menu/items`, {
        ...itemForm,
        dayId: Number(itemForm.dayId),
        price: Number(itemForm.price),
        quantity: Number(itemForm.quantity),
      });

      setItemForm({
        dayId: '',
        name: '',
        price: '',
        quantity: '',
        type: 'meal',
      });

      await fetchData();
    } catch (error) {
      console.error('CREATE ITEM ERROR:', error?.response?.data || error.message);
    }
  };

  const deleteDay = async (dayId) => {
    try {
      await axios.delete(`${API}/admin/menu/days/${dayId}`);
      await fetchData();
    } catch (error) {
      console.error('DELETE DAY ERROR:', error?.response?.data || error.message);
    }
  };

  const deleteItem = async (dayId, itemId) => {
    try {
      await axios.delete(`${API}/admin/menu/items/${dayId}/${itemId}`);
      await fetchData();
    } catch (error) {
      console.error('DELETE ITEM ERROR:', error?.response?.data || error.message);
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await axios.delete(`${API}/admin/orders/${orderId}`);
      await fetchData();
    } catch (error) {
      console.error('DELETE ORDER ERROR:', error?.response?.data || error.message);
    }
  };

  const startEditOrder = (order) => {
    const itemsText = (order.items || [])
      .map(
        (item) =>
          `${item.name || item?.menuItem?.name || ''}|${item.quantity || 0}|${item.price || item?.menuItem?.price || 0}|${item.type || item?.menuItem?.type || 'meal'}`
      )
      .join('\n');

    setEditingOrderId(order.id);
    setEditOrderForm({
      customerName: order.customerName || '',
      telegramId: order.telegramId || '',
      itemsText,
    });
  };

  const cancelEditOrder = () => {
    setEditingOrderId(null);
    setEditOrderForm({
      customerName: '',
      telegramId: '',
      itemsText: '',
    });
  };

  const saveEditOrder = async () => {
    try {
      const parsedItems = editOrderForm.itemsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
          const [name, quantity, price, type] = line.split('|');
          return {
            id: index + 1,
            name: (name || '').trim(),
            quantity: Number(quantity || 0),
            price: Number(price || 0),
            type: (type || 'meal').trim(),
          };
        });

      await axios.put(`${API}/admin/orders/${editingOrderId}`, {
        customerName: editOrderForm.customerName,
        telegramId: editOrderForm.telegramId,
        items: parsedItems,
      });

      cancelEditOrder();
      await fetchData();
    } catch (error) {
      console.error('SAVE ORDER ERROR:', error?.response?.data || error.message);
    }
  };

  const exportOrdersXLS = () => {
    const rows = orders.map((order) => ({
      orderId: order.id,
      customerName: order.customerName || '',
      telegramId: order.telegramId || '',
      createdAt: order.createdAt || '',
      totalAmount: order.totalAmount || 0,
      items: (order.items || [])
        .map(
          (item) =>
            `${item.name || item?.menuItem?.name || ''} x${item.quantity || 0} (${item.type || item?.menuItem?.type || 'meal'})`
        )
        .join(', '),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, 'orders.xlsx');
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>Manage menu and orders</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={fetchData} style={styles.primaryButton}>
            Refresh
          </button>
          <button onClick={exportOrdersXLS} style={styles.primaryButton}>
            Download XLS
          </button>
        </div>
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
          <div style={styles.statLabel}>Ordered Items</div>
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
                setItemForm((prev) => ({ ...prev, dayId: e.target.value }))
              }
              style={styles.input}
              required
            >
              <option value="">Select day</option>
              {sortedMenuDays.map((day) => (
                <option key={day.id} value={day.id}>
                  {day.date}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Name"
              value={itemForm.name}
              onChange={(e) =>
                setItemForm((prev) => ({ ...prev, name: e.target.value }))
              }
              style={styles.input}
              required
            />

            <input
              type="number"
              placeholder="Price"
              value={itemForm.price}
              onChange={(e) =>
                setItemForm((prev) => ({ ...prev, price: e.target.value }))
              }
              style={styles.input}
              required
            />

            <input
              type="number"
              placeholder="Quantity"
              value={itemForm.quantity}
              onChange={(e) =>
                setItemForm((prev) => ({ ...prev, quantity: e.target.value }))
              }
              style={styles.input}
              required
            />

            <select
              value={itemForm.type}
              onChange={(e) =>
                setItemForm((prev) => ({ ...prev, type: e.target.value }))
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

        {sortedMenuDays.length === 0 ? (
          <div style={styles.emptyCard}>No menu days yet.</div>
        ) : (
          <div style={styles.cardsGrid}>
            {sortedMenuDays.map((day) => (
              <div key={day.id} style={styles.dayCard}>
                <div style={styles.cardTop}>
                  <strong style={styles.cardTitle}>{day.date}</strong>
                  <button
                    onClick={() => deleteDay(day.id)}
                    style={styles.dangerButton}
                  >
                    Delete Day
                  </button>
                </div>

                <div style={styles.itemsWrap}>
                  {(day.items || []).length === 0 ? (
                    <p style={styles.emptyText}>No items yet.</p>
                  ) : (
                    (day.items || []).map((item) => (
                      <div key={item.id} style={styles.itemRow}>
                        <div>
                          {item.name}{' '}
                          <span style={styles.typeBadge}>({item.type || 'meal'})</span>
                        </div>

                        <div style={styles.itemActions}>
                          <span>{item.price}</span>
                          <button
                            onClick={() => deleteItem(day.id, item.id)}
                            style={styles.smallDangerButton}
                          >
                            Delete Item
                          </button>
                        </div>
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
            {orders.map((order) => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.cardTop}>
                  <strong style={styles.cardTitle}>Order #{order.id}</strong>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => startEditOrder(order)}
                      style={styles.primaryButtonSmall}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteOrder(order.id)}
                      style={styles.dangerButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div style={styles.orderItems}>
                  {(order.items || []).map((item) => (
                    <div key={item.id} style={styles.orderItemRow}>
                      <span>
                        {item.name || item?.menuItem?.name || ''}
                        {' '}
                        <span style={styles.typeBadge}>
                          ({item.type || item?.menuItem?.type || 'meal'})
                        </span>
                      </span>
                      <span>x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.orderMetaRow}>
                  <span style={styles.metaPill}>{order.customerName || '-'}</span>
                  <span style={styles.metaPill}>{order.totalAmount || 0} so'm</span>
                  <span style={styles.metaPill}>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : '-'}
                  </span>
                </div>

                {editingOrderId === order.id && (
                  <div style={styles.editBox}>
                    <input
                      type="text"
                      placeholder="Customer name"
                      value={editOrderForm.customerName}
                      onChange={(e) =>
                        setEditOrderForm((prev) => ({
                          ...prev,
                          customerName: e.target.value,
                        }))
                      }
                      style={styles.input}
                    />

                    <input
                      type="text"
                      placeholder="Telegram ID"
                      value={editOrderForm.telegramId}
                      onChange={(e) =>
                        setEditOrderForm((prev) => ({
                          ...prev,
                          telegramId: e.target.value,
                        }))
                      }
                      style={styles.input}
                    />

                    <textarea
                      rows={6}
                      placeholder="name|quantity|price|type"
                      value={editOrderForm.itemsText}
                      onChange={(e) =>
                        setEditOrderForm((prev) => ({
                          ...prev,
                          itemsText: e.target.value,
                        }))
                      }
                      style={styles.textarea}
                    />

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button onClick={saveEditOrder} style={styles.primaryButton}>
                        Save Order
                      </button>
                      <button onClick={cancelEditOrder} style={styles.smallDangerButton}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
  textarea: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #d9e4f1',
    background: '#fff',
    boxSizing: 'border-box',
    fontSize: '14px',
    resize: 'vertical',
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
  primaryButtonSmall: {
    border: 'none',
    background: '#1f7aec',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '10px',
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
  smallDangerButton: {
    border: 'none',
    background: '#ff7b81',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '12px',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
    alignItems: 'center',
    gap: '12px',
    background: '#f7fbff',
    padding: '10px 12px',
    borderRadius: '12px',
    flexWrap: 'wrap',
  },
  itemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
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
  editBox: {
    marginTop: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: '#f7fbff',
    padding: '14px',
    borderRadius: '14px',
  },
};
