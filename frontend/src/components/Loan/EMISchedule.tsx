import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, Calendar, CheckCircle, DollarSign, TrendingUp, History } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { MStripeDivider } from '../../ui/Divider';
import { TabButton, TabUnderline } from '../../ui/Tabs';

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

  const handlePayment = async (_installmentNumber: number) => {
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
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="text-xs ui-label-uppercase ui-text-body">Loading EMI schedule...</p>
        </div>
      </div>
    );
  }

  if (error && !emiSchedule) {
    return (
      <div className="min-h-screen p-4">
        <div className="mx-auto max-w-[1440px]">
          <Button onClick={() => navigate('/dashboard')} className="mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Button>
          <Card className="p-6" tone="card">
            <div className="border border-white/20 ui-surface-soft px-4 py-3">
              <div className="ui-label-uppercase text-xs text-white">Error</div>
              <div className="text-sm ui-text-body-strong">{error}</div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-[1440px]">
        <Button onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Button>

        <Card className="p-8 mb-6" tone="card">
          <MStripeDivider className="mb-8" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border ui-hairline flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl ui-label-uppercase">EMI Schedule</h1>
                <p className="ui-text-muted text-sm">Application ID: {applicationId}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs ui-label-uppercase ui-text-body">Total Outstanding</p>
              <p className="text-3xl font-bold">₹{emiSchedule?.totalOutstanding?.toLocaleString() || 0}</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6" tone="soft">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 border ui-hairline flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs ui-label-uppercase ui-text-muted">Total</span>
              </div>
              <p className="text-xs ui-label-uppercase ui-text-body mb-2">Total EMIs</p>
              <p className="text-3xl font-bold">{emiSchedule?.totalEmis}</p>
            </Card>
            <Card className="p-6" tone="soft">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 border ui-hairline flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs ui-label-uppercase ui-text-muted">Paid</span>
              </div>
              <p className="text-xs ui-label-uppercase ui-text-body mb-2">Paid EMIs</p>
              <p className="text-3xl font-bold">{emiSchedule?.paidEmis}</p>
            </Card>
            <Card className="p-6" tone="soft">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 border ui-hairline flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs ui-label-uppercase ui-text-muted">Due</span>
              </div>
              <p className="text-xs ui-label-uppercase ui-text-body mb-2">Remaining EMIs</p>
              <p className="text-3xl font-bold">{emiSchedule?.totalEmis - emiSchedule?.paidEmis}</p>
            </Card>
            <Card className="p-6" tone="soft">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 border ui-hairline flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs ui-label-uppercase ui-text-muted">Monthly</span>
              </div>
              <p className="text-xs ui-label-uppercase ui-text-body mb-2">Monthly EMI</p>
              <p className="text-3xl font-bold">₹{emiSchedule?.monthlyEmi?.toLocaleString()}</p>
            </Card>
          </div>

          {/* Tabs */}
          <div className="border-b ui-hairline mb-6">
            <div className="flex gap-8">
              <div className="flex flex-col">
                <TabButton onClick={() => setActiveTab('schedule')}>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>EMI Schedule</span>
                  </span>
                </TabButton>
                {activeTab === 'schedule' ? <TabUnderline /> : <div className="h-0.5 w-full bg-transparent" />}
              </div>
              <div className="flex flex-col">
                <TabButton onClick={() => setActiveTab('transactions')}>
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    <span>Payment History</span>
                  </span>
                </TabButton>
                {activeTab === 'transactions' ? <TabUnderline /> : <div className="h-0.5 w-full bg-transparent" />}
              </div>
            </div>
          </div>

          {/* EMI Schedule Table */}
          {activeTab === 'schedule' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b ui-hairline">
                    <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Installment</th>
                    <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Due Date</th>
                    <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Principal</th>
                    <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Interest</th>
                    <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Total</th>
                    <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Outstanding</th>
                    <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Status</th>
                    <th className="text-center py-3 px-4 text-xs ui-label-uppercase ui-text-body">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {emiSchedule?.installments?.map((installment: any) => (
                    <tr key={installment.installmentNumber} className="border-b ui-hairline hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-sm text-white/90">#{installment.installmentNumber}</td>
                      <td className="py-3 px-4 text-sm ui-text-body">
                        {new Date(installment.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-white/90">₹{installment.principal.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-white/90">₹{installment.interest.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-white">
                        ₹{installment.totalEmi.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm ui-text-body">₹{installment.outstandingBalance.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1.5 text-xs ui-label-uppercase border ${
                            installment.status === 'PAID'
                              ? 'ui-surface-soft text-white/80 border-white/20'
                              : installment.status === 'DUE'
                              ? 'ui-surface-soft text-white/80 border-white/20'
                              : 'ui-surface-soft text-white/80 border-white/20'
                          }`}
                        >
                          {installment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {installment.status === 'DUE' && (
                          <Button size="sm" onClick={() => handlePayment(installment.installmentNumber)}>
                            Pay Now
                          </Button>
                        )}
                        {installment.status === 'PAID' && (
                          <span className="ui-label-uppercase text-xs text-white/80 flex items-center gap-1 justify-center">
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
                  <tr className="border-b ui-hairline">
                    <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Transaction</th>
                    <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Installment</th>
                    <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Amount</th>
                    <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Payment Date</th>
                    <th className="text-left py-3 px-4 text-xs ui-label-uppercase ui-text-body">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 px-4 text-center ui-text-body">
                        No payment history available
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction: any) => (
                      <tr key={transaction.id} className="border-b ui-hairline hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-mono text-sm text-white/90">
                          {String(transaction.id).slice(0, 8)}...
                        </td>
                        <td className="py-3 px-4 text-white/90">#{transaction.installmentNumber}</td>
                        <td className="py-3 px-4 text-white">
                          ₹{transaction.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 ui-text-body">
                          {new Date(transaction.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1.5 text-xs ui-label-uppercase border ui-surface-soft text-white/80 border-white/20">
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
        </Card>
      </div>
    </div>
  );
};

export default EMISchedule;
