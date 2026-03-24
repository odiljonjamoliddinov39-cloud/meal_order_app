import { Outlet, Link } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Link to="/web">Go to app</Link>
      </div>
      <Outlet />
    </div>
  );
}