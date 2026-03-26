import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [days, setDays] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterDate, setFilterDate] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

  const [dayForm, setDayForm] = useState({
    date: '',
  });

  const [itemForm, setItemForm] = useState({
    dayId: '',
    name: '',
    price: '',
    quantity: '',
  });

  const token = localStorage.getItem('adminToken');

  const headers = useMemo(() => {
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
  }, [token]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const ordersUrl = new URL(`${import.meta.env.VITE_API_URL}/admin/orders`);
      if (filterDate) ordersUrl.searchParams.set('date', filterDate);
      if (filterCustomer) ordersUrl.searchParams.set('customer', filterCustomer);

      const [daysRes, ordersRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/admin/menu/days`, { headers }),
        axios.get(ordersUrl.toString(), { headers }),
      ]);

      const safeDays = Array.isArray(daysRes.data)
        ? daysRes.data
        : Array.isArray(daysRes.data?.days)
        ? daysRes.data.days
        : [];

      const safeOrders = Array.isArray(ordersRes.data)
        ? ordersRes.data
        : Array.isArray(ordersRes.data?.orders)
        ? ordersRes.data.orders
        : [];

      setDays(safeDays);
      setOrders(safeOrders);
    } catch (err) {
      console.error('Dashboard fetch error:', err?.response?.data || err.message);
      setError(err?.response?.data?.message || 'Failed to load dashboard data');
      setDays([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  const handleDayChange = (e) => {
    const { name, value } = e.target;
    setDayForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateDay = async (e) => {
    e.preventDefault();

    try {
      setError('');

      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/menu/days`,
        dayForm,
        { headers }
      );

      setDayForm({ date: '' });
      await fetchData();
    } catch (err) {
      console.error('Create day error:', err?.response?.data || err.message);
      setError(err?.response?.data?.message || 'Failed to create menu day');
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();

    try {
      setError('');

      const payload = {
        dayId: Number(itemForm.dayId),
        name: itemForm.name,
        price: Number(itemForm.price),
        quantity: Number(itemForm.quantity),
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/menu/items`,
        payload,
        { headers }
      );

      setItemForm({
        dayId: '',
        name: '',
        price: '',
        quantity: '',
      });

      await fetchData();
    } catch (err) {
      console.error('Create item error:', err?.response?.data || err.message);
      setError(err?.response?.data?.message || 'Failed to create menu item');
    }
  };

  const handleDeleteDay = async (dayId) => {
    try {
      setError('');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/admin/menu/days/${dayId}`,
        { headers }
      );
      await fetchData();
    } catch (err) {
      console.error('Delete day error:', err?.response?.data || err.message);
      setError(err?.response?.data?.message || 'Failed to delete menu day');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      setError('');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/admin/orders/${orderId}`,
        { headers }
      );
      await fetchData();
    } catch (err) {
      console.error('Delete order error:', err?.response?.data || err.message);
      setError(err?.response?.data?.message || 'Failed to delete order');
    }
  };

  const totalOrders = Array.isArray(orders) ? orders.length : 0;

  const totalOrderedItems = (Array.isArray(orders) ? orders : []).reduce(
    (sum, order) => sum + (order?.items?.length || 0),
    0
  );

  const totalRevenue = (Array.isArray(orders) ? orders : []).reduce(
    (sum, order) => sum + Number(order?.totalAmount || order?.total || 0),
    0
  );

  if (loading) {
    return (
      <div style={{ padding: '24px', color: '#111' }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', color: '#111' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchData}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#ffe5e5',
            color: '#a30000',
            padding: '12px 14px',
            borderRadius: '10px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div style={cardStat}>
          <h3 style={{ marginTop: 0 }}>Menu Days</h3>
          <p style={statNumber}>{Array.isArray(days) ? days.length : 0}</p>
        </div>

        <div style={cardStat}>
          <h3 style={{ marginTop: 0 }}>Orders</h3>
          <p style={statNumber}>{totalOrders}</p>
        </div>

        <div style={cardStat}>
          <h3 style={{ marginTop: 0 }}>Ordered Items</h3>
          <p style={statNumber}>{totalOrderedItems}</p>
        </div>

        <div style={cardStat}>
          <h3 style={{ marginTop: 0 }}>Revenue</h3>
          <p style={statNumber}>{totalRevenue}</p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        <div style={panel}>
          <h2>Create Menu Day</h2>

          <form onSubmit={handleCreateDay}>
            <div style={{ marginBottom: '12px' }}>
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={dayForm.date}
                onChange={handleDayChange}
                required
                style={inputStyle}
              />
            </div>

            <button type="submit" style={primaryBtn}>
              Create Day
            </button>
          </form>
        </div>

        <div style={panel}>
          <h2>Create Menu Item</h2>

          <form onSubmit={handleCreateItem}>
            <div style={{ marginBottom: '12px' }}>
              <label>Day</label>
              <select
                name="dayId"
                value={itemForm.dayId}
                onChange={handleItemChange}
                required
                style={inputStyle}
              >
                <option value="">Select day</option>
                {(Array.isArray(days) ? days : []).map((day) => (
                  <option key={day.id} value={day.id}>
                    {day.date}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={itemForm.name}
                onChange={handleItemChange}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label>Price</label>
              <input
                type="number"
                name="price"
                value={itemForm.price}
                onChange={handleItemChange}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label>Quantity</label>
              <input
                type="number"
                name="quantity"
                value={itemForm.quantity}
                onChange={handleItemChange}
                required
                style={inputStyle}
              />
            </div>

            <button type="submit" style={primaryBtn}>
              Create Item
            </button>
          </form>
        </div>
      </div>

      <div style={{ ...panel, marginBottom: '24px' }}>
        <h2>Menu Days</h2>

        {(Array.isArray(days) ? days : []).length === 0 ? (
          <p>No menu days yet.</p>
        ) : (
          (Array.isArray(days) ? days : []).map((day) => (
            <div
              key={day.id}
              style={{
                padding: '14px',
                border: '1px solid #e5e5e5',
                borderRadius: '12px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <strong>{day.date}</strong>

                <button
                  onClick={() => handleDeleteDay(day.id)}
                  style={dangerBtn}
                >
                  Delete Day
                </button>
              </div>

              <div style={{ marginTop: '8px' }}>
                {(day.items || []).length === 0 ? (
                  <p style={{ margin: 0 }}>No items yet.</p>
                ) : (
                  <ul style={{ margin: '8px 0 0 18px' }}>
                    {(day.items || []).map((item) => (
                      <li key={item.id}>
                        {item.name} - {item.price}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={panel}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ margin: 0 }}>Orders</h2>

          <button onClick={fetchData} style={primaryBtn}>
            Refresh Orders
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <label>Filter by date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label>Filter by customer / username / telegram ID</label>
            <input
              type="text"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              placeholder="Search customer..."
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button onClick={fetchData} style={primaryBtn}>
            Apply Filters
          </button>
        </div>

        {(Array.isArray(orders) ? orders : []).length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          (Array.isArray(orders) ? orders : []).map((order) => (
            <div
              key={order.id}
              style={{
                padding: '14px',
                border: '1px solid #e5e5e5',
                borderRadius: '12px',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div><strong>Order #{order.id}</strong></div>
                  <div>Status: {order.status || 'UNKNOWN'}</div>
                  <div>Customer: {order.customerName || 'Unknown'}</div>
                  <div>Username: {order.telegramUsername || '-'}</div>
                  <div>Telegram ID: {order.telegramId || '-'}</div>
                  <div>Total: {order.totalAmount || order.total || 0}</div>
                  <div>
                    Created:{' '}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : '-'}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  style={dangerBtn}
                >
                  Delete Order
                </button>
              </div>

              <div style={{ marginTop: '8px' }}>
                <strong>Items:</strong>
                {(order.items || []).length === 0 ? (
                  <p style={{ margin: '6px 0 0 0' }}>No items</p>
                ) : (
                  <ul style={{ margin: '8px 0 0 18px' }}>
                    {(order.items || []).map((item) => (
                      <li key={item.id}>
                        {(item.menuItem?.name || item.name || 'Unnamed item')} x{' '}
                        {item.quantity || 0}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const cardStat = {
  padding: '18px',
  borderRadius: '14px',
  background: '#f5f5f5',
};

const statNumber = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: 0,
};

const panel = {
  background: '#fafafa',
  padding: '20px',
  borderRadius: '14px',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginTop: '6px',
  borderRadius: '10px',
  border: '1px solid #ccc',
};

const primaryBtn = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
};

const dangerBtn = {
  background: '#ff4d4f',
  color: '#fff',
  border: 'none',
  padding: '8px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
};