import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboardPage() {
  const [days, setDays] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Overview, 2: Create Day, 3: Create Items, 4: View Orders
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
      setMessage('Menu day created successfully!');
      setDayForm({ date: '', orderDeadline: '' });
      fetchData();
      setTimeout(() => setCurrentStep(3), 1500); // Move to create items step
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating day');
    }
  }

  async function createMenuItem(e) {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/admin/menu/items`, itemForm, { headers });
      setMessage('Menu item created successfully!');
      setItemForm({ ...itemForm, name: '', price: 0, plannedQuantity: 1 });
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating item');
    }
  }

  const steps = [
    { id: 1, title: 'Overview', description: 'View dashboard statistics' },
    { id: 2, title: 'Create Menu Day', description: 'Set up a new day for orders' },
    { id: 3, title: 'Add Menu Items', description: 'Add meals for the selected day' },
    { id: 4, title: 'View Orders', description: 'Review customer orders' }
  ];

  return (
    <div className="page admin-page">
      <h1>Admin Portal</h1>
      <p className="muted">Manage your meal ordering system step by step.</p>

      {/* Step Navigation */}
      <div className="step-nav">
        {steps.map((step) => (
          <button
            key={step.id}
            className={`step-btn ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
            onClick={() => setCurrentStep(step.id)}
          >
            <div className="step-number">{step.id}</div>
            <div className="step-info">
              <div className="step-title">{step.title}</div>
              <div className="step-desc">{step.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="step-content">
        {currentStep === 1 && (
          <div className="panel">
            <h2>Dashboard Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <strong>{days.length}</strong>
                <div className="muted">Menu days created</div>
              </div>
              <div className="stat-card">
                <strong>{days.reduce((total, day) => total + day.items.length, 0)}</strong>
                <div className="muted">Menu items available</div>
              </div>
              <div className="stat-card">
                <strong>{orders.length}</strong>
                <div className="muted">Total orders</div>
              </div>
              <div className="stat-card">
                <strong>{orders.reduce((total, order) => total + Number(order.totalAmount), 0).toLocaleString()} so'm</strong>
                <div className="muted">Total revenue</div>
              </div>
            </div>
            <div className="action-buttons">
              <button className="btn-primary" onClick={() => setCurrentStep(2)}>
                Create New Menu Day →
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="panel">
            <h2>Create Menu Day</h2>
            <p className="muted">Set up a new day for customers to place orders.</p>
            <form className="stack" onSubmit={createMenuDay}>
              <div className="form-group">
                <label>Select Date</label>
                <input
                  type="date"
                  value={dayForm.date}
                  onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Order Deadline</label>
                <input
                  type="datetime-local"
                  value={dayForm.orderDeadline}
                  onChange={(e) => setDayForm({ ...dayForm, orderDeadline: e.target.value })}
                  required
                />
              </div>
              <div className="action-buttons">
                <button type="button" className="btn-secondary" onClick={() => setCurrentStep(1)}>← Back</button>
                <button type="submit" className="btn-primary">Create Day</button>
              </div>
            </form>
          </div>
        )}

        {currentStep === 3 && (
          <div className="panel">
            <h2>Add Menu Items</h2>
            <p className="muted">Add meals and drinks for customers to order.</p>

            {days.length === 0 ? (
              <div className="empty-state">
                <p>No menu days available. Create a menu day first.</p>
                <button className="btn-primary" onClick={() => setCurrentStep(2)}>Create Menu Day</button>
              </div>
            ) : (
              <form className="stack" onSubmit={createMenuItem}>
                <div className="form-group">
                  <label>Select Menu Day</label>
                  <select
                    value={itemForm.menuDayId}
                    onChange={(e) => setItemForm({ ...itemForm, menuDayId: e.target.value })}
                    required
                  >
                    <option value="">Choose day</option>
                    {days.map((day) => (
                      <option key={day.id} value={day.id}>
                        {new Date(day.date).toLocaleDateString()} ({day.items.length} items)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Item Name</label>
                  <input
                    placeholder="e.g., Grilled Chicken Salad"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (so'm)</label>
                    <input
                      type="number"
                      value={itemForm.price}
                      min="1"
                      onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity Available</label>
                    <input
                      type="number"
                      value={itemForm.plannedQuantity}
                      min="1"
                      onChange={(e) => setItemForm({ ...itemForm, plannedQuantity: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="action-buttons">
                  <button type="button" className="btn-secondary" onClick={() => setCurrentStep(2)}>← Back</button>
                  <button type="submit" className="btn-primary">Add Item</button>
                  <button type="button" className="btn-outline" onClick={() => setCurrentStep(4)}>View Orders →</button>
                </div>
              </form>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="panel">
            <h2>Recent Orders</h2>
            <p className="muted">Monitor customer orders and revenue.</p>

            {orders.length === 0 ? (
              <div className="empty-state">
                <p>No orders yet. Orders will appear here once customers start placing them.</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <strong>#{order.id.slice(-6)}</strong>
                      <span className="order-status">{order.status}</span>
                    </div>
                    <div className="order-details">
                      <div>{order.user?.fullName || 'Unknown customer'}</div>
                      <div className="muted">{new Date(order.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="order-amount">
                      <strong>{Number(order.totalAmount).toLocaleString()} so'm</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="action-buttons">
              <button type="button" className="btn-secondary" onClick={() => setCurrentStep(3)}>← Back to Items</button>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
