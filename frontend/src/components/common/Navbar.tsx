import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { Menu, X, Settings, LogOut, User, LayoutDashboard, Moon, Sun, Landmark } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 glass-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gradient">LoanHub</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Personal Loan LOS</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-all duration-300"
                >
                  <LayoutDashboard size={18} />
                  <span className="font-medium">Dashboard</span>
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-all duration-300"
                  >
                    <Settings size={18} />
                    <span className="font-medium">Admin</span>
                  </Link>
                )}
                {(user?.role === 'LOAN_OFFICER' || user?.role === 'RM') && (
                  <Link
                    to="/maker"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-all duration-300"
                  >
                    <LayoutDashboard size={18} />
                    <span className="font-medium">Maker Queue</span>
                  </Link>
                )}
                {['BRANCH_MANAGER', 'REGIONAL_CREDIT_MGR', 'ZONAL_HEAD', 'CREDIT_COMMITTEE', 'BOD'].includes(user?.role || '') && (
                  <Link
                    to="/checker"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-all duration-300"
                  >
                    <LayoutDashboard size={18} />
                    <span className="font-medium">Checker Queue</span>
                  </Link>
                )}

                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-all duration-300"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                  <span className="font-medium hidden lg:inline">{darkMode ? 'Light' : 'Dark'}</span>
                </button>

                {/* User Profile & Logout */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-semibold shadow-md">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <LogOut size={18} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-all duration-300"
                >
                  <User size={18} />
                  <span className="font-medium">Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span className="font-medium">Get Started</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-violet-50 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} className="text-gray-600" /> : <Menu size={24} className="text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-lg">
          <div className="px-4 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-all duration-300"
                >
                  <LayoutDashboard size={20} />
                  <span className="font-medium">Dashboard</span>
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-all duration-300"
                  >
                    <Settings size={20} />
                    <span className="font-medium">Admin Panel</span>
                  </Link>
                )}

                {/* Dark Mode Toggle - Mobile */}
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-all duration-300"
                >
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold shadow-md">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-violet-50 hover:text-violet-600 transition-all duration-300"
                >
                  <User size={20} />
                  <span className="font-medium">Login</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300"
                >
                  <span className="font-medium">Get Started</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
