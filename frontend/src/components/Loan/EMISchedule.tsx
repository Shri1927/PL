import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

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
      setEmiSchedule(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load EMI schedule');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get(`/workflow/applications/${applicationId}/emi-payments`);
      setTransactions(response.data.content || response.data);
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading EMI schedule...</div>
      </div>
    );
  }

  if (error && !emiSchedule) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
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
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">EMI Schedule</h1>
              <p className="text-gray-600">Application ID: {applicationId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Outstanding</p>
              <p className="text-3xl font-bold text-indigo-600">
                ₹{emiSchedule?.totalOutstanding?.toLocaleString() || 0}
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-600 font-semibold">Total EMIs</p>
              <p className="text-2xl font-bold text-blue-800">{emiSchedule?.totalEmis}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-600 font-semibold">Paid EMIs</p>
              <p className="text-2xl font-bold text-green-800">{emiSchedule?.paidEmis}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <p className="text-sm text-orange-600 font-semibold">Remaining EMIs</p>
              <p className="text-2xl font-bold text-orange-800">{emiSchedule?.totalEmis - emiSchedule?.paidEmis}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-purple-600 font-semibold">Monthly EMI</p>
              <p className="text-2xl font-bold text-purple-800">
                ₹{emiSchedule?.monthlyEmi?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-3 font-semibold ${
                activeTab === 'schedule'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              EMI Schedule
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 font-semibold ${
                activeTab === 'transactions'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Payment History
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
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            installment.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : installment.status === 'DUE'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {installment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {installment.status === 'DUE' && (
                          <button
                            onClick={() => handlePayment(installment.installmentNumber)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                          >
                            Pay Now
                          </button>
                        )}
                        {installment.status === 'PAID' && (
                          <span className="text-green-600 font-semibold">✓ Paid</span>
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
                          {transaction.id.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-4 text-gray-800">#{transaction.installmentNumber}</td>
                        <td className="py-3 px-4 text-gray-800 font-semibold">
                          ₹{transaction.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(transaction.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
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
