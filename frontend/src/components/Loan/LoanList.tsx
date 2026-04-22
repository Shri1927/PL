import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

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
        return 'bg-gray-100 text-gray-800';
      case 'KYC_VERIFIED':
        return 'bg-blue-100 text-blue-800';
      case 'DOCS_COMPLETE':
        return 'bg-teal-100 text-teal-800';
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error && !applications.length) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            ← Back to Dashboard
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={() => navigate('/apply')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + New Application
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">My Loan Applications</h1>

          {/* Filter */}
          <div className="mb-6">
            <div className="flex gap-2">
              {['ALL', 'DRAFT', 'KYC_VERIFIED', 'DOCS_COMPLETE', 'APPROVED', 'ACCEPTED', 'DISBURSED'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setPage(0);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No applications found</p>
              <button
                onClick={() => navigate('/apply')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Your First Application
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Application ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenure</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Purpose</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Created Date</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-mono text-gray-800">{String(app.id)}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">
                          ₹{(app.requestedAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-800">{app.tenureMonths} months</td>
                        <td className="py-3 px-4 text-sm text-gray-800">{app.loanPurpose}</td>
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
                    ))}
                  </tbody>
                </table>
              </div>

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
  );
};

export default LoanList;
