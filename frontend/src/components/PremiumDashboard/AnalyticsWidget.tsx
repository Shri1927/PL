import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AnalyticsWidgetProps {
  label: string;
  value: string | number;
  subtitle: string;
  progress: number;
  trend: 'up' | 'down';
  color: string;
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ label, value, subtitle, progress, trend, color }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-[#1e1e24] p-6 rounded-[32px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_10px_20px_rgba(0,0,0,0.4)] flex justify-between items-center group"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-white text-lg font-bold">{label}</p>
          {trend === 'up' ? (
            <TrendingUp size={14} className="text-emerald-400" />
          ) : (
            <TrendingDown size={14} className="text-rose-400" />
          )}
        </div>
        <p className="text-gray-500 text-xs mb-3">{subtitle}</p>
        <h3 className="text-2xl font-black text-white">{value}</h3>
      </div>

      <div className="relative w-20 h-20">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="34"
            stroke="#2a2a32"
            strokeWidth="8"
            fill="transparent"
            className="shadow-inner"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="34"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={213.6}
            initial={{ strokeDashoffset: 213.6 }}
            animate={{ strokeDashoffset: 213.6 - (213.6 * progress) / 100 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
          {progress}%
        </div>
      </div>
    </motion.div>
  );
};

export default AnalyticsWidget;
