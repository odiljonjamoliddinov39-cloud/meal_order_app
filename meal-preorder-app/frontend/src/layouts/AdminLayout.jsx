import { Outlet, Link, Navigate, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <Link to="/web">Go to app</Link>
        <button
          type="button"
          onClick={logout}
          style={{
            border: 'none',
            background: '#ff7b81',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Logout
        </button>
      </div>

      <Outlet />
    </div>
  );
}
