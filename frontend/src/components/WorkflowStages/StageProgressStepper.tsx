import React from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import type { WorkflowStage } from '../../context/WorkflowContext';

const StageProgressStepper: React.FC = () => {
  const { stages } = useWorkflow();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check size={14} className="text-emerald-400" />;
      case 'rejected': return <AlertCircle size={14} className="text-rose-400" />;
      case 'pending': return <Clock size={14} className="text-amber-400 animate-pulse" />;
      default: return <Lock size={12} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/20 border-emerald-500/50';
      case 'rejected': return 'bg-rose-500/20 border-rose-500/50';
      case 'pending': return 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
      default: return 'bg-[#16161a] border-white/5';
    }
  };

  return (
    <div className="flex items-center justify-between w-full px-4 py-8 bg-[#1a1a2e]/50 backdrop-blur-xl rounded-[40px] border border-white/5 mb-10 overflow-x-auto scrollbar-hide">
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <div className="flex flex-col items-center flex-1 min-w-[120px]">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300 ${getStatusColor(stage.status)}`}
            >
              {getStatusIcon(stage.status)}
            </motion.div>
            <p className={`mt-3 text-[10px] font-black uppercase tracking-widest text-center whitespace-nowrap ${
              stage.status === 'pending' ? 'text-white' : 'text-gray-500'
            }`}>
              {stage.name}
            </p>
          </div>
          
          {index < stages.length - 1 && (
            <div className="w-full h-px max-w-[40px] bg-white/5 mx-2" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StageProgressStepper;
