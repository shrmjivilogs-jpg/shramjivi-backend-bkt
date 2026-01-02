import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Setup from './pages/Setup';
import RegisterWorker from './pages/RegisterWorker';
import GenerateForms from './pages/GenerateForms';

// Protects routes that require a logged-in session
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const token = localStorage.getItem('token');

  return (
    <Routes>
      {/* 1. Root Redirection: Direct Login or Dashboard */}
      <Route 
        path="/" 
        element={
          !token ? <Navigate to="/login" replace /> : <Navigate to="/dashboard" replace />
        } 
      />

      {/* 2. Authentication Route */}
      <Route path="/login" element={<Login />} />
      
      {/* 3. Setup Page (Sirf manually access karne ke liye) */}
      <Route path="/setup" element={<Setup />} />

      {/* 4. Protected Routes - Yahan koi redirection logic change nahi kiya */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/register-worker"
        element={
          <PrivateRoute>
            <RegisterWorker />
          </PrivateRoute>
        }
      />

      <Route
        path="/generate"
        element={
          <PrivateRoute>
            <GenerateForms />
          </PrivateRoute>
        }
      />

      {/* 5. Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}