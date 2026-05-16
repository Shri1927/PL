import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, CheckCircle2, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import type { StageStatus, WorkflowStage } from '../../context/WorkflowContext';

interface StageCardProps {
  stage: WorkflowStage;
  isActive: boolean;
  onClick: () => void;
}

const StageCard: React.FC<StageCardProps> = ({ stage, isActive, onClick }) => {
  const getStyles = (status: StageStatus) => {
    switch (status) {
      case 'approved': return {
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/5',
        icon: <CheckCircle2 className="text-emerald-400" size={24} />,
        badge: 'Approved',
        badgeColor: 'text-emerald-400 bg-emerald-400/10',
        lock: <Unlock size={14} className="text-emerald-400/60" />
      };
      case 'rejected': return {
        border: 'border-rose-500/30',
        bg: 'bg-rose-500/5',
        icon: <AlertCircle className="text-rose-400" size={24} />,
        badge: 'Rejected',
        badgeColor: 'text-rose-400 bg-rose-400/10',
        lock: <Lock size={14} className="text-rose-400/60" />
      };
      case 'pending': return {
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/5',
        icon: <Clock className="text-amber-400 animate-pulse" size={24} />,
        badge: 'Pending Review',
        badgeColor: 'text-amber-400 bg-amber-400/10',
        lock: <Unlock size={14} className="text-amber-400/60" />
      };
      default: return {
        border: 'border-white/5',
        bg: 'bg-[#1e1e24]',
        icon: <Lock className="text-gray-600" size={24} />,
        badge: 'Locked',
        badgeColor: 'text-gray-600 bg-white/5',
        lock: <Lock size={14} className="text-gray-700" />
      };
    }
  };

  const styles = getStyles(stage.status);

  return (
    <motion.div
      whileHover={stage.status !== 'locked' ? { x: 5 } : {}}
      onClick={stage.status !== 'locked' ? onClick : undefined}
      className={`relative p-8 rounded-[40px] border transition-all duration-300 ${styles.border} ${styles.bg} ${
        stage.status === 'locked' ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'
      } ${isActive ? 'ring-2 ring-indigo-500/50 shadow-[0_20px_50px_rgba(79,70,229,0.15)]' : ''}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#16161a] rounded-2xl shadow-inner">
            {styles.icon}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Stage {stage.id}</p>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">{stage.name}</h3>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${styles.badgeColor}`}>
          {styles.badge}
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/5">
        <div className="flex items-center gap-2">
          {styles.lock}
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            {stage.status === 'locked' ? 'Access Restricted' : 'Access Granted'}
          </span>
        </div>
        {stage.status !== 'locked' && (
          <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
        )}
      </div>

      {stage.status === 'rejected' && stage.rejectionReason && (
        <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Reason for Rejection</p>
          <p className="text-sm font-medium text-rose-200">{stage.rejectionReason}</p>
        </div>
      )}
    </motion.div>
  );
};

export default StageCard;
