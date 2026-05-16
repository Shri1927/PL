import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, MessageSquare, ShieldCheck, AlertCircle } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import type { WorkflowStage } from '../../context/WorkflowContext';

interface MakerApprovalPanelProps {
  applicationId: string;
  stage: WorkflowStage;
}

const MakerApprovalPanel: React.FC<MakerApprovalPanelProps> = ({ applicationId, stage }) => {
  const { approveStage, rejectStage, loading } = useWorkflow();
  const [comment, setComment] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async () => {
    try {
      await approveStage(applicationId, stage.id, comment);
      setComment('');
    } catch (err) {
      // Error handled by context
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) return;
    try {
      await rejectStage(applicationId, stage.id, rejectionReason, comment);
      setShowRejectForm(false);
      setRejectionReason('');
    } catch (err) {
      // Error handled by context
    }
  };

  if (stage.status === 'approved') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[32px] flex items-center gap-6">
        <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h4 className="text-lg font-black text-white uppercase tracking-tight">Approved by Maker</h4>
          <p className="text-emerald-400/60 text-sm font-medium">Stage authorized successfully at {stage.approvedAt ? new Date(stage.approvedAt).toLocaleString() : 'N/A'}</p>
          {stage.makerComment && <p className="mt-2 text-emerald-200/60 text-xs italic">"{stage.makerComment}"</p>}
        </div>
      </div>
    );
  }

  if (stage.status === 'rejected') {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[32px] flex items-center gap-6">
        <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400">
          <AlertCircle size={28} />
        </div>
        <div>
          <h4 className="text-lg font-black text-white uppercase tracking-tight">Rejected by Maker</h4>
          <p className="text-rose-400/60 text-sm font-medium">Stage rejection reason: {stage.rejectionReason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1e1e24] border border-white/5 p-8 rounded-[40px] shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
          <ShieldCheck size={20} />
        </div>
        <h4 className="text-xl font-black text-white uppercase tracking-tight">Maker Approval Panel</h4>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">Internal Maker Comment</label>
          <div className="relative">
            <MessageSquare className="absolute left-5 top-5 text-gray-600" size={18} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-[#16161a] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white font-medium focus:outline-none focus:border-indigo-500 transition-all min-h-[120px]"
              placeholder="Add internal notes for this approval stage..."
            />
          </div>
        </div>

        <AnimatePresence>
          {showRejectForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">Rejection Reason (Required)</label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-[#16161a] border border-rose-500/20 rounded-xl py-4 px-5 text-white focus:outline-none focus:border-rose-500"
                  placeholder="e.g. Document mismatch, Low credit score..."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {!showRejectForm ? (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApprove}
                disabled={loading}
                className="py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 transition-all disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
                Approve Stage
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowRejectForm(true)}
                className="py-5 bg-transparent border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                <X size={18} />
                Reject Stage
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReject}
                disabled={loading || !rejectionReason}
                className="py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(244,63,94,0.3)] flex items-center justify-center gap-3 transition-all disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <AlertCircle size={18} />}
                Confirm Rejection
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowRejectForm(false)}
                className="py-5 bg-transparent text-gray-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                Cancel
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MakerApprovalPanel;
