import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { MStripeDivider } from '../../ui/Divider';
import { TabButton, TabUnderline } from '../../ui/Tabs';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'KYC_VERIFIED':
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'CREDIT_ASSESSED':
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'OFFER_GENERATED':
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'OFFER_ACCEPTED':
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'AGREEMENT_EXECUTED':
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'DISBURSED':
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'REJECTED':
        return 'ui-surface-soft text-white/80 border-white/20';
      default:
        return 'ui-surface-soft text-white/80 border-white/20';
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border ui-hairline flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl ui-label-uppercase">Admin Dashboard</h1>
              <p className="ui-text-body text-sm">Manage loan applications and approvals</p>
            </div>
          </div>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Button>
        </div>

        <MStripeDivider className="mb-8" />

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6" tone="card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 border ui-hairline flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs ui-label-uppercase ui-text-muted">Total</span>
            </div>
            <p className="text-xs ui-label-uppercase ui-text-body mb-2">Total Applications</p>
            <p className="text-3xl font-bold">{stats.totalApplications || 0}</p>
          </Card>
          <Card className="p-6" tone="card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 border ui-hairline flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs ui-label-uppercase ui-text-muted">Approved</span>
            </div>
            <p className="text-xs ui-label-uppercase ui-text-body mb-2">Approved</p>
            <p className="text-3xl font-bold">{stats.approvedApplications || 0}</p>
          </Card>
          <Card className="p-6" tone="card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 border ui-hairline flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs ui-label-uppercase ui-text-muted">Rejected</span>
            </div>
            <p className="text-xs ui-label-uppercase ui-text-body mb-2">Rejected</p>
            <p className="text-3xl font-bold">{stats.rejectedApplications || 0}</p>
          </Card>
          <Card className="p-6" tone="card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 border ui-hairline flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs ui-label-uppercase ui-text-muted">Pending</span>
            </div>
            <p className="text-xs ui-label-uppercase ui-text-body mb-2">Pending Review</p>
            <p className="text-3xl font-bold">{stats.pendingApplications || 0}</p>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="p-0 overflow-hidden" tone="card">
          <div className="border-b ui-hairline px-6">
            <div className="flex gap-8">
              <div className="flex flex-col">
                <TabButton
                  onClick={() => {
                    setActiveTab('applications');
                    setPage(0);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>All Applications</span>
                  </span>
                </TabButton>
                {activeTab === 'applications' ? <TabUnderline /> : <div className="h-0.5 w-full bg-transparent" />}
              </div>
              <div className="flex flex-col">
                <TabButton
                  onClick={() => {
                    setActiveTab('underwriter');
                    setPage(0);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Underwriter Queue</span>
                  </span>
                </TabButton>
                {activeTab === 'underwriter' ? <TabUnderline /> : <div className="h-0.5 w-full bg-transparent" />}
              </div>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="border border-white/20 ui-surface-soft px-4 py-3 mb-6">
                <div className="ui-label-uppercase text-xs text-white">Error</div>
                <div className="text-sm ui-text-body-strong">{error}</div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs ui-label-uppercase ui-text-body">Loading data...</p>
              </div>
            ) : (
              <>
                {/* All Applications Tab */}
                {activeTab === 'applications' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b ui-hairline">
                          <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Application</th>
                          <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Applicant</th>
                          <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Amount</th>
                          <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Status</th>
                          <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Created</th>
                          <th className="text-center py-3 px-4 text-xs ui-label-uppercase ui-text-body">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 px-4 text-center ui-text-body">
                              No applications found
                            </td>
                          </tr>
                        ) : (
                          applications.map((app) => (
                            <tr key={app.id} className="border-b ui-hairline hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 text-sm font-mono text-white/90">{app.id.slice(0, 8)}...</td>
                              <td className="py-3 px-4 text-sm ui-text-body">
                                {app.customerDetails?.firstName} {app.customerDetails?.lastName}
                              </td>
                              <td className="py-3 px-4 text-sm text-white/90">
                                ₹{app.loanAmount.toLocaleString()}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1.5 text-xs ui-label-uppercase border ${getStatusColor(app.status)}`}>
                                  {app.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm ui-text-body">
                                {new Date(app.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <Button size="sm" onClick={() => navigate(`/application/${app.id}`)}>
                                  View
                                </Button>
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
                        <tr className="border-b ui-hairline">
                          <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Application</th>
                          <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Applicant</th>
                          <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Amount</th>
                          <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Risk Grade</th>
                          <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">DTI Ratio</th>
                          <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Status</th>
                          <th className="text-center py-3 px-4 text-xs ui-label-uppercase ui-text-body">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {underwriterQueue.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 px-4 text-center ui-text-body">
                              No applications in queue
                            </td>
                          </tr>
                        ) : (
                          underwriterQueue.map((app) => (
                            <tr key={app.id} className="border-b ui-hairline hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 text-sm font-mono text-white/90">{app.id.slice(0, 8)}...</td>
                              <td className="py-3 px-4 text-sm ui-text-body">
                                {app.customerDetails?.firstName} {app.customerDetails?.lastName}
                              </td>
                              <td className="py-3 px-4 text-sm text-white/90">
                                ₹{app.loanAmount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-3 py-1 text-xs ui-label-uppercase border ui-surface-soft text-white/80 border-white/20">
                                  {app.creditAssessment?.riskGrade || 'N/A'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-white/90">
                                {app.creditAssessment?.dtiRatio?.toFixed(2) || 'N/A'}%
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1.5 text-xs ui-label-uppercase border ${getStatusColor(app.status)}`}>
                                  {app.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className="flex gap-2 justify-center">
                                  <Button size="sm" onClick={() => navigate(`/application/${app.id}`)}>
                                    View
                                  </Button>
                                  <Button size="sm" onClick={() => handleApproval(app.id)}>
                                    Approve
                                  </Button>
                                  <Button size="sm" onClick={() => handleRejection(app.id)}>
                                    Reject
                                  </Button>
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
                <div className="flex justify-between items-center mt-6 pt-4 border-t ui-hairline">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-2 px-4 h-10 border ui-hairline ui-button-uppercase text-xs text-white/80 hover:text-white hover:border-white disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Previous</span>
                  </button>
                  <p className="text-xs ui-label-uppercase ui-text-body">
                    Page {page + 1} of {totalPages}
                  </p>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page === totalPages - 1}
                    className="flex items-center gap-2 px-4 h-10 border ui-hairline ui-button-uppercase text-xs text-white/80 hover:text-white hover:border-white disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
