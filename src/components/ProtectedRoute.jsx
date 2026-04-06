import React from 'react';
import { Outlet } from 'react-router-dom';

export default function ProtectedRoute({ component: Component }) {
  return Component ? <Component /> : <Outlet />;
}
