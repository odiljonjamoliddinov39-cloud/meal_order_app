import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@example.com', password: '12345678' });
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/admin/auth/login`, form);
      localStorage.setItem('admin_token', response.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="page narrow">
      <h1>Admin login</h1>
      <form className="panel stack" onSubmit={handleSubmit}>
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit">Login</button>
        {error ? <div className="error">{error}</div> : null}
      </form>
    </div>
  );
}
