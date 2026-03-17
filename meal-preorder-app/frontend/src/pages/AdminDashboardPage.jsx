import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboardPage() {
  const [days, setDays] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [dayForm, setDayForm] = useState({ date: '', orderDeadline: '' });
  const [itemForm, setItemForm] = useState({ menuDayId: '', name: '', price: 0, plannedQuantity: 1 });

  const token = localStorage.getItem('admin_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [daysRes, ordersRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/admin/menu/days`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/orders`, { headers })
      ]);
      setDays(daysRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error(err);
      setMessage('Could not load admin dashboard data.');
    }
  }

  async function createMenuDay(e) {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/admin/menu/days`, dayForm, { headers });
      setMessage('Menu day created');
      setDayForm({ date: '', orderDeadline: '' });
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating day');
    }
  }

  async function createMenuItem(e) {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/admin/menu/items`, itemForm, { headers });
      setMessage('Item created');
      setItemForm({ ...itemForm, name: '', price: 0, plannedQuantity: 1 });
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating item');
    }
  }

  return (
    <div className="page admin-page">
      <h1>Admin Portal</h1>
      <p className="muted">Create menu days and items, review orders.</p>

      <div className="stats-grid">
        <div className="panel"><strong>{days.length}</strong><div className="muted">Menu days</div></div>
        <div className="panel"><strong>{orders.length}</strong><div className="muted">Orders</div></div>
      </div>

      <div className="panel admin-segment">
        <h2>Create menu day</h2>
        <form className="stack" onSubmit={createMenuDay}>
          <input type="date" value={dayForm.date} onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })} required />
          <input type="datetime-local" value={dayForm.orderDeadline} onChange={(e) => setDayForm({ ...dayForm, orderDeadline: e.target.value })} required />
          <button type="submit">Create day</button>
        </form>
      </div>

      <div className="panel admin-segment">
        <h2>Create menu item</h2>
        <form className="stack" onSubmit={createMenuItem}>
          <select value={itemForm.menuDayId} onChange={(e) => setItemForm({ ...itemForm, menuDayId: e.target.value })} required>
            <option value="">Choose day</option>
            {days.map((day) => <option key={day.id} value={day.id}>{new Date(day.date).toLocaleDateString()}</option>)}
          </select>
          <input placeholder="Name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required />
          <input placeholder="Price" type="number" value={itemForm.price} min="1" onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })} required />
          <input placeholder="Planned quantity" type="number" value={itemForm.plannedQuantity} min="1" onChange={(e) => setItemForm({ ...itemForm, plannedQuantity: Number(e.target.value) })} required />
          <button type="submit">Create item</button>
        </form>
      </div>

      <div className="panel admin-segment">
        <h2>Recent orders</h2>
        {orders.map((order) => (
          <div key={order.id} className="list-row">
            <div>
              <strong>#{order.id.slice(-6)}</strong> {new Date(order.createdAt).toLocaleString()}
              <div className="muted">{order.user?.fullName || 'Unknown customer'}</div>
            </div>
            <strong>{Number(order.totalAmount).toLocaleString()} so'm</strong>
          </div>
        ))}
        {!orders.length && <div>No orders yet.</div>}
      </div>

      {message && <div className="message">{message}</div>}
    </div>
  );
}
