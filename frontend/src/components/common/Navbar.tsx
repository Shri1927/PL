import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          🏦 Personal Loan LOS
        </Link>

        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="hover:text-indigo-200 transition">
                Dashboard
              </Link>
              <Link to="/applications" className="hover:text-indigo-200 transition">
                My Applications
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="hover:text-indigo-200 transition font-semibold">
                  Admin Panel
                </Link>
              )}

              <div className="flex items-center gap-4 pl-6 border-l border-indigo-400">
                <div className="text-right">
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-xs text-indigo-200">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 rounded-lg transition"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-indigo-200 transition">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
