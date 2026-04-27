import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, Plus, Filter, ChevronLeft, ChevronRight, FileText, Search } from 'lucide-react';

const LoanList = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchApplications();
  }, [page, filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const status = filter === 'ALL' ? '' : filter;
      const response = await api.get('/workflow/applications', {
        params: {
          page,
          size: 10,
          status: status || undefined,
        },
      });
      setApplications(response.data.content || []);
      setTotalPages(response.data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'KYC_VERIFIED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DOCS_COMPLETE':
        return 'bg-teal-100 text-teal-700 border-teal-200';
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
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (error && !applications.length) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="card-modern p-6">
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/apply')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">New Application</span>
          </button>
        </div>

        <div className="card-modern p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-violet-500/30">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">My Loan Applications</h1>
                <p className="text-gray-500 text-sm">Track and manage your loan applications</p>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Filter by Status</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'DRAFT', 'KYC_VERIFIED', 'DOCS_COMPLETE', 'APPROVED', 'ACCEPTED', 'DISBURSED'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setPage(0);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    filter === status
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                <FileText className="w-10 h-10 text-violet-400" />
              </div>
              <p className="text-gray-600 mb-6 text-lg">No applications found</p>
              <button
                onClick={() => navigate('/apply')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Application</span>
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Application ID</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Tenure</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Purpose</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Created Date</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-b border-gray-100 hover:bg-violet-50/50 transition-colors">
                        <td className="py-4 px-4 text-sm font-mono text-gray-800 font-semibold">#{String(app.id).slice(-6)}</td>
                        <td className="py-4 px-4 text-sm text-gray-800 font-semibold">₹{(app.requestedAmount || 0).toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{app.tenureMonths} months</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{app.loanPurpose}</td>
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
                    ))}
                  </tbody>
                </table>
              </div>

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
  );
};

export default LoanList;
