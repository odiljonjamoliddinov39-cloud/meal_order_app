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

  return (
    <div className="page">
      <h1>Customer Meal Preorder</h1>
      <p className="muted">Your Telegram account is auto-associated for this session.</p>

      <div className="date-tabs">
        {days.map((day) => (
          <button
            key={day.id}
            className={day.id === selectedDayId ? 'active' : ''}
            onClick={() => setSelectedDayId(day.id)}
          >
            {new Date(day.date).toLocaleDateString()}
          </button>
        ))}
      </div>

      <div className="meal-list">
        {selectedDay?.items?.map((item) => (
          <MealCard key={item.id} item={item} onAdd={addToCart} />
        ))}
        {!selectedDay?.items?.length && <div className="empty-box">No meals planned yet.</div>}
      </div>

      <div className="panel">
        <h2>Cart</h2>
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
