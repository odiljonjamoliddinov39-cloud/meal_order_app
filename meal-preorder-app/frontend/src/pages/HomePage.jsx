import { useEffect, useState } from 'react';
import api from '../api/client.js';
import MealCard from '../components/MealCard.jsx';

export default function HomePage() {
  const [days, setDays] = useState([]);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/menu/days').then((res) => {
      setDays(res.data);
      if (res.data.length) setSelectedDayId(res.data[0].id);
    }).catch((err) => {
      console.error(err);
      setMessage('Could not load menu days.');
    });
  }, []);

  const selectedDay = days.find((day) => day.id === selectedDayId);

  function addToCart(item) {
    setCart((current) => {
      const existing = current.find((c) => c.menuItemId === item.id);
      if (existing) {
        return current.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...current, { menuItemId: item.id, quantity: 1, name: item.name, price: item.price }];
    });
    setMessage(`${item.name} added to cart.`);
  }

  async function submitOrder() {
    try {
      if (!selectedDay) return;
      if (!cart.length) {
        setMessage('Cart is empty. Add items first.');
        return;
      }

      const payload = {
        menuDayId: selectedDay.id,
        items: cart.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity }))
      };

      await api.post('/orders', payload);
      setMessage('Order placed successfully!');
      setCart([]);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Failed to place order.');
    }
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="page customer-page">
      <div className="customer-header">
        <div>
          <p className="caption">Oqtepa lavash</p>
          <div className="title-row">
            <h1>Meal pre-order</h1>
            <span className="badge-pill">Delivery 25-35 min</span>
          </div>
          <div className="meta-row">
            <span>⭐ 4.5 (1824)</span>
            <span>🕒 25-35 minutes</span>
            <span>🚶 0-4499 so'm</span>
          </div>
        </div>
        <button className="web-btn">Translate</button>
      </div>

      <div className="offers-row">
        <div className="offer-pill">-27000 so'm on multiple dishes</div>
        <div className="offer-pill">-13000 so'm on any order</div>
      </div>

      <section className="section-heading">
        <div>
          <h2>Offers</h2>
          <p>There are limits on the number of items</p>
        </div>
        <button className="link-btn">View all</button>
      </section>

      <div className="date-tabs">
        {days.map((day) => (
          <button
            key={day.id}
            className={day.id === selectedDayId ? 'active' : ''}
            onClick={() => setSelectedDayId(day.id)}
          >
            {new Date(day.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </button>
        ))}
      </div>

      <div className="meal-grid">
        {selectedDay?.items?.map((item) => (
          <MealCard key={item.id} item={item} onAdd={addToCart} />
        ))}
        {!selectedDay?.items?.length && <div className="empty-box">No meals planned yet.</div>}
      </div>

      <div className="cart-panel">
        <div className="cart-heading">
          <div>
            <h3>Cart</h3>
            <p>{cart.length} item(s)</p>
          </div>
          <strong>{total.toLocaleString()} so'm</strong>
        </div>
        <div className="stack">
          {cart.map((item) => (
            <div key={item.menuItemId} className="list-row">
              <span>{item.name} x {item.quantity}</span>
              <strong>{Number(item.price * item.quantity).toLocaleString()} so'm</strong>
            </div>
          ))}
          {!cart.length && <div>No cart items yet.</div>}
        </div>
        <button onClick={submitOrder} disabled={!cart.length}>Place preorder</button>
      </div>

      {message && <div className="message">{message}</div>}
    </div>
  );
}
