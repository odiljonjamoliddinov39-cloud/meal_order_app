import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import CartPage from './pages/CartPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/web" element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="orders" element={<OrdersPage />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="login" element={<AdminLoginPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/web" />} />
      <Route path="*" element={<div className="page"><h2>Page not found</h2></div>} />
    </Routes>
  );
}

