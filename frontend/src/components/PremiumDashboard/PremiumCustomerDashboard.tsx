import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Eye, Compass, ShoppingBag, 
  CheckCircle, XCircle, RotateCcw, MessageSquare, 
  Clock, ArrowRight, BarChart2, Plus, FileText, 
  DollarSign, TrendingUp, LayoutDashboard 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../PremiumDashboard/Sidebar';
import RightPanel from '../PremiumDashboard/RightPanel';
import StatCard from '../PremiumDashboard/StatCard';
import AnalyticsWidget from '../PremiumDashboard/AnalyticsWidget';

const PremiumCustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<'home' | 'applications'>('home');
  const [stats, setStats] = useState<any>({});
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsResponse = await api.get('/workflow/applications/stats');
      setStats(statsResponse.data);

      const applicationsResponse = await api.get('/workflow/applications?page=0&size=50');
      setApplications(applicationsResponse.data.content || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return '#34d399';
      case 'REJECTED': return '#f472b6';
      case 'DISBURSED': return '#3b82f6';
      default: return '#fbbf24';
    }
  };

  return (
    <div className="flex bg-[#0f0f12] min-h-screen font-['Inter',sans-serif] text-gray-300 overflow-hidden">
      <Sidebar activeView={view === 'home' ? 'home' : 'queue'} onViewChange={(v) => setView(v === 'home' ? 'home' : 'applications')} />

      <main className="flex-1 p-10 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-12 relative">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#1e1e24] rounded-xl shadow-lg">
                <Search size={20} className="text-gray-500" />
              </div>
              <input 
                type="text" 
                placeholder="Search applications..." 
                className="bg-transparent border-none outline-none text-gray-400 font-medium w-64"
              />
            </div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-black text-white mb-1"
            >
              {view === 'home' ? `Hello, ${user?.name?.split(' ')[0]}` : 'My Applications'}
            </motion.h1>
            <p className="text-gray-500 font-medium">
              {view === 'home' ? 'Welcome to your premium lending portal' : `Tracking ${applications.length} loan requests`}
            </p>
          </div>

          <div className="flex gap-4 self-end">
            <button 
              onClick={() => navigate('/apply')}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:bg-indigo-700 transition-all"
            >
              <Plus size={18} />
              <span>New Application</span>
            </button>
          </div>


        </header>

        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard 
                  label="Total Applied" 
                  value={stats.totalApplications || 0} 
                  subtitle="Applications to date" 
                  icon={<FileText size={24} />} 
                  progress={100} 
                  color="#818cf8"
                />
                <StatCard 
                  label="In Progress" 
                  value={stats.inProgressApplications || 0} 
                  subtitle="Awaiting processing" 
                  icon={<Clock size={24} />} 
                  progress={65} 
                  color="#fbbf24"
                />
                <StatCard 
                  label="Disbursed" 
                  value={`₹${(stats.disbursedAmount || 0).toLocaleString()}`} 
                  subtitle="Total loan capital" 
                  icon={<DollarSign size={24} />} 
                  progress={80} 
                  color="#34d399"
                />
              </div>

              {/* Quick Navigation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setView('applications')}
                  className="p-8 bg-[#1e1e24] rounded-[40px] border border-white/5 shadow-xl cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <LayoutDashboard size={24} />
                    </div>
                    <ArrowRight className="text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Track Applications</h3>
                  <p className="text-gray-500 text-sm">Check the real-time status of your active loan requests and required actions.</p>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate('/apply')}
                  className="p-8 bg-[#1e1e24] rounded-[40px] border border-white/5 shadow-xl cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <Plus size={24} />
                    </div>
                    <ArrowRight className="text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Apply for Loan</h3>
                  <p className="text-gray-500 text-sm">Start a new personal loan application with our seamless digital process.</p>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="applications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {applications.length === 0 ? (
                <div className="bg-[#1e1e24] rounded-[32px] p-16 text-center border border-dashed border-gray-800">
                  <FileText size={48} className="mx-auto text-gray-700 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Applications Found</h3>
                  <p className="text-gray-500">You haven't started any loan applications yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {applications.map((app) => (
                    <motion.div
                      key={app.id}
                      whileHover={{ x: 5 }}
                      onClick={() => {
                        if (app.status === 'DRAFT') {
                          navigate(`/apply?id=${app.id}`);
                        } else {
                          navigate(`/application/${app.id}`);
                        }
                      }}
                      className="bg-[#1e1e24] p-6 rounded-[32px] shadow-lg border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                          <div className="p-4 bg-[#2a2a32] rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
                            <ShoppingBag size={24} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              {app.loanPurpose || 'Personal Loan'}
                            </h3>
                            <div className="flex gap-3 mt-1">
                              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <Clock size={12} /> ID: #{String(app.id).slice(-6)}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                ₹{(app.requestedAmount || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Status</p>
                            <span 
                              className="text-xs font-black uppercase tracking-tighter"
                              style={{ color: getStatusColor(app.status) }}
                            >
                              {app.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="p-3 bg-[#2a2a32] rounded-xl text-gray-400 group-hover:text-white transition-all">
                            <ArrowRight size={20} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <RightPanel applications={applications} />
    </div>
  );
};

export default PremiumCustomerDashboard;
