import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsResponse = await api.get('/workflow/applications/stats');
      setStats(statsResponse.data);

      const applicationsResponse = await api.get('/workflow/applications?page=0&size=5');
      setRecentApplications(applicationsResponse.data.content || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            {user?.role === 'ADMIN'
              ? 'Here is your admin overview'
              : 'Manage your loan applications and stay updated on your loan status'}
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => navigate('/apply')}
            className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-all text-left"
          >
            <p className="text-3xl mb-2">📝</p>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Apply for Loan</h3>
            <p className="text-gray-600">Start a new loan application</p>
          </button>

          <button
            onClick={() => navigate('/applications')}
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6 hover:shadow-lg transition-all text-left"
          >
            <p className="text-3xl mb-2">📊</p>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">View Applications</h3>
            <p className="text-gray-600">Check your loan applications</p>
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6 hover:shadow-lg transition-all text-left"
            >
              <p className="text-3xl mb-2">⚙️</p>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Admin Panel</h3>
              <p className="text-gray-600">Manage all applications</p>
            </button>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
            <p className="text-sm text-gray-600 font-semibold">Total Applications</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.totalApplications || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <p className="text-sm text-gray-600 font-semibold">Approved</p>
            <p className="text-3xl font-bold text-green-600">{stats.approvedApplications || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
            <p className="text-sm text-gray-600 font-semibold">In Progress</p>
            <p className="text-3xl font-bold text-orange-600">{stats.inProgressApplications || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 font-semibold">Disbursed</p>
            <p className="text-3xl font-bold text-blue-600">{stats.disbursedApplications || 0}</p>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Applications</h2>

          {recentApplications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No applications yet</p>
              <button
                onClick={() => navigate('/apply')}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                Create Your First Application
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Application ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenure</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Purpose</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
                    <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-mono text-gray-800">{String(app.id)}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">₹{(app.requestedAmount || 0).toLocaleString()}</td>
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
          )}

          {recentApplications.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/applications')}
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                View All Applications →
              </button>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📚 Need Help?</h3>
          <p className="text-blue-800 mb-4">
            Our loan application process is simple and straightforward. Here's what you need to know:
          </p>
          <ul className="list-disc list-inside text-blue-800 space-y-1">
            <li>Fill out your personal, employment, and financial details</li>
            <li>Complete KYC verification with your PAN and Aadhaar</li>
            <li>Provide your bank details for fund disbursement</li>
            <li>Review and accept the loan offer</li>
            <li>Sign the digital agreement</li>
            <li>Receive the loan amount directly to your account</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
