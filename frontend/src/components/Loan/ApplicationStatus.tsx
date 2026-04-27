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
  const { applicationId, stageIndex } = useParams();
  const navigate = useNavigate();
  const activeStage = stageIndex ? parseInt(stageIndex) : null;

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

  // KYC form & wizard state
  const [kycForm, setKycForm] = useState({ pan: '', aadhaarLast4: '', otp: '' });
  const [kycStep, setKycStep] = useState(1);
  const [simulatedKycAction, setSimulatedKycAction] = useState('');

  // Document upload form
  const [docForm, setDocForm] = useState({ documentType: '', fileName: '' });
  const [docVerifyStep, setDocVerifyStep] = useState(0);
  const [simulatedDocAction, setSimulatedDocAction] = useState('');

  // Credit Assessment
  const [creditVerifyStep, setCreditVerifyStep] = useState(0);
  const [simulatedCreditAction, setSimulatedCreditAction] = useState('');

  // Loan Offer & Configurator
  const [offerGenStep, setOfferGenStep] = useState(0);
  const [simulatedOfferAction, setSimulatedOfferAction] = useState('');
  const [offerAmount, setOfferAmount] = useState<number | null>(null);
  const [offerTenure, setOfferTenure] = useState<number | null>(null);

  // Disbursement form
  const [disbForm, setDisbForm] = useState({ bankAccount: '', ifsc: '' });

  // Agreement consent
  const [agreementConsent, setAgreementConsent] = useState(false);

  // View state: Track which stage "page" is currently selected


  // Stage 07: Acceptance & Consent
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [kfsAcknowledged, setKfsAcknowledged] = useState(false);
  const [emiDate, setEmiDate] = useState('5th');
  const [repaymentMode, setRepaymentMode] = useState('NACH');
  const [insuranceOptIn, setInsuranceOptIn] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [acceptanceOtp, setAcceptanceOtp] = useState('');
  const [simulatedAcceptanceAction, setSimulatedAcceptanceAction] = useState('');

  // Stage 08: Legal Agreement & Execution
  const [agreementStep, setAgreementStep] = useState(0);
  const [simulatedAgreementAction, setSimulatedAgreementAction] = useState('');
  const [hasScrolledAgreement, setHasScrolledAgreement] = useState(false);
  const [showEsignOtpModal, setShowEsignOtpModal] = useState(false);
  const [esignOtp, setEsignOtp] = useState('');

  // Stage 09: Loan Disbursement
  const [disbStep, setDisbStep] = useState(0);
  const [simulatedDisbAction, setSimulatedDisbAction] = useState('');

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

  const currentStepIndex = STATUS_FLOW.indexOf(application?.status || 'DRAFT');
  const maxAccessibleStage = Math.min(currentStepIndex + 2, 8);

  useEffect(() => {
    // Redirect logic: If no stage specified, or if accessing a locked stage
    if (!loading && application) {
      if (!stageIndex) {
        navigate(`/application/${applicationId}/${maxAccessibleStage}`, { replace: true });
      } else if (activeStage && activeStage > maxAccessibleStage) {
        // User tried to access a future stage manually via URL
        navigate(`/application/${applicationId}/${maxAccessibleStage}`, { replace: true });
      }
    }
  }, [loading, application, stageIndex, activeStage, maxAccessibleStage, applicationId, navigate]);

  // ── Stage 03: KYC ──
  const handleNextKycStep = () => {
    if (kycStep === 1) {
      setSimulatedKycAction('Verifying PAN with NSDL/UTI...');
      setActionLoading(true);
      setTimeout(() => {
        setActionLoading(false);
        setSimulatedKycAction('');
        setKycStep(2);
      }, 1500);
    } else if (kycStep === 2) {
      setSimulatedKycAction('Triggering OTP to Aadhaar-linked mobile via UIDAI...');
      setActionLoading(true);
      setTimeout(() => {
        setActionLoading(false);
        setSimulatedKycAction('');
        setKycStep(3);
      }, 1500);
    } else if (kycStep === 3) {
      setSimulatedKycAction('Verifying OTP and retrieving Aadhaar XML...');
      setActionLoading(true);
      setTimeout(() => {
        setActionLoading(false);
        setSimulatedKycAction('');
        setKycStep(4);
      }, 1500);
    } else if (kycStep === 4) {
      // Simulate CKYC, Address Match, Video KYC, Fraud Check
      setSimulatedKycAction('Running CKYC, Address Match, and AML/Fraud Screening...');
      setActionLoading(true);
      setTimeout(() => {
        setActionLoading(false);
        setSimulatedKycAction('');

        // Finalize KYC
        performAction(async () => {
          await api.post(`/workflow/applications/${applicationId}/kyc`, {
            pan: kycForm.pan,
            aadhaarLast4: kycForm.aadhaarLast4,
          });
        }, 'KYC verification completed successfully!');
      }, 2500);
    }
  };

  // ── Stage 04: Document Upload ──
  const handleDocumentUpload = () => {
    if (!docForm.documentType || !docForm.fileName) return;
    performAction(async () => {
      await api.post(`/workflow/applications/${applicationId}/documents`, {
        documentType: docForm.documentType,
        fileName: docForm.fileName || `${docForm.documentType.toLowerCase().replace(/\s/g, '_')}.pdf`,
      });
      setDocForm({ documentType: '', fileName: '' });
    }, 'Document uploaded successfully!');
  };

  const handleAutoVerifyDocs = () => {
    setSimulatedDocAction('Initializing OCR Engine (Tesseract + ML)...');
    setActionLoading(true);
    setDocVerifyStep(1);

    setTimeout(() => {
      setSimulatedDocAction('Running Document Quality Check (Resolution, Anti-Tampering)...');
      setDocVerifyStep(2);
    }, 1500);

    setTimeout(() => {
      setSimulatedDocAction('Cross-verifying extracted data against application...');
      setDocVerifyStep(3);
    }, 3000);

    setTimeout(() => {
      setSimulatedDocAction('Analyzing Bank Statements (Finbox AI)...');
      setDocVerifyStep(4);
    }, 4500);

    setTimeout(() => {
      setSimulatedDocAction('Finalizing Document Completeness Check...');
      setDocVerifyStep(5);
    }, 6000);

    setTimeout(() => {
      setSimulatedDocAction('');
      setDocVerifyStep(0);

      performAction(async () => {
        await api.post(`/workflow/applications/${applicationId}/documents/auto-verify`);
      }, 'All documents processed and verified successfully!');
    }, 7500);
  };

  // ── Stage 05: Credit Assessment ──
  const handleCreditAssessment = () => {
    setSimulatedCreditAction('5.1 Pulling Credit Bureau Reports (CIBIL/Experian)...');
    setActionLoading(true);
    setCreditVerifyStep(1);

    setTimeout(() => {
      setSimulatedCreditAction('5.2 Evaluating Credit Score against Lender Policy...');
      setCreditVerifyStep(2);
    }, 1500);

    setTimeout(() => {
      setSimulatedCreditAction('5.3 Running ML Internal Scoring Model (50+ variables)...');
      setCreditVerifyStep(3);
    }, 3000);

    setTimeout(() => {
      setSimulatedCreditAction('5.4 Running Negative Policy Checks (NPA, Fraud, Past Due)...');
      setCreditVerifyStep(4);
    }, 4500);

    setTimeout(() => {
      setSimulatedCreditAction('5.5 Calculating Debt-to-Income (DTI) Ratio...');
      setCreditVerifyStep(5);
    }, 6000);

    setTimeout(() => {
      setSimulatedCreditAction('5.6 STP Decision Engine Evaluating Automated Approval...');
      setCreditVerifyStep(6);
    }, 7500);

    setTimeout(() => {
      setSimulatedCreditAction('');
      setCreditVerifyStep(0);
      performAction(async () => {
        // We submit a score that ensures STP approval for the happy path
        await api.post(`/workflow/applications/${applicationId}/credit`, {
          bureauScore: 785,
          internalScore: 820,
        });
      }, 'Credit assessment completed successfully via STP!');
    }, 9000);
  };

  // ── Stage 06: Offer Generation ──
  const handleOfferGeneration = () => {
    setSimulatedOfferAction('6.1 Triggering Pricing Engine (Base Rate + Risk Premium)...');
    setActionLoading(true);
    setOfferGenStep(1);

    setTimeout(() => {
      setSimulatedOfferAction('6.2 Calculating Processing Fees & Charges...');
      setOfferGenStep(2);
    }, 1500);

    setTimeout(() => {
      setSimulatedOfferAction('6.3 Generating Complete Amortisation Schedule (EMI break-up)...');
      setOfferGenStep(3);
    }, 3000);

    setTimeout(() => {
      setSimulatedOfferAction('6.6 Generating Sanction Letter PDF & Triggering Communications...');
      setOfferGenStep(4);
    }, 4500);

    setTimeout(() => {
      setSimulatedOfferAction('6.7 Compiling Key Facts Statement (KFS)...');
      setOfferGenStep(5);
    }, 6000);

    setTimeout(() => {
      setSimulatedOfferAction('');
      setOfferGenStep(0);
      performAction(async () => {
        await api.post(`/workflow/applications/${applicationId}/offer`);
      }, 'Personalized loan offer generated successfully!');
    }, 7500);
  };

  // ── Stage 07: Offer Accept / Reject ──
  const handleOfferAcceptance = (accepted: boolean) =>
    performAction(async () => {
      await api.post(`/workflow/applications/${applicationId}/offer/accept`, { accepted });
      setShowRejectConfirm(false);
      setSimulatedAcceptanceAction('');
    }, accepted ? 'Legally bound offer accepted digitally!' : 'Offer declined.');

  const handleDigitalAcceptance = () => {
    setSimulatedAcceptanceAction('7.6 Triggering OTP to registered mobile for final authentication...');
    setActionLoading(true);

    setTimeout(() => {
      setSimulatedAcceptanceAction('');
      setShowOtpModal(true);
      setActionLoading(false);
    }, 2000);
  };

  const handleVerifyAcceptanceOtp = () => {
    if (acceptanceOtp.length < 6) return;
    setShowOtpModal(false);
    setSimulatedAcceptanceAction('7.7 Immutably recording acceptance (Timestamp, IP, Device Hash, OTP Hash)...');
    setActionLoading(true);

    setTimeout(() => {
      handleOfferAcceptance(true);
    }, 3500);
  };

  // ── Stage 08: Agreement ──
  const handleAgreementExecution = () => {
    setSimulatedAgreementAction('8.1 Generating Loan Agreement PDF (populating customer & loan data)...');
    setActionLoading(true);
    setAgreementStep(1);

    setTimeout(() => {
      setSimulatedAgreementAction('8.2 Generating ancillary docs: DPN, NACH Mandate, MITC, KFS bundle...');
      setAgreementStep(2);
    }, 1500);

    setTimeout(() => {
      setSimulatedAgreementAction('8.7 Calculating Stamp Duty & Integrating with e-Stamp portal (Protean)...');
      setAgreementStep(3);
    }, 3000);

    setTimeout(() => {
      setSimulatedAgreementAction('');
      setAgreementStep(0);
      setActionLoading(false);
      // After generation, we stay in ACCEPTED state but show the "Review & Sign" UI
    }, 4500);
  };

  const handleAadhaarEsign = () => {
    setSimulatedAgreementAction('8.4 Initiating Aadhaar OTP-based eSign (via NSDL e-Gov/UIDAI)...');
    setActionLoading(true);

    setTimeout(() => {
      setSimulatedAgreementAction('');
      setShowEsignOtpModal(true);
      setActionLoading(false);
    }, 2000);
  };

  const handleVerifyEsignOtp = () => {
    if (esignOtp.length < 6) return;
    setShowEsignOtpModal(false);
    setSimulatedAgreementAction('8.5 Applying Customer DSC & NBFC countersignature (Lender DSC)...');
    setActionLoading(true);

    setTimeout(() => {
      setSimulatedAgreementAction('8.6 Storing immutable signed PDF & Generating hash verification audit log...');
    }, 2000);

    setTimeout(() => {
      setSimulatedAgreementAction('8.8 Final compliance check: AML re-run & Disbursement instruction creation...');
    }, 4000);

    setTimeout(() => {
      performAction(async () => {
        await api.post(`/workflow/applications/${applicationId}/agreement`);
      }, 'Agreement legally executed and digitally signed via Aadhaar eSign!');
      setSimulatedAgreementAction('');
    }, 6000);
  };

  // ── Stage 09: Disbursement ──
  const handleDisbursement = () => {
    setSimulatedDisbAction('9.1 Triggering Penny Drop (₹1) for beneficiary name match (>80% fuzzy match)...');
    setActionLoading(true);
    setDisbStep(1);

    setTimeout(() => {
      setSimulatedDisbAction('9.2 Finalising Net Disbursement calculation (Sanctioned - Fee - Insurance)...');
      setDisbStep(2);
    }, 1500);

    setTimeout(() => {
      setSimulatedDisbAction('9.3 Creating Disbursement Instruction (Beneficiary, IFSC, Mode: IMPS)...');
      setDisbStep(3);
    }, 3000);

    setTimeout(() => {
      setSimulatedDisbAction('9.4 Maker-Checker Approval: STP engine auto-approving payment instruction...');
      setDisbStep(4);
    }, 4500);

    setTimeout(() => {
      setSimulatedDisbAction('9.5 Payment Execution: Transmitting via NPCI payment rails (IMPS 24x7)...');
      setDisbStep(5);
    }, 6000);

    setTimeout(() => {
      setSimulatedDisbAction('9.6 Loan Activation: Generating LAN & Onboarding to Loan Ledger (LMS)...');
      setDisbStep(6);
    }, 7500);

    setTimeout(() => {
      performAction(async () => {
        await api.post(`/workflow/applications/${applicationId}/disbursement`, {
          bankAccount: disbForm.bankAccount,
          ifsc: disbForm.ifsc,
        });
      }, 'Funds successfully disbursed! UTR generated and SMS/Email sent.');
      setSimulatedDisbAction('');
      setDisbStep(0);
    }, 9000);
  };

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

  const currentStatus = application?.status;

  // ── Dynamic EMI Calculations ──
  const principal = offerAmount ?? application?.sanctionedAmount ?? 0;
  const tenure = offerTenure ?? application?.requestedTenure ?? 12;
  const annualRate = application?.annualInterestRate || offerDetails?.apr || 12;
  const monthlyRate = annualRate / 12 / 100;

  const computedEmi = principal > 0 && monthlyRate > 0 && tenure > 0
    ? Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1))
    : 0;

  const totalInterest = Math.max(0, (computedEmi * tenure) - principal);

  // 7.5 Optional Insurance Calculation (e.g. 1.5% of principal)
  const simulatedInsurancePremium = insuranceOptIn ? Math.round(principal * 0.015) : 0;
  const totalCostOfLoan = totalInterest + (offerDetails?.processingFee || 0) + simulatedInsurancePremium;
  const finalDisbursement = principal - (offerDetails?.processingFee || 0) - simulatedInsurancePremium;

  const handleKfsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 10;
    if (bottom && !hasScrolledToBottom) setHasScrolledToBottom(true);
  };

  const handleAgreementScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 10;
    if (bottom && !hasScrolledAgreement) setHasScrolledAgreement(true);
  };

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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Application Status</h1>
              <p className="text-gray-500 font-medium">Application ID: <span className="text-indigo-600 font-bold">#{applicationId?.substring(0, 8)}</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Current Progress</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${((currentStepIndex + 1) / 8) * 100}%` }}></div>
                </div>
                <span className="text-sm font-black text-indigo-700">{Math.round(((currentStepIndex + 1) / 8) * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative px-2">
              {/* Background Line */}
              <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-0"></div>
              <div 
                className="absolute top-5 left-0 h-0.5 bg-indigo-600 transition-all duration-1000 -z-0" 
                style={{ width: `${(currentStepIndex / 7) * 100}%` }}
              ></div>

              {STATUS_FLOW.map((step, index) => {
                const stepNumber = index + 1;
                const isSelected = activeStage === stepNumber;
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isLocked = stepNumber > maxAccessibleStage;

                return (
                  <div 
                    key={step} 
                    className={`flex flex-col items-center flex-1 transition-all duration-300 ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105'} group relative z-10`}
                    onClick={() => {
                      if (!isLocked) {
                        navigate(`/application/${applicationId}/${stepNumber}`);
                      }
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300 ${
                        isSelected
                          ? 'bg-white border-4 border-indigo-600 text-indigo-700 shadow-xl scale-125'
                          : isCompleted
                          ? 'bg-indigo-600 text-white'
                          : isCurrent
                          ? 'bg-indigo-100 border-2 border-indigo-400 text-indigo-700'
                          : 'bg-white border-2 border-gray-200 text-gray-400'
                      }`}
                    >
                      {isLocked ? '🔒' : isCompleted ? '✓' : stepNumber}
                    </div>
                    <p className={`text-[10px] text-center w-20 leading-tight transition-all duration-300 ${isSelected ? 'font-black text-indigo-900 scale-110' : isLocked ? 'text-gray-400 font-normal' : 'text-gray-500 font-medium'}`}>
                      {STAGE_LABELS[step]?.split(' ').map((word, i) => <span key={i} className="block">{word}</span>)}
                    </p>
                  </div>
                );
              })}
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
            STAGE 01: APPLICATION SUMMARY
        ═══════════════════════════════════════════════ */}
        {activeStage === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">1</span>
              Application Initiated
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Borrower Name</p>
                  <p className="text-lg font-bold text-gray-800">{application?.fullName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Requested Loan</p>
                  <p className="text-lg font-bold text-gray-800">₹{application?.requestedAmount?.toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Employment Type</p>
                  <p className="text-lg font-bold text-gray-800">{application?.employmentType}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Submission Date</p>
                  <p className="text-lg font-bold text-gray-800">{new Date(application?.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t flex justify-between items-center">
              <p className="text-sm text-gray-500">Your application has been received. Please proceed to KYC verification.</p>
              <button 
                onClick={() => navigate(`/application/${applicationId}/2`)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                Continue to KYC →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            STAGE 02: KYC VERIFICATION
        ═══════════════════════════════════════════════ */}
        {activeStage === 2 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 animate-fadeIn">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">2</span>
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
          ) : currentStatus === 'DRAFT' || currentStatus === 'SUBMITTED' ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Complete your Know Your Customer (KYC) verification. This involves verifying your identity against government databases.
              </p>

              {/* Progress indicator for KYC */}
              <div className="flex items-center justify-between mb-6">
                {[
                  { step: 1, label: 'PAN' },
                  { step: 2, label: 'Aadhaar' },
                  { step: 3, label: 'OTP' },
                  { step: 4, label: 'System Checks' }
                ].map((s) => (
                  <div key={s.step} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${kycStep >= s.step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {kycStep > s.step ? '✓' : s.step}
                    </div>
                    <span className="text-xs text-gray-500">{s.label}</span>
                  </div>
                ))}
              </div>

              {simulatedKycAction && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                  <span className="text-sm">{simulatedKycAction}</span>
                </div>
              )}

              {!simulatedKycAction && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  {kycStep === 1 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800">Step 3.2: PAN Verification</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter PAN Number</label>
                        <input
                          type="text"
                          value={kycForm.pan}
                          onChange={(e) => setKycForm({ ...kycForm, pan: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-sm"
                          placeholder="ABCDE1234F"
                          maxLength={10}
                        />
                        <p className="text-xs text-gray-500 mt-1">We will verify your name with the Income Tax Department.</p>
                      </div>
                    </div>
                  )}

                  {kycStep === 2 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800">Step 3.3: Aadhaar eKYC</h3>
                      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded text-sm inline-block mb-2">
                        ✓ PAN Verified Successfully
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter Aadhaar Last 4 Digits</label>
                        <input
                          type="text"
                          value={kycForm.aadhaarLast4}
                          onChange={(e) => setKycForm({ ...kycForm, aadhaarLast4: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-sm"
                          placeholder="1234"
                          maxLength={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">An OTP will be sent to your Aadhaar-linked mobile number.</p>
                      </div>
                    </div>
                  )}

                  {kycStep === 3 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800">Step 3.4: Enter Aadhaar OTP</h3>
                      <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-2 rounded text-sm mb-4">
                        ℹ OTP sent to mobile linked with Aadhaar ending in {kycForm.aadhaarLast4}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-digit OTP</label>
                        <input
                          type="text"
                          value={kycForm.otp}
                          onChange={(e) => setKycForm({ ...kycForm, otp: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-sm tracking-widest text-lg"
                          placeholder="000000"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  )}

                  {kycStep === 4 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800">Step 3.5 - 3.8: Processing Compliance Checks</h3>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700 flex items-center gap-2"><span>⏳</span> Querying CKYC Registry...</p>
                        <p className="text-sm text-gray-700 flex items-center gap-2"><span>⏳</span> Cross-verifying address...</p>
                        {application?.requestedAmount > 200000 && (
                          <p className="text-sm text-indigo-700 flex items-center gap-2 font-semibold"><span>📷</span> Setting up Video KYC session...</p>
                        )}
                        <p className="text-sm text-gray-700 flex items-center gap-2"><span>⏳</span> Fraud & AML Screening against watchlists...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!simulatedKycAction && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleNextKycStep}
                    disabled={
                      (kycStep === 1 && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(kycForm.pan)) ||
                      (kycStep === 2 && !/^[0-9]{4}$/.test(kycForm.aadhaarLast4)) ||
                      (kycStep === 3 && kycForm.otp.length !== 6)
                    }
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg"
                  >
                    {kycStep === 4 ? 'Complete KYC' : 'Next Step'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">KYC not yet initiated</p>
          )}
          {kycDetails && (
            <div className="mt-8 pt-6 border-t flex justify-end">
              <button 
                onClick={() => navigate(`/application/${applicationId}/3`)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                Next: Document Upload →
              </button>
            </div>
          )}
        </div>
        )}

        {/* ═══════════════════════════════════════════════
            STAGE 03: DOCUMENT UPLOAD & VERIFICATION
        ═══════════════════════════════════════════════ */}
        {activeStage === 3 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 animate-fadeIn">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">3</span>
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
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${doc.verificationStatus === 'VERIFIED'
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

              {/* Simulation Action Bar */}
              {simulatedDocAction && (
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-3 text-indigo-700 font-medium mb-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-700"></div>
                    {simulatedDocAction}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(docVerifyStep / 5) * 100}%` }}></div>
                  </div>
                </div>
              )}

              {/* Auto-verify button */}
              {!simulatedDocAction && documents.some((d: any) => d.verificationStatus === 'PENDING') && (
                <button
                  onClick={handleAutoVerifyDocs}
                  disabled={actionLoading}
                  className="px-6 py-3 w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium shadow-sm flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <><span>✓</span> Start AI Document Verification (OCR)</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Upload form & Checklist — available when KYC is verified or draft */}
          {(currentStatus === 'DRAFT' || currentStatus === 'KYC_VERIFIED') && (
            <div className="border-t pt-6 mt-4">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                  <span>📋</span> Document Checklist Generated
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Based on your employment profile <strong>({application?.companyName ? 'Salaried Applicant' : 'Self-Employed / Business Owner'})</strong>, here is your required document checklist.
                  Accepted formats: PDF, JPG, PNG (Max size: 5MB).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-6">
                {[
                  { category: 'Identity Proof', reqSal: 'Aadhaar Card (via eKYC) + PAN Card', reqSelf: 'Aadhaar Card (via eKYC) + PAN Card', key: 'IDENTITY_PROOF' },
                  { category: 'Address Proof', reqSal: 'Aadhaar / Utility Bill / Passport', reqSelf: 'Aadhaar / Utility Bill / Property Tax Receipt', key: 'ADDRESS_PROOF' },
                  { category: 'Income Proof', reqSal: 'Last 3 months Salary Slips', reqSelf: 'Last 2 years ITR with computation / CA Certified P&L', key: 'INCOME_PROOF' },
                  { category: 'Employment Proof', reqSal: 'Offer Letter + Latest Appointment Letter', reqSelf: 'GST Registration / MSME Certificate', key: 'EMPLOYMENT_PROOF' },
                  { category: 'Bank Statement', reqSal: 'Last 6 months (primary salary account)', reqSelf: 'Last 12 months (primary business account)', key: 'BANK_STATEMENT' },
                  { category: 'Tax Documents', reqSal: 'Latest Form 16 (Part A + Part B)', reqSelf: 'Not applicable — ITR Acknowledgement instead', key: 'TAX_DOCUMENT' },
                  { category: 'Photograph', reqSal: 'Recent passport-size photo', reqSelf: 'Recent passport-size photo', key: 'PHOTO' },
                ].map(docType => {
                  const isUploaded = documents.some((d: any) => d.documentType === docType.key);
                  return (
                    <div key={docType.key} className="flex items-center justify-between bg-gray-50 border border-gray-200 p-4 rounded-lg hover:shadow-sm transition-shadow">
                      <div>
                        <p className="font-semibold text-gray-800">{docType.category}</p>
                        <p className="text-xs text-gray-500 mt-1"><span className="font-medium text-gray-700">Required:</span> {application?.companyName ? docType.reqSal : docType.reqSelf}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {isUploaded ? (
                          <span className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                            <span>✓</span> Uploaded
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setDocForm({ documentType: docType.key, fileName: e.target.files[0].name });
                                }
                              }}
                              className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                              accept=".pdf,.jpg,.png"
                            />
                            {docForm.documentType === docType.key && (
                              <button
                                onClick={handleDocumentUpload}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm transition-colors"
                              >
                                {actionLoading ? 'Uploading...' : 'Upload'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next Stage Button */}
          {documents.length > 0 && (
            <div className="mt-8 pt-6 border-t flex justify-end items-center gap-4">
              <p className="text-sm text-gray-500 italic">
                {currentStatus === 'KYC_VERIFIED' 
                  ? 'Please finalize your documents to unlock the Credit Assessment stage.' 
                  : 'Documents submitted. You can now proceed.'}
              </p>
              {currentStatus === 'KYC_VERIFIED' ? (
                <button 
                  onClick={handleAutoVerifyDocs}
                  disabled={actionLoading}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all flex items-center gap-2"
                >
                  {actionLoading ? 'Processing...' : 'Finalize & Submit Documents 🔓'}
                </button>
              ) : (
                <button 
                  onClick={() => navigate(`/application/${applicationId}/4`)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all flex items-center gap-2"
                >
                  Next: Credit Assessment →
                </button>
              )}
            </div>
          )}
        </div>
        )}

        {/* ═══════════════════════════════════════════════
            STAGE 04: CREDIT ASSESSMENT & UNDERWRITING
        ═══════════════════════════════════════════════ */}
        {activeStage === 4 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 animate-fadeIn">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">4</span>
            Credit Assessment & Underwriting
            {creditDetails && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${creditDetails.finalDecision === 'APPROVED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                }`}>
                {creditDetails.finalDecision}
              </span>
            )}
          </h2>

          {creditDetails ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">📊</div>
                <p className="text-sm font-semibold text-gray-500 mb-1 tracking-wide uppercase">Bureau Score</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-indigo-900">{creditDetails.bureauScore}</p>
                  <p className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Good</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">🤖</div>
                <p className="text-sm font-semibold text-gray-500 mb-1 tracking-wide uppercase">Internal ML Score</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-extrabold text-indigo-900">{creditDetails.internalScore}</p>
                  <p className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">/1000</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">🛡️</div>
                <p className="text-sm font-semibold text-gray-500 mb-1 tracking-wide uppercase">Risk Grade</p>
                <p className="text-3xl font-extrabold text-indigo-900">{creditDetails.riskGrade}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 tracking-wide uppercase">Policy Check</p>
                  <p className={`font-bold flex items-center gap-2 ${creditDetails.policyPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {creditDetails.policyPassed ? <><span className="text-xl">✓</span> Passed</> : <><span className="text-xl">✗</span> Failed</>}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 tracking-wide uppercase">STP Eligible</p>
                  <p className={`font-bold flex items-center gap-2 ${creditDetails.stpEligible ? 'text-green-600' : 'text-orange-600'}`}>
                    {creditDetails.stpEligible ? <><span className="text-xl">⚡</span> Auto-Approved</> : <><span className="text-xl">⏳</span> Manual Review</>}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 mb-1 tracking-wide uppercase">Decision Reason</p>
                <p className="text-sm font-medium text-gray-800">{creditDetails.decisionReason}</p>
              </div>
            </div>
          ) : (currentStatus === 'KYC_VERIFIED' || currentStatus === 'DOCS_COMPLETE') ? (
            <div>
              {/* Simulation Action Bar */}
              {simulatedCreditAction && (
                <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg mb-6">
                  <div className="flex items-center gap-3 text-purple-800 font-medium mb-4 text-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-800"></div>
                    {simulatedCreditAction}
                  </div>
                  <div className="w-full bg-purple-100 rounded-full h-2.5">
                    <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(creditVerifyStep / 6) * 100}%` }}></div>
                  </div>
                </div>
              )}

              {!simulatedCreditAction && (
                <div className="border-t pt-4">
                  <p className="text-gray-600 mb-6 bg-gray-50 p-4 rounded border border-gray-100">
                    <strong className="text-gray-800">Ready for Underwriting:</strong> The system will now run your application through our ML credit scoring engine, fetch bureau reports (CIBIL/Experian), check negative policies, calculate DTI, and attempt a Straight-Through Processing (STP) auto-approval.
                  </p>
                  <button
                    onClick={handleCreditAssessment}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg shadow-sm flex items-center gap-2"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <><span>⚡</span> Run Automated Credit Assessment (STP)</>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Application must complete KYC and Document Verification first.</p>
          )}
          {creditDetails && (
            <div className="mt-8 pt-6 border-t flex justify-end">
              <button 
                onClick={() => navigate(`/application/${applicationId}/5`)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                Next: View Loan Offer →
              </button>
            </div>
          )}
        </div>
        )}

        {/* ═══════════════════════════════════════════════
            STAGE 05: LOAN OFFER GENERATION
        ═══════════════════════════════════════════════ */}
        {activeStage === 5 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 animate-fadeIn">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">5</span>
            Loan Offer
            {offerDetails && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                ✓ Generated
              </span>
            )}
          </h2>

          {offerDetails ? (
            <div>
              <div className="bg-indigo-900 rounded-2xl p-8 mb-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-800 rounded-full blur-2xl opacity-50"></div>

                <h3 className="text-2xl font-bold mb-6">Your Pre-Approved Loan Offer</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                  <div>
                    <p className="text-indigo-300 text-sm mb-1 uppercase tracking-wider font-semibold">Net Sanctioned Amount</p>
                    <p className="text-4xl font-extrabold text-white">₹{principal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-indigo-300 text-sm mb-1 uppercase tracking-wider font-semibold">Interest Rate (APR)</p>
                    <p className="text-4xl font-extrabold text-green-400">{annualRate.toFixed(2)}% <span className="text-lg font-medium text-green-200">p.a.</span></p>
                  </div>
                  <div>
                    <p className="text-indigo-300 text-sm mb-1 uppercase tracking-wider font-semibold">Tenure</p>
                    <p className="text-4xl font-extrabold text-white">{tenure} <span className="text-lg font-medium text-indigo-200">months</span></p>
                  </div>
                  <div>
                    <p className="text-indigo-300 text-sm mb-1 uppercase tracking-wider font-semibold">Monthly EMI</p>
                    <p className="text-4xl font-extrabold text-white">₹{computedEmi.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-indigo-800 grid grid-cols-3 gap-6 relative z-10">
                  <div>
                    <p className="text-indigo-300 text-xs uppercase tracking-wider">Processing Fee (+GST)</p>
                    <p className="text-lg font-semibold">₹{offerDetails.processingFee?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-indigo-300 text-xs uppercase tracking-wider">Total Interest Payable</p>
                    <p className="text-lg font-semibold">₹{totalInterest.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-indigo-300 text-xs uppercase tracking-wider">Total Cost of Loan</p>
                    <p className="text-lg font-semibold">₹{totalCostOfLoan.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Offer Configurator (Step 6.5) */}
              {currentStatus === 'APPROVED' && !offerDetails.accepted && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span>🎛️</span> Customize Your Offer
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Loan Amount</label>
                        <span className="text-sm font-bold text-indigo-700">₹{principal.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="10000"
                        max={application?.sanctionedAmount || 500000}
                        step="10000"
                        value={principal}
                        onChange={(e) => setOfferAmount(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>₹10,000</span>
                        <span>Max Eligible: ₹{application?.sanctionedAmount?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Tenure (Months)</label>
                        <span className="text-sm font-bold text-indigo-700">{tenure} Months</span>
                      </div>
                      <input
                        type="range"
                        min="6"
                        max="60"
                        step="6"
                        value={tenure}
                        onChange={(e) => setOfferTenure(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>6 Months</span>
                        <span>60 Months</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Note: Changing the loan amount or tenure will dynamically recalculate your EMI and total interest payable. The final offer will be updated upon acceptance.
                  </p>
                </div>
              )}

              {/* Stage 07: Offer Review & Accept/Reject */}
              {currentStatus === 'APPROVED' && !offerDetails.accepted && (
                <div className="border-t pt-8 mt-8 border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold shadow-sm">7</span>
                    Offer Review & Digital Acceptance
                  </h3>

                  {simulatedAcceptanceAction && (
                    <div className="bg-purple-50 border border-purple-200 p-5 rounded-lg mb-6">
                      <div className="flex items-center gap-3 text-purple-800 font-medium text-lg">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-800"></div>
                        {simulatedAcceptanceAction}
                      </div>
                    </div>
                  )}

                  {!simulatedAcceptanceAction && !showOtpModal && (
                    <div className="space-y-8">

                      {/* Step 7.1 & 7.2: KFS Review and Scroll Gate */}
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                          <h4 className="font-bold text-gray-800 flex items-center gap-2">
                            <span>📄</span> Key Facts Statement (KFS)
                          </h4>
                          <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                            ⬇️ Download PDF
                          </button>
                        </div>
                        <div
                          className="h-48 overflow-y-scroll p-6 bg-gray-50/50 text-sm text-gray-700 leading-relaxed border-b border-gray-200"
                          onScroll={handleKfsScroll}
                        >
                          <p className="font-semibold mb-2">1. Loan Details</p>
                          <p>Sanctioned Amount: ₹{principal.toLocaleString()}</p>
                          <p>Interest Rate (Reducing Balance): {annualRate.toFixed(2)}% p.a.</p>
                          <p>Tenure: {tenure} Months</p>
                          <p className="font-semibold mt-4 mb-2">2. Fees & Charges</p>
                          <p>Processing Fee (+GST): ₹{offerDetails.processingFee?.toLocaleString()}</p>
                          <p>Optional Insurance Premium: ₹{simulatedInsurancePremium.toLocaleString()}</p>
                          <p className="font-semibold text-indigo-700 mt-2">Net Disbursement: ₹{finalDisbursement.toLocaleString()}</p>
                          <p className="font-semibold mt-4 mb-2">3. Repayment & Penalties</p>
                          <p>Monthly EMI: ₹{computedEmi.toLocaleString()}</p>
                          <p>Prepayment allowed after 6 EMIs without penalty.</p>
                          <p>Late payment penalty: 2% per month on the overdue amount.</p>
                          <p className="mt-8 italic text-center text-gray-500">(Scroll to the bottom to acknowledge)</p>
                          <div className="h-10"></div> {/* Buffer for scroll */}
                        </div>
                        <div className="p-4 bg-white">
                          <label className={`flex items-start gap-3 cursor-pointer ${!hasScrolledToBottom ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input
                              type="checkbox"
                              checked={kfsAcknowledged}
                              onChange={(e) => setKfsAcknowledged(e.target.checked)}
                              className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700 font-medium">
                              I confirm I have read and understood the Key Facts Statement (KFS) and all material terms of the loan.
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Step 7.3 & 7.4: Repayment Preferences */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span>📅</span> EMI Repayment Date</h4>
                          <select
                            value={emiDate}
                            onChange={(e) => setEmiDate(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                          >
                            <option value="1st">1st of every month</option>
                            <option value="5th">5th of every month</option>
                            <option value="10th">10th of every month</option>
                            <option value="15th">15th of every month</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-2">First EMI date calculated based on disbursement + cooling-off period.</p>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span>🏦</span> Repayment Mode</h4>
                          <select
                            value={repaymentMode}
                            onChange={(e) => setRepaymentMode(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                          >
                            <option value="NACH">NACH (Auto-debit from bank) - Recommended</option>
                            <option value="UPI">UPI AutoPay</option>
                            <option value="PDC">Post-Dated Cheques (PDC)</option>
                            <option value="SI">Standing Instruction</option>
                          </select>
                        </div>
                      </div>

                      {/* Step 7.5: Insurance Opt-in/Opt-out */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 opacity-10 text-9xl">🛡️</div>
                        <div className="relative z-10">
                          <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">Loan Protection Insurance (Optional)</h4>
                          <p className="text-sm text-blue-800 mb-4">Protect your family from the burden of repayment in case of unforeseen events (Life + Disability cover). The premium is deducted from the sanctioned amount.</p>
                          <label className="flex items-center gap-3 cursor-pointer bg-white/60 p-3 rounded-lg border border-blue-100 hover:bg-white transition-colors">
                            <input
                              type="checkbox"
                              checked={insuranceOptIn}
                              onChange={(e) => setInsuranceOptIn(e.target.checked)}
                              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="font-medium text-blue-900">
                              Yes, I want to secure my loan (+₹{Math.round(principal * 0.015).toLocaleString()})
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Step 7.6: Digital Acceptance Actions */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                          onClick={handleDigitalAcceptance}
                          disabled={actionLoading || !kfsAcknowledged}
                          className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2"
                        >
                          {actionLoading ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          ) : (
                            <><span>✍️</span> I Accept the Loan Terms</>
                          )}
                        </button>
                        <button
                          onClick={() => setShowRejectConfirm(true)}
                          disabled={actionLoading}
                          className="px-6 py-4 bg-white border-2 border-red-200 hover:border-red-600 hover:bg-red-50 text-red-600 rounded-xl font-bold transition-all"
                        >
                          Decline Offer
                        </button>
                      </div>

                      {showRejectConfirm && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-4">
                          <p className="text-red-800 font-bold mb-4 flex items-center gap-2">
                            <span>⚠️</span> Are you absolutely sure you want to decline this pre-approved offer?
                          </p>
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleOfferAcceptance(false)}
                              disabled={actionLoading}
                              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-semibold shadow-sm"
                            >
                              {actionLoading ? 'Processing...' : 'Yes, Withdraw Application'}
                            </button>
                            <button
                              onClick={() => setShowRejectConfirm(false)}
                              className="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-semibold"
                            >
                              Keep Offer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OTP Modal for Digital Acceptance */}
                  {showOtpModal && (
                    <div className="bg-white border-2 border-green-500 rounded-xl p-8 shadow-xl text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📱</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Digital Consent Required</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        To legally accept the offer of ₹{principal.toLocaleString()}, please enter the 6-digit OTP sent to your registered mobile number.
                      </p>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={acceptanceOtp}
                        onChange={(e) => setAcceptanceOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-48 text-center text-3xl tracking-[0.5em] font-bold py-3 border-b-2 border-gray-300 focus:border-green-500 outline-none mb-8 bg-transparent"
                      />
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => setShowOtpModal(false)}
                          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleVerifyAcceptanceOtp}
                          disabled={acceptanceOtp.length < 6 || actionLoading}
                          className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold rounded-lg shadow-md"
                        >
                          Verify & Sign
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
          ) : currentStatus === 'APPROVED' ? (
            <div>
              {/* Simulation Action Bar */}
              {simulatedOfferAction && (
                <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg mb-6">
                  <div className="flex items-center gap-3 text-blue-800 font-medium mb-4 text-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-800"></div>
                    {simulatedOfferAction}
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(offerGenStep / 5) * 100}%` }}></div>
                  </div>
                </div>
              )}

              {!simulatedOfferAction && (
                <div className="border-t pt-4">
                  <p className="text-gray-600 mb-6 bg-gray-50 p-4 rounded border border-gray-100">
                    <strong className="text-gray-800">Generate Your Personalized Offer:</strong> The pricing engine will now use your Risk Grade to determine the optimal interest rate, calculate processing fees, generate an amortization schedule, and compile your Key Facts Statement (KFS) per RBI guidelines.
                  </p>
                  <button
                    onClick={handleOfferGeneration}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg shadow-sm flex items-center gap-2"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <><span>📄</span> Generate Final Loan Offer & KFS</>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              {currentStatus === 'REJECTED' ? 'Application was rejected — no offer available' : 'Offer not yet generated'}
            </p>
          )}
          {offerDetails?.accepted && (
            <div className="mt-8 pt-6 border-t flex justify-end">
              <button 
                onClick={() => navigate(`/application/${applicationId}/6`)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                Next: Digital Agreement →
              </button>
            </div>
          )}
        </div>
        )}

        {/* ═══════════════════════════════════════════════
            STAGE 06: LEGAL AGREEMENT & SANCTION LETTER
        ═══════════════════════════════════════════════ */}
        {activeStage === 6 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 animate-fadeIn">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
            Legal Agreement & Execution
          </h2>

          {currentStatus === 'ACCEPTED' ? (
            <div className="space-y-6">
              {simulatedAgreementAction && (
                <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-lg">
                  <div className="flex items-center gap-3 text-indigo-800 font-medium text-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-800"></div>
                    {simulatedAgreementAction}
                  </div>
                  {agreementStep > 0 && (
                    <div className="w-full bg-indigo-100 rounded-full h-2.5 mt-4">
                      <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(agreementStep / 3) * 100}%` }}></div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 8.1 & 8.2: Document Package Generation */}
              {!simulatedAgreementAction && agreementStep === 0 && !hasScrolledAgreement && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-800 mb-2">Legal Document Package</h3>
                  <p className="text-sm text-gray-600 mb-4">The system needs to generate your personalized loan agreement, demand promissory note, and mandatory regulatory disclosures.</p>
                  <button
                    onClick={handleAgreementExecution}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center gap-2"
                  >
                    {actionLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : '📄 Generate Signing Package'}
                  </button>
                </div>
              )}

              {/* Step 8.3: Document Review (Scroll Gate) */}
              {!simulatedAgreementAction && !showEsignOtpModal && agreementStep === 0 && (hasScrolledAgreement || currentStatus === 'ACCEPTED') && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-xl">ℹ️</span>
                    <p className="text-sm text-blue-800 font-medium">Please review all documents in the bundle. The eSign button will activate once you've reviewed the entire agreement.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Document List */}
                    <div className="lg:col-span-1 space-y-3">
                      <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Signing Bundle (5 Documents)</h4>
                      {[
                        { id: 'LA', name: 'Loan Agreement', size: '1.2 MB' },
                        { id: 'DPN', name: 'Demand Promissory Note', size: '450 KB' },
                        { id: 'NACH', name: 'NACH / Auto-Debit Form', size: '600 KB' },
                        { id: 'SOC', name: 'Schedule of Charges', size: '320 KB' },
                        { id: 'MITC', name: 'MITC & KFS (Final)', size: '890 KB' }
                      ].map(doc => (
                        <div key={doc.id} className="bg-white border border-gray-200 p-3 rounded-lg flex items-center justify-between hover:border-indigo-300 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{doc.name}</p>
                              <p className="text-xs text-gray-500">{doc.size} • PDF</p>
                            </div>
                          </div>
                          <span className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">👁️</span>
                        </div>
                      ))}
                    </div>

                    {/* PDF Viewer Simulation */}
                    <div className="lg:col-span-2 bg-gray-800 rounded-xl overflow-hidden flex flex-col shadow-inner border-4 border-gray-700">
                      <div className="bg-gray-700 p-3 flex justify-between items-center text-white text-xs font-bold">
                        <span>PREVIEW: LOAN_AGREEMENT_V1.PDF</span>
                        <div className="flex gap-4">
                          <span>PAGE 1 OF 12</span>
                          <span className="cursor-pointer hover:text-indigo-300">⬇️ DOWNLOAD</span>
                        </div>
                      </div>
                      <div
                        className="h-96 overflow-y-scroll p-8 bg-white"
                        onScroll={handleAgreementScroll}
                      >
                        <div className="max-w-2xl mx-auto space-y-6 text-gray-800 font-serif">
                          <h1 className="text-2xl font-bold text-center border-b-2 border-black pb-4">LOAN AGREEMENT</h1>
                          <p className="text-sm">This Loan Agreement ("Agreement") is made on this day {new Date().toLocaleDateString()} between:</p>
                          <p className="text-sm font-bold">LENDER: FINTECH GLOBAL NBFC SERVICES LTD.</p>
                          <p className="text-sm font-bold uppercase">BORROWER: {application?.fullName}</p>

                          <div className="grid grid-cols-2 gap-4 border p-4 bg-gray-50 font-sans text-xs">
                            <div><strong>SANCTIONED AMOUNT:</strong> ₹{application?.sanctionedAmount?.toLocaleString()}</div>
                            <div><strong>INTEREST RATE:</strong> {application?.annualInterestRate}% p.a.</div>
                            <div><strong>TENURE:</strong> {application?.requestedTenure} Months</div>
                            <div><strong>MONTHLY EMI:</strong> ₹{offerDetails?.emi?.toLocaleString()}</div>
                          </div>

                          <div className="space-y-4 text-xs leading-relaxed">
                            <p><strong>1. REPAYMENT:</strong> The Borrower shall repay the Loan to the Lender in Equated Monthly Installments (EMIs) as per the schedule attached hereto.</p>
                            <p><strong>2. DEFAULT:</strong> In the event of default in payment of any EMI, the Borrower shall be liable to pay penal interest at the rate of 2% per month.</p>
                            <p><strong>3. PREPAYMENT:</strong> The Borrower may prepay the loan after 6 successful EMI payments without any additional charges.</p>
                            <p><strong>4. JURISDICTION:</strong> This Agreement shall be governed by the laws of India and courts at Mumbai shall have exclusive jurisdiction.</p>
                          </div>

                          <div className="h-64 flex items-end justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-400 italic">
                            {hasScrolledAgreement ? (
                              <div className="text-center">
                                <p className="text-green-600 font-bold not-italic">✓ End of Document Reached</p>
                                <p className="text-xs">Scroll capture successful at {new Date().toLocaleTimeString()}</p>
                              </div>
                            ) : (
                              'Scroll to the end to sign...'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 8.4: Aadhaar eSign Action */}
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleAadhaarEsign}
                      disabled={!hasScrolledAgreement || actionLoading}
                      className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 text-lg group"
                    >
                      <span className="text-2xl group-hover:rotate-12 transition-transform">✍️</span>
                      E-SIGN DOCUMENTS (AADHAAR OTP)
                    </button>
                  </div>
                </div>
              )}

              {/* Aadhaar eSign OTP Modal */}
              {showEsignOtpModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center animate-scaleIn">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <img src="https://upload.wikimedia.org/wikipedia/en/thumb/c/cf/Aadhaar_Logo.svg/1200px-Aadhaar_Logo.svg.png" alt="Aadhaar" className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Aadhaar eSign Authentication</h3>
                    <p className="text-gray-600 mb-8">
                      An OTP has been sent to the mobile number linked with your Aadhaar (ending in **{kycDetails?.aadhaarLast4 || 'XXXX'}).
                    </p>

                    <div className="flex flex-col gap-6">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="ENTER 6-DIGIT OTP"
                        value={esignOtp}
                        onChange={(e) => setEsignOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center text-2xl tracking-[0.3em] font-bold py-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none transition-colors"
                      />

                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowEsignOtpModal(false)}
                          className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleVerifyEsignOtp}
                          disabled={esignOtp.length < 6 || actionLoading}
                          className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-lg transition-colors"
                        >
                          {actionLoading ? 'Signing...' : 'Verify & eSign'}
                        </button>
                      </div>
                    </div>
                    <p className="mt-6 text-xs text-gray-500">
                      By clicking "Verify & eSign", you provide your consent to use your Aadhaar data for the purpose of digitally signing these loan documents via eSign ASP/ESP services.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : currentStatus === 'AGREEMENT_EXECUTED' || currentStatus === 'DISBURSED' || currentStatus === 'ACTIVE' ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-4 text-green-800 mb-4">
                <span className="text-3xl">✅</span>
                <div>
                  <h3 className="font-bold text-lg">Loan Agreement Fully Executed</h3>
                  <p className="text-sm">Signed digitally by Customer & Lender on {agreementDetails?.executedAt ? new Date(agreementDetails.executedAt).toLocaleString() : new Date().toLocaleString()}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors flex items-center gap-2">
                  ⬇️ Download Signed Agreement
                </button>
                <button className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors flex items-center gap-2">
                  ⬇️ Download MITC/KFS
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">This stage will activate once the loan offer is accepted in Stage 5.</p>
          )}
          {(currentStatus === 'AGREEMENT_EXECUTED' || currentStatus === 'DISBURSED' || currentStatus === 'ACTIVE') && (
            <div className="mt-8 pt-6 border-t flex justify-end">
              <button 
                onClick={() => navigate(`/application/${applicationId}/7`)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                Next: Final Disbursement →
              </button>
            </div>
          )}
        </div>
        )}

        {/* ═══════════════════════════════════════════════
            STAGE 07: LOAN DISBURSEMENT
        ═══════════════════════════════════════════════ */}
        {activeStage === 7 && (
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 animate-fadeIn">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">7</span>
            Loan Disbursement
            {disbursementDetails?.status === 'SUCCESS' && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                ✓ Disbursed
              </span>
            )}
          </h2>

          {disbursementDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl">💰</div>
                  <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Net Disbursed Amount</p>
                  <p className="text-3xl font-black text-green-800">₹{disbursementDetails.amount?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">UTR Number (Reference)</p>
                  <p className="font-mono text-lg font-bold text-gray-800">{disbursementDetails.utr}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Credit Timestamp</p>
                  <p className="font-semibold text-gray-800">
                    {disbursementDetails.disbursedAt ? new Date(disbursementDetails.disbursedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Final Ledger Entries (LMS)</h4>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Beneficiary Account:</span>
                      <span className="font-bold text-gray-800">{disbursementDetails.bankAccount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bank IFSC:</span>
                      <span className="font-bold text-gray-800">{disbursementDetails.ifsc}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-3">
                      <span className="text-gray-500">Loan Account Number (LAN):</span>
                      <span className="font-mono font-bold text-indigo-700">PL-{applicationId}-{Math.floor(1000 + Math.random() * 9000)}</span>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="flex items-center gap-2 text-green-800 font-bold mb-2">
                      <span>✅</span> Funds Transferred Successfully
                    </div>
                    <p className="text-xs text-green-700 leading-relaxed">
                      LMS has activated the repayment schedule. GST Invoice for processing fees has been emailed to your registered address.
                    </p>
                  </div>
                </div>
              </div>

              {(currentStatus === 'DISBURSED' || currentStatus === 'ACTIVE') && (
                <div className="pt-4">
                  <button
                    onClick={() => navigate(`/loan-dashboard/${applicationId}`)}
                    className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all flex items-center justify-center gap-3 text-lg"
                  >
                    <span>📅</span> View Repayment Schedule & LMS Dashboard
                  </button>
                </div>
              )}
            </div>
          ) : currentStatus === 'AGREEMENT_EXECUTED' ? (
            <div className="space-y-6">
              {simulatedDisbAction && (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl shadow-sm">
                  <div className="flex items-center gap-4 text-emerald-800 font-bold text-xl mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-800"></div>
                    {simulatedDisbAction}
                  </div>
                  <div className="w-full bg-emerald-100 rounded-full h-3">
                    <div className="bg-emerald-600 h-3 rounded-full transition-all duration-500" style={{ width: `${(disbStep / 6) * 100}%` }}></div>
                  </div>
                </div>
              )}

              {!simulatedDisbAction && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-start gap-4">
                    <span className="text-2xl mt-1">💡</span>
                    <div>
                      <p className="text-sm text-blue-900 font-bold mb-1">Step 9.1: Destination Account Verification</p>
                      <p className="text-xs text-blue-800 leading-relaxed">Please ensure the bank details below match your primary savings account. We will perform a Penny Drop test (₹1) to verify your name before the final transfer.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Destination Bank Account</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-400">🏦</span>
                        <input
                          type="text"
                          value={disbForm.bankAccount}
                          onChange={(e) => setDisbForm({ ...disbForm, bankAccount: e.target.value.replace(/\D/g, '') })}
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-colors font-mono tracking-wider"
                          placeholder="ACCOUNT NUMBER"
                          maxLength={18}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 ml-1">Example: 123456789012 (9-18 digits)</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Bank IFSC Code</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-400">🏢</span>
                        <input
                          type="text"
                          value={disbForm.ifsc}
                          onChange={(e) => setDisbForm({ ...disbForm, ifsc: e.target.value.toUpperCase() })}
                          className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-colors font-mono tracking-widest"
                          placeholder="IFSC CODE"
                          maxLength={11}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 ml-1">Example: SBIN0001234 (11 characters)</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
                      <h4 className="font-black text-gray-800 uppercase tracking-tighter text-lg">Disbursement Breakdown</h4>
                      <span className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded font-bold">LOCKED</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-600 font-medium">
                        <span>Sanctioned Principal</span>
                        <span>₹{application?.sanctionedAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-red-600 font-medium">
                        <span>Processing Fee (+GST)</span>
                        <span>-₹{offerDetails?.processingFee?.toLocaleString()}</span>
                      </div>
                      {simulatedInsurancePremium > 0 && (
                        <div className="flex justify-between text-red-600 font-medium">
                          <span>Insurance Premium</span>
                          <span>-₹{simulatedInsurancePremium.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                        <span className="text-gray-900 font-black text-xl uppercase">Net Transfer</span>
                        <span className="text-indigo-700 font-black text-3xl tracking-tighter">₹{finalDisbursement.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleDisbursement}
                    disabled={actionLoading || disbForm.bankAccount.length < 9 || disbForm.ifsc.length !== 11}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-black text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1"
                  >
                    {actionLoading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : '💰 TRIGGER FINAL DISBURSEMENT'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">This stage will activate once the Loan Agreement is executed in Stage 6.</p>
          )}
          {(disbursementDetails?.status === 'SUCCESS' || currentStatus === 'ACTIVE') && (
            <div className="mt-8 pt-6 border-t flex justify-end">
              <button 
                onClick={() => navigate(`/application/${applicationId}/8`)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                Next: Final Status →
              </button>
            </div>
          )}
        </div>
        )}

        {/* Stage 08: Post-Disbursement Stage */}
        {activeStage === 8 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Stage 8: Loan Active & Disbursed</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Your application process is complete. You can now manage your loan, view repayment schedules, and make payments from your personal dashboard.
            </p>
            <button
              onClick={() => navigate(`/loan-dashboard/${applicationId}`)}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
            >
              <span>📅</span> Go to Repayment Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationStatus;
