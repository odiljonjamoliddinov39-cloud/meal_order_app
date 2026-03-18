import { Outlet, Link } from 'react-router-dom';

export default function AdminLayout() {
  const token = localStorage.getItem('admin_token');
  return (
    <div>
      <div className="topbar">
        {!token && <Link to="/admin/login">Admin Login</Link>}
        {token && <Link to="/admin/dashboard">Dashboard</Link>}
      </div>
      <Outlet />
    </div>
  );
}
