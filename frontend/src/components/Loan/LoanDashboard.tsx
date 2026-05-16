import { useState, useEffect } from 'react';
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
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { MStripeDivider } from '../../ui/Divider';
import { TabButton, TabUnderline } from '../../ui/Tabs';

const LoanDashboard = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [appDetails, setAppDetails] = useState<any>(null);
  const [emiSchedule, setEmiSchedule] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

      // If needed later, we can fetch NOC details when CLOSED.
    } catch (err: any) {
      console.error(err.response?.data?.message || 'Failed to load loan details');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-white"></div>
          <p className="text-xs ui-label-uppercase ui-text-body">Loading Loan Dashboard...</p>
        </div>
      </div>
    );
  }

  const isClosed = appDetails?.status === 'CLOSED';

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 ui-label-uppercase ui-text-body mb-2">
              <Activity size={18} />
              <span>Personal Loan Account</span>
            </div>
            <h1 className="text-2xl ui-label-uppercase">Loan #{appDetails?.applicationRef}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 text-xs ui-label-uppercase border ui-surface-soft text-white/80 border-white/20">
                {appDetails?.status}
              </span>
              <span className="ui-text-muted text-sm">|</span>
              <span className="ui-text-muted text-sm">Mandate: {appDetails?.mandateStatus || 'NOT REGISTERED'}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Apps
            </Button>
            {appDetails?.mandateStatus !== 'REGISTERED' && !isClosed && (
              <Button
                onClick={handleRegisterMandate}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Register NACH'}
                <ArrowRight size={16} />
              </Button>
            )}
            {isClosed && (
              <Button>
                <Download size={16} />
                Download NOC
              </Button>
            )}
          </div>
        </div>

        <MStripeDivider className="mb-8" />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-6" tone="card">
                <p className="text-xs ui-label-uppercase ui-text-body mb-2">Outstanding Principal</p>
                <h3 className="text-2xl font-bold">₹{(appDetails?.outstandingPrincipal || 0).toLocaleString()}</h3>
                <p className="text-xs ui-text-muted mt-2">Total Sanctioned: ₹{appDetails?.sanctionedAmount?.toLocaleString()}</p>
              </Card>

              <Card className="p-6" tone="card">
                <p className="text-xs ui-label-uppercase ui-text-body mb-2">Next EMI Due</p>
                <h3 className="text-2xl font-bold">
                  {emiSchedule?.installments?.find((i: any) => i.status === 'DUE')?.dueDate ?
                    new Date(emiSchedule?.installments?.find((i: any) => i.status === 'DUE')?.dueDate).toLocaleDateString() : 'N/A'}
                </h3>
                <p className="text-xs ui-text-muted mt-2">EMI Amount: ₹{emiSchedule?.monthlyEmi?.toLocaleString()}</p>
              </Card>

              <Card className="p-6" tone="card">
                <p className="text-xs ui-label-uppercase ui-text-body mb-2">Tenure Progress</p>
                <h3 className="text-2xl font-bold">
                  {emiSchedule?.paidEmis} / {emiSchedule?.totalEmis}
                </h3>
                <p className="text-xs ui-text-muted mt-2">{emiSchedule?.totalEmis - emiSchedule?.paidEmis} EMIs remaining</p>
              </Card>
            </div>

            {/* Tabs & Content */}
            <Card className="p-0 overflow-hidden" tone="card">
              <div className="border-b ui-hairline px-6">
                <div className="flex gap-8">
                  <div className="flex flex-col">
                    <TabButton onClick={() => setActiveTab('overview')}>Quick Actions</TabButton>
                    {activeTab === 'overview' ? <TabUnderline /> : <div className="h-0.5 w-full bg-transparent" />}
                  </div>
                  <div className="flex flex-col">
                    <TabButton onClick={() => setActiveTab('schedule')}>Amortization</TabButton>
                    {activeTab === 'schedule' ? <TabUnderline /> : <div className="h-0.5 w-full bg-transparent" />}
                  </div>
                  <div className="flex flex-col">
                    <TabButton onClick={() => setActiveTab('transactions')}>History</TabButton>
                    {activeTab === 'transactions' ? <TabUnderline /> : <div className="h-0.5 w-full bg-transparent" />}
                  </div>
                  <div className="flex flex-col">
                    <TabButton onClick={() => setActiveTab('prepayment')}>Repayment Options</TabButton>
                    {activeTab === 'prepayment' ? <TabUnderline /> : <div className="h-0.5 w-full bg-transparent" />}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border ui-hairline ui-surface-soft cursor-pointer hover:border-white transition-colors" onClick={handleSimulateDebit}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 border ui-hairline text-white transition-colors">
                            <Activity size={20} />
                          </div>
                          <h4 className="ui-label-uppercase text-xs text-white">Simulate Monthly Debit</h4>
                        </div>
                        <p className="text-sm ui-text-body">Trigger the mandate simulation for the current month's EMI.</p>
                      </div>

                      <div className="p-4 border ui-hairline ui-surface-soft cursor-pointer hover:border-white transition-colors" onClick={() => setActiveTab('prepayment')}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 border ui-hairline text-white transition-colors">
                            <CreditCard size={20} />
                          </div>
                          <h4 className="ui-label-uppercase text-xs text-white">Make Part-Prepayment</h4>
                        </div>
                        <p className="text-sm ui-text-body">Pay an extra amount to reduce interest or tenure.</p>
                      </div>

                      <div className="p-4 border ui-hairline ui-surface-soft cursor-pointer hover:border-white transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 border ui-hairline text-white transition-colors">
                            <FileText size={20} />
                          </div>
                          <h4 className="ui-label-uppercase text-xs text-white">Download Statement</h4>
                        </div>
                        <p className="text-sm ui-text-body">Get a PDF of your repayment history and schedule.</p>
                      </div>

                      <div className="p-4 border ui-hairline ui-surface-soft cursor-pointer hover:border-white transition-colors" onClick={handleForeclosure}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 border ui-hairline text-white transition-colors">
                            <AlertCircle size={20} />
                          </div>
                          <h4 className="ui-label-uppercase text-xs text-white">Full Foreclosure</h4>
                        </div>
                        <p className="text-sm ui-text-body">Close your loan early by paying the full outstanding amount.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b ui-hairline">
                          <th className="py-4 px-2 text-xs ui-label-uppercase ui-text-body">#</th>
                          <th className="py-4 px-2 text-xs ui-label-uppercase ui-text-body">Due Date</th>
                          <th className="py-4 px-2 text-xs ui-label-uppercase ui-text-body">Principal</th>
                          <th className="py-4 px-2 text-xs ui-label-uppercase ui-text-body">Interest</th>
                          <th className="py-4 px-2 text-xs ui-label-uppercase ui-text-body">Total</th>
                          <th className="py-4 px-2 text-xs ui-label-uppercase ui-text-body">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {emiSchedule?.installments?.map((inst: any) => (
                          <tr key={inst.installmentNumber} className="border-b ui-hairline hover:bg-white/5 transition-colors">
                            <td className="py-4 px-2 text-sm font-mono text-white/90">{inst.installmentNumber}</td>
                            <td className="py-4 px-2 text-sm ui-text-body">{new Date(inst.dueDate).toLocaleDateString()}</td>
                            <td className="py-4 px-2 text-sm text-white/90">₹{inst.principal.toLocaleString()}</td>
                            <td className="py-4 px-2 text-sm text-white/90">₹{inst.interest.toLocaleString()}</td>
                            <td className="py-4 px-2 text-sm text-white">₹{inst.totalEmi.toLocaleString()}</td>
                            <td className="py-4 px-2">
                              <span className="px-2 py-1 text-[10px] ui-label-uppercase border ui-surface-soft text-white/80 border-white/20">
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
                      <div className="text-center py-12 ui-text-muted">
                        <History size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No transactions recorded yet.</p>
                      </div>
                    ) : (
                      transactions.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 border ui-hairline ui-surface-soft">
                          <div className="flex items-center gap-4">
                            <div className="p-2 border ui-hairline text-white">
                              {tx.transactionType === 'EMI_PAYMENT' ? <Calendar size={20} /> : <Activity size={20} />}
                            </div>
                            <div>
                              <h5 className="ui-label-uppercase text-xs text-white">{tx.transactionType}</h5>
                              <p className="text-xs ui-text-muted mt-1">
                                {new Date(tx.paymentDate).toLocaleString()} • Ref: {tx.gatewayRef}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">₹{tx.amount.toLocaleString()}</p>
                            <span className="text-[10px] ui-label-uppercase ui-text-body">Success</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'prepayment' && (
                  <div className="max-w-md space-y-6">
                    <div>
                      <h4 className="text-sm ui-label-uppercase mb-2">Make a Part-Prepayment</h4>
                      <p className="text-sm ui-text-body mb-6">Choose how you want your prepayment to impact your loan.</p>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs ui-label-uppercase ui-text-body mb-2">Prepayment Amount (₹)</label>
                          <input
                            type="number"
                            value={prepayAmount}
                            onChange={(e) => setPrepayAmount(e.target.value)}
                            className="w-full h-12 px-4 ui-surface-card border ui-hairline text-white focus:outline-none focus:border-white rounded-none"
                            placeholder="e.g. 50000"
                          />
                        </div>

                        <div>
                          <label className="block text-xs ui-label-uppercase ui-text-body mb-3">Repayment Strategy</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div
                              onClick={() => setPrepayType('REDUCE_TENURE')}
                              className={`p-4 border ui-hairline cursor-pointer transition-colors ${prepayType === 'REDUCE_TENURE' ? 'border-white' : 'ui-surface-soft hover:border-white'}`}
                            >
                              <h5 className="ui-label-uppercase text-xs text-white">Reduce Tenure</h5>
                              <p className="text-[10px] ui-text-body mt-2">Keep EMI same, finish loan faster.</p>
                            </div>
                            <div
                              onClick={() => setPrepayType('REDUCE_EMI')}
                              className={`p-4 border ui-hairline cursor-pointer transition-colors ${prepayType === 'REDUCE_EMI' ? 'border-white' : 'ui-surface-soft hover:border-white'}`}
                            >
                              <h5 className="ui-label-uppercase text-xs text-white">Reduce EMI</h5>
                              <p className="text-[10px] ui-text-body mt-2">Keep tenure same, lower monthly burden.</p>
                            </div>
                          </div>
                        </div>

                        <Button onClick={handlePrepayment} disabled={actionLoading || !prepayAmount} className="w-full mt-4">
                          {actionLoading ? 'Processing...' : `Pay ₹${parseFloat(prepayAmount || '0').toLocaleString()}`}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Side Panels */}
          <div className="space-y-8">
            {/* Compliance Info */}
            <Card tone="soft" className="p-6">
              <h4 className="text-sm ui-label-uppercase mb-4 flex items-center gap-2">
                <CheckCircle size={20} />
                RBI Compliance
              </h4>
              <ul className="space-y-4 text-sm ui-text-body">
                <li className="flex gap-3">
                  <div className="w-5 h-5 border ui-hairline flex items-center justify-center shrink-0 text-xs">1</div>
                  <p>Statements available within 24 hours of request.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 border ui-hairline flex items-center justify-center shrink-0 text-xs">2</div>
                  <p>Zero foreclosure charges on floating rate loans.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 border ui-hairline flex items-center justify-center shrink-0 text-xs">3</div>
                  <p>NOC issued within 7 days of loan closure.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 border ui-hairline flex items-center justify-center shrink-0 text-xs">4</div>
                  <p>3 days grace period before late fees apply.</p>
                </li>
              </ul>
            </Card>

            {/* Bureau Reporting */}
            <Card tone="card" className="p-6">
              <h4 className="text-sm ui-label-uppercase mb-4 flex items-center gap-2">
                <PieChart size={20} className="text-white" />
                Bureau Reporting
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="ui-text-body">CIBIL Status</span>
                  <span className="text-white ui-label-uppercase text-xs">Current</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="ui-text-body">Last Reported</span>
                  <span className="text-white/90">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="h-2 ui-surface-soft overflow-hidden">
                  <div className="h-full bg-white/70 w-3/4"></div>
                </div>
                <p className="text-[10px] ui-text-muted italic">
                  Making on-time payments improves your CIBIL score. We report to CIBIL, Experian, and Equifax every 30 days.
                </p>
              </div>
            </Card>

            {/* Support */}
            <Card tone="soft" className="p-6">
              <h4 className="text-sm ui-label-uppercase mb-2">Need Assistance?</h4>
              <p className="text-sm ui-text-body mb-4">Our servicing team is available 24/7 for loan queries.</p>
              <div className="space-y-2">
                <p className="text-sm ui-text-body">support@fintechlos.com</p>
                <p className="text-sm ui-text-body">1800-LOAN-SERV</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDashboard;
