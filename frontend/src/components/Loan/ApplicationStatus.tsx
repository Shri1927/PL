import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Eye, Compass, ShoppingBag, 
  CheckCircle, XCircle, RotateCcw, MessageSquare, 
  Clock, ArrowRight, BarChart2, Plus, FileText, 
  DollarSign, TrendingUp, LayoutDashboard, Lock, Shield, User, Briefcase, Building, Activity, ShieldCheck
} from 'lucide-react';
import api from '../../api';
import Sidebar from '../PremiumDashboard/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useWorkflow } from '../../context/WorkflowContext';
import StageProgressStepper from '../WorkflowStages/StageProgressStepper';
import StageCard from '../WorkflowStages/StageCard';
import MakerApprovalPanel from '../WorkflowStages/MakerApprovalPanel';

// ── Stage label map ──
const STAGE_LABELS: Record<string, string> = {
  DRAFT: 'Application Initiated',
  SUBMITTED: 'Pending Maker Review',
  MAKER_CHECKED: 'Maker Approved',
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
  'SUBMITTED',
  'MAKER_CHECKED',
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
  const { user } = useAuth();
  const { stages, fetchStages } = useWorkflow();
  
  const [viewMode, setViewMode] = useState<'USER' | 'MAKER'>('USER');
  const isMaker = user?.role === 'ADMIN' || user?.role === 'MAKER' || user?.role === 'LOAN_OFFICER';

  const activeStageId = stageIndex ? parseInt(stageIndex) : 1;
  const activeStage = stages.find(s => s.id === activeStageId) || stages[0];

  useEffect(() => {
    if (applicationId) {
      fetchStages(applicationId);
    }
  }, [applicationId, fetchStages]);

  useEffect(() => {
    if (isMaker && viewMode === 'USER') {
      // Potentially stay in user view or auto-switch
    }
  }, [isMaker, viewMode]);

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
  const maxAccessibleStage = application?.allowedStage || 1;

  useEffect(() => {
    // Redirect logic: If no stage specified, default to maxAccessibleStage
    if (!loading && application) {
      if (!stageIndex) {
        navigate(`/application/${applicationId}/${maxAccessibleStage}`, { replace: true });
      }
    }
  }, [loading, application, stageIndex, maxAccessibleStage, applicationId, navigate]);

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

  const AwaitingAuthorizationView = ({ stageNum }: { stageNum: number }) => (
    <div className="bg-[#2a2a32] border border-white/5 p-10 rounded-[40px] text-center">
      <div className="w-24 h-24 bg-amber-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-amber-400">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <Clock size={48} />
        </motion.div>
      </div>
      <h3 className="text-2xl font-black text-white mb-4">Awaiting Authorization</h3>
      <p className="text-gray-500 max-w-lg mx-auto mb-8 font-medium leading-relaxed">
        Our Maker Officer is currently reviewing your loan application details for <span className="text-amber-400">Stage {stageNum}</span>. 
        You will be notified once the application is approved for the next stage.
      </p>
      <div className="flex justify-center gap-4">
        <button 
          onClick={fetchFullDetails}
          className="px-8 py-4 bg-[#1e1e24] text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5 hover:bg-[#16161a] transition-all flex items-center gap-2"
        >
          <RotateCcw size={16} />
          Check Status
        </button>
      </div>
    </div>
  );
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
    <div className="flex bg-[#0f0f12] min-h-screen font-['Inter',sans-serif] text-gray-300 overflow-hidden">
      <Sidebar activeView="queue" onViewChange={() => navigate('/dashboard')} />

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-12 relative">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-2 bg-[#1e1e24] rounded-xl shadow-lg text-gray-500 hover:text-white transition-colors"
              >
                <ArrowRight size={20} className="rotate-180" />
              </button>
              <span className="text-gray-500 font-medium">Back to Dashboard</span>
            </div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-black text-white mb-1"
            >
              Application Workflow
            </motion.h1>
            <p className="text-gray-500 font-medium">
              ID: <span className="text-indigo-400 font-bold">#{applicationId?.substring(0, 8)}</span> • {application?.fullName}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Current Progress</p>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStepIndex + 1) / 10) * 100}%` }}
                    className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  />
                </div>
                <span className="text-sm font-black text-white">{Math.round(((currentStepIndex + 1) / 10) * 100)}%</span>
              </div>
            </div>
          </div>
        </header>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-6 py-4 rounded-3xl mb-8 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <XCircle size={20} />
                <span className="font-medium">{error}</span>
              </div>
              <button onClick={() => setError('')} className="text-rose-400/50 hover:text-rose-400">
                <XCircle size={20} />
              </button>
            </motion.div>
          )}
          {actionSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-4 rounded-3xl mb-8 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <CheckCircle size={20} />
                <span className="font-medium">{actionSuccess}</span>
              </div>
              <button onClick={() => setActionSuccess('')} className="text-emerald-400/50 hover:text-emerald-400">
                <XCircle size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline Navigation */}
        <div className="bg-[#1e1e24] p-8 rounded-[40px] border border-white/5 shadow-xl mb-12">
          <div className="flex items-center justify-between relative px-4">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 w-full h-0.5 bg-white/5 -z-0"></div>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(currentStepIndex / 9) * 100}%` }}
              className="absolute top-5 left-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] -z-0"
            />

            {STATUS_FLOW.map((step, index) => {
              const stepNumber = index + 1;
              const isSelected = activeStageId === stepNumber;
              const isApproved = stepNumber <= maxAccessibleStage;
              const isLocked = stepNumber > maxAccessibleStage + 1;
              const isPendingCurrent = stepNumber === maxAccessibleStage + 1;

              return (
                <div 
                  key={step} 
                  className="flex flex-col items-center flex-1 cursor-pointer group relative z-10"
                  onClick={() => navigate(`/application/${applicationId}/${stepNumber}`)}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold mb-3 transition-all duration-300 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]'
                        : isApproved
                        ? 'bg-[#2a2a32] text-emerald-400 border border-emerald-500/30'
                        : isPendingCurrent
                        ? 'bg-[#2a2a32] text-amber-400 border border-amber-500/30 animate-pulse'
                        : 'bg-[#16161a] text-gray-600 border border-white/5'
                    }`}
                  >
                    {isApproved ? <CheckCircle size={18} /> : isLocked ? <Lock size={14} /> : stepNumber}
                  </motion.div>
                  <p className={`text-[10px] font-black uppercase tracking-widest text-center transition-all duration-300 ${
                    isSelected ? 'text-white' : isApproved ? 'text-emerald-500/60' : 'text-gray-500'
                  }`}>
                    {STAGE_LABELS[step]?.split(' ').map((word, i) => <span key={i} className="block leading-tight">{word}</span>)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Loan Quick Summary Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Loan Amount', value: `₹${application?.requestedAmount?.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-400' },
                { label: 'Tenure', value: `${application?.tenureMonths} Months`, icon: Clock, color: 'text-amber-400' },
                { label: 'Purpose', value: application?.loanPurpose, icon: ShoppingBag, color: 'text-emerald-400' },
                { label: 'Current Stage', value: STAGE_LABELS[application?.status || 'DRAFT'], icon: Activity, color: 'text-rose-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-[#1e1e24] p-5 rounded-[24px] border border-white/5 flex items-center gap-4">
                  <div className={`p-3 bg-black/20 rounded-xl ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
                    <p className="text-sm font-bold text-white truncate">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stage Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStageId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#1e1e24] rounded-[32px] border border-white/5 shadow-xl overflow-hidden"
              >
                {/* ═══════════════════════════════════════════════
                    STAGE 01: APPLICATION SUMMARY
                ═══════════════════════════════════════════════ */}
                {activeStageId === 1 && (
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                        <FileText size={22} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Application Initiated</h2>
                        <p className="text-gray-500 font-medium text-xs">Review your submitted application details</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Borrower Name', value: application?.fullName, icon: User },
                        { label: 'Requested Loan', value: `₹${application?.requestedAmount?.toLocaleString()}`, icon: DollarSign },
                        { label: 'Employment Type', value: application?.employmentType, icon: Briefcase },
                        { label: 'Submission Date', value: application?.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A', icon: Clock },
                      ].map((field, i) => (
                        <div key={i} className="bg-[#2a2a32] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                          <div className="p-2.5 bg-[#1e1e24] rounded-xl text-gray-400">
                            <field.icon size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{field.label}</p>
                            <p className="text-base font-bold text-white">{field.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 flex justify-between items-center">
                      {maxAccessibleStage < 2 ? (
                        isMaker ? (
                          <div className="w-full mt-4">
                            <MakerApprovalPanel applicationId={applicationId!} stage={{ id: activeStageId, name: STAGE_LABELS[STATUS_FLOW[activeStageId - 1]], status: 'pending' } as any} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 text-amber-400 bg-amber-400/10 px-5 py-3 rounded-xl border border-amber-400/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <p className="text-xs font-bold">Awaiting Maker Verification...</p>
                          </div>
                        )
                      ) : (
                        <>
                          <p className="text-xs text-gray-500 max-w-md font-medium">Your application has been received and approved for processing. Please proceed to the next step.</p>
                          <button 
                            onClick={() => navigate(`/application/${applicationId}/2`)}
                            className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all group"
                          >
                            <span>Continue to Review</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════
                    STAGE 02: PENDING MAKER REVIEW
                ═══════════════════════════════════════════════ */}
                {activeStageId === 2 && (
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl">
                        <Clock size={22} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Pending Maker Review</h2>
                        <p className="text-gray-500 font-medium text-xs">Internal verification in progress</p>
                      </div>
                    </div>

                    {activeStageId > maxAccessibleStage ? (
                      <AwaitingAuthorizationView stageNum={2} />
                    ) : (
                      <div className="bg-[#2a2a32] border border-white/5 p-8 rounded-[32px] text-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
                          <CheckCircle size={40} />
                        </div>
                        <h3 className="text-xl font-black text-white mb-4">Verification Complete</h3>
                        <p className="text-gray-500 max-w-lg mx-auto mb-8 font-medium text-sm leading-relaxed">
                          Your application has been verified by the Maker Officer. 
                          You can now proceed to the next stage.
                        </p>
                        
                        <button 
                          onClick={() => navigate(`/application/${applicationId}/3`)}
                          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all mx-auto group"
                        >
                          <span>Proceed to Maker Approved</span>
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════
                    STAGE 03: MAKER APPROVED
                ═══════════════════════════════════════════════ */}
                {activeStageId === 3 && (
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                        <CheckCircle size={22} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Maker Approved</h2>
                        <p className="text-gray-500 font-medium text-xs">Internal authorization successful</p>
                      </div>
                    </div>

                    {activeStageId > maxAccessibleStage ? (
                      <AwaitingAuthorizationView stageNum={3} />
                    ) : (
                      <div className="bg-[#2a2a32] border border-white/5 p-8 rounded-[32px] text-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
                          <CheckCircle size={40} />
                        </div>
                        <h3 className="text-xl font-black text-white mb-4">Authorization Successful</h3>
                        <p className="text-gray-500 max-w-lg mx-auto mb-8 font-medium text-sm leading-relaxed">
                          Your application has been successfully authorized by the Maker Officer. 
                          You can now proceed with KYC and Document verification.
                        </p>

                        <button 
                          onClick={() => navigate(`/application/${applicationId}/4`)}
                          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all mx-auto group"
                        >
                          <span>Proceed to KYC Verification</span>
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════
                    STAGE 04: KYC VERIFICATION
                ═══════════════════════════════════════════════ */}
                {activeStageId === 4 && (
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-violet-500/10 text-violet-400 rounded-2xl">
                          <Shield size={22} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white uppercase tracking-tight">KYC Verification</h2>
                          <p className="text-gray-500 font-medium text-xs">Identity & Compliance checks</p>
                        </div>
                      </div>
                      {kycDetails && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase">
                          <CheckCircle size={14} /> Verified
                        </div>
                      )}
                    </div>

                    {activeStageId > maxAccessibleStage ? (
                      <AwaitingAuthorizationView stageNum={4} />
                    ) : kycDetails ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { label: 'PAN Number', value: kycDetails.pan, status: kycDetails.panVerified ? 'Verified' : 'Pending', color: kycDetails.panVerified ? 'text-emerald-400' : 'text-amber-400' },
                          { label: 'Aadhaar Token', value: kycDetails.aadhaarToken, status: kycDetails.aadhaarVerified ? 'Verified' : 'Pending', color: kycDetails.aadhaarVerified ? 'text-emerald-400' : 'text-amber-400' },
                          { label: 'CKYC Status', value: kycDetails.ckycFound ? 'Found' : 'Not Found', status: kycDetails.ckycFound ? 'Confirmed' : 'System Search', color: kycDetails.ckycFound ? 'text-emerald-400' : 'text-gray-400' },
                        ].map((item, i) => (
                          <div key={i} className="bg-[#2a2a32] p-5 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="text-base font-bold text-white mb-2">{item.value}</p>
                            <span className={`text-[10px] font-black uppercase px-2 py-1 bg-white/5 rounded-lg ${item.color}`}>
                              {item.status}
                            </span>
                          </div>
                        ))}
                        
                        <div className="col-span-1 md:col-span-3 grid grid-cols-2 gap-4 mt-2">
                          <div className={`p-5 rounded-2xl border ${kycDetails.fraudFlag ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                            <div className="flex items-center gap-3">
                              {kycDetails.fraudFlag ? <XCircle size={16} /> : <CheckCircle size={16} />}
                              <span className="text-[10px] font-black uppercase tracking-wider">Fraud Check: {kycDetails.fraudFlag ? 'Flagged' : 'Clear'}</span>
                            </div>
                          </div>
                          <div className={`p-5 rounded-2xl border ${kycDetails.amlFlag ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                            <div className="flex items-center gap-3">
                              {kycDetails.amlFlag ? <XCircle size={16} /> : <CheckCircle size={16} />}
                              <span className="text-[10px] font-black uppercase tracking-wider">AML Screening: {kycDetails.amlFlag ? 'Flagged' : 'Clear'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (currentStatus === 'MAKER_CHECKED' || currentStatus === 'SUBMITTED' || currentStatus === 'DRAFT') ? (
                      <div className="space-y-6">
                        <div className="bg-[#2a2a32] p-8 rounded-[32px] border border-white/5">
                          <p className="text-gray-400 text-xs font-medium mb-8 leading-relaxed">
                            Complete your Know Your Customer (KYC) verification. This involves verifying your identity against government databases in real-time.
                          </p>

                          {/* Progress indicator for KYC */}
                          <div className="flex items-center justify-between mb-8 px-8">
                            {[
                              { step: 1, label: 'PAN' },
                              { step: 2, label: 'Aadhaar' },
                              { step: 3, label: 'OTP' },
                              { step: 4, label: 'Checks' }
                            ].map((s) => (
                              <div key={s.step} className="flex flex-col items-center flex-1 relative">
                                {s.step < 4 && (
                                  <div className={`absolute top-4 left-1/2 w-full h-px ${kycStep > s.step ? 'bg-indigo-500' : 'bg-white/5'}`} />
                                )}
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black z-10 transition-all duration-300 ${
                                  kycStep >= s.step 
                                    ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' 
                                    : 'bg-[#16161a] text-gray-600 border border-white/5'
                                }`}>
                                  {kycStep > s.step ? <CheckCircle size={14} /> : s.step}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-tighter mt-2 ${kycStep >= s.step ? 'text-white' : 'text-gray-600'}`}>
                                  {s.label}
                                </span>
                              </div>
                            ))}
                          </div>

                          {simulatedKycAction ? (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-8 rounded-3xl flex flex-col items-center gap-4">
                              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                              <span className="text-xs font-bold tracking-tight uppercase">{simulatedKycAction}</span>
                            </div>
                          ) : (
                            <div className="bg-[#16161a] p-8 rounded-3xl border border-white/5">
                              {kycStep === 1 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                  <div>
                                    <h3 className="text-base font-black text-white mb-2 uppercase tracking-tight">Step 4.1: PAN Verification</h3>
                                    <p className="text-[10px] text-gray-500 mb-6 font-bold uppercase tracking-widest">Enter your Permanent Account Number for instant verification.</p>
                                    <div className="relative">
                                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                                        <Shield size={18} />
                                      </div>
                                      <input
                                        type="text"
                                        value={kycForm.pan}
                                        onChange={(e) => setKycForm({ ...kycForm, pan: e.target.value.toUpperCase() })}
                                        className="w-full bg-[#1e1e24] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-gray-700 focus:outline-none focus:border-indigo-500 transition-all"
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                              {kycStep === 2 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                  <div>
                                    <div className="flex items-center gap-2 text-emerald-400 mb-4">
                                      <CheckCircle size={14} />
                                      <span className="text-[10px] font-black uppercase">PAN Verified Successfully</span>
                                    </div>
                                    <h3 className="text-base font-black text-white mb-2 uppercase tracking-tight">Step 4.2: Aadhaar eKYC</h3>
                                    <p className="text-[10px] text-gray-500 mb-6 font-bold uppercase tracking-widest">Enter the last 4 digits of your Aadhaar for identity verification.</p>
                                    <div className="relative">
                                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                                        <Lock size={18} />
                                      </div>
                                      <input
                                        type="text"
                                        value={kycForm.aadhaarLast4}
                                        onChange={(e) => setKycForm({ ...kycForm, aadhaarLast4: e.target.value.replace(/\D/g, '') })}
                                        className="w-full bg-[#1e1e24] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-gray-700 focus:outline-none focus:border-indigo-500 transition-all"
                                        placeholder="1234"
                                        maxLength={4}
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                              {kycStep === 3 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                  <div>
                                    <div className="flex items-center gap-2 text-indigo-400 mb-4">
                                      <MessageSquare size={14} />
                                      <span className="text-[10px] font-black uppercase tracking-tight">OTP sent to linked mobile</span>
                                    </div>
                                    <h3 className="text-base font-black text-white mb-2 uppercase tracking-tight">Step 4.3: Aadhaar OTP</h3>
                                    <p className="text-[10px] text-gray-500 mb-6 font-bold uppercase tracking-widest">Enter the 6-digit code sent to your UIDAI registered mobile.</p>
                                    <input
                                      type="text"
                                      value={kycForm.otp}
                                      onChange={(e) => setKycForm({ ...kycForm, otp: e.target.value.replace(/\D/g, '') })}
                                      className="w-full bg-[#1e1e24] border border-white/10 rounded-xl py-5 text-center text-2xl font-black tracking-[0.8em] text-white placeholder:text-gray-800 focus:outline-none focus:border-indigo-500 transition-all"
                                      placeholder="000000"
                                      maxLength={6}
                                    />
                                  </div>
                                </motion.div>
                              )}

                              {kycStep === 4 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                  <h3 className="text-base font-black text-white mb-4 uppercase tracking-tight">Final System Checks</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                      'Querying CKYC Registry...',
                                      'Cross-verifying address...',
                                      application?.requestedAmount > 200000 ? 'Video KYC Readiness...' : null,
                                      'Fraud & AML Watchlist...'
                                    ].filter(Boolean).map((text, i) => (
                                      <div key={i} className="flex items-center gap-3 p-4 bg-[#1e1e24] rounded-xl border border-white/5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}

                              <div className="flex justify-end mt-8">
                                <button
                                  onClick={handleNextKycStep}
                                  disabled={
                                    (kycStep === 1 && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(kycForm.pan)) ||
                                    (kycStep === 2 && !/^[0-9]{4}$/.test(kycForm.aadhaarLast4)) ||
                                    (kycStep === 3 && kycForm.otp.length !== 6)
                                  }
                                  className="px-8 py-3.5 bg-indigo-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"
                                >
                                  {kycStep === 4 ? 'Complete Verification' : 'Verify & Continue'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#2a2a32] p-16 rounded-[32px] text-center border border-dashed border-white/5">
                        <Lock size={40} className="mx-auto text-gray-700 mb-4" />
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">KYC Locked</h3>
                        <p className="text-gray-500 text-sm font-medium">Complete the previous stages to unlock identity verification.</p>
                      </div>
                    )}

                    {kycDetails && (
                      <div className="mt-8 pt-8 border-t border-white/5 flex justify-end items-center gap-6">
                        {maxAccessibleStage >= 5 ? (
                          <>
                            <p className="text-xs text-gray-500 font-medium italic">Identity verified. Proceed to document submission.</p>
                            <button 
                              onClick={() => navigate(`/application/${applicationId}/5`)}
                              className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all group"
                            >
                              <span>Next: Documents</span>
                              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                          </>
                        ) : (
                          isMaker ? (
                            <div className="w-full mt-4">
                              <MakerApprovalPanel applicationId={applicationId!} stage={{ id: activeStageId, name: STAGE_LABELS[STATUS_FLOW[activeStageId - 1]], status: 'pending' } as any} />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-amber-400 bg-amber-400/10 px-6 py-3 rounded-xl border border-amber-400/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <p className="text-xs font-bold">Waiting for permission...</p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════
                    STAGE 05: DOCUMENT UPLOAD & VERIFICATION
                ═══════════════════════════════════════════════ */}
                {activeStageId === 5 && (
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                          <Plus size={22} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white uppercase tracking-tight">Documents</h2>
                          <p className="text-gray-500 font-medium text-xs">Upload and verify required documents</p>
                        </div>
                      </div>
                      {currentStatus !== 'DRAFT' && documents.length > 0 && documents.every((d: any) => d.verificationStatus === 'VERIFIED') && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase">
                          <CheckCircle size={14} /> All Verified
                        </div>
                      )}
                    </div>

                    {activeStageId > maxAccessibleStage ? (
                      <AwaitingAuthorizationView stageNum={5} />
                    ) : (
                      <>
                        {/* Document list */}
                        {documents.length > 0 && (
                          <div className="mb-8 overflow-hidden bg-[#2a2a32] rounded-2xl border border-white/5">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                  <th className="py-3 px-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Type</th>
                                  <th className="py-3 px-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">File</th>
                                  <th className="py-3 px-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {documents.map((doc: any) => (
                                  <tr key={doc.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="py-4 px-6">
                                      <p className="text-xs font-bold text-white uppercase tracking-tight">{doc.documentType.replace(/_/g, ' ')}</p>
                                    </td>
                                    <td className="py-4 px-6 text-[10px] text-gray-500 font-medium">{doc.storageUrl?.split('/').pop() || doc.fileName}</td>
                                    <td className="py-4 px-6 text-right">
                                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                                        doc.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' : 
                                        doc.verificationStatus === 'FAILED' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                                      }`}>
                                        {doc.verificationStatus}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Upload Form */}
                        {(currentStatus === 'DRAFT' || currentStatus === 'KYC_VERIFIED' || currentStatus === 'MAKER_CHECKED' || currentStatus === 'SUBMITTED') && (
                          <div className="space-y-6">
                            <div className="bg-[#2a2a32] p-8 rounded-[32px] border border-white/5">
                              <div className="flex items-center gap-3 mb-6">
                                <Compass size={20} className="text-indigo-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Document Checklist</h3>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-3">
                                {[
                                  { category: 'Identity Proof', key: 'IDENTITY_PROOF' },
                                  { category: 'Address Proof', key: 'ADDRESS_PROOF' },
                                  { category: 'Income Proof', key: 'INCOME_PROOF' },
                                  { category: 'Bank Statement', key: 'BANK_STATEMENT' },
                                ].map(docType => {
                                  const isUploaded = documents.some((d: any) => d.documentType === docType.key);
                                  return (
                                    <div key={docType.key} className="flex items-center justify-between bg-[#1e1e24] p-5 rounded-xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                                      <div>
                                        <p className="text-sm font-bold text-white">{docType.category}</p>
                                        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-0.5">Required for verification</p>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        {isUploaded ? (
                                          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">
                                            <CheckCircle size={12} /> Uploaded
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-3">
                                            <input
                                              type="file"
                                              id={`file-${docType.key}`}
                                              className="hidden"
                                              onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                  setDocForm({ documentType: docType.key, fileName: e.target.files[0].name });
                                                }
                                              }}
                                            />
                                            <label 
                                              htmlFor={`file-${docType.key}`}
                                              className="px-3 py-1.5 bg-[#2a2a32] text-gray-500 hover:text-white rounded-lg text-[9px] font-black uppercase border border-white/10 cursor-pointer transition-colors"
                                            >
                                              {docForm.documentType === docType.key ? docForm.fileName : 'Choose File'}
                                            </label>
                                            {docForm.documentType === docType.key && (
                                              <button
                                                onClick={handleDocumentUpload}
                                                disabled={actionLoading}
                                                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg"
                                              >
                                                <Plus size={16} />
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

                            {simulatedDocAction && (
                              <div className="bg-indigo-500/10 border border-indigo-500/20 p-8 rounded-3xl">
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{simulatedDocAction}</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-1">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(docVerifyStep / 5) * 100}%` }}
                                    className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                  />
                                </div>
                              </div>
                            )}

                            {!simulatedDocAction && documents.length > 0 && documents.some((d: any) => d.verificationStatus === 'PENDING') && (
                              <button
                                onClick={handleAutoVerifyDocs}
                                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                              >
                                <Shield size={18} />
                                Start AI Document Verification
                              </button>
                            )}
                          </div>
                        )}

                        {/* Next Stage Footer */}
                        {documents.length > 0 && !documents.some((d: any) => d.verificationStatus === 'PENDING') && (
                          <div className="mt-8 pt-8 border-t border-white/5 flex justify-end items-center gap-6">
                            {maxAccessibleStage >= 6 ? (
                              <>
                                <p className="text-xs text-gray-500 font-medium italic">Verification complete. Proceed to assessment.</p>
                                <button 
                                  onClick={() => navigate(`/application/${applicationId}/6`)}
                                  className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all group"
                                >
                                  <span>Next: Credit Assessment</span>
                                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                              </>
                            ) : (
                              isMaker ? (
                                <div className="w-full mt-4">
                                  <MakerApprovalPanel applicationId={applicationId!} stage={{ id: activeStageId, name: STAGE_LABELS[STATUS_FLOW[activeStageId - 1]], status: 'pending' } as any} />
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 text-amber-400 bg-amber-400/10 px-6 py-3 rounded-xl border border-amber-400/20">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                  <p className="text-xs font-bold">Waiting for credit stage to unlock...</p>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════
                    STAGE 06: CREDIT ASSESSMENT & UNDERWRITING
                ═══════════════════════════════════════════════ */}
                {activeStageId === 6 && (
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-violet-500/10 text-violet-400 rounded-2xl">
                          <BarChart2 size={22} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white uppercase tracking-tight">Credit Assessment</h2>
                          <p className="text-gray-500 font-medium text-xs">Underwriting & Risk Analysis</p>
                        </div>
                      </div>
                      {creditDetails && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase ${
                          creditDetails.finalDecision === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {creditDetails.finalDecision === 'APPROVED' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {creditDetails.finalDecision}
                        </div>
                      )}
                    </div>

                    {activeStageId > maxAccessibleStage ? (
                      <AwaitingAuthorizationView stageNum={6} />
                    ) : creditDetails ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { label: 'Bureau Score', value: creditDetails.bureauScore, icon: BarChart2, color: 'text-indigo-400' },
                            { label: 'Internal Score', value: creditDetails.internalScore, icon: Shield, color: 'text-violet-400' },
                            { label: 'Risk Grade', value: creditDetails.riskGrade, icon: TrendingUp, color: 'text-amber-400' },
                          ].map((item, i) => (
                            <div key={i} className="bg-[#2a2a32] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                              <item.icon size={40} className="absolute -right-3 -top-3 text-white/5 group-hover:text-white/10 transition-colors" />
                              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{item.label}</p>
                              <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="bg-[#2a2a32] p-8 rounded-[32px] border border-white/5">
                          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Decision Intelligence</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-4 p-5 bg-[#1e1e24] rounded-2xl border border-white/5">
                              <div className={`p-2.5 rounded-xl ${creditDetails.policyPassed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {creditDetails.policyPassed ? <CheckCircle size={18} /> : <XCircle size={18} />}
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Policy Compliance</p>
                                <p className="text-xs font-bold text-white">{creditDetails.policyPassed ? 'Criteria Met' : 'Check Failed'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-[#1e1e24] rounded-2xl border border-white/5">
                              <div className={`p-2.5 rounded-xl ${creditDetails.stpEligible ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                <RotateCcw size={18} className={creditDetails.stpEligible ? '' : 'animate-pulse'} />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Processing Type</p>
                                <p className="text-xs font-bold text-white">{creditDetails.stpEligible ? 'Straight-Through (Auto)' : 'Manual Review Required'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 p-5 bg-[#1e1e24] rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Decision Rationale</p>
                            <p className="text-xs text-gray-400 font-medium leading-relaxed">{creditDetails.decisionReason}</p>
                          </div>
                        </div>
                      </div>
                    ) : (currentStatus === 'KYC_VERIFIED' || currentStatus === 'DOCS_COMPLETE' || currentStatus === 'MAKER_CHECKED' || currentStatus === 'SUBMITTED') ? (
                      <div className="space-y-6">
                        {simulatedCreditAction ? (
                          <div className="bg-violet-500/10 border border-violet-500/20 p-10 rounded-[32px] flex flex-col items-center gap-6">
                            <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                            <div className="text-center">
                              <p className="text-lg font-black text-white uppercase tracking-tight mb-1">AI Underwriting in Progress</p>
                              <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">{simulatedCreditAction}</p>
                            </div>
                            <div className="w-full max-w-xs bg-white/5 rounded-full h-1">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(creditVerifyStep / 6) * 100}%` }}
                                className="h-full bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#2a2a32] border border-white/5 p-10 rounded-[32px] text-center">
                            <div className="w-20 h-20 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-violet-400">
                              <BarChart2 size={40} />
                            </div>
                            <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">Ready for Assessment</h3>
                            <p className="text-gray-500 max-w-lg mx-auto mb-8 font-medium text-sm">
                              The system will evaluate bureau reports, negative policies, 
                              and ML scoring models to determine eligibility.
                            </p>
                            <button
                              onClick={handleCreditAssessment}
                              className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 mx-auto group"
                            >
                              <Shield size={18} className="group-hover:scale-110 transition-transform" />
                              Run Automated Underwriting
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-[#2a2a32] p-16 rounded-[32px] text-center border border-dashed border-white/5">
                        <Lock size={40} className="mx-auto text-gray-700 mb-4" />
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Assessment Locked</h3>
                        <p className="text-gray-500 text-sm">Documents must be verified before credit assessment can begin.</p>
                      </div>
                    )}

                    {creditDetails && (
                      <div className="mt-8 pt-8 border-t border-white/5 flex justify-end items-center gap-6">
                        {maxAccessibleStage >= 7 ? (
                          <>
                            <p className="text-xs text-gray-500 font-medium italic">Assessment finalized. View your customized offer.</p>
                            <button 
                              onClick={() => navigate(`/application/${applicationId}/7`)}
                              className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all group"
                            >
                              <span>View Loan Offer</span>
                              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                          </>
                        ) : (
                          isMaker ? (
                            <div className="w-full mt-4">
                              <MakerApprovalPanel applicationId={applicationId!} stage={{ id: activeStageId, name: STAGE_LABELS[STATUS_FLOW[activeStageId - 1]], status: 'pending' } as any} />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-amber-400 bg-amber-400/10 px-6 py-3 rounded-xl border border-amber-400/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <p className="text-xs font-bold">Waiting for offer generation...</p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════
                    STAGE 07: LOAN OFFER GENERATION & ACCEPTANCE
                ═══════════════════════════════════════════════ */}
                {activeStageId === 7 && (
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl">
                          <DollarSign size={22} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white uppercase tracking-tight">Loan Offer</h2>
                          <p className="text-gray-500 font-medium text-xs">Personalized Sanction Details</p>
                        </div>
                      </div>
                      {offerDetails?.accepted && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase">
                          <CheckCircle size={14} /> Accepted
                        </div>
                      )}
                    </div>

                    {activeStageId > maxAccessibleStage ? (
                      <AwaitingAuthorizationView stageNum={7} />
                    ) : offerDetails ? (
                      <div className="space-y-6">
                        {/* Premium Offer Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] p-8 text-white shadow-[0_20px_50px_rgba(79,70,229,0.3)] relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <ShoppingBag size={100} />
                          </div>
                          
                          <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-8">Official Sanction Letter Summary</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                              <div>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Sanctioned Amount</p>
                                <p className="text-3xl font-black">₹{principal.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Monthly EMI</p>
                                <p className="text-3xl font-black">₹{computedEmi.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Interest Rate</p>
                                <p className="text-3xl font-black text-emerald-300">{annualRate}% <span className="text-xs font-bold opacity-60">p.a.</span></p>
                              </div>
                              <div>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Tenure</p>
                                <p className="text-3xl font-black">{tenure} <span className="text-xs font-bold opacity-60">Mo</span></p>
                              </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-3 gap-6">
                              <div>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Processing Fee</p>
                                <p className="text-base font-bold">₹{offerDetails.processingFee?.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Insurance</p>
                                <p className="text-base font-bold">₹{simulatedInsurancePremium.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-emerald-300/80 text-[10px] font-black uppercase tracking-widest mb-1">Net Disbursement</p>
                                <p className="text-base font-black text-emerald-300">₹{finalDisbursement.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Customizer */}
                        {!offerDetails.accepted && (
                          <div className="bg-[#2a2a32] p-8 rounded-[32px] border border-white/5">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8">Optimize Your Plan</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Loan Amount</p>
                                  <p className="text-lg font-black text-white">₹{principal.toLocaleString()}</p>
                                </div>
                                <div className="relative pt-1">
                                  <input
                                    type="range"
                                    min="10000"
                                    max={application?.sanctionedAmount || 500000}
                                    step="10000"
                                    value={principal}
                                    onChange={(e) => setOfferAmount(Number(e.target.value))}
                                    className="w-full h-1 bg-[#1e1e24] rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                                  />
                                  <div className="flex justify-between mt-2">
                                    <span className="text-[8px] font-bold text-gray-600">₹10K</span>
                                    <span className="text-[8px] font-bold text-gray-600">₹{(application?.sanctionedAmount || 500000).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tenure</p>
                                  <p className="text-lg font-black text-white">{tenure} Months</p>
                                </div>
                                <div className="relative pt-1">
                                  <input
                                    type="range"
                                    min="6"
                                    max="60"
                                    step="6"
                                    value={tenure}
                                    onChange={(e) => setOfferTenure(Number(e.target.value))}
                                    className="w-full h-1 bg-[#1e1e24] rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                                  />
                                  <div className="flex justify-between mt-2">
                                    <span className="text-[8px] font-bold text-gray-600">6 Mo</span>
                                    <span className="text-[8px] font-bold text-gray-600">60 Mo</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Acceptance Controls */}
                        {!offerDetails.accepted && (
                          <div className="bg-[#2a2a32] p-8 rounded-[32px] border border-white/5 space-y-8">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Digital Acceptance</h3>
                            
                            {/* KFS Scroll Gate */}
                            <div className="bg-[#1e1e24] rounded-2xl border border-white/5 overflow-hidden">
                              <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Key Facts Statement (KFS)</span>
                                <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 flex items-center gap-1">
                                  <FileText size={12} /> Download
                                </button>
                              </div>
                              <div 
                                className="h-48 overflow-y-auto p-5 text-[11px] text-gray-500 font-medium leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
                                onScroll={handleKfsScroll}
                              >
                                <div className="space-y-4">
                                  <p className="text-gray-400 font-black uppercase tracking-wider text-[10px] pb-2 border-b border-white/5">Critical Disclosures:</p>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <p className="text-gray-600 uppercase text-[9px] font-black">Annual Percentage Rate</p>
                                      <p className="text-white font-bold">{annualRate}%</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-gray-600 uppercase text-[9px] font-black">Total Repayment</p>
                                      <p className="text-white font-bold">₹{(computedEmi * tenure).toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-gray-600 uppercase text-[9px] font-black">Processing Fee</p>
                                      <p className="text-white font-bold">₹{offerDetails.processingFee?.toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-gray-600 uppercase text-[9px] font-black">Pre-payment Policy</p>
                                      <p className="text-white font-bold">Zero charges after 6 EMIs</p>
                                    </div>
                                  </div>
                                  <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                                    <p className="text-gray-500">• Default Interest: 2% monthly on overdue</p>
                                    <p className="text-gray-500">• Recovery Charges: As per actuals</p>
                                  </div>
                                </div>
                                <div className="h-10" />
                              </div>
                              <div className="p-5 bg-black/40">
                                <label className={`flex items-center gap-3 cursor-pointer transition-all duration-500 ${!hasScrolledToBottom ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}>
                                  <input 
                                    type="checkbox" 
                                    checked={kfsAcknowledged}
                                    onChange={(e) => setKfsAcknowledged(e.target.checked)}
                                    className="w-5 h-5 rounded-lg bg-[#2a2a32] border-white/10 text-indigo-600 focus:ring-0 transition-colors" 
                                  />
                                  <span className="text-xs font-bold text-gray-400">I have reviewed and agree to the KFS and all loan terms.</span>
                                </label>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <button
                                onClick={handleDigitalAcceptance}
                                disabled={!kfsAcknowledged || actionLoading}
                                className="py-4 bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group"
                              >
                                <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />
                                Accept Offer
                              </button>
                              <button
                                onClick={() => setShowRejectConfirm(true)}
                                className="py-4 bg-transparent border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                              >
                                Decline Offer
                              </button>
                            </div>
                          </div>
                        )}

                        {/* OTP Modal */}
                        {showOtpModal && (
                          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
                            <motion.div 
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-[#1e1e24] rounded-[48px] p-10 max-w-md w-full border border-white/5 shadow-2xl text-center"
                            >
                              <div className="w-20 h-20 bg-indigo-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-indigo-400">
                                <MessageSquare size={32} />
                              </div>
                              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Sign Your Offer</h3>
                              <p className="text-gray-500 text-sm font-medium mb-10">
                                Enter the 6-digit OTP sent to your mobile to digitally execute this loan offer.
                              </p>
                              
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="000000"
                                value={acceptanceOtp}
                                onChange={(e) => setAcceptanceOtp(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-[#16161a] border border-white/10 rounded-3xl py-6 text-center text-4xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-indigo-500 transition-all mb-8"
                              />

                              <div className="flex gap-3">
                                <button 
                                  onClick={() => setShowOtpModal(false)}
                                  className="flex-1 py-4 bg-transparent text-gray-500 font-black text-xs uppercase tracking-widest hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={handleVerifyAcceptanceOtp}
                                  disabled={acceptanceOtp.length < 6 || actionLoading}
                                  className="flex-[2] py-4 bg-indigo-600 disabled:bg-gray-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
                                >
                                  Verify & Sign
                                </button>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    ) : (currentStatus === 'APPROVED') ? (
                      <div className="bg-[#2a2a32] border border-white/5 p-10 rounded-[40px] text-center">
                        <div className="w-24 h-24 bg-amber-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-amber-400">
                          <DollarSign size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Generate Final Offer</h3>
                        <p className="text-gray-500 max-w-lg mx-auto mb-10 font-medium">
                          Our pricing engine will now calculate your final interest rate, 
                          processing fees, and amortization schedule.
                        </p>
                        <button
                          onClick={handleOfferGeneration}
                          className="px-12 py-5 bg-indigo-600 text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 mx-auto"
                        >
                          <Plus size={20} />
                          Generate My Offer
                        </button>
                      </div>
                    ) : (
                      <div className="bg-[#2a2a32] p-16 rounded-[40px] text-center border border-dashed border-white/5">
                        <Lock size={48} className="mx-auto text-gray-700 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Offer Not Ready</h3>
                        <p className="text-gray-500">Credit assessment must be completed before an offer can be generated.</p>
                      </div>
                    )}

                    {offerDetails?.accepted && (
                      <div className="mt-10 pt-10 border-t border-white/5 flex justify-end items-center gap-6">
                        {maxAccessibleStage >= 8 ? (
                          <>
                            <p className="text-sm text-gray-500 font-medium italic">Offer accepted. Move to digital agreement execution.</p>
                            <button 
                              onClick={() => navigate(`/application/${applicationId}/8`)}
                              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-700 transition-all group"
                            >
                              <span>Legal Agreement</span>
                              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                          </>
                        ) : (
                          isMaker ? (
                            <div className="w-full mt-6">
                              <MakerApprovalPanel applicationId={applicationId!} stage={{ id: activeStageId, name: STAGE_LABELS[STATUS_FLOW[activeStageId - 1]], status: 'pending' } as any} />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-amber-400 bg-amber-400/10 px-8 py-4 rounded-2xl border border-amber-400/20">
                              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              <p className="text-sm font-bold">Waiting for agreement package...</p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* STAGES 08 - 10 follow same premium pattern... */}
                {activeStageId === 8 && (
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                        <Activity size={22} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Disbursement</h2>
                        <p className="text-gray-500 font-medium text-xs">Funds transfer & activation</p>
                      </div>
                    </div>

                    {activeStageId > maxAccessibleStage ? (
                      <AwaitingAuthorizationView stageNum={8} />
                    ) : (
                      <div className="bg-[#2a2a32] border border-white/5 p-8 rounded-[32px] text-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
                          <CheckCircle size={40} />
                        </div>
                        <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">Loan Disbursed</h3>
                        <p className="text-gray-500 max-w-lg mx-auto mb-8 font-medium text-sm">
                          Funds have been successfully transferred to your registered bank account. 
                          Your loan account is now active.
                        </p>
                        
                        <button 
                          onClick={() => navigate(`/application/${applicationId}/9`)}
                          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all mx-auto group"
                        >
                          <span>View Repayment Schedule</span>
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeStageId === 9 && (
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                        <CheckCircle size={22} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Repayment</h2>
                        <p className="text-gray-500 font-medium text-xs">Manage your active loan</p>
                      </div>
                    </div>

                    {activeStageId > maxAccessibleStage ? (
                      <AwaitingAuthorizationView stageNum={9} />
                    ) : (
                      <div className="bg-[#2a2a32] border border-white/5 p-8 rounded-[32px] text-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
                          <CheckCircle size={40} />
                        </div>
                        <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">Active Servicing</h3>
                        <p className="text-gray-500 max-w-lg mx-auto mb-8 font-medium text-sm">
                          Your loan is in active repayment. You can track your EMIs 
                          and download statements from this section.
                        </p>
                        
                        <button 
                          onClick={() => navigate(`/application/${applicationId}/10`)}
                          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all mx-auto group"
                        >
                          <span>Loan Closure Details</span>
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeStageId === 10 && (
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                        <CheckCircle size={22} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Loan Closure</h2>
                        <p className="text-gray-500 font-medium text-xs">Final status and NOC</p>
                      </div>
                    </div>

                    {activeStageId > maxAccessibleStage ? (
                      <AwaitingAuthorizationView stageNum={10} />
                    ) : (
                      <div className="bg-[#2a2a32] border border-white/5 p-8 rounded-[32px] text-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
                          <CheckCircle size={40} />
                        </div>
                        <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">Loan Closed</h3>
                        <p className="text-gray-500 max-w-lg mx-auto mb-8 font-medium text-sm">
                          Congratulations! Your loan has been successfully closed. 
                          You can download your No Objection Certificate (NOC) now.
                        </p>
                        
                        <button className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all mx-auto group">
                          <FileText size={18} />
                          <span>Download NOC</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    );
  };

export default ApplicationStatus;
