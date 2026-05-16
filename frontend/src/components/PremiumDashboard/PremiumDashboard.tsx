import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Eye, Compass, ShoppingBag, CheckCircle, XCircle, RotateCcw, MessageSquare, Clock, ArrowRight, BarChart2, ShieldCheck } from 'lucide-react';
import api from '../../api';
import { workflowApi } from '../../workflowApi';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import StatCard from './StatCard';
import AnalyticsWidget from './AnalyticsWidget';
import ApplicationDetailModal from './ApplicationDetailModal';

const PremiumDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [view, setView] = useState<'home' | 'analytics' | 'queue'>(
    location.pathname === '/analytics' ? 'analytics' : 'home'
  );
  const [applications, setApplications] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingApp, setViewingApp] = useState<any | null>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [actioningTask, setActioningTask] = useState<any | null>(null);
  const [remarks, setRemarks] = useState('');

  const getStageName = (stage: number) => {
    switch(stage) {
      case 1: return "Application Initiated";
      case 2: return "Pending Maker Review";
      case 3: return "Maker Approved";
      case 4: return "KYC Verified";
      case 5: return "Documents Verified";
      case 6: return "Credit Approved";
      case 7: return "Offer Accepted";
      case 8: return "Agreement Signed";
      case 9: return "Funds Disbursed";
      case 10: return "Loan Active";
      default: return `Stage ${stage}`;
    }
  };

  useEffect(() => {
    if (view === 'analytics') {
      fetchSubmittedApplications();
    } else {
      fetchQueue();
    }
  }, [view]);

  const fetchSubmittedApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/submitted-applications');
      const responseData = response.data.data || response.data;
      let allApps = Array.isArray(responseData) ? responseData : [];
      setApplications(normalizeApps(allApps));
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const isMaker = ['LOAN_OFFICER', 'RM', 'CREDIT_ANALYST', 'UNDERWRITER'].includes(user?.role || '');
      const response = isMaker ? await workflowApi.getMakerQueue() : await workflowApi.getCheckerQueue();
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeApps = (apps: any[]) => {
    return apps.map(app => {
      const normalizedApp: any = {};
      Object.keys(app).forEach(key => {
        normalizedApp[key.toLowerCase()] = app[key];
      });
      return normalizedApp;
    });
  };

  const fetchApplicationDetails = async (loanId: number) => {
    try {
      setFetchingDetail(true);
      const response = await api.get(`/workflow/applications/${loanId}/details`);
      const data = response.data.data;
      
      const flatApp = {
        ...data.application,
        kyc_status: data.kyc?.status,
        pan: data.kyc?.pan,
        aadhaar_token: data.kyc?.aadhaarToken,
        pan_verified: data.kyc?.panVerified,
        aadhaar_verified: data.kyc?.aadhaarVerified,
        ckyc_found: data.kyc?.ckycFound,
        fraud_flag: data.kyc?.fraudFlag,
        aml_flag: data.kyc?.amlFlag,
        bureau_score: data.credit?.bureauScore,
        internal_score: data.credit?.internalScore,
        risk_grade: data.credit?.riskGrade,
        stp_eligible: data.credit?.stpEligible,
        final_decision: data.credit?.finalDecision,
        decision_reason: data.credit?.decisionReason,
        documents: data.documents,
        agreement: data.agreement,
        document_count: data.documents?.length || 0,
        verified_document_count: data.documents?.filter((d: any) => d.verificationStatus === 'VERIFIED').length || 0,
        customer_name: data.application.fullName || data.application.customer_name,
        customer_email: data.application.email || data.application.customer_email,
        customer_mobile: data.application.mobile || data.application.customer_mobile,
      };
      setViewingApp(flatApp);
    } catch (error) {
      console.error('Error fetching application details', error);
      alert('Failed to load application details');
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleApproveStage = async (loanId: number, currentStage: number) => {
    try {
      setLoading(true);
      const nextStage = currentStage + 1;
      await api.post(`/maker-checker/loans/${loanId}/update-permission?allowedStage=${nextStage}`);
      alert(`Authorized successfully! Next stage: ${getStageName(nextStage)}`);
      fetchQueue();
      setActioningTask(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to authorize stage');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject' | 'return') => {
    if (!actioningTask) return;
    
    if ((action === 'reject' || action === 'return') && remarks.length < 10) {
      alert('Please provide detailed remarks (min 10 characters)');
      return;
    }

    try {
      const taskId = actioningTask.id;
      const loanId = actioningTask.applicationId || actioningTask.id;
      const isMakerAction = !actioningTask.applicationId;

      if (isMakerAction) {
        // Maker actions on LoanApplication
        if (action === 'approve') {
          // Default maker "approval" is recommending to a checker
          // For simplicity, we'll try to find a default checker or ask for one
          // But based on user request, let's just use the recommend endpoint
          // Note: This might need a checkerId, we'll use a placeholder or handle it
          const checkersRes = await api.get('/maker-checker/checkers?role=BRANCH_MANAGER');
          const checkerId = checkersRes.data.data?.[0]?.id;
          if (!checkerId) throw new Error('No available checkers found');
          
          await api.post(`/maker-checker/loans/${loanId}/recommend`, { 
            checkerId, 
            remarks: remarks || 'Recommended from premium dashboard' 
          });
        } else {
          // Maker can't really "reject" in the same way, but let's just skip for now or use a generic action
          alert('This action is currently only available for Checkers');
          return;
        }
      } else {
        // Checker actions on ApprovalTask
        if (action === 'approve') {
          await workflowApi.approveTask(loanId, taskId);
        } else if (action === 'reject') {
          await workflowApi.rejectTask(loanId, taskId, remarks);
        } else {
          await workflowApi.returnTask(loanId, taskId, remarks);
        }
      }
      
      setRemarks('');
      setActioningTask(null);
      fetchQueue();
      alert(`Application ${action === 'approve' && isMakerAction ? 'recommended' : action + 'd'} successfully`);
    } catch (error: any) {
      alert(error.response?.data?.message || error.message || 'Action failed');
    }
  };

  const calculateStats = () => {
    const totalAmount = applications.reduce((sum, app) => sum + (app.requested_amount || 0), 0);
    const approvedCount = applications.filter(app => app.status === 'APPROVED').length;
    const pendingCount = applications.filter(app => app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW').length;
    
    return {
      totalCount: applications.length,
      totalAmount: (totalAmount / 100000).toFixed(1) + 'L',
      approvedCount,
      pendingCount,
      revenue: '₹' + (totalAmount * 0.02 / 1000).toFixed(1) + 'k'
    };
  };

  const stats = calculateStats();

  return (
    <div className="flex bg-[#0f0f12] min-h-screen font-['Inter',sans-serif] text-gray-300 overflow-hidden">
      <Sidebar activeView={view} onViewChange={setView} />

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
                placeholder={view === 'analytics' ? "Search for stats" : "Search for applications"} 
                className="bg-transparent border-none outline-none text-gray-400 font-medium w-64"
              />
            </div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-black text-white mb-1"
            >
              {view === 'analytics' ? 'Lending Analytics' : 'Application Queue'}
            </motion.h1>
            <p className="text-gray-500 font-medium">
              {view === 'analytics' ? 'Real-time portfolio overview' : `Managing ${tasks.length} pending tasks`}
            </p>
          </div>

          <div className="flex gap-4 self-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1e1e24] rounded-2xl text-gray-400 font-bold text-sm shadow-lg hover:text-white transition-colors">
              <span>Filters</span>
              <Filter size={16} />
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
              <div className="bg-[#1e1e24] p-10 rounded-[48px] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                      {user?.name?.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white">Welcome back, {user?.name?.split(' ')[0]}!</h2>
                      <p className="text-gray-500 font-medium">{user?.role} — Internal Staff Portal</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                    <div className="p-6 bg-[#2a2a32] rounded-[32px] border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Employee ID</p>
                      <p className="text-lg font-bold text-white">{user?.customerId}</p>
                    </div>
                    <div className="p-6 bg-[#2a2a32] rounded-[32px] border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Access Level</p>
                      <p className="text-lg font-bold text-emerald-400">AUTHORIZED</p>
                    </div>
                    <div className="p-6 bg-[#2a2a32] rounded-[32px] border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Queue Load</p>
                      <p className="text-lg font-bold text-violet-400">{tasks.length} Pending</p>
                    </div>
                    <div className="p-6 bg-[#2a2a32] rounded-[32px] border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Portfolio View</p>
                      <p className="text-lg font-bold text-amber-400">Full Access</p>
                    </div>
                  </div>
                </div>

                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 blur-[100px] rounded-full" />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setView('queue')}
                  className="p-8 bg-[#1e1e24] rounded-[40px] border border-white/5 shadow-xl cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <MessageSquare size={24} />
                    </div>
                    <ArrowRight className="text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Process Queue</h3>
                  <p className="text-gray-500 text-sm">Review and approve pending loan applications assigned to your role.</p>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setView('analytics')}
                  className="p-8 bg-[#1e1e24] rounded-[40px] border border-white/5 shadow-xl cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                      <BarChart2 size={24} />
                    </div>
                    <ArrowRight className="text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Portfolio Insights</h3>
                  <p className="text-gray-500 text-sm">View high-level analytics and performance metrics for the lending portfolio.</p>
                </motion.div>
              </div>
            </motion.div>
          ) : view === 'analytics' ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard label="Total Applications" value={stats.totalCount} subtitle="Active queue" icon={<Eye size={24} />} progress={65} color="#818cf8" />
                <StatCard label="Portfolio Value" value={stats.totalAmount} subtitle="Requested amount" icon={<Compass size={24} />} progress={45} color="#f472b6" />
                <StatCard label="Est. Revenue" value={stats.revenue} subtitle="From fees" icon={<ShoppingBag size={24} />} progress={80} color="#fbbf24" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AnalyticsWidget label="Approved Loans" value={stats.approvedCount} subtitle="Ready for disbursement" progress={55} trend="up" color="#34d399" />
                <AnalyticsWidget label="Pending Review" value={stats.pendingCount} subtitle="Awaiting action" progress={30} trend="down" color="#a855f7" />
                <AnalyticsWidget label="Risk Index" value="3.2" subtitle="Portfolio health" progress={80} trend="up" color="#3b82f6" />
                <AnalyticsWidget label="DTI Avg" value="32%" subtitle="Borrower debt level" progress={70} trend="up" color="#2dd4bf" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {tasks.length === 0 ? (
                <div className="bg-[#1e1e24] rounded-[32px] p-16 text-center border border-dashed border-gray-800">
                  <CheckCircle size={48} className="mx-auto text-gray-700 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Queue is Empty</h3>
                  <p className="text-gray-500">All tasks have been processed for your role.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layoutId={`task-${task.id}`}
                      className="bg-[#1e1e24] p-6 rounded-[32px] shadow-lg border border-white/5 hover:border-indigo-500/30 transition-all group"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex gap-4 items-center">
                          <div className="p-4 bg-[#2a2a32] rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
                            <MessageSquare size={24} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              Application #{task.applicationId || task.id}
                            </h3>
                            <div className="flex gap-3 mt-1">
                              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <Clock size={12} /> {task.tier}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                {task.assignedRole || (task.status ? task.status : 'PENDING')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <button 
                            onClick={() => fetchApplicationDetails(task.applicationId || task.id)}
                            className="p-3 bg-[#2a2a32] rounded-xl text-gray-400 hover:text-white hover:bg-indigo-600 transition-all"
                          >
                            <Eye size={20} />
                          </button>
                          <button 
                            onClick={() => setActioningTask(task)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                          >
                            Take Action
                          </button>
                        </div>
                      </div>

                      {actioningTask?.id === task.id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-6 pt-6 border-t border-gray-800"
                        >
                          {(task.allowedStage || task.allowed_stage || 1) < 10 ? (
                            <div className="space-y-4">
                              <div className="bg-indigo-600/10 border border-indigo-600/20 p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-2">
                                  <ShieldCheck size={20} className="text-indigo-400" />
                                  <h4 className="text-white font-bold">Stage Authorization Required</h4>
                                </div>
                                <p className="text-sm text-gray-400">
                                  This application is currently at <span className="text-indigo-400 font-bold">Stage {task.allowedStage || task.allowed_stage || 1}: {getStageName(task.allowedStage || task.allowed_stage || 1)}</span>. 
                                  Please verify the submitted data before authorizing the next stage.
                                </p>
                              </div>
                              
                              <div className="flex gap-3">
                                <button 
                                  onClick={() => handleApproveStage(task.applicationId || task.id, task.allowedStage || task.allowed_stage || 1)}
                                  disabled={loading}
                                  className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"
                                >
                                  {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <ShieldCheck size={18} />
                                  )}
                                  Authorize Next: {getStageName((task.allowedStage || task.allowed_stage || 1) + 1)}
                                </button>
                                <button 
                                  onClick={() => setActioningTask(null)}
                                  className="px-6 py-4 text-gray-500 font-bold hover:text-white transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <textarea
                                className="w-full bg-[#16161a] border border-gray-800 rounded-2xl p-4 text-sm text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                                placeholder="Enter remarks for your decision..."
                                rows={3}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                              />
                              <div className="flex gap-3">
                                {/* Actions for both applications and tasks */}
                                <button 
                                  onClick={() => handleAction('approve')}
                                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all"
                                >
                                  <CheckCircle size={18} /> Approve
                                </button>
                                <button 
                                  onClick={() => handleAction('reject')}
                                  className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all"
                                >
                                  <XCircle size={18} /> Reject
                                </button>
                                <button 
                                  onClick={() => handleAction('return')}
                                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all"
                                >
                                  <RotateCcw size={18} /> Return
                                </button>
                                <button 
                                  onClick={() => setActioningTask(null)}
                                  className="px-6 py-3 text-gray-500 font-bold hover:text-white transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <RightPanel applications={applications} />

      {viewingApp && (
        <ApplicationDetailModal 
          application={viewingApp} 
          onClose={() => setViewingApp(null)} 
          onRefresh={() => fetchApplicationDetails(viewingApp.id)}
        />
      )}
    </div>
  );
};

export default PremiumDashboard;
