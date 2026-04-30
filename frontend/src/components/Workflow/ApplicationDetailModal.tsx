import React from 'react';
import { X, User, Briefcase, Landmark, FileText, ShieldCheck, PieChart } from 'lucide-react';

interface ApplicationDetailModalProps {
  application: any;
  onClose: () => void;
}

const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({ application, onClose }) => {
  if (!application) return null;

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
            <p className="text-sm text-gray-500">Ref: {application.application_ref} | ID: #{application.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
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
                <p className="text-lg font-bold text-violet-900">{application.tier || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-violet-600 uppercase font-bold mb-1">Requested Amount</p>
                <p className="text-lg font-bold text-violet-900">₹{(application.requested_amount || 0).toLocaleString()}</p>
              </div>
              {application.sanctioned_amount && (
                <div>
                  <p className="text-xs text-violet-600 uppercase font-bold mb-1">Sanctioned Amount</p>
                  <p className="text-lg font-bold text-emerald-600">₹{(application.sanctioned_amount || 0).toLocaleString()}</p>
                </div>
              )}
              {application.annual_interest_rate && (
                <div>
                  <p className="text-xs text-violet-600 uppercase font-bold mb-1">Interest Rate</p>
                  <p className="text-lg font-bold text-blue-600">{application.annual_interest_rate}% p.a.</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
               <div>
                  <p className="text-xs text-violet-600 uppercase font-bold mb-1">Allowed Stage</p>
                  <p className="text-lg font-bold text-violet-900">Stage {application.allowed_stage || 1}</p>
               </div>
            </div>
          </div>

          {/* Personal Details */}
          <DetailSection title="Personal Information" icon={User}>
            <DataField label="Full Name" value={application.customer_name} highlight />
            <DataField label="Email" value={application.customer_email} />
            <DataField label="Mobile" value={application.customer_mobile} />
            <DataField label="Father's Name" value={application.father_name} />
            <DataField label="Mother's Name" value={application.mother_name} />
            <DataField label="Gender" value={application.gender} />
            <DataField label="Marital Status" value={application.marital_status} />
            <DataField label="Dependents" value={application.dependents} />
            <DataField label="Current Address" value={application.current_address} />
            <DataField label="Permanent Address" value={application.permanent_address} />
            <DataField label="Res. Stability" value={application.residential_stability} />
            <DataField label="PAN" value={application.pan} highlight />
            <DataField label="Aadhaar" value={application.aadhaar_token ? `XXXX-XXXX-${application.aadhaar_token.slice(-4)}` : 'N/A'} />
            <DataField label="Loan Purpose" value={application.loan_purpose} />
          </DetailSection>

          {/* Employment Details */}
          <DetailSection title="Employment Details" icon={Briefcase}>
            <DataField label="Company" value={application.company_name} />
            <DataField label="Designation" value={application.designation} />
            <DataField label="Employee ID" value={application.employee_id} />
            <DataField label="Employment Type" value={application.employment_type} />
            <DataField label="Total Experience" value={application.total_experience_months ? `${application.total_experience_months} months` : 'N/A'} />
            <DataField label="Current Experience" value={application.current_experience_months ? `${application.current_experience_months} months` : 'N/A'} />
            <DataField label="Office Address" value={application.office_address} />
            <DataField label="Official Email" value={application.official_email} />
            <DataField label="Monthly Income" value={application.monthly_income ? `₹${application.monthly_income.toLocaleString()}` : 'N/A'} highlight />
            <DataField label="Gross Monthly" value={application.gross_monthly_income ? `₹${application.gross_monthly_income.toLocaleString()}` : 'N/A'} />
            <DataField label="Other Income" value={application.other_income ? `₹${application.other_income.toLocaleString()}` : 'N/A'} />
            <DataField label="Existing EMI" value={application.existing_emi ? `₹${application.existing_emi.toLocaleString()}` : 'N/A'} />
            <DataField label="Existing Loans" value={application.existing_loans_count} />
            <DataField label="CC Outstanding" value={application.credit_card_outstanding ? `₹${application.credit_card_outstanding.toLocaleString()}` : 'N/A'} />
          </DetailSection>

          {/* KYC Status */}
          <DetailSection title="KYC Verification" icon={ShieldCheck}>
            <DataField label="Overall KYC Status" value={application.kyc_status} highlight />
            <DataField label="PAN Verified" value={application.pan_verified ? 'Yes' : 'No'} />
            <DataField label="Aadhaar Verified" value={application.aadhaar_verified ? 'Yes' : 'No'} />
            <DataField label="CKYC Found" value={application.ckyc_found ? 'Yes' : 'No'} />
            <DataField label="Fraud Flag" value={application.fraud_flag ? '⚠ YES' : 'Clear'} />
            <DataField label="AML Flag" value={application.aml_flag ? '⚠ YES' : 'Clear'} />
          </DetailSection>

          {/* Credit Assessment */}
          <DetailSection title="Credit Assessment" icon={PieChart}>
            <DataField label="Bureau Score" value={application.bureau_score} highlight />
            <DataField label="Internal Score" value={application.internal_score} />
            <DataField label="Risk Grade" value={application.risk_grade} highlight />
            <DataField label="STP Eligible" value={application.stp_eligible ? 'Yes' : 'No'} />
            <DataField label="Final Decision" value={application.final_decision} />
            <DataField label="Decision Reason" value={application.decision_reason} />
          </DetailSection>

          {/* Bank Details */}
          <DetailSection title="Bank Details" icon={Landmark}>
            <DataField label="Bank Name" value={application.bank_name} />
            <DataField label="Account Number" value={application.bank_account_number} />
            <DataField label="Account Type" value={application.bank_account_type} />
            <DataField label="IFSC Code" value={application.bank_ifsc} />
          </DetailSection>

          {/* Documents */}
          <DetailSection title="Documents Status" icon={FileText}>
            <DataField label="Total Documents" value={application.document_count} />
            <DataField label="Verified Documents" value={application.verified_document_count} />
            <DataField label="Pending Documents" value={(application.document_count || 0) - (application.verified_document_count || 0)} />
          </DetailSection>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex justify-end rounded-b-2xl sticky bottom-0">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all shadow-md"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;
