import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { TrendingUp, CheckCircle, Clock, DollarSign, FileText, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
          <p className="text-lg text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl shadow-lg shadow-violet-500/30">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600">
                {user?.role === 'ADMIN'
                  ? 'Here is your admin overview'
                  : 'Manage your loan applications and stay updated on your loan status'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate('/apply')}
            className="card-modern p-6 card-hover group text-left animate-fadeIn"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Apply for Loan</h3>
            <p className="text-gray-600 mb-4">Start a new loan application</p>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold group-hover:gap-3 transition-all">
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          <button
            onClick={() => navigate('/applications')}
            className="card-modern p-6 card-hover group text-left animate-fadeIn"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">View Applications</h3>
            <p className="text-gray-600 mb-4">Check your loan applications</p>
            <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all">
              <span>View All</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              className="card-modern p-6 card-hover group text-left animate-fadeIn"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Admin Panel</h3>
              <p className="text-gray-600 mb-4">Manage all applications</p>
              <div className="flex items-center gap-2 text-violet-600 font-semibold group-hover:gap-3 transition-all">
                <span>Manage</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-modern p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-violet-600 bg-violet-100 px-3 py-1 rounded-full">Total</span>
            </div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Total Applications</p>
            <p className="text-3xl font-bold text-gradient">{stats.totalApplications || 0}</p>
          </div>

          <div className="card-modern p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Approved</span>
            </div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Approved</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.approvedApplications || 0}</p>
          </div>

          <div className="card-modern p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">Pending</span>
            </div>
            <p className="text-sm text-gray-600 font-semibold mb-1">In Progress</p>
            <p className="text-3xl font-bold text-amber-600">{stats.inProgressApplications || 0}</p>
          </div>

          <div className="card-modern p-6 card-hover animate-fadeIn" style={{ animationDelay: '0.7s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-cyan-600 bg-cyan-100 px-3 py-1 rounded-full">Disbursed</span>
            </div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Disbursed</p>
            <p className="text-3xl font-bold text-cyan-600">{stats.disbursedApplications || 0}</p>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card-modern p-6 animate-fadeIn" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gradient">Recent Applications</h2>
            {recentApplications.length > 0 && (
              <button
                onClick={() => navigate('/applications')}
                className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-semibold transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {recentApplications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                <FileText className="w-10 h-10 text-violet-400" />
              </div>
              <p className="text-gray-600 mb-6 text-lg">No applications yet</p>
              <button
                onClick={() => navigate('/apply')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <span>Create Your First Application</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Application ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Tenure</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Purpose</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Created</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
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
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 card-modern p-6 bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200 animate-fadeIn" style={{ animationDelay: '0.9s' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                Our loan application process is simple and straightforward. Here's what you need to know:
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  Fill out your personal, employment, and financial details
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  Complete KYC verification with your PAN and Aadhaar
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  Provide your bank details for fund disbursement
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  Review and accept the loan offer
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  Sign the digital agreement
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                  Receive the loan amount directly to your account
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
