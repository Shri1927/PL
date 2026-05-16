import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Briefcase, CreditCard, Users, BarChart2, Settings, Menu, LogOut, Phone, Mail, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  activeView: 'home' | 'analytics' | 'queue';
  onViewChange: (view: 'home' | 'analytics' | 'queue') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: Home, label: 'Home', action: () => onViewChange('home'), active: activeView === 'home' },
    { icon: Briefcase, label: 'Queue', action: () => onViewChange('queue'), active: activeView === 'queue' },
    { icon: BarChart2, label: 'Analytics', action: () => onViewChange('analytics'), active: activeView === 'analytics' },
    { icon: Settings, label: 'Settings', action: () => navigate('/settings'), active: false },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-[#16161a] h-screen flex flex-col p-6 border-r border-gray-800/50">
      <div className="flex items-center gap-3 mb-12 px-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="p-2 bg-indigo-600 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)]">
          <Menu className="text-white" size={20} />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">FintechLOS</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ x: 5 }}
            onClick={item.action}
            className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 ${
              item.active 
                ? 'bg-[#1e1e24] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_10px_rgba(0,0,0,0.3)]' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
            }`}
          >
            <item.icon size={20} className={item.active ? 'text-indigo-400' : ''} />
            <span className="font-medium">{item.label}</span>
            {item.active && (
              <motion.div 
                layoutId="activeTab"
                className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"
              />
            )}
          </motion.div>
        ))}
      </nav>

      {/* Staff Basic Info - Only visible when Home is active */}
      <AnimatePresence>
        {activeView === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-8 p-4 bg-[#1e1e24] rounded-3xl border border-white/5 shadow-xl"
          >
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 px-1">Staff Profile</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2a2a32] rounded-xl text-indigo-400">
                  <UserIcon size={14} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Full Name</p>
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2a2a32] rounded-xl text-emerald-400">
                  <Shield size={14} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Employee ID</p>
                  <p className="text-xs font-bold text-white truncate">{user?.customerId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2a2a32] rounded-xl text-violet-400">
                  <Phone size={14} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Mobile</p>
                  <p className="text-xs font-bold text-white truncate">{user?.mobile}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2a2a32] rounded-xl text-amber-400">
                  <Mail size={14} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Official Email</p>
                  <p className="text-xs font-bold text-white truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto space-y-4">
        <motion.div
          whileHover={{ x: 5 }}
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all duration-300"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </motion.div>

        <div className="pt-6 border-t border-gray-800/50 flex items-center gap-4 px-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold border-2 border-[#1e1e24]">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#16161a]" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate">{user?.role || 'Guest'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
