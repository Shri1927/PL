import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ChevronLeft, ChevronRight, CheckCircle, FileText, User, Briefcase, DollarSign, Building, Lock } from 'lucide-react';

const LoanApplicationForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Step 1: Loan Details
    loanPurpose: '',
    requestedAmount: '',
    tenureMonths: '',
    
    // Step 2: Personal Details
    fatherName: '',
    motherName: '',
    gender: '',
    maritalStatus: '',
    dependents: '',
    currentAddress: '',
    permanentAddress: '',
    residentialStability: '',
    
    // Step 3: Employment Details
    companyName: '',
    employeeId: '',
    designation: '',
    currentExperienceMonths: '',
    totalExperienceMonths: '',
    officeAddress: '',
    officialEmail: '',
    
    // Step 4: Financial Details
    grossMonthlyIncome: '',
    netTakeHomeSalary: '',
    otherIncome: '',
    existingEmi: '',
    existingLoansCount: '',
    creditCardOutstanding: '',
    
    // Step 5: Bank Details
    bankName: '',
    bankAccountNumber: '',
    bankAccountType: '',
    bankIfsc: '',
    
    declarationAccepted: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.loanPurpose || !formData.requestedAmount || !formData.tenureMonths) {
        setError('Please fill all loan details');
        return false;
      }
    } else if (step === 2) {
      if (!formData.gender || !formData.maritalStatus || !formData.currentAddress) {
        setError('Please fill all mandatory personal details');
        return false;
      }
    } else if (step === 3) {
      if (!formData.companyName || !formData.designation) {
        setError('Please fill mandatory employment details');
        return false;
      }
    } else if (step === 4) {
      if (!formData.netTakeHomeSalary) {
        setError('Please fill net take home salary');
        return false;
      }
    } else if (step === 5) {
      if (!formData.bankName || !formData.bankAccountNumber || !formData.bankIfsc) {
        setError('Please fill all bank details');
        return false;
      }
    } else if (step === 6) {
      if (!formData.declarationAccepted) {
        setError('You must accept the declaration to submit');
        return false;
      }
    }
    return true;
  };

  const saveDraft = async () => {
    try {
      const payload: any = { ...formData };
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') payload[key] = null;
      });

      if (applicationId) {
        await api.put(`/workflow/applications/${applicationId}/draft`, payload);
      } else {
        const createPayload = {
          loanPurpose: formData.loanPurpose,
          requestedAmount: parseFloat(formData.requestedAmount),
          tenureMonths: parseInt(formData.tenureMonths),
          monthlyIncome: parseFloat(formData.netTakeHomeSalary) || 0,
          existingEmi: parseFloat(formData.existingEmi) || 0,
        };
        const response = await api.post('/workflow/applications', createPayload);
        setApplicationId(response.data.data.id);
      }
    } catch (err: any) {
      console.error("Auto-save failed", err);
      setError("Auto-save failed. Check logs.");
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    setLoading(true);
    await saveDraft();
    setStep(step + 1);
    setLoading(false);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    
    setLoading(true);
    setError('');

    try {
      await saveDraft();
      if (applicationId) {
        await api.post(`/workflow/applications/${applicationId}/submit`);
        navigate(`/application/${applicationId}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card-modern p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-lg shadow-violet-500/30">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Loan Application</h1>
            <p className="text-gray-600">Complete all steps to submit your application</p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
            {[
              { num: 1, label: 'Loan', icon: DollarSign },
              { num: 2, label: 'Personal', icon: User },
              { num: 3, label: 'Employment', icon: Briefcase },
              { num: 4, label: 'Financial', icon: Building },
              { num: 5, label: 'Bank', icon: Building },
              { num: 6, label: 'Review', icon: CheckCircle },
            ].map((item) => {
              const Icon = item.icon;
              const isCompleted = step > item.num;
              const isCurrent = step === item.num;
              return (
                <div key={item.num} className="flex items-center shrink-0">
                  <div
                    className={`flex flex-col items-center ${
                      isCompleted ? 'text-emerald-600' : isCurrent ? 'text-violet-600' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30'
                          : isCurrent
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <span className="text-xs font-semibold mt-2">{item.label}</span>
                  </div>
                  {item.num < 6 && (
                    <div
                      className={`w-8 md:w-16 h-1 mx-2 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Loan Requirements */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Loan Requirements</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Loan Purpose</label>
                    <select name="loanPurpose" value={formData.loanPurpose} onChange={handleInputChange} className="input-modern appearance-none cursor-pointer">
                      <option value="">Select Purpose</option>
                      <option value="Medical Emergency">Medical Emergency</option>
                      <option value="Home Renovation">Home Renovation</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Travel">Travel</option>
                      <option value="Debt Consolidation">Debt Consolidation</option>
                      <option value="Education">Education</option>
                      <option value="Business Expansion">Business Expansion</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Requested Amount (₹)</label>
                      <input type="number" name="requestedAmount" value={formData.requestedAmount} onChange={handleInputChange} className="input-modern" placeholder="100000" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tenure (Months)</label>
                      <select name="tenureMonths" value={formData.tenureMonths} onChange={handleInputChange} className="input-modern appearance-none cursor-pointer">
                        <option value="">Select Tenure</option>
                        <option value="12">12</option>
                        <option value="24">24</option>
                        <option value="36">36</option>
                        <option value="48">48</option>
                        <option value="60">60</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Personal Details */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Personal Details</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Father's Name</label>
                      <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} className="input-modern" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Mother's Name</label>
                      <input type="text" name="motherName" value={formData.motherName} onChange={handleInputChange} className="input-modern" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleInputChange} className="input-modern appearance-none cursor-pointer">
                        <option value="">Select</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Marital Status</label>
                      <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} className="input-modern appearance-none cursor-pointer">
                        <option value="">Select</option>
                        <option value="SINGLE">Single</option>
                        <option value="MARRIED">Married</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Dependents</label>
                      <input type="number" name="dependents" value={formData.dependents} onChange={handleInputChange} className="input-modern" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Current Address</label>
                    <input type="text" name="currentAddress" value={formData.currentAddress} onChange={handleInputChange} className="input-modern" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Permanent Address</label>
                    <input type="text" name="permanentAddress" value={formData.permanentAddress} onChange={handleInputChange} className="input-modern" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Residential Stability</label>
                    <select name="residentialStability" value={formData.residentialStability} onChange={handleInputChange} className="input-modern appearance-none cursor-pointer">
                      <option value="">Select</option>
                      <option value="Owned">Owned</option>
                      <option value="Rented">Rented</option>
                      <option value="Company-provided">Company-provided</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Employment Details */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Employment Details</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Company/Business Name</label>
                      <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="input-modern" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID / Registration No</label>
                      <input type="text" name="employeeId" value={formData.employeeId} onChange={handleInputChange} className="input-modern" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                    <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className="input-modern" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Current Exp (Months)</label>
                      <input type="number" name="currentExperienceMonths" value={formData.currentExperienceMonths} onChange={handleInputChange} className="input-modern" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Total Exp (Months)</label>
                      <input type="number" name="totalExperienceMonths" value={formData.totalExperienceMonths} onChange={handleInputChange} className="input-modern" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Office Address</label>
                    <input type="text" name="officeAddress" value={formData.officeAddress} onChange={handleInputChange} className="input-modern" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Official Email ID</label>
                    <input type="email" name="officialEmail" value={formData.officialEmail} onChange={handleInputChange} className="input-modern" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Financial Details */}
            {step === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Financial Details</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Gross Monthly Income (₹)</label>
                      <input type="number" name="grossMonthlyIncome" value={formData.grossMonthlyIncome} onChange={handleInputChange} className="input-modern" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Net Take-Home Salary (₹)</label>
                      <input type="number" name="netTakeHomeSalary" value={formData.netTakeHomeSalary} onChange={handleInputChange} className="input-modern" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Other Income Sources (₹)</label>
                    <input type="number" name="otherIncome" value={formData.otherIncome} onChange={handleInputChange} className="input-modern" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Existing EMI (₹)</label>
                      <input type="number" name="existingEmi" value={formData.existingEmi} onChange={handleInputChange} className="input-modern" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">No. of Loans</label>
                      <input type="number" name="existingLoansCount" value={formData.existingLoansCount} onChange={handleInputChange} className="input-modern" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">CC Outstanding (₹)</label>
                      <input type="number" name="creditCardOutstanding" value={formData.creditCardOutstanding} onChange={handleInputChange} className="input-modern" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Bank Details */}
            {step === 5 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Bank Details</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} className="input-modern" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                      <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleInputChange} className="input-modern" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code</label>
                      <input type="text" name="bankIfsc" value={formData.bankIfsc} onChange={handleInputChange} className="input-modern" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
                    <select name="bankAccountType" value={formData.bankAccountType} onChange={handleInputChange} className="input-modern appearance-none cursor-pointer">
                      <option value="">Select</option>
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Review */}
            {step === 6 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Summary & Confirmation</h2>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 p-6 rounded-2xl border border-violet-200 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-violet-200">
                    <span className="text-gray-600 font-medium">Loan Amount</span>
                    <span className="text-gray-800 font-bold">₹{formData.requestedAmount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-violet-200">
                    <span className="text-gray-600 font-medium">Tenure</span>
                    <span className="text-gray-800 font-bold">{formData.tenureMonths} Months</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-violet-200">
                    <span className="text-gray-600 font-medium">Net Salary</span>
                    <span className="text-gray-800 font-bold">₹{formData.netTakeHomeSalary}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Bank</span>
                    <span className="text-gray-800 font-bold">{formData.bankName} ({formData.bankAccountNumber})</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-violet-50 rounded-xl border border-violet-200">
                  <input type="checkbox" name="declarationAccepted" checked={formData.declarationAccepted} onChange={handleInputChange} className="mt-1 h-5 w-5 text-violet-600 border-gray-300 rounded cursor-pointer" />
                  <label className="text-sm text-gray-700 cursor-pointer">
                    I declare that all information provided is accurate and I authorize the system to fetch my credit report and proceed with the loan assessment.
                  </label>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              {step > 1 && (
                <button type="button" onClick={handlePrevious} className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all font-semibold">
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>
              )}
              <div className="flex-1"></div>
              {step < 6 ? (
                <button type="button" onClick={handleNext} disabled={loading} className="btn-primary flex items-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <button type="submit" disabled={loading || !formData.declarationAccepted} className="btn-primary flex items-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoanApplicationForm;
