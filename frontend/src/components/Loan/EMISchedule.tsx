import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, Calendar, CheckCircle, DollarSign, TrendingUp, History, ChevronLeft, ChevronRight } from 'lucide-react';

const EMISchedule = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [emiSchedule, setEmiSchedule] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'transactions'>('schedule');

  useEffect(() => {
    fetchEmiSchedule();
    fetchTransactions();
  }, [applicationId]);

  const fetchEmiSchedule = async () => {
    try {
      const response = await api.get(`/workflow/applications/${applicationId}/emi-schedule`);
      setEmiSchedule(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load EMI schedule');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get(`/workflow/applications/${applicationId}/emi-payments`);
      setTransactions(response.data.data?.content || response.data.data || []);
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
    }
  };

  const handlePayment = async (installmentNumber: number) => {
    try {
      await api.post(`/workflow/applications/${applicationId}/emi/pay`, {
        amount: emiSchedule?.monthlyEmi,
        gatewayRef: `PAY_${Date.now()}`,
      });
      fetchEmiSchedule();
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
          <p className="text-lg text-gray-600 font-medium">Loading EMI schedule...</p>
        </div>
      </div>
    );
  }

  if (error && !emiSchedule) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
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
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="card-modern p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">EMI Schedule</h1>
                <p className="text-gray-500 text-sm">Application ID: {applicationId}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 font-medium">Total Outstanding</p>
              <p className="text-3xl font-bold text-gradient">
                ₹{emiSchedule?.totalOutstanding?.toLocaleString() || 0}
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card-modern p-6 card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Total</span>
              </div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Total EMIs</p>
              <p className="text-3xl font-bold text-blue-600">{emiSchedule?.totalEmis}</p>
            </div>
            <div className="card-modern p-6 card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Paid</span>
              </div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Paid EMIs</p>
              <p className="text-3xl font-bold text-emerald-600">{emiSchedule?.paidEmis}</p>
            </div>
            <div className="card-modern p-6 card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">Due</span>
              </div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Remaining EMIs</p>
              <p className="text-3xl font-bold text-amber-600">{emiSchedule?.totalEmis - emiSchedule?.paidEmis}</p>
            </div>
            <div className="card-modern p-6 card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-violet-600 bg-violet-100 px-3 py-1 rounded-full">Monthly</span>
              </div>
              <p className="text-sm text-gray-600 font-semibold mb-1">Monthly EMI</p>
              <p className="text-3xl font-bold text-violet-600">
                ₹{emiSchedule?.monthlyEmi?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-3 font-semibold rounded-t-xl transition-all ${
                activeTab === 'schedule'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>EMI Schedule</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 font-semibold rounded-t-xl transition-all ${
                activeTab === 'transactions'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4" />
                <span>Payment History</span>
              </span>
            </button>
          </div>

          {/* EMI Schedule Table */}
          {activeTab === 'schedule' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Installment #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Principal</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Interest</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Total EMI</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Outstanding</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {emiSchedule?.installments?.map((installment: any) => (
                    <tr key={installment.installmentNumber} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-800">#{installment.installmentNumber}</td>
                      <td className="py-3 px-4 text-gray-800">
                        {new Date(installment.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-800">₹{installment.principal.toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-800">₹{installment.interest.toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-800 font-semibold">
                        ₹{installment.totalEmi.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-800">₹{installment.outstandingBalance.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            installment.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : installment.status === 'DUE'
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {installment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {installment.status === 'DUE' && (
                          <button
                            onClick={() => handlePayment(installment.installmentNumber)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5"
                          >
                            Pay Now
                          </button>
                        )}
                        {installment.status === 'PAID' && (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>Paid</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment History */}
          {activeTab === 'transactions' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Transaction ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Installment #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 px-4 text-center text-gray-600">
                        No payment history available
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction: any) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm text-gray-800">
                          {String(transaction.id).slice(0, 8)}...
                        </td>
                        <td className="py-3 px-4 text-gray-800">#{transaction.installmentNumber}</td>
                        <td className="py-3 px-4 text-gray-800 font-semibold">
                          ₹{transaction.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(transaction.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EMISchedule;
