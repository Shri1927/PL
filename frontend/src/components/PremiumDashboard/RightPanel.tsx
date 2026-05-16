import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, User, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface RightPanelProps {
  applications: any[];
}

const RightPanel: React.FC<RightPanelProps> = ({ applications }) => {
  const statusCounts = applications.reduce((acc: any, app) => {
    const status = app.status || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: 'Submitted', value: statusCounts['SUBMITTED'] || 0, icon: FileText, color: '#818cf8' },
    { label: 'Approved', value: statusCounts['APPROVED'] || 0, icon: CheckCircle, color: '#34d399' },
    { label: 'Under Review', value: statusCounts['UNDER_REVIEW'] || 0, icon: Clock, color: '#fbbf24' },
    { label: 'Rejected', value: statusCounts['REJECTED'] || 0, icon: AlertCircle, color: '#f472b6' },
  ];

  const chartData = [40, 60, 30, 80, 50, 40];

  return (
    <div className="w-80 bg-[#16161a] h-screen flex flex-col p-8 border-l border-gray-800/50">
      <div className="flex justify-end gap-4 mb-12">
        <button className="p-2 bg-[#1e1e24] rounded-full text-gray-400 hover:text-white transition-colors shadow-lg">
          <Settings size={20} />
        </button>
        <button className="p-2 bg-[#1e1e24] rounded-full text-gray-400 hover:text-white transition-colors shadow-lg">
          <Bell size={20} />
        </button>
        <button className="p-2 bg-[#1e1e24] rounded-full text-gray-400 hover:text-white transition-colors shadow-lg">
          <User size={20} />
        </button>
      </div>

      <div className="mb-10">
        <h3 className="text-xl font-bold text-white mb-6">Application Status</h3>
        <div className="space-y-6">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-4 group cursor-pointer">
              <div className="p-3 bg-[#1e1e24] rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-6">Queue Volume</h3>
        <div className="bg-[#1e1e24] p-6 rounded-[32px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] h-48 flex items-end justify-between gap-2">
          {chartData.map((height, index) => (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
              className="w-full bg-gradient-to-t from-indigo-600/20 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(129,140,248,0.3)]"
            />
          ))}
        </div>
        <div className="flex justify-between mt-4 px-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <span key={i} className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">{day}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
