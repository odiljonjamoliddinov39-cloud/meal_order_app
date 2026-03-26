import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboardPage() {
  const [days, setDays] = useState([]);
  const [orders, setOrders] = useState([]);

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
    const [d, o] = await Promise.all([
      axios.get(`${API}/admin/menu/days`),
      axios.get(`${API}/admin/orders`),
    ]);

    setDays(d.data || []);
    setOrders(o.data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===== CREATE =====

  const createDay = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/admin/menu/days`, dayForm);
    setDayForm({ date: '' });
    fetchData();
  };

  const createItem = async (e) => {
    e.preventDefault();

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
  };

  // ===== DELETE =====

  const deleteDay = async (id) => {
    await axios.delete(`${API}/admin/menu/days/${id}`);
    fetchData();
  };

  const deleteOrder = async (id) => {
    await axios.delete(`${API}/admin/orders/${id}`);
    fetchData();
  };

  return (
    <div style={{ padding: 20 }}>

      <h1>Admin</h1>

      <button onClick={fetchData}>Refresh</button>

      {/* CREATE DAY */}
      <h2>Create Day</h2>
      <form onSubmit={createDay}>
        <input
          type="date"
          value={dayForm.date}
          onChange={(e) => setDayForm({ date: e.target.value })}
        />
        <button>Create</button>
      </form>

      {/* CREATE ITEM */}
      <h2>Create Item</h2>
      <form onSubmit={createItem}>
        <select
          value={itemForm.dayId}
          onChange={(e) =>
            setItemForm({ ...itemForm, dayId: e.target.value })
          }
        >
          <option value="">Select day</option>
          {days.map((d) => (
            <option key={d.id} value={d.id}>
              {d.date}
            </option>
          ))}
        </select>

        <input
          placeholder="Name"
          value={itemForm.name}
          onChange={(e) =>
            setItemForm({ ...itemForm, name: e.target.value })
          }
        />

        <input
          placeholder="Price"
          type="number"
          value={itemForm.price}
          onChange={(e) =>
            setItemForm({ ...itemForm, price: e.target.value })
          }
        />

        <input
          placeholder="Qty"
          type="number"
          value={itemForm.quantity}
          onChange={(e) =>
            setItemForm({ ...itemForm, quantity: e.target.value })
          }
        />

        <select
          value={itemForm.type}
          onChange={(e) =>
            setItemForm({ ...itemForm, type: e.target.value })
          }
        >
          <option value="meal">Meal</option>
          <option value="coffee">Coffee</option>
          <option value="drink">Drink</option>
          <option value="dessert">Dessert</option>
        </select>

        <button>Create</button>
      </form>

      {/* MENU */}
      <h2>Menu Days</h2>
      {days.map((day) => (
        <div key={day.id} style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}>
          <strong>{day.date}</strong>
          <button onClick={() => deleteDay(day.id)}>Delete</button>

          {day.items.map((item) => (
            <div key={item.id}>
              {item.name} ({item.type}) - {item.price}
            </div>
          ))}
        </div>
      ))}

      {/* ORDERS */}
      <h2>Orders</h2>
      {orders.map((o) => (
        <div key={o.id} style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}>

          <strong>Order #{o.id}</strong>

          {o.items.map((i) => (
            <div key={i.id}>
              {i.name} x{i.quantity}
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{o.customerName}</span>
            <span>{o.totalAmount}</span>
            <span>
              {new Date(o.createdAt).toLocaleTimeString()}
            </span>
          </div>

          <button onClick={() => deleteOrder(o.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
