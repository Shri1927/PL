import React from 'react';
import { X, User, Briefcase, Landmark, FileText, ShieldCheck, PieChart, RotateCcw } from 'lucide-react';

interface ApplicationDetailModalProps {
  application: any;
  onClose: () => void;
  onApproveStage?: (id: number, nextStage: number) => void;
  onRefresh?: () => void;
}

const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({ application, onClose, onApproveStage, onRefresh }) => {
  if (!application) return null;

  const currentAllowed = application.allowed_stage || application.allowedStage || 1;
  const nextStage = currentAllowed + 1;

  // Helper to get value from application object with fallback for different naming conventions
  const f = (key: string) => {
    // Try original key
    if (application[key] !== undefined && application[key] !== null) return application[key];
    
    // Try camelCase version if key is snake_case
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    if (application[camelKey] !== undefined && application[camelKey] !== null) return application[camelKey];
    
    // Try snake_case version if key is camelCase
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (application[snakeKey] !== undefined && application[snakeKey] !== null) return application[snakeKey];

    // Special mappings
    if (key === 'customer_name') return application.fullName || application.customerName;
    if (key === 'customer_email') return application.email || application.customerEmail;
    if (key === 'customer_mobile') return application.mobile || application.customerMobile;
    if (key === 'monthly_income') return application.netTakeHomeSalary || application.monthlyIncome;
    if (key === 'requested_amount') return application.requestedAmount;
    if (key === 'loan_purpose') return application.loanPurpose;
    if (key === 'application_ref') return application.applicationRef;

    return null;
  };

  const getStageName = (stage: number) => {
    switch(stage) {
      case 1: return "Application Initiated";
      case 2: return "Pending Maker Review";
      case 3: return "Maker Approved";
      case 4: return "KYC Verified";
      case 5: return "Documents Verified";
      case 6: return "Credit Approved";
      case 7: return "Offer Accepted";
      case 8: return "Agreement Signed";
      case 9: return "Funds Disbursed";
      case 10: return "Loan Active";
      default: return `Stage ${stage}`;
    }
  };

  const DetailSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
        <Icon size={20} className="text-violet-600" />
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );

  const DataField = ({ label, value, highlight = false }: { label: string; value: any; highlight?: boolean }) => (
    <div>
      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-violet-700 font-bold' : 'text-gray-800'}`}>
        {value || 'N/A'}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl my-8 shadow-2xl animate-scaleIn flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
            <p className="text-sm text-gray-500">Ref: {f('application_ref') || 'N/A'} | ID: #{application.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-indigo-600"
                title="Refresh Details"
              >
                <RotateCcw size={20} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          {/* Status Banner */}
          <div className="mb-8 flex flex-wrap gap-4 items-center justify-between bg-violet-50 p-6 rounded-2xl border border-violet-100">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-violet-600 uppercase font-bold mb-1">Current Status</p>
                <span className="px-3 py-1 bg-violet-600 text-white rounded-full text-xs font-bold uppercase">
                  {application.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-violet-600 uppercase font-bold mb-1">Tier</p>
                <p className="text-lg font-bold text-violet-900">{f('tier') || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-violet-600 uppercase font-bold mb-1">Requested Amount</p>
                <p className="text-lg font-bold text-violet-900">₹{(f('requested_amount') || 0).toLocaleString()}</p>
              </div>
              {f('sanctioned_amount') && (
                <div>
                  <p className="text-xs text-violet-600 uppercase font-bold mb-1">Sanctioned Amount</p>
                  <p className="text-lg font-bold text-emerald-600">₹{(f('sanctioned_amount') || 0).toLocaleString()}</p>
                </div>
              )}
              {f('annual_interest_rate') && (
                <div>
                  <p className="text-xs text-violet-600 uppercase font-bold mb-1">Interest Rate</p>
                  <p className="text-lg font-bold text-blue-600">{f('annual_interest_rate')}% p.a.</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
               <div>
                  <p className="text-xs text-violet-600 uppercase font-bold mb-1">Allowed Stage</p>
                  <p className="text-lg font-bold text-violet-900">Stage {currentAllowed}</p>
               </div>
            </div>
          </div>

          {/* Personal Details */}
          <DetailSection title="Personal Information" icon={User}>
            <DataField label="Full Name" value={f('customer_name')} highlight />
            <DataField label="Email" value={f('customer_email')} />
            <DataField label="Mobile" value={f('customer_mobile')} />
            <DataField label="Father's Name" value={f('father_name')} />
            <DataField label="Mother's Name" value={f('mother_name')} />
            <DataField label="Gender" value={f('gender')} />
            <DataField label="Marital Status" value={f('marital_status')} />
            <DataField label="Dependents" value={f('dependents')} />
            <DataField label="Current Address" value={f('current_address')} />
            <DataField label="Permanent Address" value={f('permanent_address')} />
            <DataField label="Res. Stability" value={f('residential_stability')} />
            <DataField label="PAN" value={f('pan')} highlight />
            <DataField label="Aadhaar" value={f('aadhaar_token') ? `XXXX-XXXX-${String(f('aadhaar_token')).slice(-4)}` : 'N/A'} />
            <DataField label="Loan Purpose" value={f('loan_purpose')} />
          </DetailSection>

          {/* Employment Details */}
          <DetailSection title="Employment Details" icon={Briefcase}>
            <DataField label="Company" value={f('company_name')} />
            <DataField label="Designation" value={f('designation')} />
            <DataField label="Employee ID" value={f('employee_id')} />
            <DataField label="Employment Type" value={f('employment_type')} />
            <DataField label="Total Experience" value={f('total_experience_months') ? `${f('total_experience_months')} months` : 'N/A'} />
            <DataField label="Current Experience" value={f('current_experience_months') ? `${f('current_experience_months')} months` : 'N/A'} />
            <DataField label="Office Address" value={f('office_address')} />
            <DataField label="Official Email" value={f('official_email')} />
            <DataField label="Monthly Income" value={f('monthly_income') ? `₹${Number(f('monthly_income')).toLocaleString()}` : 'N/A'} highlight />
            <DataField label="Gross Monthly" value={f('gross_monthly_income') ? `₹${Number(f('gross_monthly_income')).toLocaleString()}` : 'N/A'} />
            <DataField label="Other Income" value={f('other_income') ? `₹${Number(f('other_income')).toLocaleString()}` : 'N/A'} />
            <DataField label="Existing EMI" value={f('existing_emi') ? `₹${Number(f('existing_emi')).toLocaleString()}` : 'N/A'} />
            <DataField label="Existing Loans" value={f('existing_loans_count')} />
            <DataField label="CC Outstanding" value={f('credit_card_outstanding') ? `₹${Number(f('credit_card_outstanding')).toLocaleString()}` : 'N/A'} />
          </DetailSection>

          {/* KYC Status */}
          <DetailSection title="KYC Verification" icon={ShieldCheck}>
            <DataField label="Overall KYC Status" value={f('kyc_status')} highlight />
            <DataField label="PAN Verified" value={f('pan_verified') ? 'Yes' : 'No'} />
            <DataField label="Aadhaar Verified" value={f('aadhaar_verified') ? 'Yes' : 'No'} />
            <DataField label="CKYC Found" value={f('ckyc_found') ? 'Yes' : 'No'} />
            <DataField label="Fraud Flag" value={f('fraud_flag') ? '⚠ YES' : 'Clear'} />
            <DataField label="AML Flag" value={f('aml_flag') ? '⚠ YES' : 'Clear'} />
          </DetailSection>

          {/* Credit Assessment */}
          <DetailSection title="Credit Assessment" icon={PieChart}>
            <DataField label="Bureau Score" value={f('bureau_score')} highlight />
            <DataField label="Internal Score" value={f('internal_score')} />
            <DataField label="Risk Grade" value={f('risk_grade')} highlight />
            <DataField label="STP Eligible" value={f('stp_eligible') ? 'Yes' : 'No'} />
            <DataField label="Final Decision" value={f('final_decision')} />
            <DataField label="Decision Reason" value={f('decision_reason')} />
          </DetailSection>

          {/* Bank Details */}
          <DetailSection title="Bank Details" icon={Landmark}>
            <DataField label="Bank Name" value={f('bank_name')} />
            <DataField label="Account Number" value={f('bank_account_number')} />
            <DataField label="Account Type" value={f('bank_account_type')} />
            <DataField label="IFSC Code" value={f('bank_ifsc')} />
          </DetailSection>

          {/* Documents */}
          <DetailSection title="Documents Status" icon={FileText}>
            <DataField label="Total Documents" value={f('document_count')} />
            <DataField label="Verified Documents" value={f('verified_document_count')} />
            <DataField label="Pending Documents" value={(Number(f('document_count')) || 0) - (Number(f('verified_document_count')) || 0)} />
          </DetailSection>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between rounded-b-2xl sticky bottom-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-6 py-3 bg-[#222222] text-[#eab308] border border-[#333333] rounded-lg text-xs font-bold shadow-inner">
              <div className="w-2 h-2 rounded-full bg-[#eab308] animate-pulse" />
              Awaiting Maker Verification for {getStageName(nextStage)}
            </div>
            {onApproveStage && nextStage <= 10 && (
              <button
                onClick={() => onApproveStage(application.id, nextStage)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2 uppercase text-xs tracking-widest"
              >
                <ShieldCheck size={18} />
                Authorize Next Stage
              </button>
            )}
          </div>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;
