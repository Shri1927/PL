import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Loan Components
import Dashboard from './components/common/Dashboard';
import LoanApplicationForm from './components/Loan/LoanApplicationForm';
import LoanList from './components/Loan/LoanList';
import ApplicationStatus from './components/Loan/ApplicationStatus';
import EMISchedule from './components/Loan/EMISchedule';
import LoanDashboard from './components/Loan/LoanDashboard';

// Admin Components
import AdminDashboard from './components/Admin/AdminDashboard';

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <Navbar />
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes - Customer */}
        <Route
          path="/loan-dashboard/:applicationId"
          element={
            <ProtectedRoute>
              <LoanDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apply"
          element={
            <ProtectedRoute>
              <LoanApplicationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <LoanList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/application/:applicationId/:stageIndex?"
          element={
            <ProtectedRoute>
              <ApplicationStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emi-schedule/:applicationId"
          element={
            <ProtectedRoute>
              <EMISchedule />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;
