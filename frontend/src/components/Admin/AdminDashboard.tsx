import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, Users, CheckCircle, XCircle, Clock, FileText, TrendingUp, ChevronLeft, ChevronRight, Shield } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'applications' | 'underwriter'>('applications');
  const [applications, setApplications] = useState<any[]>([]);
  const [underwriterQueue, setUnderwriterQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    fetchDashboardData();
  }, [page, activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'applications') {
        const response = await api.get('/admin/applications', {
          params: {
            page,
            size: 10,
          },
        });
        setApplications(response.data.content);
        setTotalPages(response.data.totalPages);
      } else {
        const response = await api.get('/underwriter/manual-queue', {
          params: {
            page,
            size: 10,
          },
        });
        setUnderwriterQueue(response.data.content);
        setTotalPages(response.data.totalPages);
      }

      // Fetch stats
      const statsResponse = await api.get('/admin/stats');
      setStats(statsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (applicationId: string) => {
    try {
      await api.post(`/admin/applications/${applicationId}/approve`);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleRejection = async (applicationId: string) => {
    try {
      const reason = prompt('Enter rejection reason:');
      if (reason) {
        await api.post(`/admin/applications/${applicationId}/reject`, {
          rejectionReason: reason,
        });
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Rejection failed');
    }
  };

  const handleManualReview = async (applicationId: string) => {
    try {
      await api.post(`/underwriter/applications/${applicationId}/review`);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Review submission failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'KYC_VERIFIED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CREDIT_ASSESSED':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'OFFER_GENERATED':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'OFFER_ACCEPTED':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'AGREEMENT_EXECUTED':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'DISBURSED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Admin Dashboard</h1>
              <p className="text-gray-500 text-sm">Manage loan applications and approvals</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-modern p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Total</span>
            </div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Total Applications</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalApplications || 0}</p>
          </div>
          <div className="card-modern p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Approved</span>
            </div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Approved</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.approvedApplications || 0}</p>
          </div>
          <div className="card-modern p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">Rejected</span>
            </div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Rejected</p>
            <p className="text-3xl font-bold text-red-600">{stats.rejectedApplications || 0}</p>
          </div>
          <div className="card-modern p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">Pending</span>
            </div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Pending Review</p>
            <p className="text-3xl font-bold text-amber-600">{stats.pendingApplications || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="card-modern overflow-hidden">
          <div className="flex gap-2 border-b border-gray-200 px-6">
            <button
              onClick={() => {
                setActiveTab('applications');
                setPage(0);
              }}
              className={`px-6 py-4 font-semibold rounded-t-xl transition-all ${
                activeTab === 'applications'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>All Applications</span>
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab('underwriter');
                setPage(0);
              }}
              className={`px-6 py-4 font-semibold rounded-t-xl transition-all ${
                activeTab === 'underwriter'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Underwriter Queue</span>
              </span>
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {loading ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading data...</p>
              </div>
            ) : (
              <>
                {/* All Applications Tab */}
                {activeTab === 'applications' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Application ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Applicant Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Created Date</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 px-4 text-center text-gray-600">
                              No applications found
                            </td>
                          </tr>
                        ) : (
                          applications.map((app) => (
                            <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm font-mono text-gray-800">{app.id.slice(0, 8)}...</td>
                              <td className="py-3 px-4 text-sm text-gray-800">
                                {app.customerDetails?.firstName} {app.customerDetails?.lastName}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-800">
                                ₹{app.loanAmount.toLocaleString()}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(app.status)}`}>
                                  {app.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">
                                {new Date(app.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <button
                                  onClick={() => navigate(`/application/${app.id}`)}
                                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm font-semibold shadow-md shadow-violet-500/30 hover:shadow-lg hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Underwriter Queue Tab */}
                {activeTab === 'underwriter' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Application ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Applicant Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Risk Grade</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">DTI Ratio</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {underwriterQueue.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 px-4 text-center text-gray-600">
                              No applications in queue
                            </td>
                          </tr>
                        ) : (
                          underwriterQueue.map((app) => (
                            <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm font-mono text-gray-800">{app.id.slice(0, 8)}...</td>
                              <td className="py-3 px-4 text-sm text-gray-800">
                                {app.customerDetails?.firstName} {app.customerDetails?.lastName}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-800">
                                ₹{app.loanAmount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                  {app.creditAssessment?.riskGrade || 'N/A'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-800">
                                {app.creditAssessment?.dtiRatio?.toFixed(2) || 'N/A'}%
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(app.status)}`}>
                                  {app.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => navigate(`/application/${app.id}`)}
                                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-sm font-semibold shadow-md shadow-violet-500/30 hover:shadow-lg hover:shadow-violet-500/40 transition-all hover:-translate-y-0.5"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleApproval(app.id)}
                                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejection(app.id)}
                                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40 transition-all hover:-translate-y-0.5"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-xl transition-all font-semibold"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Previous</span>
                  </button>
                  <p className="text-gray-600 font-medium">
                    Page {page + 1} of {totalPages}
                  </p>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page === totalPages - 1}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-xl transition-all font-semibold"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
