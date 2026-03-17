import { Outlet, Link } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div>
      <div className="topbar">
        <Link to="/admin/login">Admin Login</Link>
        <Link to="/admin/dashboard">Dashboard</Link>
      </div>
      <Outlet />
    </div>
  );
}
