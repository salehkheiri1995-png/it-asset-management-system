import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import AssetsPage from './pages/AssetsPage';
import TicketsPage from './pages/TicketsPage';
import InspectionsPage from './pages/InspectionsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import ReportsPage from './pages/ReportsPage';
import DepartmentsPage from './pages/DepartmentsPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div><p>در حال بارگذاری...</p></div>;
  if (!user) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/employees" element={<PrivateRoute><EmployeesPage /></PrivateRoute>} />
          <Route path="/employees/:id" element={<PrivateRoute><EmployeeProfilePage /></PrivateRoute>} />
          <Route path="/assets" element={<PrivateRoute><AssetsPage /></PrivateRoute>} />
          <Route path="/assignments" element={<PrivateRoute><AssignmentsPage /></PrivateRoute>} />
          <Route path="/inspections" element={<PrivateRoute><InspectionsPage /></PrivateRoute>} />
          <Route path="/tickets" element={<PrivateRoute><TicketsPage /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><DepartmentsPage /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
