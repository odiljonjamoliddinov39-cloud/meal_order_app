import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [days, setDays] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const headers = useMemo(() => {
    return {
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [daysRes, ordersRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/admin/menu/days`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/orders`, { headers }),
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
    navigate('/admin/login');
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
  e.preventDefault(); // 🔥 THIS IS CRITICAL

  try {
    const token = localStorage.getItem('adminToken');

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const payload = {
      dayId: Number(itemForm.dayId),
      name: itemForm.name,
      price: Number(itemForm.price),
      quantity: Number(itemForm.quantity),
    };

    console.log('CREATE ITEM PAYLOAD:', payload);

    await axios.post(
      `${import.meta.env.VITE_API_URL}/admin/menu/items`,
      payload,
      { headers }
    );

    // reset form
    setItemForm({
      dayId: '',
      name: '',
      price: '',
      quantity: '',
    });

    // reload data
    await fetchData();
  } catch (err) {
    console.error('CREATE ITEM ERROR:', err?.response?.data || err.message);
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
    <div style={{ padding: '24px', color: '#111' }}>
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
        <div
          style={{
            padding: '18px',
            borderRadius: '14px',
            background: '#f5f5f5',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Menu Days</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: 0 }}>
            {Array.isArray(days) ? days.length : 0}
          </p>
        </div>

        <div
          style={{
            padding: '18px',
            borderRadius: '14px',
            background: '#f5f5f5',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Orders</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: 0 }}>
            {totalOrders}
          </p>
        </div>

        <div
          style={{
            padding: '18px',
            borderRadius: '14px',
            background: '#f5f5f5',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Ordered Items</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: 0 }}>
            {totalOrderedItems}
          </p>
        </div>

        <div
          style={{
            padding: '18px',
            borderRadius: '14px',
            background: '#f5f5f5',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Revenue</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: 0 }}>
            {totalRevenue}
          </p>
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
        <div
          style={{
            background: '#fafafa',
            padding: '20px',
            borderRadius: '14px',
          }}
        >
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
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '6px',
                  borderRadius: '10px',
                  border: '1px solid #ccc',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              Create Day
            </button>
          </form>
        </div>

        <div
          style={{
            background: '#fafafa',
            padding: '20px',
            borderRadius: '14px',
          }}
        >
          <h2>Create Menu Item</h2>

          <form onSubmit={handleCreateItem}>
            <div style={{ marginBottom: '12px' }}>
              <label>Day</label>
              <select
                name="dayId"
                value={itemForm.dayId}
                onChange={handleItemChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '6px',
                  borderRadius: '10px',
                  border: '1px solid #ccc',
                }}
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
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '6px',
                  borderRadius: '10px',
                  border: '1px solid #ccc',
                }}
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
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '6px',
                  borderRadius: '10px',
                  border: '1px solid #ccc',
                }}
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
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '6px',
                  borderRadius: '10px',
                  border: '1px solid #ccc',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              Create Item
            </button>
          </form>
        </div>
      </div>

      <div
        style={{
          background: '#fafafa',
          padding: '20px',
          borderRadius: '14px',
          marginBottom: '24px',
        }}
      >
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
              <strong>{day.date}</strong>

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

      <div
        style={{
          background: '#fafafa',
          padding: '20px',
          borderRadius: '14px',
        }}
      >
        <h2>Orders</h2>

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
              <div><strong>Order #{order.id}</strong></div>
              <div>Status: {order.status || 'UNKNOWN'}</div>
              <div>Customer: {order.customerName || 'Unknown'}</div>
              <div>Total: {order.totalAmount || order.total || 0}</div>
              <div>
                Created:{' '}
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString()
                  : '-'}
              </div>

              <div style={{ marginTop: '8px' }}>
                <strong>Items:</strong>
                {(order.items || []).length === 0 ? (
                  <p style={{ margin: '6px 0 0 0' }}>No items</p>
                ) : (
                  <ul style={{ margin: '8px 0 0 18px' }}>
                    {(order.items || []).map((item) => (
                      <li key={item.id}>
                        {item.menuItem?.name || item.name || 'Unnamed item'} x{' '}
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