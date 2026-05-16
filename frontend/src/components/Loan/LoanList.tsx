import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, Plus, Filter, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { MStripeDivider } from '../../ui/Divider';

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
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'KYC_VERIFIED':
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'DOCS_COMPLETE':
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'CREDIT_ASSESSED':
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'OFFER_GENERATED':
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'OFFER_ACCEPTED':
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'AGREEMENT_EXECUTED':
        return 'ui-surface-soft text-white/80 border-white/20';
      case 'DISBURSED':
        return 'ui-surface-soft text-white/80 border-white/20';
      default:
        return 'ui-surface-soft text-white/80 border-white/20';
    }
  };

  if (error && !applications.length) {
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
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Button>
          <Button onClick={() => navigate('/apply')}>
            <Plus className="w-5 h-5" />
            <span>New Application</span>
          </Button>
        </div>

        <Card className="p-6 mb-6" tone="card">
          <MStripeDivider className="mb-6" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border ui-hairline flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl ui-label-uppercase">My Loan Applications</h1>
                <p className="ui-text-body text-sm">Track and manage your loan applications</p>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-white/60" />
              <span className="text-xs ui-label-uppercase ui-text-body">Filter by Status</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'DRAFT', 'KYC_VERIFIED', 'DOCS_COMPLETE', 'APPROVED', 'ACCEPTED', 'DISBURSED'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setPage(0);
                  }}
                  className={[
                    'px-4 h-10 border ui-hairline ui-button-uppercase text-xs transition-colors',
                    filter === status ? 'border-white text-white' : 'text-white/70 hover:text-white hover:border-white',
                  ].join(' ')}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xs ui-label-uppercase ui-text-body">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 border ui-hairline flex items-center justify-center">
                <FileText className="w-10 h-10 text-white/60" />
              </div>
              <p className="ui-text-body mb-6">No applications found</p>
              <Button onClick={() => navigate('/apply')}>
                <Plus className="w-5 h-5" />
                <span>Create Your First Application</span>
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b ui-hairline">
                      <th className="text-left py-4 px-4 text-xs ui-label-uppercase ui-text-body">Application</th>
                      <th className="text-left py-4 px-4 text-xs ui-label-uppercase ui-text-body">Amount</th>
                      <th className="text-left py-4 px-4 text-xs ui-label-uppercase ui-text-body">Tenure</th>
                      <th className="text-left py-4 px-4 text-xs ui-label-uppercase ui-text-body">Purpose</th>
                      <th className="text-left py-4 px-4 text-xs ui-label-uppercase ui-text-body">Status</th>
                      <th className="text-left py-4 px-4 text-xs ui-label-uppercase ui-text-body">Created</th>
                      <th className="text-center py-4 px-4 text-xs ui-label-uppercase ui-text-body">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-b ui-hairline hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 text-sm font-mono text-white/90">#{String(app.id).slice(-6)}</td>
                        <td className="py-4 px-4 text-sm text-white/90">₹{(app.requestedAmount || 0).toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm ui-text-body">{app.tenureMonths} months</td>
                        <td className="py-4 px-4 text-sm ui-text-body">{app.loanPurpose}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1.5 text-xs ui-label-uppercase border ${getStatusColor(app.status)}`}>
                            {app.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm ui-text-body">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Button size="sm" onClick={() => navigate(`/application/${app.id}`)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t ui-hairline">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-2 px-4 h-10 border ui-hairline ui-button-uppercase text-xs text-white/80 hover:text-white hover:border-white disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>
                <p className="text-xs ui-label-uppercase ui-text-body">
                  Page {page + 1} of {totalPages}
                </p>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  className="flex items-center gap-2 px-4 h-10 border ui-hairline ui-button-uppercase text-xs text-white/80 hover:text-white hover:border-white disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LoanList;
