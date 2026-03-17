import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders/me').then((res) => setOrders(res.data)).catch(console.error);
  }, []);

  return (
    <div className="page">
      <h1>My orders</h1>
      <div className="stack">
        {orders.map((order) => (
          <div className="panel" key={order.id}>
            <strong>Order #{order.id.slice(-6)}</strong>
            <div className="muted">{new Date(order.createdAt).toLocaleString()}</div>
            <div>Status: {order.status}</div>
            <div>Total: {Number(order.totalAmount).toLocaleString()} so'm</div>
          </div>
        ))}
        {!orders.length && <div className="empty-box">No orders yet.</div>}
      </div>
    </div>
  );
}
