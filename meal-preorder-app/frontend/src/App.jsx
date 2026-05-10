import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import CustomerLayout from './layouts/CustomerLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import CartPage from './pages/CartPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';

function RootRedirect() {
  const location = useLocation();

  return (
    <Navigate
      to={{
        pathname: '/web',
        search: location.search,
        hash: location.hash,
      }}
      replace
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/web" element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="orders" element={<OrdersPage />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<div><h2>Page not found</h2></div>} />
    </Routes>
  );
}
