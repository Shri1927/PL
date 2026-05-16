import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  progress: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtitle, icon, progress, color }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-[#1e1e24] p-6 rounded-[32px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_10px_20px_rgba(0,0,0,0.4)] relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-[#2a2a32] rounded-2xl text-gray-400 group-hover:text-white transition-colors shadow-inner">
          {icon}
        </div>
        <div className="relative w-12 h-12">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-gray-800"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              stroke={color}
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={125.6}
              initial={{ strokeDashoffset: 125.6 }}
              animate={{ strokeDashoffset: 125.6 - (125.6 * progress) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-400">
            {progress}%
          </div>
        </div>
      </div>
      
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{label}</p>
        <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
        <p className="text-gray-500 text-xs">{subtitle}</p>
      </div>
      
      {/* Subtle glow effect */}
      <div 
        className="absolute -bottom-10 -right-10 w-24 h-24 blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity"
        style={{ backgroundColor: color }}
      />
    </motion.div>
  );
};

export default StatCard;
