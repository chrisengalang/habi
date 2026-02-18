import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import Dashboard from './pages/Dashboard';
import Budgets from './pages/Budgets';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import Login from './pages/Login';
import Register from './pages/Register';
import Checklist from './pages/Checklist';
import ChecklistImport from './pages/ChecklistImport';

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                  <Dashboard selectedMonth={selectedDate} />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/budgets"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                  <Budgets selectedMonth={selectedDate} />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                  <Transactions selectedMonth={selectedDate} />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                  <Categories />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklist"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout selectedDate={selectedDate} setSelectedDate={setSelectedDate}>
                  <Checklist selectedMonth={selectedDate} />
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklist/import/:shareId"
            element={
              <ProtectedRoute>
                <ChecklistImport />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
