import { Outlet, Link } from 'react-router-dom';
import { useState } from 'react';

export default function CustomerLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const customerName = 'Demo User';

  return (
    <div>
      <div className="topbar">
        <button className="icon-btn" onClick={() => setMenuOpen((v) => !v)}>
          ☰ Menu
        </button>
        <div className="topbar-right">
          <span className="account-pill">{customerName}</span>
        </div>
      </div>

      {menuOpen ? (
        <div className="customer-menu">
          <Link to="/web">Home</Link>
          <Link to="/web/cart">Cart</Link>
          <Link to="/web/orders">My Orders</Link>
        </div>
      ) : null}

      <Outlet />
    </div>
  );
}
