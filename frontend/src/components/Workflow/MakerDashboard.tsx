import React, { useEffect, useState } from 'react';
import api from '../../api';
import AuditTrailModal from './AuditTrailModal';
import ApplicationDetailModal from './ApplicationDetailModal';
import { TrendingUp, DollarSign, BarChart3, Clock, Eye } from 'lucide-react';

const MakerDashboard: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [viewingApp, setViewingApp] = useState<any | null>(null);
  const [showCheckerModal, setShowCheckerModal] = useState(false);
  const [checkers, setCheckers] = useState<any[]>([]);
  const [recommendingAppId, setRecommendingAppId] = useState<number | null>(null);
  const [selectedCheckerId, setSelectedCheckerId] = useState<string>('');
  const [recommendRemarks, setRecommendRemarks] = useState('Recommended by Maker');

  useEffect(() => {
    fetchSubmittedApplications();
  }, []);

  const fetchSubmittedApplications = async () => {
    try {
      setLoading(true);
      // Use the new endpoint that fetches from the database view
      const response = await api.get('/admin/submitted-applications');
      
      console.log('API Response:', response.data);
      
      // Handle different response structures
      const responseData = response.data.data || response.data;
      let allApps = Array.isArray(responseData) ? responseData : [];
      
      // Normalize keys to lowercase to handle different DB behaviors (e.g. H2 uppercase keys)
      allApps = allApps.map(app => {
        const normalizedApp: any = {};
        Object.keys(app).forEach(key => {
          normalizedApp[key.toLowerCase()] = app[key];
        });
        return normalizedApp;
      });
      
      console.log('Normalized Applications:', allApps);
      setApplications(allApps);
    } catch (error: any) {
      console.error('Error fetching submitted applications:', error);
      console.error('Error details:', error.response?.data || error.message);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = () => {
    if (applications.length === 0) {
      return {
        totalCount: 0,
        totalAmount: 0,
        averageAmount: 0,
        tierBreakdown: {},
      };
    }

    const totalAmount = applications.reduce((sum, app) => sum + (app.requested_amount || 0), 0);
    const averageAmount = totalAmount / applications.length;
    
    const tierBreakdown = applications.reduce((acc: any, app) => {
      const tier = app.tier || 'UNKNOWN';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});

    return {
      totalCount: applications.length,
      totalAmount,
      averageAmount,
      tierBreakdown,
    };
  };

  const handleResubmit = async (id: number) => {
    try {
      await api.post(`/workflow/applications/${id}/submit`);
      fetchSubmittedApplications();
    } catch (error) {
      alert('Resubmission failed');
    }
  };

  const handleUpdatePermission = async (id: number, stage: number) => {
    try {
      await api.post(`/maker-checker/loans/${id}/update-permission?allowedStage=${stage}`);
      alert(`Permission granted up to stage ${stage}`);
      fetchSubmittedApplications();
    } catch (error) {
      console.error('Update permission failed:', error);
      alert('Failed to update permission');
    }
  };

  const handleRecommend = async (id: number) => {
    try {
      setLoading(true);
      const roleResponse = await api.get(`/maker-checker/loans/${id}/required-role`);
      const role = roleResponse.data.data;
      
      // Check if it's Tier 1 (No role required, system is checker)
      if (!role) {
        if (window.confirm('This is a Tier 1 application. Sending it forward will trigger system auto-approval. Proceed?')) {
          await api.post(`/maker-checker/loans/${id}/recommend`, { remarks: 'Recommended by Maker (Auto-Approved)' });
          alert('Application auto-approved successfully');
          fetchSubmittedApplications();
        }
        return;
      }

      const checkersResponse = await api.get(`/maker-checker/checkers?role=${role}`);
      setCheckers(checkersResponse.data.data);
      
      setRecommendingAppId(id);
      setShowCheckerModal(true);
    } catch (error) {
      console.error('Failed to fetch checkers:', error);
      alert('Failed to load available checkers');
    } finally {
      setLoading(false);
    }
  };

  const submitRecommendation = async () => {
    if (!selectedCheckerId) {
      alert('Please select a checker');
      return;
    }
    
    try {
      await api.post(`/maker-checker/loans/${recommendingAppId}/recommend`, { 
        checkerId: parseInt(selectedCheckerId),
        remarks: recommendRemarks 
      });
      alert('Application sent to checker successfully');
      setShowCheckerModal(false);
      setRecommendingAppId(null);
      setSelectedCheckerId('');
      fetchSubmittedApplications();
    } catch (error) {
      console.error('Recommendation failed:', error);
      alert('Failed to send to checker');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'RETURNED': return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'SUBMITTED': return 'bg-violet-100 text-violet-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return (
    <div className="p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Loading submitted applications...</p>
        <p className="text-sm text-gray-500">(Check browser console for details)</p>
      </div>
    </div>
  );

  const analytics = calculateAnalytics();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Maker Dashboard</h1>
        <p className="text-gray-600">Track and manage submitted loan applications</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Submitted Applications */}
        <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl shadow-sm border border-violet-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-600 text-sm font-medium">Total Submitted</p>
              <p className="text-3xl font-bold text-violet-900 mt-2">{analytics.totalCount}</p>
            </div>
            <div className="bg-violet-200 rounded-full p-3">
              <BarChart3 size={24} className="text-violet-600" />
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-sm border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Amount</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">₹{(analytics.totalAmount / 100000).toFixed(1)}L</p>
            </div>
            <div className="bg-blue-200 rounded-full p-3">
              <DollarSign size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Average Amount */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-sm border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Average Amount</p>
              <p className="text-3xl font-bold text-green-900 mt-2">₹{(analytics.averageAmount / 100000).toFixed(1)}L</p>
            </div>
            <div className="bg-green-200 rounded-full p-3">
              <TrendingUp size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-sm border border-orange-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Pending Review</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">{analytics.totalCount}</p>
            </div>
            <div className="bg-orange-200 rounded-full p-3">
              <Clock size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tier Breakdown */}
      {Object.keys(analytics.tierBreakdown).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications by Tier</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(analytics.tierBreakdown).map(([tier, count]) => (
              <div key={tier} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <p className="text-gray-600 text-sm font-medium">{tier}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{count as number}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applications List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Submitted Applications</h2>
        </div>
        
        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">No submitted applications found</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Amount</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Tier</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">KYC Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Credit Score</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Documents</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Submitted</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">#{app.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>
                      <div className="font-medium">{app.customer_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{app.customer_mobile || ''}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">₹{(app.requested_amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{app.tier || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      app.kyc_status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                      app.kyc_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {app.kyc_status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {app.bureau_score || app.internal_score || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {app.verified_document_count || 0}/{app.document_count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-3">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setViewingApp(app)}
                        className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        title="View Full Application"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {['SUBMITTED', 'MAKER_CHECKED', 'KYC_VERIFIED', 'DOCS_COMPLETE', 'RETURNED', 'APPROVED', 'ACCEPTED', 'AGREEMENT_EXECUTED'].includes(app.status) && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <select 
                              className="text-xs border rounded p-1 bg-white font-semibold text-indigo-700"
                              onChange={(e) => handleUpdatePermission(app.id, parseInt(e.target.value))}
                              value={app.allowed_stage || 2}
                            >
                              <option value={2}>Gate: Pending Review (Stage 2)</option>
                              <option value={3}>Gate: Maker Approval (Stage 3)</option>
                              <option value={4}>Allow KYC (Stage 4)</option>
                              <option value={5}>Allow Documents (Stage 5)</option>
                              <option value={6}>Allow Credit Assessment (Stage 6)</option>
                              <option value={7}>Allow Loan Offer (Stage 7)</option>
                              <option value={8}>Allow Digital Agreement (Stage 8)</option>
                              <option value={9}>Allow Disbursement (Stage 9)</option>
                              <option value={10}>Allow Final Status (Stage 10)</option>
                            </select>
                          </div>
                          
                          {/* Only show "Send to Checker" if not yet approved or recommended */}
                          {['SUBMITTED', 'MAKER_CHECKED', 'KYC_VERIFIED', 'DOCS_COMPLETE', 'RETURNED'].includes(app.status) && (
                            <button 
                              onClick={() => handleRecommend(app.id)}
                              className="text-green-600 hover:text-green-800 font-medium text-xs text-left"
                            >
                              Send to Checker
                            </button>
                          )}
                        </div>
                      )}
                      <button 
                        onClick={() => setSelectedAppId(app.id)}
                        className="text-gray-400 hover:text-gray-600 font-medium"
                        title="View Audit Trail"
                      >
                        Audit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedAppId && (
        <AuditTrailModal 
          loanId={selectedAppId} 
          onClose={() => setSelectedAppId(null)} 
        />
      )}

      {viewingApp && (
        <ApplicationDetailModal 
          application={viewingApp} 
          onClose={() => setViewingApp(null)} 
        />
      )}

      {/* Checker Selection Modal */}
      {showCheckerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-scaleIn">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Checker</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Available Checkers</label>
                <select 
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition bg-white text-gray-900 font-medium"
                  value={selectedCheckerId}
                  onChange={(e) => setSelectedCheckerId(e.target.value)}
                >
                  <option value="" className="text-gray-500">-- Choose a Checker --</option>
                  {checkers.map(checker => (
                    <option key={checker.id} value={checker.id} className="text-gray-900">
                      {checker.fullName} ({checker.role})
                    </option>
                  ))}
                </select>
                {checkers.length === 0 && (
                  <p className="text-sm text-red-500 mt-2">No checkers available for this role.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
                <textarea 
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition bg-white text-gray-900"
                  value={recommendRemarks}
                  onChange={(e) => setRecommendRemarks(e.target.value)}
                  rows={3}
                  placeholder="Enter any additional comments..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={submitRecommendation}
                  disabled={!selectedCheckerId}
                  className="flex-1 btn-primary py-3"
                >
                  Send Forward
                </button>
                <button 
                  onClick={() => { setShowCheckerModal(false); setSelectedCheckerId(''); }}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MakerDashboard;
