import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  History,
  PieChart,
  Activity,
  ArrowRight
} from 'lucide-react';

const LoanDashboard = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [appDetails, setAppDetails] = useState<any>(null);
  const [emiSchedule, setEmiSchedule] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [nocDetails, setNocDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'transactions' | 'prepayment'>('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [prepayAmount, setPrepayAmount] = useState('');
  const [prepayType, setPrepayType] = useState('REDUCE_TENURE');

  useEffect(() => {
    fetchData();
  }, [applicationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appRes, emiRes, txRes] = await Promise.all([
        api.get(`/workflow/applications/${applicationId}`),
        api.get(`/workflow/applications/${applicationId}/emi-schedule`),
        api.get(`/workflow/applications/${applicationId}/emi-payments`)
      ]);

      setAppDetails(appRes.data.data);
      setEmiSchedule(emiRes.data.data);
      setTransactions(txRes.data.data?.content || txRes.data.data || []);

      if (appRes.data.data.status === 'CLOSED') {
        const nocRes = await api.get(`/workflow/applications/${applicationId}/noc`);
        setNocDetails(nocRes.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load loan details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterMandate = async () => {
    setActionLoading(true);
    try {
      await api.post(`/workflow/applications/${applicationId}/mandate/register`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Mandate registration failed');
    } finally {
      setActionLoading(true); // Small delay simulation
      setTimeout(() => setActionLoading(false), 1000);
    }
  };

  const handleSimulateDebit = async () => {
    setActionLoading(true);
    try {
      await api.post(`/workflow/applications/${applicationId}/emi/simulate-collection`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Collection simulation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrepayment = async () => {
    if (!prepayAmount || parseFloat(prepayAmount) <= 0) return;
    setActionLoading(true);
    try {
      await api.post(`/workflow/applications/${applicationId}/prepayment`, {
        amount: parseFloat(prepayAmount),
        prepaymentType: prepayType
      });
      setPrepayAmount('');
      fetchData();
      setActiveTab('overview');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Prepayment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForeclosure = async () => {
    if (!window.confirm('Are you sure you want to foreclose this loan?')) return;
    setActionLoading(true);
    try {
      await api.post(`/workflow/applications/${applicationId}/foreclose`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Foreclosure failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-slate-600 font-medium">Loading Loan Dashboard...</p>
        </div>
      </div>
    );
  }

  const isClosed = appDetails?.status === 'CLOSED';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-1">
              <Activity size={18} />
              <span>Personal Loan Account</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Loan #{appDetails?.applicationRef}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                {appDetails?.status}
              </span>
              <span className="text-slate-500 text-sm">|</span>
              <span className="text-slate-500 text-sm">Mandate: {appDetails?.mandateStatus || 'NOT REGISTERED'}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-white transition-colors"
            >
              Back to Apps
            </button>
            {appDetails?.mandateStatus !== 'REGISTERED' && !isClosed && (
              <button
                onClick={handleRegisterMandate}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all flex items-center gap-2"
              >
                {actionLoading ? 'Processing...' : 'Register NACH'}
                <ArrowRight size={16} />
              </button>
            )}
            {isClosed && (
              <button
                className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all flex items-center gap-2"
              >
                <Download size={16} />
                Download NOC
              </button>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full flex items-center justify-center pl-4 pb-4">
                  <PieChart className="text-indigo-400" size={20} />
                </div>
                <p className="text-slate-500 text-sm font-medium mb-1">Outstanding Principal</p>
                <h3 className="text-2xl font-bold text-slate-900">₹{(appDetails?.outstandingPrincipal || 0).toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-2">Total Sanctioned: ₹{appDetails?.sanctionedAmount?.toLocaleString()}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full flex items-center justify-center pl-4 pb-4">
                  <Calendar className="text-amber-400" size={20} />
                </div>
                <p className="text-slate-500 text-sm font-medium mb-1">Next EMI Due</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {emiSchedule?.installments?.find((i: any) => i.status === 'DUE')?.dueDate ?
                    new Date(emiSchedule?.installments?.find((i: any) => i.status === 'DUE')?.dueDate).toLocaleDateString() : 'N/A'}
                </h3>
                <p className="text-xs text-slate-400 mt-2">EMI Amount: ₹{emiSchedule?.monthlyEmi?.toLocaleString()}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full flex items-center justify-center pl-4 pb-4">
                  <CheckCircle className="text-emerald-400" size={20} />
                </div>
                <p className="text-slate-500 text-sm font-medium mb-1">Tenure Progress</p>
                <h3 className="text-2xl font-bold text-slate-900">{emiSchedule?.paidEmis} / {emiSchedule?.totalEmis}</h3>
                <p className="text-xs text-slate-400 mt-2">{emiSchedule?.totalEmis - emiSchedule?.paidEmis} EMIs remaining</p>
              </div>
            </div>

            {/* Tabs & Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 font-semibold text-sm transition-all ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Quick Actions
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-6 py-4 font-semibold text-sm transition-all ${activeTab === 'schedule' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Amortization
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-6 py-4 font-semibold text-sm transition-all ${activeTab === 'transactions' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  History
                </button>
                <button
                  onClick={() => setActiveTab('prepayment')}
                  className={`px-6 py-4 font-semibold text-sm transition-all ${activeTab === 'prepayment' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Repayment Options
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-colors group cursor-pointer" onClick={handleSimulateDebit}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Activity size={20} />
                          </div>
                          <h4 className="font-bold text-slate-800">Simulate Monthly Debit</h4>
                        </div>
                        <p className="text-sm text-slate-500">Trigger the NACH/UPI mandate simulation for the current month's EMI.</p>
                      </div>

                      <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-amber-50 transition-colors group cursor-pointer" onClick={() => setActiveTab('prepayment')}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-amber-100 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                            <CreditCard size={20} />
                          </div>
                          <h4 className="font-bold text-slate-800">Make Part-Prepayment</h4>
                        </div>
                        <p className="text-sm text-slate-500">Pay an extra amount to reduce your interest or tenure.</p>
                      </div>

                      <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-emerald-50 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <FileText size={20} />
                          </div>
                          <h4 className="font-bold text-slate-800">Download Statement</h4>
                        </div>
                        <p className="text-sm text-slate-500">Get a PDF of your complete repayment history and schedule.</p>
                      </div>

                      <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-rose-50 transition-colors group cursor-pointer" onClick={handleForeclosure}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-rose-100 rounded-lg text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
                            <AlertCircle size={20} />
                          </div>
                          <h4 className="font-bold text-slate-800">Full Foreclosure</h4>
                        </div>
                        <p className="text-sm text-slate-500">Close your loan account early by paying the full outstanding amount.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="py-4 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">#</th>
                          <th className="py-4 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Due Date</th>
                          <th className="py-4 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Principal</th>
                          <th className="py-4 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Interest</th>
                          <th className="py-4 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                          <th className="py-4 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {emiSchedule?.installments?.map((inst: any) => (
                          <tr key={inst.installmentNumber} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-2 text-sm font-semibold text-slate-700">{inst.installmentNumber}</td>
                            <td className="py-4 px-2 text-sm text-slate-600">{new Date(inst.dueDate).toLocaleDateString()}</td>
                            <td className="py-4 px-2 text-sm text-slate-600">₹{inst.principal.toLocaleString()}</td>
                            <td className="py-4 px-2 text-sm text-slate-600">₹{inst.interest.toLocaleString()}</td>
                            <td className="py-4 px-2 text-sm font-bold text-slate-800">₹{inst.totalEmi.toLocaleString()}</td>
                            <td className="py-4 px-2">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${inst.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                {inst.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'transactions' && (
                  <div className="space-y-4">
                    {transactions.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <History size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No transactions recorded yet.</p>
                      </div>
                    ) : (
                      transactions.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${tx.transactionType === 'EMI_PAYMENT' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                              {tx.transactionType === 'EMI_PAYMENT' ? <Calendar size={20} /> : <Activity size={20} />}
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-800">{tx.transactionType}</h5>
                              <p className="text-xs text-slate-400">{new Date(tx.paymentDate).toLocaleString()} • Ref: {tx.gatewayRef}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">₹{tx.amount.toLocaleString()}</p>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">Success</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'prepayment' && (
                  <div className="max-w-md space-y-6">
                    <div>
                      <h4 className="font-bold text-slate-800 mb-2">Make a Part-Prepayment</h4>
                      <p className="text-sm text-slate-500 mb-6">Choose how you want your prepayment to impact your loan.</p>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Prepayment Amount (₹)</label>
                          <input
                            type="number"
                            value={prepayAmount}
                            onChange={(e) => setPrepayAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="e.g. 50000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-3">Repayment Strategy</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div
                              onClick={() => setPrepayType('REDUCE_TENURE')}
                              className={`p-4 border rounded-xl cursor-pointer transition-all ${prepayType === 'REDUCE_TENURE' ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500' : 'border-slate-100 bg-slate-50 hover:bg-white'}`}
                            >
                              <h5 className={`font-bold text-sm ${prepayType === 'REDUCE_TENURE' ? 'text-indigo-900' : 'text-slate-700'}`}>Reduce Tenure</h5>
                              <p className="text-[10px] text-slate-500 mt-1">Keep EMI same, finish loan faster.</p>
                            </div>
                            <div
                              onClick={() => setPrepayType('REDUCE_EMI')}
                              className={`p-4 border rounded-xl cursor-pointer transition-all ${prepayType === 'REDUCE_EMI' ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500' : 'border-slate-100 bg-slate-50 hover:bg-white'}`}
                            >
                              <h5 className={`font-bold text-sm ${prepayType === 'REDUCE_EMI' ? 'text-indigo-900' : 'text-slate-700'}`}>Reduce EMI</h5>
                              <p className="text-[10px] text-slate-500 mt-1">Keep tenure same, lower monthly burden.</p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handlePrepayment}
                          disabled={actionLoading || !prepayAmount}
                          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 mt-4"
                        >
                          {actionLoading ? 'Processing...' : `Pay ₹${parseFloat(prepayAmount || '0').toLocaleString()}`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Panels */}
          <div className="space-y-8">
            {/* Compliance Info */}
            <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CheckCircle size={20} />
                RBI Compliance
              </h4>
              <ul className="space-y-4 text-sm text-indigo-100">
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-800 flex items-center justify-center shrink-0">1</div>
                  <p>Statements available within 24 hours of request.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-800 flex items-center justify-center shrink-0">2</div>
                  <p>Zero foreclosure charges on floating rate loans.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-800 flex items-center justify-center shrink-0">3</div>
                  <p>NOC issued within 7 days of loan closure.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-800 flex items-center justify-center shrink-0">4</div>
                  <p>3 days grace period before late fees apply.</p>
                </li>
              </ul>
            </div>

            {/* Bureau Reporting */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <PieChart size={20} className="text-indigo-600" />
                Bureau Reporting
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">CIBIL Status</span>
                  <span className="text-emerald-600 font-bold">CURRENT</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Last Reported</span>
                  <span className="text-slate-700 font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-3/4"></div>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Making on-time payments improves your CIBIL score. We report to CIBIL, Experian, and Equifax every 30 days.
                </p>
              </div>
            </div>

            {/* Support */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200">
              <h4 className="font-bold text-lg mb-2">Need Assistance?</h4>
              <p className="text-sm text-slate-400 mb-4">Our servicing team is available 24/7 for loan queries.</p>
              <div className="space-y-2">
                <p className="text-sm">📧 support@fintechlos.com</p>
                <p className="text-sm">📞 1800-LOAN-SERV</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDashboard;
