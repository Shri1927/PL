import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

// ── Stage label map ──
const STAGE_LABELS: Record<string, string> = {
  DRAFT: 'Application Initiated',
  KYC_VERIFIED: 'KYC Verified',
  DOCS_COMPLETE: 'Documents Verified',
  APPROVED: 'Credit Approved',
  REJECTED: 'Rejected',
  ACCEPTED: 'Offer Accepted',
  AGREEMENT_EXECUTED: 'Agreement Signed',
  DISBURSED: 'Funds Disbursed',
  ACTIVE: 'Loan Active',
  CLOSED: 'Loan Closed',
};

const STATUS_FLOW = [
  'DRAFT',
  'KYC_VERIFIED',
  'DOCS_COMPLETE',
  'APPROVED',
  'ACCEPTED',
  'AGREEMENT_EXECUTED',
  'DISBURSED',
  'ACTIVE',
];

const ApplicationStatus = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState<any>(null);
  const [kycDetails, setKycDetails] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [creditDetails, setCreditDetails] = useState<any>(null);
  const [offerDetails, setOfferDetails] = useState<any>(null);
  const [agreementDetails, setAgreementDetails] = useState<any>(null);
  const [disbursementDetails, setDisbursementDetails] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // KYC form
  const [kycForm, setKycForm] = useState({ pan: '', aadhaarLast4: '' });

  // Document upload form
  const [docForm, setDocForm] = useState({ documentType: '', fileName: '' });

  // Disbursement form
  const [disbForm, setDisbForm] = useState({ bankAccount: '', ifsc: '' });

  // Agreement consent
  const [agreementConsent, setAgreementConsent] = useState(false);

  // Offer rejection reason
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const fetchFullDetails = useCallback(async () => {
    try {
      const response = await api.get(`/workflow/applications/${applicationId}/details`);
      const data = response.data.data;
      setApplication(data.application);
      setKycDetails(data.kyc);
      setDocuments(data.documents || []);
      setCreditDetails(data.credit);
      setOfferDetails(data.offer);
      setAgreementDetails(data.agreement);
      setDisbursementDetails(data.disbursement);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchFullDetails();
  }, [fetchFullDetails]);

  const performAction = async (action: () => Promise<void>, successMsg: string) => {
    setActionLoading(true);
    setError('');
    setActionSuccess('');
    try {
      await action();
      setActionSuccess(successMsg);
      await fetchFullDetails();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Stage 03: KYC ──
  const handleKycVerification = () =>
    performAction(async () => {
      await api.post(`/workflow/applications/${applicationId}/kyc`, {
        pan: kycForm.pan,
        aadhaarLast4: kycForm.aadhaarLast4,
      });
    }, 'KYC verification completed successfully!');

  // ── Stage 04: Document Upload ──
  const handleDocumentUpload = () =>
    performAction(async () => {
      await api.post(`/workflow/applications/${applicationId}/documents`, {
        documentType: docForm.documentType,
        fileName: docForm.fileName || `${docForm.documentType.toLowerCase().replace(/\s/g, '_')}.pdf`,
      });
      setDocForm({ documentType: '', fileName: '' });
    }, 'Document uploaded successfully!');

  const handleAutoVerifyDocs = () =>
    performAction(async () => {
      await api.post(`/workflow/applications/${applicationId}/documents/auto-verify`);
    }, 'All documents verified successfully!');

  // ── Stage 05: Credit Assessment ──
  const handleCreditAssessment = () =>
    performAction(async () => {
      await api.post(`/workflow/applications/${applicationId}/credit`, {
        bureauScore: 750,
        internalScore: 500,
      });
    }, 'Credit assessment completed!');

  // ── Stage 06: Offer Generation ──
  const handleOfferGeneration = () =>
    performAction(async () => {
      await api.post(`/workflow/applications/${applicationId}/offer`);
    }, 'Loan offer generated!');

  // ── Stage 07: Offer Accept / Reject ──
  const handleOfferAcceptance = (accepted: boolean) =>
    performAction(async () => {
      await api.post(`/workflow/applications/${applicationId}/offer/accept`, { accepted });
      setShowRejectConfirm(false);
    }, accepted ? 'Offer accepted!' : 'Offer declined.');

  // ── Stage 08: Agreement ──
  const handleAgreementExecution = () =>
    performAction(async () => {
      await api.post(`/workflow/applications/${applicationId}/agreement`);
    }, 'Agreement executed and signed!');

  // ── Stage 09: Disbursement ──
  const handleDisbursement = () =>
    performAction(async () => {
      await api.post(`/workflow/applications/${applicationId}/disbursement`, {
        bankAccount: disbForm.bankAccount,
        ifsc: disbForm.ifsc,
      });
    }, 'Funds disbursed successfully!');

  // ── Rendering helpers ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading application details...</div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            ← Back to Dashboard
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        </div>
      </div>
    );
  }

  const currentStatus = application?.status || 'DRAFT';
  const currentStepIndex = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          ← Back to Dashboard
        </button>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}
        {actionSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            ✅ {actionSuccess}
            <button onClick={() => setActionSuccess('')} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Header + Status */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Application Status</h1>
              <p className="text-gray-600">
                Application ID: {applicationId} &nbsp;|&nbsp; Ref: {application?.applicationRef}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Current Status</p>
              <p className="text-2xl font-bold text-indigo-600">{STAGE_LABELS[currentStatus] || currentStatus}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STATUS_FLOW.map((step, index) => (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                      index <= currentStepIndex
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index < currentStepIndex ? '✓' : index + 1}
                  </div>
                  <p className="text-xs text-center text-gray-600 w-20 leading-tight">
                    {STAGE_LABELS[step]?.replace(' ', '\n') || step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Loan Summary */}
          <div className="grid grid-cols-4 gap-6 mb-4">
            <div>
              <p className="text-sm text-gray-600">Loan Amount</p>
              <p className="text-2xl font-bold text-gray-800">₹{application?.requestedAmount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tenure</p>
              <p className="text-2xl font-bold text-gray-800">{application?.tenureMonths} months</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Purpose</p>
              <p className="text-lg text-gray-800">{application?.loanPurpose}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stage</p>
              <p className="text-lg text-gray-800">{application?.stage}</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            STAGE 03: KYC VERIFICATION
        ═══════════════════════════════════════════════ */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">3</span>
            KYC Verification
            {kycDetails && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                ✓ Verified
              </span>
            )}
          </h2>

          {kycDetails ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">PAN</p>
                <p className="font-semibold text-gray-800">{kycDetails.pan}</p>
                <p className={`text-xs mt-1 ${kycDetails.panVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {kycDetails.panVerified ? '✓ Verified' : '✗ Not verified'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Aadhaar</p>
                <p className="font-semibold text-gray-800">{kycDetails.aadhaarToken}</p>
                <p className={`text-xs mt-1 ${kycDetails.aadhaarVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {kycDetails.aadhaarVerified ? '✓ Verified' : '✗ Not verified'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">CKYC Status</p>
                <p className="font-semibold text-gray-800">{kycDetails.ckycFound ? 'Found in CKYC' : 'Not in CKYC'}</p>
                <div className="flex gap-3 mt-1">
                  <p className={`text-xs ${kycDetails.fraudFlag ? 'text-red-600' : 'text-green-600'}`}>
                    Fraud: {kycDetails.fraudFlag ? '⚠ Flagged' : '✓ Clear'}
                  </p>
                  <p className={`text-xs ${kycDetails.amlFlag ? 'text-red-600' : 'text-green-600'}`}>
                    AML: {kycDetails.amlFlag ? '⚠ Flagged' : '✓ Clear'}
                  </p>
                </div>
              </div>
              {kycDetails.videoKycRequired && (
                <div className="col-span-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded text-sm">
                  ⚠ Video KYC is required for this loan amount
                </div>
              )}
            </div>
          ) : currentStatus === 'DRAFT' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter your PAN and Aadhaar details to verify your identity.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={kycForm.pan}
                    onChange={(e) => setKycForm({ ...kycForm, pan: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-400 mt-1">Format: 5 letters, 4 digits, 1 letter</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Last 4 Digits</label>
                  <input
                    type="text"
                    value={kycForm.aadhaarLast4}
                    onChange={(e) => setKycForm({ ...kycForm, aadhaarLast4: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
              </div>
              <button
                onClick={handleKycVerification}
                disabled={actionLoading || kycForm.pan.length !== 10 || kycForm.aadhaarLast4.length !== 4}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg"
              >
                {actionLoading ? 'Verifying...' : 'Verify KYC'}
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">KYC not yet initiated</p>
          )}
        </div>

        {/* ═══════════════════════════════════════════════
            STAGE 04: DOCUMENT UPLOAD & VERIFICATION
        ═══════════════════════════════════════════════ */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">4</span>
            Document Upload & Verification
            {currentStatus !== 'DRAFT' && documents.length > 0 && documents.every((d: any) => d.verificationStatus === 'VERIFIED') && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                ✓ All Documents Verified
              </span>
            )}
          </h2>

          {/* Document list */}
          {documents.length > 0 && (
            <div className="mb-6">
              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Type</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">File</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Quality Score</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc: any) => (
                    <tr key={doc.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 text-sm font-medium text-gray-800">{doc.documentType}</td>
                      <td className="py-2 px-3 text-sm text-gray-600">{doc.storageUrl?.split('/').pop()}</td>
                      <td className="py-2 px-3 text-sm text-gray-600">
                        {doc.qualityScore ? `${(parseFloat(doc.qualityScore) * 100).toFixed(0)}%` : 'N/A'}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            doc.verificationStatus === 'VERIFIED'
                              ? 'bg-green-100 text-green-800'
                              : doc.verificationStatus === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {doc.verificationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Auto-verify button */}
              {documents.some((d: any) => d.verificationStatus === 'PENDING') && (
                <button
                  onClick={handleAutoVerifyDocs}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm"
                >
                  {actionLoading ? 'Verifying...' : '✓ Verify All Documents (OCR)'}
                </button>
              )}
            </div>
          )}

          {/* Upload form — available when KYC is verified or draft */}
          {(currentStatus === 'DRAFT' || currentStatus === 'KYC_VERIFIED') && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">Upload required documents for verification.</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                  <select
                    value={docForm.documentType}
                    onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select type</option>
                    <option value="PAN_CARD">PAN Card</option>
                    <option value="AADHAAR_CARD">Aadhaar Card</option>
                    <option value="SALARY_SLIP">Salary Slip (3 months)</option>
                    <option value="BANK_STATEMENT">Bank Statement (6 months)</option>
                    <option value="ADDRESS_PROOF">Address Proof</option>
                    <option value="PHOTO">Passport Photo</option>
                    <option value="ITR">Income Tax Return</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                  <input
                    type="text"
                    value={docForm.fileName}
                    onChange={(e) => setDocForm({ ...docForm, fileName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="document.pdf"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleDocumentUpload}
                    disabled={actionLoading || !docForm.documentType}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg"
                  >
                    {actionLoading ? 'Uploading...' : '📎 Upload Document'}
                  </button>
                </div>
              </div>
              <div className="mt-3 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded text-sm">
                📋 Required documents: PAN Card, Aadhaar Card, Salary Slips, Bank Statement, Address Proof, Photo
              </div>
            </div>
          )}

          {currentStatus !== 'DRAFT' && currentStatus !== 'KYC_VERIFIED' && documents.length === 0 && (
            <p className="text-gray-500 text-sm">No documents were uploaded for this application.</p>
          )}
        </div>

        {/* ═══════════════════════════════════════════════
            STAGE 05: CREDIT ASSESSMENT & UNDERWRITING
        ═══════════════════════════════════════════════ */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">5</span>
            Credit Assessment & Underwriting
            {creditDetails && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                creditDetails.finalDecision === 'APPROVED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {creditDetails.finalDecision}
              </span>
            )}
          </h2>

          {creditDetails ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Bureau Score</p>
                <p className="text-2xl font-bold text-gray-800">{creditDetails.bureauScore}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Internal Score</p>
                <p className="text-2xl font-bold text-gray-800">{creditDetails.internalScore}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Risk Grade</p>
                <p className="text-2xl font-bold text-gray-800">{creditDetails.riskGrade}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Policy Check</p>
                <p className={`font-semibold ${creditDetails.policyPassed ? 'text-green-600' : 'text-red-600'}`}>
                  {creditDetails.policyPassed ? '✓ Passed' : '✗ Failed'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">STP Eligible</p>
                <p className={`font-semibold ${creditDetails.stpEligible ? 'text-green-600' : 'text-orange-600'}`}>
                  {creditDetails.stpEligible ? '✓ Yes' : '✗ Manual Review'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Decision Reason</p>
                <p className="text-sm text-gray-700">{creditDetails.decisionReason}</p>
              </div>
            </div>
          ) : (currentStatus === 'KYC_VERIFIED' || currentStatus === 'DOCS_COMPLETE') ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Credit bureau check and underwriting assessment will be performed.
              </p>
              <button
                onClick={handleCreditAssessment}
                disabled={actionLoading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg"
              >
                {actionLoading ? 'Assessing...' : 'Start Credit Assessment'}
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Credit assessment not yet initiated</p>
          )}
        </div>

        {/* ═══════════════════════════════════════════════
            STAGE 06: LOAN OFFER GENERATION
        ═══════════════════════════════════════════════ */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">6</span>
            Loan Offer
            {offerDetails && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                ✓ Generated
              </span>
            )}
          </h2>

          {offerDetails ? (
            <div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                  <p className="text-xs text-indigo-600 font-semibold">APR</p>
                  <p className="text-2xl font-bold text-indigo-800">{offerDetails.apr?.toFixed(2)}%</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <p className="text-xs text-green-600 font-semibold">Sanctioned Amount</p>
                  <p className="text-2xl font-bold text-green-800">₹{application?.sanctionedAmount?.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                  <p className="text-xs text-orange-600 font-semibold">Processing Fee</p>
                  <p className="text-2xl font-bold text-orange-800">₹{offerDetails.processingFee?.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <p className="text-xs text-purple-600 font-semibold">Valid Till</p>
                  <p className="text-lg font-bold text-purple-800">
                    {offerDetails.validTill ? new Date(offerDetails.validTill).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Stage 07: Offer Review & Accept/Reject */}
              {currentStatus === 'APPROVED' && !offerDetails.accepted && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mr-2">7</span>
                    Review & Accept Offer
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Terms & Conditions</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Interest rate: {offerDetails.apr?.toFixed(2)}% per annum (reducing balance)</li>
                      <li>Processing fee of ₹{offerDetails.processingFee?.toLocaleString()} will be deducted at disbursement</li>
                      <li>Tenure: {application?.tenureMonths} months with equated monthly installments</li>
                      <li>Prepayment allowed after 6 EMIs with no penalty</li>
                      <li>Late payment penalty: 2% per month on overdue amount</li>
                      <li>Insurance premium: ₹{offerDetails.insurancePremium?.toLocaleString() || '0'}</li>
                      <li>This offer is valid until {offerDetails.validTill ? new Date(offerDetails.validTill).toLocaleDateString() : 'N/A'}</li>
                    </ul>
                  </div>

                  {!showRejectConfirm ? (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleOfferAcceptance(true)}
                        disabled={actionLoading}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-semibold"
                      >
                        {actionLoading ? 'Processing...' : '✓ Accept Offer'}
                      </button>
                      <button
                        onClick={() => setShowRejectConfirm(true)}
                        disabled={actionLoading}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-semibold"
                      >
                        ✗ Decline Offer
                      </button>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 font-semibold mb-3">
                        Are you sure you want to decline this offer? This action cannot be undone.
                      </p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleOfferAcceptance(false)}
                          disabled={actionLoading}
                          className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg"
                        >
                          {actionLoading ? 'Processing...' : 'Yes, Decline Offer'}
                        </button>
                        <button
                          onClick={() => setShowRejectConfirm(false)}
                          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {offerDetails.accepted && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded text-sm mt-2">
                  ✅ Offer accepted on {offerDetails.acceptedAt ? new Date(offerDetails.acceptedAt).toLocaleString() : 'N/A'}
                </div>
              )}
            </div>
          ) : currentStatus === 'APPROVED' || (creditDetails && creditDetails.finalDecision === 'APPROVED' && !offerDetails) ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">Application is approved. Generate the loan offer.</p>
              <button
                onClick={handleOfferGeneration}
                disabled={actionLoading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg"
              >
                {actionLoading ? 'Generating...' : 'Generate Loan Offer'}
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              {currentStatus === 'REJECTED' ? 'Application was rejected — no offer available' : 'Offer not yet generated'}
            </p>
          )}
        </div>

        {/* ═══════════════════════════════════════════════
            STAGE 08: LEGAL AGREEMENT & SANCTION LETTER
        ═══════════════════════════════════════════════ */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">8</span>
            Legal Agreement & Sanction Letter
            {agreementDetails?.signed && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                ✓ Signed
              </span>
            )}
          </h2>

          {agreementDetails ? (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Agreement Hash</p>
                  <p className="font-mono text-sm text-gray-800 break-all">{agreementDetails.agreementHash}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Signed At</p>
                  <p className="font-semibold text-gray-800">
                    {agreementDetails.signedAt ? new Date(agreementDetails.signedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="font-semibold text-green-800">Sanction Letter & Agreement Document</p>
                    <p className="text-sm text-green-700">
                      Document URL: <span className="font-mono">{agreementDetails.signedDocumentUrl}</span>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Digitally signed and verified
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : currentStatus === 'ACCEPTED' ? (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">📋 Loan Agreement Summary</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Sanctioned Amount: ₹{application?.sanctionedAmount?.toLocaleString()}</li>
                  <li>• Annual Interest Rate: {application?.annualInterestRate}%</li>
                  <li>• Tenure: {application?.tenureMonths} months</li>
                  <li>• Processing Fee: ₹{offerDetails?.processingFee?.toLocaleString()}</li>
                  <li>• Net Disbursement: ₹{(application?.sanctionedAmount - (offerDetails?.processingFee || 0))?.toLocaleString()}</li>
                </ul>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="agreementConsent"
                  checked={agreementConsent}
                  onChange={(e) => setAgreementConsent(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="agreementConsent" className="text-sm text-gray-700">
                  I have read and agree to the loan agreement terms, sanction letter conditions, and authorize digital signing of the agreement.
                </label>
              </div>

              <button
                onClick={handleAgreementExecution}
                disabled={actionLoading || !agreementConsent}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg"
              >
                {actionLoading ? 'Executing...' : '✍ Sign Agreement & Generate Sanction Letter'}
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Agreement not yet available</p>
          )}
        </div>

        {/* ═══════════════════════════════════════════════
            STAGE 09: LOAN DISBURSEMENT
        ═══════════════════════════════════════════════ */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">9</span>
            Loan Disbursement
            {disbursementDetails?.status === 'SUCCESS' && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                ✓ Disbursed
              </span>
            )}
          </h2>

          {disbursementDetails ? (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <p className="text-xs text-green-600 font-semibold">Disbursed Amount</p>
                  <p className="text-2xl font-bold text-green-800">₹{disbursementDetails.amount?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">UTR Number</p>
                  <p className="font-mono text-sm font-bold text-gray-800">{disbursementDetails.utr}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Disbursed At</p>
                  <p className="font-semibold text-gray-800">
                    {disbursementDetails.disbursedAt ? new Date(disbursementDetails.disbursedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Bank Account</p>
                  <p className="font-semibold text-gray-800">{disbursementDetails.bankAccount}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">IFSC Code</p>
                  <p className="font-semibold text-gray-800">{disbursementDetails.ifsc}</p>
                </div>
              </div>

              <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded text-sm">
                ✅ Funds successfully transferred. UTR: {disbursementDetails.utr}
              </div>

              {(currentStatus === 'DISBURSED' || currentStatus === 'ACTIVE') && (
                <div className="mt-4">
                  <button
                    onClick={() => navigate(`/emi-schedule/${applicationId}`)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    📅 View EMI Schedule & Make Payments
                  </button>
                </div>
              )}
            </div>
          ) : currentStatus === 'AGREEMENT_EXECUTED' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-3">
                Enter the bank account details where the loan amount should be disbursed.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={disbForm.bankAccount}
                    onChange={(e) => setDisbForm({ ...disbForm, bankAccount: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="123456789012"
                    maxLength={18}
                  />
                  <p className="text-xs text-gray-400 mt-1">9-18 digit account number</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={disbForm.ifsc}
                    onChange={(e) => setDisbForm({ ...disbForm, ifsc: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="SBIN0001234"
                    maxLength={11}
                  />
                  <p className="text-xs text-gray-400 mt-1">Format: 4 letters + 0 + 6 alphanumeric</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">Disbursement Summary:</p>
                <p>Sanctioned: ₹{application?.sanctionedAmount?.toLocaleString()}</p>
                <p>Processing Fee: -₹{offerDetails?.processingFee?.toLocaleString() || '0'}</p>
                <p className="font-bold mt-1">
                  Net Amount to Transfer: ₹{(application?.sanctionedAmount - (offerDetails?.processingFee || 0) - (offerDetails?.insurancePremium || 0))?.toLocaleString()}
                </p>
              </div>

              <button
                onClick={handleDisbursement}
                disabled={actionLoading || disbForm.bankAccount.length < 9 || disbForm.ifsc.length !== 11}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-semibold"
              >
                {actionLoading ? 'Processing...' : '💰 Disburse Funds'}
              </button>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Disbursement not yet available</p>
          )}
        </div>

        {/* ═══════════════════════════════════════════════
            STAGE 10: POST-DISBURSEMENT LINK
        ═══════════════════════════════════════════════ */}
        {(currentStatus === 'DISBURSED' || currentStatus === 'ACTIVE') && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">10</span>
              Post-Disbursement & Repayment
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Your loan is active. View your EMI schedule, make payments, and track your repayment progress.
            </p>
            <button
              onClick={() => navigate(`/emi-schedule/${applicationId}`)}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
            >
              📅 View EMI Schedule & Make Payments
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationStatus;
