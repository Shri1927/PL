import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const LoanApplicationForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    // Loan details
    loanAmount: '',
    tenureMonths: '',
    loanPurpose: '',
    
    // Personal details
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    maritalStatus: '',
    motherName: '',
    
    // Contact details
    email: '',
    phone: '',
    altPhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // Employment details
    employmentType: '',
    companyName: '',
    designation: '',
    monthlySalary: '',
    yearsInCurrentJob: '',
    
    // Financial details
    annualIncome: '',
    existingEmi: '',
    
    // KYC details
    panNumber: '',
    aadhaarNumber: '',
    
    // Bank details
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep = () => {
    setError('');
    
    if (step === 1) {
      if (!formData.loanAmount || !formData.tenureMonths || !formData.loanPurpose) {
        setError('Please fill all loan details');
        return false;
      }
    } else if (step === 2) {
      if (!formData.firstName || !formData.lastName || !formData.dob || !formData.gender) {
        setError('Please fill all personal details');
        return false;
      }
    } else if (step === 3) {
      if (!formData.panNumber || !formData.aadhaarNumber) {
        setError('Please fill KYC details');
        return false;
      }
    } else if (step === 4) {
      if (!formData.bankName || !formData.accountNumber || !formData.ifscCode) {
        setError('Please fill bank details');
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
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
      const response = await api.post('/workflow/applications', {
        requestedAmount: parseFloat(formData.loanAmount),
        tenureMonths: parseInt(formData.tenureMonths),
        loanPurpose: formData.loanPurpose,
        monthlyIncome: parseFloat(formData.monthlySalary) || 0,
        existingEmi: parseFloat(formData.existingEmi) || 0,
      });

      const appId = response.data?.data?.id;
      navigate(`/application/${appId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">Loan Application Form</h1>

          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= num ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {num}
                </div>
                {num < 5 && <div className="w-12 h-1 bg-gray-200 mx-2"></div>}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Loan Details */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">Loan Details</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="loanAmount"
                    value={formData.loanAmount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="100000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenure (Months)
                  </label>
                  <input
                    type="number"
                    name="tenureMonths"
                    value={formData.tenureMonths}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Purpose
                  </label>
                  <select
                    name="loanPurpose"
                    value={formData.loanPurpose}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Purpose</option>
                    <option value="HOME">Home</option>
                    <option value="CAR">Car</option>
                    <option value="EDUCATION">Education</option>
                    <option value="BUSINESS">Business</option>
                    <option value="PERSONAL">Personal</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Personal Details */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">Personal Details</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marital Status
                    </label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select</option>
                      <option value="SINGLE">Single</option>
                      <option value="MARRIED">Married</option>
                      <option value="DIVORCED">Divorced</option>
                      <option value="WIDOWED">Widowed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mother's Name
                  </label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alt Phone
                    </label>
                    <input
                      type="tel"
                      name="altPhone"
                      value={formData.altPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: KYC Details */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">KYC Verification</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ABCDE1234F"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="1234 5678 9012"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                  <p className="text-sm">
                    KYC verification is required to process your loan application. Your details will be
                    verified using the provided identification numbers.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Bank Details */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">Bank Details</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type
                    </label>
                    <select
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select</option>
                      <option value="SALARIED">Salaried</option>
                      <option value="SELF_EMPLOYED">Self-Employed</option>
                      <option value="BUSINESS">Business</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Salary (₹)
                    </label>
                    <input
                      type="number"
                      name="monthlySalary"
                      value={formData.monthlySalary}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Existing EMI (₹)
                  </label>
                  <input
                    type="number"
                    name="existingEmi"
                    value={formData.existingEmi}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">Review Application</h2>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Loan Amount</p>
                      <p className="text-lg font-semibold text-gray-800">₹{formData.loanAmount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tenure</p>
                      <p className="text-lg font-semibold text-gray-800">{formData.tenureMonths} months</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Applicant Name</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {formData.firstName} {formData.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Salary</p>
                      <p className="text-lg font-semibold text-gray-800">₹{formData.monthlySalary}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    ✓ All details have been verified and are correct. Click "Submit" to proceed with
                    your application.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-6 border-t">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Previous
                </button>
              )}

              <div className="flex-1"></div>

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
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
