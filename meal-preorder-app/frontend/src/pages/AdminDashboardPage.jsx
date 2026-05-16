import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../api/client.js';

export default function AdminDashboardPage() {
  const [days, setDays] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logHasMore, setLogHasMore] = useState(false);
  const [logFilter, setLogFilter] = useState('all');
  const [logSourceFilter, setLogSourceFilter] = useState('all');
  const [logRange, setLogRange] = useState('24h');
  const [logLimit, setLogLimit] = useState('1000');
  const [logSearch, setLogSearch] = useState('');
  const [logTelegramId, setLogTelegramId] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
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
    status: 'CONFIRMED',
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const [daysRes, ordersRes] = await Promise.all([
        api.get('/admin/menu/days'),
        api.get('/admin/orders'),
      ]);

      setDays(Array.isArray(daysRes.data) ? daysRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch (error) {
      console.error('ADMIN FETCH ERROR:', error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: logLimit,
        range: logRange,
        level: logFilter,
        source: logSourceFilter,
      });

      if (logSearch.trim()) params.set('search', logSearch.trim());
      if (logTelegramId.trim()) params.set('telegramUserId', logTelegramId.trim());

      const res = await api.get(`/admin/diagnostics?${params.toString()}`);
      setLogs(Array.isArray(res.data?.logs) ? res.data.logs : []);
      setLogTotal(Number(res.data?.total || 0));
      setLogHasMore(Boolean(res.data?.hasMore));
    } catch (error) {
      console.error('ADMIN LOGS FETCH ERROR:', error?.response?.data || error.message);
    }
  };

  const clearLogs = async () => {
    try {
      await api.delete('/admin/diagnostics');
      setLogs([]);
      setLogTotal(0);
      setLogHasMore(false);
    } catch (error) {
      console.error('ADMIN LOGS CLEAR ERROR:', error?.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLogs();
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

  const filteredLogs = useMemo(() => {
    return logs;
  }, [logs]);

  const formatLogLine = (log) => {
    const time = log.time ? new Date(log.time).toLocaleString() : '-';
    const meta = [
      time,
      (log.level || 'info').toUpperCase(),
      log.source || '-',
      log.status || '',
      log.telegramUserId ? `tg:${log.telegramUserId}` : '',
    ].filter(Boolean).join(' | ');

    return `${meta}\n${log.message || log.path || '-'}\n`;
  };

  const copyVisibleLogs = async () => {
    const text = filteredLogs.map(formatLogLine).join('\n');

    try {
      await navigator.clipboard.writeText(text || 'No logs visible.');
      setCopyStatus('Copied visible logs');
    } catch {
      setCopyStatus('Copy failed');
    }
  };

  const exportVisibleLogs = () => {
    const rows = filteredLogs.map((log) => ({
      time: log.time || '',
      level: log.level || '',
      source: log.source || '',
      method: log.method || '',
      path: log.path || '',
      status: log.status || '',
      durationMs: log.durationMs || '',
      telegramUserId: log.telegramUserId || '',
      message: log.message || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs');
    XLSX.writeFile(workbook, 'diagnostic-logs.xlsx');
  };

  const createDay = async (e) => {
    e.preventDefault();

    try {
      await api.post('/admin/menu/days', dayForm);
      setDayForm({ date: '' });
      await fetchData();
    } catch (error) {
      console.error('CREATE DAY ERROR:', error?.response?.data || error.message);
    }
  };

  const createItem = async (e) => {
    e.preventDefault();

    try {
      await api.post('/admin/menu/items', {
        ...itemForm,
        dayId: itemForm.dayId,
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
      await api.delete(`/admin/menu/days/${dayId}`);
      await fetchData();
    } catch (error) {
      console.error('DELETE DAY ERROR:', error?.response?.data || error.message);
    }
  };

  const deleteItem = async (dayId, itemId) => {
    try {
      await api.delete(`/admin/menu/items/${itemId}`);
      await fetchData();
    } catch (error) {
      console.error('DELETE ITEM ERROR:', error?.response?.data || error.message);
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      await api.delete(`/admin/orders/${orderId}`);
      await fetchData();
    } catch (error) {
      console.error('DELETE ORDER ERROR:', error?.response?.data || error.message);
    }
  };

  const startEditOrder = (order) => {
    setEditingOrderId(order.id);
    setEditOrderForm({
      status: order.status || 'CONFIRMED',
    });
  };

  const cancelEditOrder = () => {
    setEditingOrderId(null);
    setEditOrderForm({
      status: 'CONFIRMED',
    });
  };

  const saveEditOrder = async () => {
    try {
      await api.put(`/admin/orders/${editingOrderId}`, {
        status: editOrderForm.status,
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
      status: order.status || '',
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
          <button
            onClick={() => {
              fetchData();
              fetchLogs();
            }}
            style={styles.primaryButton}
          >
            Refresh
          </button>
          <button onClick={exportOrdersXLS} style={styles.primaryButton}>
            Download XLS
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Live Logs</h2>
            <p style={styles.sectionSubtitle}>
              Backend requests and server errors saved in the database for recent review.
            </p>
          </div>

          <div style={styles.logActions}>
            <select
              value={logRange}
              onChange={(e) => setLogRange(e.target.value)}
              style={styles.compactSelect}
            >
              <option value="1h">Past hour</option>
              <option value="24h">Past day</option>
              <option value="7d">Past week</option>
              <option value="30d">Past month</option>
            </select>

            <select
              value={logLimit}
              onChange={(e) => setLogLimit(e.target.value)}
              style={styles.compactSelect}
            >
              <option value="250">Show 250</option>
              <option value="500">Show 500</option>
              <option value="1000">Show 1000</option>
              <option value="5000">Show 5000</option>
            </select>

            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              style={styles.compactSelect}
            >
              <option value="all">All</option>
              <option value="error">Errors</option>
              <option value="warn">Warnings</option>
              <option value="info">Info</option>
            </select>

            <select
              value={logSourceFilter}
              onChange={(e) => setLogSourceFilter(e.target.value)}
              style={styles.compactSelect}
            >
              <option value="all">All sources</option>
              <option value="request">Requests</option>
              <option value="server">Server</option>
            </select>

            <button onClick={fetchLogs} style={styles.primaryButtonSmall}>
              Apply
            </button>
            <button onClick={copyVisibleLogs} style={styles.primaryButtonSmall}>
              Copy Visible
            </button>
            <button onClick={exportVisibleLogs} style={styles.primaryButtonSmall}>
              Export XLS
            </button>
            <button onClick={clearLogs} style={styles.smallDangerButton}>
              Clear Logs
            </button>
          </div>
        </div>

        <div style={styles.logSearchRow}>
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Search message or path"
            style={styles.logInput}
          />
          <input
            type="text"
            value={logTelegramId}
            onChange={(e) => setLogTelegramId(e.target.value)}
            placeholder="Telegram ID"
            style={styles.logInput}
          />
          <span style={styles.logCount}>
            {filteredLogs.length} shown of {logTotal}
            {logHasMore ? ` - limited to ${logLimit}` : ''}
            {copyStatus ? ` - ${copyStatus}` : ''}
          </span>
        </div>

        <div style={styles.logPanel}>
          {filteredLogs.length === 0 ? (
            <div style={styles.emptyLog}>No logs captured yet.</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} style={styles.logRow}>
                <div style={styles.logMeta}>
                  <span style={{ ...styles.logBadge, ...styles[`logBadge_${log.level}`] }}>
                    {log.level || 'info'}
                  </span>
                  <span>{log.source || '-'}</span>
                  <span>{log.time ? new Date(log.time).toLocaleString() : '-'}</span>
                  {log.status ? <span>{log.status}</span> : null}
                  {log.telegramUserId ? <span>tg:{log.telegramUserId}</span> : null}
                </div>

                <pre style={styles.logMessage}>{log.message || log.path || '-'}</pre>
              </div>
            ))
          )}
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
                  <span style={styles.metaPill}>{order.status || 'CONFIRMED'}</span>
                  <span style={styles.metaPill}>{order.totalAmount || 0} so'm</span>
                  <span style={styles.metaPill}>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : '-'}
                  </span>
                </div>

                {editingOrderId === order.id && (
                  <div style={styles.editBox}>
                    <select
                      value={editOrderForm.status}
                      onChange={(e) =>
                        setEditOrderForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      style={styles.input}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>

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
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '14px',
    flexWrap: 'wrap',
    marginBottom: '14px',
  },
  sectionTitle: {
    fontSize: '24px',
    margin: 0,
  },
  sectionSubtitle: {
    margin: '6px 0 0 0',
    color: '#5b708a',
    fontSize: '13px',
  },
  logActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  compactSelect: {
    padding: '9px 12px',
    borderRadius: '10px',
    border: '1px solid #d9e4f1',
    background: '#ffffff',
    color: '#16324f',
    fontWeight: 700,
  },
  logSearchRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '10px',
  },
  logInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #d9e4f1',
    background: '#ffffff',
    color: '#16324f',
    boxSizing: 'border-box',
    fontSize: '13px',
  },
  logCount: {
    color: '#5b708a',
    fontSize: '13px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  logPanel: {
    background: '#0f1c2e',
    borderRadius: '18px',
    padding: '12px',
    color: '#d7e5f8',
    maxHeight: '360px',
    overflowY: 'auto',
    boxShadow: '0 10px 24px rgba(0,0,0,0.10)',
  },
  logRow: {
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '10px 4px',
  },
  logMeta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
    color: '#9fb4cd',
    fontSize: '12px',
    marginBottom: '6px',
  },
  logBadge: {
    borderRadius: '999px',
    padding: '3px 8px',
    color: '#ffffff',
    fontWeight: 800,
    textTransform: 'uppercase',
    fontSize: '11px',
    background: '#52708f',
  },
  logBadge_info: {
    background: '#2b8be8',
  },
  logBadge_warn: {
    background: '#d98b14',
  },
  logBadge_error: {
    background: '#e5484d',
  },
  logMessage: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: '12px',
    lineHeight: 1.45,
  },
  emptyLog: {
    color: '#9fb4cd',
    padding: '18px',
    textAlign: 'center',
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
