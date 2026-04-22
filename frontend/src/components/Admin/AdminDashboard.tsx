import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

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
        return 'bg-gray-100 text-gray-800';
      case 'KYC_VERIFIED':
        return 'bg-blue-100 text-blue-800';
      case 'CREDIT_ASSESSED':
        return 'bg-purple-100 text-purple-800';
      case 'OFFER_GENERATED':
        return 'bg-orange-100 text-orange-800';
      case 'OFFER_ACCEPTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'AGREEMENT_EXECUTED':
        return 'bg-cyan-100 text-cyan-800';
      case 'DISBURSED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Home
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 font-semibold">Total Applications</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalApplications || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <p className="text-sm text-gray-600 font-semibold">Approved</p>
            <p className="text-3xl font-bold text-green-600">{stats.approvedApplications || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-600">
            <p className="text-sm text-gray-600 font-semibold">Rejected</p>
            <p className="text-3xl font-bold text-red-600">{stats.rejectedApplications || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
            <p className="text-sm text-gray-600 font-semibold">Pending Review</p>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingApplications || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="flex gap-4 border-b px-6">
            <button
              onClick={() => {
                setActiveTab('applications');
                setPage(0);
              }}
              className={`px-6 py-4 font-semibold ${
                activeTab === 'applications'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All Applications
            </button>
            <button
              onClick={() => {
                setActiveTab('underwriter');
                setPage(0);
              }}
              className={`px-6 py-4 font-semibold ${
                activeTab === 'underwriter'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Underwriter Queue
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading data...</p>
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
                              <td className="py-3 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                                  {app.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {new Date(app.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => navigate(`/application/${app.id}`)}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
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
                              <td className="py-3 px-4 text-sm text-gray-800">
                                {app.creditAssessment?.dtiRatio?.toFixed(2) || 'N/A'}%
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.status)}`}>
                                  {app.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => navigate(`/application/${app.id}`)}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleApproval(app.id)}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejection(app.id)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
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
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-800 rounded-lg"
                  >
                    Previous
                  </button>
                  <p className="text-gray-600">
                    Page {page + 1} of {totalPages}
                  </p>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page === totalPages - 1}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-800 rounded-lg"
                  >
                    Next
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
