import { Navigate } from 'react-router-dom';

export default function AdminProtectedRoute({ children }) {
  return children || null;
}