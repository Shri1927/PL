import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Settings, LogOut, User, LayoutDashboard, BarChart2 } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show global navbar on paths that use the premium sidebar
  if (['/analytics', '/maker', '/checker'].includes(location.pathname)) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0f0f12] border-b border-gray-800/50 backdrop-blur-md">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              <span className="text-xs font-bold text-white">PL</span>
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-bold text-white tracking-tight">FintechLOS</div>
              <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Lending Portal</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    location.pathname === '/dashboard' ? 'bg-[#1e1e24] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                  }`}
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      location.pathname === '/admin' ? 'bg-[#1e1e24] text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                    }`}
                  >
                    <Settings size={18} />
                    <span>Admin</span>
                  </Link>
                )}
                {(user?.role === 'LOAN_OFFICER' || user?.role === 'RM') && (
                  <Link
                    to="/maker"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800/30 transition-all"
                  >
                    <BarChart2 size={18} />
                    <span>Staff Portal</span>
                  </Link>
                )}

                {/* User Profile & Logout */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#1e1e24] rounded-xl flex items-center justify-center text-white font-bold border border-gray-800 shadow-inner">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-bold text-white leading-none mb-1">{user?.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider leading-none">{user?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 font-bold text-sm hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 text-gray-400 font-bold text-sm hover:text-white transition-all"
                >
                  <User size={18} />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#1e1e24] text-gray-400 hover:text-white border border-gray-800 transition-all"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800/50 bg-[#0f0f12]">
          <div className="px-4 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800/30 transition-all"
                >
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800/30 transition-all"
                  >
                    <Settings size={20} />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <div className="border-t border-gray-800/50 pt-4 mt-4">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 bg-[#1e1e24] rounded-xl flex items-center justify-center text-white font-bold border border-gray-800 shadow-inner">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-1">{user?.name}</p>
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{user?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-rose-500/10 text-rose-400 rounded-xl font-bold text-sm hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800/30 transition-all"
                >
                  <User size={20} />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                  <span>Get Started</span>
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
