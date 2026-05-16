import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import { 
  ChevronLeft, ChevronRight, CheckCircle, FileText, User, 
  Briefcase, DollarSign, Building, ArrowRight, Shield, Lock, Activity, Compass, ShoppingBag
} from 'lucide-react';
import Sidebar from '../PremiumDashboard/Sidebar';

const LoanApplicationForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(queryId);

  useEffect(() => {
    if (queryId) {
      loadApplicationData(queryId);
    }
  }, [queryId]);

  const loadApplicationData = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/workflow/applications/${id}`);
      const app = response.data.data;
      
      // Populate form data
      setFormData({
        loanPurpose: app.loanPurpose || '',
        requestedAmount: app.requestedAmount?.toString() || '',
        tenureMonths: app.tenureMonths?.toString() || '',
        
        fatherName: app.fatherName || '',
        motherName: app.motherName || '',
        gender: app.gender || '',
        maritalStatus: app.maritalStatus || '',
        dependents: app.dependents?.toString() || '',
        currentAddress: app.currentAddress || '',
        permanentAddress: app.permanentAddress || '',
        residentialStability: app.residentialStability || '',
        
        companyName: app.companyName || '',
        employeeId: app.employeeId || '',
        designation: app.designation || '',
        currentExperienceMonths: app.currentExperienceMonths?.toString() || '',
        totalExperienceMonths: app.totalExperienceMonths?.toString() || '',
        officeAddress: app.officeAddress || '',
        officialEmail: app.officialEmail || '',
        
        grossMonthlyIncome: app.grossMonthlyIncome?.toString() || '',
        netTakeHomeSalary: app.netTakeHomeSalary?.toString() || '',
        otherIncome: app.otherIncome?.toString() || '',
        existingEmi: app.existingEmi?.toString() || '',
        existingLoansCount: app.existingLoansCount?.toString() || '',
        creditCardOutstanding: app.creditCardOutstanding?.toString() || '',
        
        bankName: app.bankName || '',
        bankAccountNumber: app.bankAccountNumber || '',
        bankAccountType: app.bankAccountType || '',
        bankIfsc: app.bankIfsc || '',
        
        declarationAccepted: false,
      });

      // Start at the latest step based on provided ID, or step 1
      setStep(1);
      
    } catch (err) {
      console.error("Failed to load application data", err);
      setError("Failed to load existing application.");
    } finally {
      setLoading(false);
    }
  };

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
      if (parseInt(formData.tenureMonths) < 12 || parseInt(formData.tenureMonths) > 60) {
        setError('Tenure must be between 12 and 60 months');
        return false;
      }
      if (parseFloat(formData.requestedAmount) < 1) {
        setError('Amount must be at least 1');
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

      const amt = parseFloat(formData.requestedAmount);
      const tenure = parseInt(formData.tenureMonths);

      if (isNaN(amt) || isNaN(tenure)) {
        setError('Invalid numeric values for amount or tenure');
        return;
      }

      if (applicationId) {
        await api.put(`/workflow/applications/${applicationId}/draft`, payload);
      } else {
        const createPayload = {
          loanPurpose: formData.loanPurpose,
          requestedAmount: amt,
          tenureMonths: tenure,
          monthlyIncome: parseFloat(formData.netTakeHomeSalary) || 0,
          existingEmi: parseFloat(formData.existingEmi) || 0,
        };
        const response = await api.post('/workflow/applications', createPayload);
        setApplicationId(response.data.data.id);
      }
    } catch (err: any) {
      console.error("Auto-save failed", err);
      const msg = err.response?.data?.message || "Auto-save failed. Check details.";
      setError(msg);
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
    <div className="flex bg-[#0f0f12] min-h-screen font-['Inter',sans-serif] text-gray-300 overflow-hidden">
      <Sidebar activeView="home" onViewChange={() => navigate('/dashboard')} />

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
              New Application
            </motion.h1>
            <p className="text-gray-500 font-medium">
              Start your journey towards a premium loan experience
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Step {step} of 6</p>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / 6) * 100}%` }}
                    className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  />
                </div>
                <span className="text-sm font-black text-white">{Math.round((step / 6) * 100)}%</span>
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
                <CheckCircle size={20} className="text-rose-400" />
                <span className="font-medium">{error}</span>
              </div>
              <button onClick={() => setError('')} className="text-rose-400/50 hover:text-rose-400">
                <CheckCircle size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Form Container */}
          <div className="bg-[#1e1e24] rounded-[40px] border border-white/5 shadow-xl overflow-hidden">
              {/* Progress Steps Header */}
              <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between px-10">
                {[
                  { num: 1, label: 'Loan', icon: DollarSign },
                  { num: 2, label: 'Personal', icon: User },
                  { num: 3, label: 'Employment', icon: Briefcase },
                  { num: 4, label: 'Financial', icon: Building },
                  { num: 5, label: 'Bank', icon: Activity },
                  { num: 6, label: 'Review', icon: CheckCircle },
                ].map((item) => (
                  <div key={item.num} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      step === item.num ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 
                      step > item.num ? 'bg-indigo-600/20 text-indigo-400' : 'bg-[#0f0f12] text-gray-700'
                    }`}>
                      {step > item.num ? <CheckCircle size={18} /> : <item.icon size={18} />}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${step === item.num ? 'text-white' : 'text-gray-700'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <AnimatePresence mode="wait">
                    {/* Step 1: Loan Requirements */}
                    {step === 1 && (
                      <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="flex items-center gap-4 mb-10">
                          <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                            <DollarSign size={24} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Loan Requirements</h2>
                            <p className="text-gray-500 font-medium text-sm">Define your loan amount and purpose</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Loan Purpose</label>
                            <select
                              name="loanPurpose"
                              value={formData.loanPurpose}
                              onChange={handleInputChange}
                              className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                            >
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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Requested Amount (₹)</label>
                              <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                <input
                                  type="number"
                                  name="requestedAmount"
                                  value={formData.requestedAmount}
                                  onChange={handleInputChange}
                                  placeholder="1,00,000"
                                  className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Tenure (Months)</label>
                              <select
                                name="tenureMonths"
                                value={formData.tenureMonths}
                                onChange={handleInputChange}
                                className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                              >
                                <option value="">Select Tenure</option>
                                <option value="12">12 Months</option>
                                <option value="24">24 Months</option>
                                <option value="36">36 Months</option>
                                <option value="48">48 Months</option>
                                <option value="60">60 Months</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Personal Details */}
                    {step === 2 && (
                      <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="flex items-center gap-4 mb-10">
                          <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl">
                            <User size={24} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Personal Details</h2>
                            <p className="text-gray-500 font-medium text-sm">Tell us about yourself</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Father's Name</label>
                            <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Mother's Name</label>
                            <input type="text" name="motherName" value={formData.motherName} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none">
                              <option value="">Select</option>
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Marital Status</label>
                            <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none">
                              <option value="">Select</option>
                              <option value="SINGLE">Single</option>
                              <option value="MARRIED">Married</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Dependents</label>
                            <input type="number" name="dependents" value={formData.dependents} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Current Address</label>
                          <textarea name="currentAddress" value={formData.currentAddress} onChange={handleInputChange as any} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all h-24" />
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Employment Details */}
                    {step === 3 && (
                      <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="flex items-center gap-4 mb-10">
                          <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                            <Briefcase size={24} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Employment Details</h2>
                            <p className="text-gray-500 font-medium text-sm">Your professional background</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Company Name</label>
                            <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" placeholder="Acme Corp" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Designation</label>
                            <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" placeholder="Senior Manager" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Employee ID</label>
                            <input type="text" name="employeeId" value={formData.employeeId} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" placeholder="EMP123" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Official Email</label>
                            <input type="email" name="officialEmail" value={formData.officialEmail} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" placeholder="name@company.com" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Current Experience (Months)</label>
                            <input type="number" name="currentExperienceMonths" value={formData.currentExperienceMonths} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" placeholder="24" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Total Experience (Months)</label>
                            <input type="number" name="totalExperienceMonths" value={formData.totalExperienceMonths} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" placeholder="60" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Office Address</label>
                          <textarea name="officeAddress" value={formData.officeAddress} onChange={handleInputChange as any} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all h-24" />
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: Financial Details */}
                    {step === 4 && (
                      <motion.div 
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="flex items-center gap-4 mb-10">
                          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                            <DollarSign size={24} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Financial Details</h2>
                            <p className="text-gray-500 font-medium text-sm">Help us assess your repayment capacity</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Gross Monthly Income (₹)</label>
                            <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                              <input type="number" name="grossMonthlyIncome" value={formData.grossMonthlyIncome} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" placeholder="1,00,000" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Net Take Home Salary (₹)</label>
                            <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                              <input type="number" name="netTakeHomeSalary" value={formData.netTakeHomeSalary} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" placeholder="85,000" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Existing EMIs (₹)</label>
                            <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                              <input type="number" name="existingEmi" value={formData.existingEmi} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" placeholder="10,000" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Existing Loans Count</label>
                            <input type="number" name="existingLoansCount" value={formData.existingLoansCount} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" placeholder="2" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 5: Bank Details */}
                    {step === 5 && (
                      <motion.div 
                        key="step5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="flex items-center gap-4 mb-10">
                          <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl">
                            <Activity size={24} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Banking Details</h2>
                            <p className="text-gray-500 font-medium text-sm">Where should we disburse your loan?</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Bank Name</label>
                            <input type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" placeholder="HDFC Bank" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Account Number</label>
                            <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" placeholder="501000..." />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">IFSC Code</label>
                            <input type="text" name="bankIfsc" value={formData.bankIfsc} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all" placeholder="HDFC0001234" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Account Type</label>
                            <select name="bankAccountType" value={formData.bankAccountType} onChange={handleInputChange} className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none">
                              <option value="">Select Type</option>
                              <option value="SAVINGS">Savings</option>
                              <option value="CURRENT">Current</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 6 && (
                      <motion.div 
                        key="step6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="flex items-center gap-4 mb-10">
                          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                            <CheckCircle size={24} />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Review & Submit</h2>
                            <p className="text-gray-500 font-medium text-sm">Verify your details before submission</p>
                          </div>
                        </div>

                        <div className="bg-[#2a2a32] p-8 rounded-[40px] border border-white/5 space-y-4">
                          {[
                            { label: 'Loan Amount', value: `₹${formData.requestedAmount}`, icon: DollarSign },
                            { label: 'Tenure', value: `${formData.tenureMonths} Months`, icon: Activity },
                            { label: 'Purpose', value: formData.loanPurpose, icon: Compass },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-[#1e1e24] rounded-2xl border border-white/5">
                              <div className="flex items-center gap-3 text-gray-500">
                                <item.icon size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                              </div>
                              <span className="text-sm font-bold text-white">{item.value}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-start gap-4 p-8 bg-indigo-600/10 rounded-[40px] border border-indigo-600/20">
                          <input
                            type="checkbox"
                            name="declarationAccepted"
                            checked={formData.declarationAccepted}
                            onChange={handleInputChange}
                            className="mt-1 w-6 h-6 rounded-lg bg-[#2a2a32] border-white/10 text-indigo-600 focus:ring-0"
                          />
                          <label className="text-xs font-bold text-gray-400 leading-relaxed cursor-pointer">
                            I declare that all information provided is accurate and I authorize the system to fetch my credit report and proceed with the loan assessment under the premium scheme.
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

              {/* Navigation buttons */}
                  <div className="flex justify-between items-center pt-10 border-t border-white/5">
                    {step > 1 && (
                      <button 
                        type="button" 
                        onClick={handlePrevious}
                        className="flex items-center gap-2 px-8 py-4 bg-[#2a2a32] text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5 hover:bg-[#1e1e24] transition-all"
                      >
                        <ChevronLeft size={18} />
                        <span>Previous</span>
                      </button>
                    )}
                    <div className="flex-1"></div>
                    {step < 6 ? (
                      <button 
                        type="button" 
                        onClick={handleNext} 
                        disabled={loading}
                        className="flex items-center gap-2 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all group"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Continue</span>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    ) : (
                      <button 
                        type="submit" 
                        disabled={loading || !formData.declarationAccepted}
                        className="flex items-center gap-3 px-10 py-5 bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle size={20} />
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
        </main>
      </div>
    );
  };

export default LoanApplicationForm;
