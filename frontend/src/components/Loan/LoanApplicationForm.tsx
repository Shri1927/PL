import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import { 
  ChevronLeft, ChevronRight, CheckCircle, FileText, User, 
  Briefcase, DollarSign, Building, ArrowRight, Shield, Lock, Activity, Compass, ShoppingBag, ChevronDown
} from 'lucide-react';
import Sidebar from '../PremiumDashboard/Sidebar';

interface FormData {
  loanPurpose: string;
  requestedAmount: string;
  tenureMonths: string;
  fatherName: string;
  motherName: string;
  gender: string;
  maritalStatus: string;
  dependents: string;
  currentAddress: string;
  permanentAddress: string;
  residentialStability: string;
  companyName: string;
  employeeId: string;
  designation: string;
  currentExperienceMonths: string;
  totalExperienceMonths: string;
  officeAddress: string;
  officialEmail: string;
  grossMonthlyIncome: string;
  netTakeHomeSalary: string;
  otherIncome: string;
  existingEmi: string;
  existingLoansCount: string;
  creditCardOutstanding: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountType: string;
  bankIfsc: string;
  declarationAccepted: boolean;
}

const LoanApplicationForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');

  // Initialize state from sessionStorage if available, otherwise defaults
  const initialState = (): FormData => {
    const saved = sessionStorage.getItem('loanApplicationFormData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved form data", e);
      }
    }
    return {
      // Step 1: Loan Details
      loanPurpose: '',
      requestedAmount: '',
      tenureMonths: '',
      
      // Step 2: Personal Details
      fatherName: '',
      motherName: '',
      gender: '',
      maritalStatus: '',
      dependents: '0',
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
    };
  };

  const [step, setStep] = useState(() => {
    const savedStep = sessionStorage.getItem('loanApplicationStep');
    return savedStep ? parseInt(savedStep, 10) : 1;
  });
  const [error, setError] = useState('');
  // LR_027: separate non-blocking warning state for background auto-save issues.
  // Auto-save failures are not critical (data is preserved in sessionStorage) so
  // they should not block the user with a red error banner.
  const [saveWarning, setSaveWarning] = useState('');
  // PL_001: per-field error map for Step 2. Unlike the global banner which is
  // off-screen when the user is scrolled down, these errors appear inline below
  // each input — visible regardless of scroll position.
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});
  // PL-EMP-001: per-field error map for Step 3 (Employment Details).
  const [step3Errors, setStep3Errors] = useState<Record<string, string>>({});
  // PL-FIN-001: per-field error map for Step 4 (Financial Details).
  const [step4Errors, setStep4Errors] = useState<Record<string, string>>({});
  // BD_001: per-field error map for Step 5 (Banking Details).
  const [step5Errors, setStep5Errors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(() => {
    return queryId || sessionStorage.getItem('loanApplicationId') || null;
  });

  // Persist form data and step to sessionStorage whenever they change
  const [formData, setFormData] = useState<FormData>(initialState);

  useEffect(() => {
    sessionStorage.setItem('loanApplicationFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    sessionStorage.setItem('loanApplicationStep', step.toString());
  }, [step]);

  useEffect(() => {
    if (applicationId) {
      sessionStorage.setItem('loanApplicationId', applicationId);
    } else {
      sessionStorage.removeItem('loanApplicationId');
    }
  }, [applicationId]);

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
      const loadedData = {
        loanPurpose: app.loanPurpose || '',
        requestedAmount: app.requestedAmount?.toString() || '',
        tenureMonths: app.tenureMonths?.toString() || '',
        
        fatherName: app.fatherName || '',
        motherName: app.motherName || '',
        gender: app.gender || '',
        maritalStatus: app.maritalStatus || '',
        dependents: app.dependents?.toString() || '0',
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
      };
      setFormData(loadedData);

      // Start at the latest step based on provided ID, or step 1
      setStep(1);
      
    } catch (err) {
      console.error("Failed to load application data", err);
      setError("Failed to load existing application.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let val: string | boolean = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    // Prevent negative values for numeric inputs
    if (name === 'requestedAmount' || name === 'dependents' || name === 'currentExperienceMonths' || name === 'totalExperienceMonths') {
      const numVal = Number(val);
      if (!isNaN(numVal) && numVal < 0) {
        return;
      }
    }

    if (name === 'grossMonthlyIncome' || name === 'netTakeHomeSalary' || name === 'existingEmi' || name === 'existingLoansCount' || name === 'otherIncome' || name === 'creditCardOutstanding') {
      const originalValue = val as string;
      const sanitizedValue = originalValue.replace(/[^0-9]/g, '');
      
      if (originalValue !== sanitizedValue) {
        let errorMsg = 'Only numeric values are allowed';
        if (/[eE]/.test(originalValue)) {
          errorMsg = 'Alphabetic character "e" is not allowed. Only numeric values are accepted.';
        } else if (originalValue.includes('-')) {
          errorMsg = 'Negative values are not allowed. Only numeric values are accepted.';
        }
        setStep4Errors(prev => ({ ...prev, [name]: errorMsg }));
      } else {
        if (step4Errors[name]) {
          setStep4Errors(prev => { const next = { ...prev }; delete next[name]; return next; });
        }
      }
      val = sanitizedValue;
    }

    // PL_001: clear the per-field step 2 error the moment the user starts correcting it.
    if (step2Errors[name]) {
      setStep2Errors(prev => { const next = { ...prev }; delete next[name]; return next; });
    }
    // PL-EMP-001: clear the per-field step 3 error the moment the user starts correcting it.
    if (step3Errors[name]) {
      setStep3Errors(prev => { const next = { ...prev }; delete next[name]; return next; });
    }
    // PL-FIN-001: clear the per-field step 4 error the moment the user starts correcting it.
    if (step4Errors[name]) {
      setStep4Errors(prev => { const next = { ...prev }; delete next[name]; return next; });
    }
    // PL-FIN-001: clear the per-field step 5 error the moment the user starts correcting it.
    if (step5Errors[name]) {
      setStep5Errors(prev => { const next = { ...prev }; delete next[name]; return next; });
    }

    if (name === 'bankAccountNumber') {
      const originalValue = val as string;
      const sanitizedValue = originalValue.replace(/[^0-9]/g, '');
      if (originalValue !== sanitizedValue) {
        setStep5Errors(prev => ({
          ...prev,
          bankAccountNumber: 'Account Number must contain only numeric digits (special characters and emojis are not allowed)'
        }));
      } else {
        if (step5Errors.bankAccountNumber) {
          setStep5Errors(prev => { const next = { ...prev }; delete next.bankAccountNumber; return next; });
        }
      }
      val = sanitizedValue;
    }

    if (name === 'bankIfsc') {
      const originalValue = val as string;
      const sanitizedValue = originalValue.replace(/[^a-zA-Z0-9]/g, '');
      if (originalValue !== sanitizedValue) {
        setStep5Errors(prev => ({
          ...prev,
          bankIfsc: 'IFSC Code must contain only alphanumeric characters (special characters and emojis are not allowed)'
        }));
      } else {
        if (step5Errors.bankIfsc) {
          setStep5Errors(prev => { const next = { ...prev }; delete next.bankIfsc; return next; });
        }
      }
      val = sanitizedValue.toUpperCase();
    }

    if (name === 'bankName') {
      const originalValue = val as string;
      const regex = /^[a-zA-Z\u00C0-\u024F\s.,'&\-]*$/;
      if (!regex.test(originalValue)) {
        const chars = originalValue.split('');
        const sanitizedValue = chars.filter(c => /^[a-zA-Z\u00C0-\u024F\s.,'&\-]$/.test(c)).join('');
        setStep5Errors(prev => ({
          ...prev,
          bankName: 'Bank Name must contain only valid alphabetic characters (special characters and emojis are not allowed)'
        }));
        val = sanitizedValue;
      } else {
        if (step5Errors.bankName) {
          setStep5Errors(prev => { const next = { ...prev }; delete next.bankName; return next; });
        }
      }
    }
    
    setFormData((prev: FormData) => ({ ...prev, [name]: val }));
  };

  // PL_001 / PL-PER-001 / PL-PER-002 / PL-PER-003 / PD_005: validates ALL Step 2 mandatory fields.
  // Returns a fieldName → errorMessage map so every field can be highlighted at once.
  const validateAllStep2Fields = () => {
    // PL-PER-001/002: include accented chars (À-ɏ) for international names.
    // Emoji and other Unicode symbols are NOT in this class — they will be rejected.
    const nameRegex = /^(?=.*[a-zA-Z\u00C0-\u024F])[a-zA-Z\u00C0-\u024F\s'-]+$/;
    // PL-PER-003: explicit allowlist for address — rejects emojis and other Unicode
    // symbols while allowing letters, digits, spaces, and common punctuation.
    const addressAllowlistRegex = /^[a-zA-Z0-9\u00C0-\u024F\s,.'\-/#&()]+$/;
    const errs: Record<string, string> = {};

    if (!formData.fatherName.trim())
      errs.fatherName = "Father's Name is required";
    else if (!nameRegex.test(formData.fatherName.trim()))
      errs.fatherName = "Father's Name: letters only — emojis and special characters are not allowed";

    if (!formData.motherName.trim())
      errs.motherName = "Mother's Name is required";
    else if (!nameRegex.test(formData.motherName.trim()))
      errs.motherName = "Mother's Name: letters only — emojis and special characters are not allowed";

    if (!formData.gender)
      errs.gender = 'Gender is required';

    if (!formData.maritalStatus)
      errs.maritalStatus = 'Marital Status is required';

    if (formData.dependents === '' || formData.dependents === null || formData.dependents === undefined) {
      errs.dependents = 'Number of Dependents is required';
    } else {
      const num = Number(formData.dependents);
      if (isNaN(num) || !Number.isInteger(num) || num < 0)
        errs.dependents = 'Must be a non-negative whole number (0, 1, 2…)';
      // PD_005: cap at 20 — higher values are unrealistic and likely data entry errors.
      else if (num > 20)
        errs.dependents = 'Must be between 0 and 20';
    }

    if (!formData.currentAddress.trim())
      errs.currentAddress = 'Current Address is required';
    else if (formData.currentAddress.trim().length > 255)
      errs.currentAddress = 'Current Address must not exceed 255 characters';
    else if (!/(?=.*[a-zA-Z])/.test(formData.currentAddress.trim()))
      errs.currentAddress = 'Address must contain at least one letter — numeric-only values are not valid';
    // PL-PER-003: reject emojis / disallowed symbols via explicit allowlist.
    else if (!addressAllowlistRegex.test(formData.currentAddress.trim()))
      errs.currentAddress = 'Address contains invalid characters (emojis and special symbols are not accepted)';

    return errs;
  };

  // PL-PER-001/002: live onBlur validator for name fields.
  // Runs the same nameRegex as validateAllStep2Fields so the user sees the emoji
  // error immediately when they tab away, without waiting for Continue.
  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nameRegex = /^(?=.*[a-zA-Z\u00C0-\u024F])[a-zA-Z\u00C0-\u024F\s'-]+$/;
    const label = name === 'fatherName' ? "Father's Name" : "Mother's Name";
    let err = '';
    if (!value.trim()) err = `${label} is required`;
    else if (!nameRegex.test(value.trim()))
      err = `${label}: letters only — emojis and special characters are not allowed`;
    setStep2Errors(prev =>
      err ? { ...prev, [name]: err }
           : (({ [name]: _, ...rest }) => rest)(prev)
    );
  };

  // PL-PER-003: live onBlur validator for Current Address.
  const handleAddressBlur = () => {
    const addressAllowlistRegex = /^[a-zA-Z0-9\u00C0-\u024F\s,.'\-/#&()]+$/;
    const value = formData.currentAddress;
    let err = '';
    if (!value.trim()) err = 'Current Address is required';
    else if (value.trim().length > 255) err = 'Current Address must not exceed 255 characters';
    else if (!/(?=.*[a-zA-Z])/.test(value.trim())) err = 'Address must contain at least one letter';
    else if (!addressAllowlistRegex.test(value.trim()))
      err = 'Address contains invalid characters (emojis and special symbols are not accepted)';
    setStep2Errors(prev =>
      err ? { ...prev, currentAddress: err }
           : (({ currentAddress: _, ...rest }) => rest)(prev)
    );
  };

  // PL-EMP-001: validates ALL Step 3 mandatory fields.
  // Returns a fieldName → errorMessage map so every field can be highlighted at once.
  const validateAllStep3Fields = () => {
    const textAllowlistRegex = /^[a-zA-Z0-9\u00C0-\u024F\s,.'\-/#&()]+$/;
    const companyNameRegex = /^[a-zA-Z0-9\u00C0-\u024F\s.,'&\-]+$/;
    const designationRegex = /^[a-zA-Z0-9\u00C0-\u024F\s.,'&\-\/]+$/;
    // PL-EMP-023: Strict email validation regex that rejects emojis
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const errs: Record<string, string> = {};

    // Company Name
    if (!formData.companyName.trim()) {
      errs.companyName = 'Company Name is required';
    } else if (formData.companyName.trim().length > 150) {
      errs.companyName = 'Company Name must not exceed 150 characters';
    } else if (!/(?=.*[a-zA-Z\u00C0-\u024F])/.test(formData.companyName.trim())) {
      errs.companyName = 'Company name must contain at least one letter — numeric-only values are not valid';
    } else if (!companyNameRegex.test(formData.companyName.trim())) {
      errs.companyName = 'Company name contains invalid characters (special symbols like #, @ are not allowed)';
    }

    // Designation
    if (!formData.designation.trim()) {
      errs.designation = 'Designation is required';
    } else if (formData.designation.trim().length > 100) {
      errs.designation = 'Designation must not exceed 100 characters';
    } else if (!/(?=.*[a-zA-Z\u00C0-\u024F])/.test(formData.designation.trim())) {
      errs.designation = 'Designation must contain at least one letter — numeric-only values are not valid';
    } else if (!designationRegex.test(formData.designation.trim())) {
      errs.designation = 'Designation contains invalid characters (special symbols like #, @ are not allowed)';
    }

    // Employee ID
    if (!formData.employeeId.trim()) {
      errs.employeeId = 'Employee ID is required';
    } else if (formData.employeeId.trim().length > 50) {
      errs.employeeId = 'Employee ID must not exceed 50 characters';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.employeeId.trim())) {
      errs.employeeId = 'Employee ID must contain only alphanumeric characters (no spaces or special symbols)';
    }

    // Official Email
    if (!formData.officialEmail.trim()) {
      errs.officialEmail = 'Official Email is required';
    } else if (formData.officialEmail.trim().length > 120) {
      errs.officialEmail = 'Official Email must not exceed 120 characters';
    } else if (!emailRegex.test(formData.officialEmail.trim())) {
      errs.officialEmail = 'Please enter a valid official email address (no emojis allowed)';
    }

    const curExp = Number(formData.currentExperienceMonths);
    const totExp = Number(formData.totalExperienceMonths);

    // Current Experience
    if (formData.currentExperienceMonths === '' || formData.currentExperienceMonths === null || formData.currentExperienceMonths === undefined) {
      errs.currentExperienceMonths = 'Current Experience is required';
    } else {
      if (isNaN(curExp) || !Number.isInteger(curExp) || curExp < 0) {
        errs.currentExperienceMonths = 'Must be a non-negative whole number (0, 1, 2…)';
      } else if (curExp > 720) {
        errs.currentExperienceMonths = 'Current Experience must not exceed 720 months (60 years)';
      }
    }

    // Total Experience
    if (formData.totalExperienceMonths === '' || formData.totalExperienceMonths === null || formData.totalExperienceMonths === undefined) {
      errs.totalExperienceMonths = 'Total Experience is required';
    } else {
      if (isNaN(totExp) || !Number.isInteger(totExp) || totExp < 0) {
        errs.totalExperienceMonths = 'Must be a non-negative whole number (0, 1, 2…)';
      } else if (totExp > 720) {
        errs.totalExperienceMonths = 'Total Experience must not exceed 720 months (60 years)';
      }
    }

    // Cross field experience validation
    if (formData.currentExperienceMonths !== '' && formData.totalExperienceMonths !== '' && !isNaN(curExp) && !isNaN(totExp) && curExp >= 0 && totExp >= 0 && curExp <= 720 && totExp <= 720) {
      if (curExp > totExp) {
        errs.currentExperienceMonths = 'Current experience cannot exceed total experience';
        errs.totalExperienceMonths = 'Total experience cannot be less than current experience';
      }
    }

    // Office Address
    if (!formData.officeAddress.trim()) {
      errs.officeAddress = 'Office Address is required';
    } else if (formData.officeAddress.trim().length > 255) {
      errs.officeAddress = 'Office Address must not exceed 255 characters';
    } else if (!/(?=.*[a-zA-Z])/.test(formData.officeAddress.trim())) {
      errs.officeAddress = 'Address must contain at least one letter — numeric-only values are not valid addresses';
    } else if (!textAllowlistRegex.test(formData.officeAddress.trim())) {
      errs.officeAddress = 'Address contains invalid characters (emojis and special symbols are not accepted)';
    }

    return errs;
  };

  // PL-EMP-001: live onBlur validator for Step 3 fields.
  const handleStep3Blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const textAllowlistRegex = /^[a-zA-Z0-9\u00C0-\u024F\s,.'\-/#&()]+$/;
    const companyNameRegex = /^[a-zA-Z0-9\u00C0-\u024F\s.,'&\-]+$/;
    const designationRegex = /^[a-zA-Z0-9\u00C0-\u024F\s.,'&\-\/]+$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let err = '';

    if (name === 'companyName') {
      if (!value.trim()) err = 'Company Name is required';
      else if (value.trim().length > 150) err = 'Company Name must not exceed 150 characters';
      else if (!/(?=.*[a-zA-Z\u00C0-\u024F])/.test(value.trim()))
        err = 'Company name must contain at least one letter — numeric-only values are not valid';
      else if (!companyNameRegex.test(value.trim()))
        err = 'Company name contains invalid characters (special symbols like #, @ are not allowed)';
    } else if (name === 'designation') {
      if (!value.trim()) err = 'Designation is required';
      else if (value.trim().length > 100) err = 'Designation must not exceed 100 characters';
      else if (!/(?=.*[a-zA-Z\u00C0-\u024F])/.test(value.trim()))
        err = 'Designation must contain at least one letter — numeric-only values are not valid';
      else if (!designationRegex.test(value.trim()))
        err = 'Designation contains invalid characters (special symbols like #, @ are not allowed)';
    } else if (name === 'employeeId') {
      if (!value.trim()) err = 'Employee ID is required';
      else if (value.trim().length > 50) err = 'Employee ID must not exceed 50 characters';
      else if (!/^[a-zA-Z0-9]+$/.test(value.trim()))
        err = 'Employee ID must contain only alphanumeric characters (no spaces or special symbols)';
    } else if (name === 'officialEmail') {
      if (!value.trim()) err = 'Official Email is required';
      else if (value.trim().length > 120) err = 'Official Email must not exceed 120 characters';
      else if (!emailRegex.test(value.trim()))
        err = 'Please enter a valid official email address (no emojis allowed)';
    } else if (name === 'currentExperienceMonths') {
      if (value === '') err = 'Current Experience is required';
      else {
        const num = Number(value);
        if (isNaN(num) || !Number.isInteger(num) || num < 0) {
          err = 'Must be a non-negative whole number (0, 1, 2…)';
        } else if (num > 720) {
          err = 'Current Experience must not exceed 720 months (60 years)';
        } else {
          const totExp = Number(formData.totalExperienceMonths);
          if (!isNaN(totExp) && Number.isInteger(totExp) && num > totExp && formData.totalExperienceMonths !== '') {
            err = 'Current experience cannot exceed total experience';
          }
        }
      }
    } else if (name === 'totalExperienceMonths') {
      if (value === '') err = 'Total Experience is required';
      else {
        const num = Number(value);
        if (isNaN(num) || !Number.isInteger(num) || num < 0) {
          err = 'Must be a non-negative whole number (0, 1, 2…)';
        } else if (num > 720) {
          err = 'Total Experience must not exceed 720 months (60 years)';
        } else {
          const curExp = Number(formData.currentExperienceMonths);
          if (!isNaN(curExp) && Number.isInteger(curExp) && num < curExp && formData.currentExperienceMonths !== '') {
            err = 'Total experience cannot be less than current experience';
          }
        }
      }
    } else if (name === 'officeAddress') {
      if (!value.trim()) err = 'Office Address is required';
      else if (value.trim().length > 255) err = 'Office Address must not exceed 255 characters';
      else if (!/(?=.*[a-zA-Z])/.test(value.trim()))
        err = 'Address must contain at least one letter — numeric-only values are not valid addresses';
      else if (!textAllowlistRegex.test(value.trim()))
        err = 'Address contains invalid characters (emojis and special symbols are not accepted)';
    }

    setStep3Errors(prev => {
      let next = err ? { ...prev, [name]: err } : (({ [name]: _, ...rest }) => rest)(prev);
      if (name === 'currentExperienceMonths' || name === 'totalExperienceMonths') {
        const curValue = name === 'currentExperienceMonths' ? value : formData.currentExperienceMonths;
        const totValue = name === 'totalExperienceMonths' ? value : formData.totalExperienceMonths;
        const curValNum = Number(curValue);
        const totValNum = Number(totValue);
        if (curValue !== '' && totValue !== '' && !isNaN(curValNum) && !isNaN(totValNum)) {
          if (curValNum <= totValNum && curValNum <= 720 && totValNum <= 720) {
            if (next.currentExperienceMonths === 'Current experience cannot exceed total experience') {
              delete next.currentExperienceMonths;
            }
            if (next.totalExperienceMonths === 'Total experience cannot be less than current experience') {
              delete next.totalExperienceMonths;
            }
          } else if (curValNum > totValNum && curValNum <= 720 && totValNum <= 720) {
            next.currentExperienceMonths = 'Current experience cannot exceed total experience';
            next.totalExperienceMonths = 'Total experience cannot be less than current experience';
          }
        }
      }
      return next;
    });
  };

  const validateAllStep4Fields = () => {
    const errs: Record<string, string> = {};

    const validateAmount = (field: string, label: string, required: boolean) => {
      const valObj = formData[field as keyof FormData];
      const val = valObj !== undefined && valObj !== null ? valObj.toString().trim() : '';

      if (!val) {
        if (required) {
          errs[field] = `${label} is required`;
        }
        return;
      }

      if (/[eE]/.test(val)) {
        errs[field] = `${label} cannot contain the character "e" or "E"`;
      } else if (val.includes('-')) {
        errs[field] = `${label} cannot be negative`;
      } else if (!/^\d+(\.\d+)?$/.test(val)) {
        errs[field] = `${label} must contain only numeric values`;
      } else {
        const num = Number(val);
        if (num < 0) {
          errs[field] = `${label} cannot be negative`;
        } else if (val.replace(/[^0-9]/g, '').length > 10) {
          errs[field] = `${label} cannot exceed 10 digits`;
        }
      }
    };

    validateAmount('grossMonthlyIncome', 'Gross Monthly Income', true);
    validateAmount('netTakeHomeSalary', 'Net Take Home Salary', true);
    validateAmount('existingEmi', 'Existing EMIs', true);
    validateAmount('otherIncome', 'Other Income', false);
    validateAmount('creditCardOutstanding', 'Credit Card Outstanding', false);

    // Existing Loans Count
    const countVal = formData.existingLoansCount !== undefined && formData.existingLoansCount !== null ? formData.existingLoansCount.toString().trim() : '';
    if (!countVal) {
      errs.existingLoansCount = 'Existing Loans Count is required';
    } else {
      if (/[eE]/.test(countVal)) {
        errs.existingLoansCount = 'Existing Loans Count cannot contain the character "e" or "E"';
      } else if (countVal.includes('-')) {
        errs.existingLoansCount = 'Existing Loans Count cannot be negative';
      } else if (countVal.includes('.')) {
        errs.existingLoansCount = 'Existing Loans Count must be a whole number';
      } else if (!/^\d+$/.test(countVal)) {
        errs.existingLoansCount = 'Existing Loans Count must contain only numeric values';
      } else {
        const num = Number(countVal);
        if (num < 0) {
          errs.existingLoansCount = 'Existing Loans Count cannot be negative';
        } else if (countVal.replace(/[^0-9]/g, '').length > 2) {
          errs.existingLoansCount = 'Existing Loans Count cannot exceed 2 digits';
        }
      }
    }

    // Cross-field validation: Net Take Home Salary <= Gross Monthly Income
    if (!errs.grossMonthlyIncome && !errs.netTakeHomeSalary) {
      const gross = Number(formData.grossMonthlyIncome);
      const net = Number(formData.netTakeHomeSalary);
      if (net > gross) {
        errs.netTakeHomeSalary = 'Net Take Home Salary cannot exceed Gross Monthly Income';
      }
    }

    return errs;
  };

  const handleStep4Blur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let err = '';

    const labelMap: Record<string, string> = {
      grossMonthlyIncome: 'Gross Monthly Income',
      netTakeHomeSalary: 'Net Take Home Salary',
      existingEmi: 'Existing EMIs',
      otherIncome: 'Other Income',
      creditCardOutstanding: 'Credit Card Outstanding',
      existingLoansCount: 'Existing Loans Count'
    };
    const label = labelMap[name] || name;
    const required = name === 'grossMonthlyIncome' || name === 'netTakeHomeSalary' || name === 'existingEmi' || name === 'existingLoansCount';

    if (name === 'grossMonthlyIncome' || name === 'netTakeHomeSalary' || name === 'existingEmi' || name === 'otherIncome' || name === 'creditCardOutstanding') {
      if (value === '' || value === null || value === undefined) {
        if (required) {
          err = `${label} is required`;
        }
      } else {
        const val = value.trim();
        if (/[eE]/.test(val)) {
          err = `${label} cannot contain the character "e" or "E"`;
        } else if (val.includes('-')) {
          err = `${label} cannot be negative`;
        } else if (!/^\d+(\.\d+)?$/.test(val)) {
          err = `${label} must contain only numeric values`;
        } else {
          const num = Number(val);
          if (num < 0) {
            err = `${label} cannot be negative`;
          } else if (val.replace(/[^0-9]/g, '').length > 10) {
            err = `${label} cannot exceed 10 digits`;
          }
        }
      }
    } else if (name === 'existingLoansCount') {
      if (value === '' || value === null || value === undefined) {
        err = `${label} is required`;
      } else {
        const val = value.trim();
        if (/[eE]/.test(val)) {
          err = `${label} cannot contain the character "e" or "E"`;
        } else if (val.includes('-')) {
          err = `${label} cannot be negative`;
        } else if (val.includes('.')) {
          err = `${label} must be a whole number`;
        } else if (!/^\d+$/.test(val)) {
          err = `${label} must contain only numeric values`;
        } else {
          const num = Number(val);
          if (num < 0) {
            err = `${label} cannot be negative`;
          } else if (val.replace(/[^0-9]/g, '').length > 2) {
            err = `${label} cannot exceed 2 digits`;
          }
        }
      }
    }

    setStep4Errors(prev => {
      let next = err ? { ...prev, [name]: err } : (({ [name]: _, ...rest }) => rest)(prev);
      
      const currentGross = name === 'grossMonthlyIncome' ? value : formData.grossMonthlyIncome;
      const currentNet = name === 'netTakeHomeSalary' ? value : formData.netTakeHomeSalary;
      
      if (currentGross !== '' && currentNet !== '' && !next.grossMonthlyIncome && !next.netTakeHomeSalary) {
        const grossNum = Number(currentGross);
        const netNum = Number(currentNet);
        if (netNum > grossNum) {
          next.netTakeHomeSalary = 'Net Take Home Salary cannot exceed Gross Monthly Income';
        } else if (next.netTakeHomeSalary === 'Net Take Home Salary cannot exceed Gross Monthly Income') {
          delete next.netTakeHomeSalary;
        }
      }
      
      return next;
    });
  };

  const validateAllStep5Fields = () => {
    const errs: Record<string, string> = {};
    const bankNameRegex = /^[a-zA-Z\u00C0-\u024F\s.,'&\-]+$/;
    const ifscRegex = /^[a-zA-Z]{4}0[a-zA-Z0-9]{6}$/;

    // Bank Name
    if (!formData.bankName.trim()) {
      errs.bankName = 'Bank Name is required';
    } else if (formData.bankName.trim().length > 100) {
      errs.bankName = 'Bank Name must not exceed 100 characters';
    } else if (!/(?=.*[a-zA-Z\u00C0-\u024F])/.test(formData.bankName.trim())) {
      errs.bankName = 'Bank Name must contain at least one letter';
    } else if (!bankNameRegex.test(formData.bankName.trim())) {
      errs.bankName = 'Bank Name contains invalid characters (special symbols and emojis are not allowed)';
    }

    // Account Number
    if (!formData.bankAccountNumber.trim()) {
      errs.bankAccountNumber = 'Bank Account Number is required';
    } else if (!/^\d+$/.test(formData.bankAccountNumber.trim())) {
      errs.bankAccountNumber = 'Account Number must contain only numeric digits (no letters, spaces, special characters, or emojis)';
    } else if (formData.bankAccountNumber.trim().length < 9 || formData.bankAccountNumber.trim().length > 18) {
      errs.bankAccountNumber = 'Account Number must be between 9 and 18 digits';
    }

    // IFSC Code
    const ifscVal = formData.bankIfsc.trim().toUpperCase();
    if (!formData.bankIfsc.trim()) {
      errs.bankIfsc = 'Bank IFSC is required';
    } else if (ifscVal.length !== 11) {
      errs.bankIfsc = 'IFSC Code must be exactly 11 characters long';
    } else if (!/^[A-Z0-9]+$/.test(ifscVal)) {
      errs.bankIfsc = 'IFSC Code must contain only alphanumeric characters (no special symbols or emojis)';
    } else if (ifscVal.charAt(4) !== '0') {
      errs.bankIfsc = 'IFSC Code 5th character must be "0" (e.g. SBIN0001234)';
    } else if (!ifscRegex.test(ifscVal)) {
      errs.bankIfsc = 'Please enter a valid IFSC Code format (e.g. HDFC0001234)';
    }

    // Account Type
    if (!formData.bankAccountType) {
      errs.bankAccountType = 'Account Type is required';
    }

    return errs;
  };

  const handleStep5Blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let err = '';
    const bankNameRegex = /^[a-zA-Z\u00C0-\u024F\s.,'&\-]+$/;
    const ifscRegex = /^[a-zA-Z]{4}0[a-zA-Z0-9]{6}$/;

    if (name === 'bankName') {
      if (!value.trim()) {
        err = 'Bank Name is required';
      } else if (value.trim().length > 100) {
        err = 'Bank Name must not exceed 100 characters';
      } else if (!/(?=.*[a-zA-Z\u00C0-\u024F])/.test(value.trim())) {
        err = 'Bank Name must contain at least one letter';
      } else if (!bankNameRegex.test(value.trim())) {
        err = 'Bank Name contains invalid characters (special symbols and emojis are not allowed)';
      }
    } else if (name === 'bankAccountNumber') {
      if (!value.trim()) {
        err = 'Bank Account Number is required';
      } else if (!/^\d+$/.test(value.trim())) {
        err = 'Account Number must contain only numeric digits (no letters, spaces, special characters, or emojis)';
      } else if (value.trim().length < 9 || value.trim().length > 18) {
        err = 'Account Number must be between 9 and 18 digits';
      }
    } else if (name === 'bankIfsc') {
      const ifscVal = value.trim().toUpperCase();
      if (!value.trim()) {
        err = 'Bank IFSC is required';
      } else if (ifscVal.length !== 11) {
        err = 'IFSC Code must be exactly 11 characters long';
      } else if (!/^[A-Z0-9]+$/.test(ifscVal)) {
        err = 'IFSC Code must contain only alphanumeric characters (no special symbols or emojis)';
      } else if (ifscVal.charAt(4) !== '0') {
        err = 'IFSC Code 5th character must be "0" (e.g. SBIN0001234)';
      } else if (!ifscRegex.test(ifscVal)) {
        err = 'Please enter a valid IFSC Code format (e.g. HDFC0001234)';
      }
    } else if (name === 'bankAccountType') {
      if (!value) {
        err = 'Account Type is required';
      }
    }

    setStep5Errors(prev =>
      err ? { ...prev, [name]: err }
           : (({ [name]: _, ...rest }) => rest)(prev)
    );
  };

  const validateStep = () => {
    setError('');
    const nameRegex = /^(?=.*[a-zA-Z])[a-zA-Z\s'-]+$/;
    const addressRegex = /^(?=.*[a-zA-Z])/;
    const MIN_LOAN_AMOUNT = 10000; // ₹10,000 minimum
    const MAX_LOAN_AMOUNT = 50000000; // ₹5 Crore maximum

    if (step === 1) {
      if (!formData.loanPurpose) {
        setError('Loan Purpose is required');
        return false;
      }
      if (!formData.requestedAmount) {
        setError('Requested Amount is required');
        return false;
      }
      const requestedAmt = parseFloat(formData.requestedAmount);
      if (isNaN(requestedAmt)) {
        setError('Requested Amount must be a valid number');
        return false;
      }
      if (requestedAmt < MIN_LOAN_AMOUNT) {
        setError(`Requested Amount must be at least ₹${MIN_LOAN_AMOUNT.toLocaleString()}`);
        return false;
      }
      if (requestedAmt > MAX_LOAN_AMOUNT) {
        setError(`Requested Amount exceeds maximum limit of ₹${MAX_LOAN_AMOUNT.toLocaleString()}`);
        return false;
      }
      if (!formData.tenureMonths) {
        setError('Tenure is required');
        return false;
      }
      if (parseInt(formData.tenureMonths) < 12 || parseInt(formData.tenureMonths) > 60) {
        setError('Tenure must be between 12 and 60 months');
        return false;
      }
    } else if (step === 2) {
      // PL_001: validate all fields at once and show inline errors under each field.
      const errs = validateAllStep2Fields();
      setStep2Errors(errs);
      if (Object.keys(errs).length > 0) {
        // UI_007: scroll to top so the global summary banner and first inline errors
        // are reachable on first click even when the user is scrolled down.
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setError(`Please fix the ${Object.keys(errs).length} highlighted field(s) below.`);
        return false;
      }
      setStep2Errors({});
    } else if (step === 3) {
      const errs = validateAllStep3Fields();
      setStep3Errors(errs);
      if (Object.keys(errs).length > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setError(`Please fix the ${Object.keys(errs).length} highlighted field(s) below.`);
        return false;
      }
      setStep3Errors({});
    } else if (step === 4) {
      const errs = validateAllStep4Fields();
      setStep4Errors(errs);
      if (Object.keys(errs).length > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setError(`Please fix the ${Object.keys(errs).length} highlighted field(s) below.`);
        return false;
      }
      setStep4Errors({});
    } else if (step === 5) {
      const errs = validateAllStep5Fields();
      setStep5Errors(errs);
      if (Object.keys(errs).length > 0) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setError(`Please fix the ${Object.keys(errs).length} highlighted field(s) below.`);
        return false;
      }
      setStep5Errors({});
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
        // This IS a blocking error — we cannot persist without valid numeric fields.
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
      // LR_027: Use a non-blocking amber warning instead of a red error banner.
      // Data is always preserved locally in sessionStorage, so the user can safely
      // continue even if the background save fails. The warning auto-dismisses.
      const msg = err.response?.data?.message || "Auto-save encountered an issue. Your progress is preserved locally.";
      setSaveWarning(msg);
      setTimeout(() => setSaveWarning(''), 6000);
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    // Requested_Amt_012: Navigate to the next step immediately after local validation
    // without waiting for the API auto-save round-trip. Previously, awaiting saveDraft()
    // caused a visible spinner delay of several seconds before the page changed.
    // saveDraft() now runs in the background; any failure shows a non-blocking warning.
    setStep(step + 1);
    saveDraft(); // fire-and-forget — errors handled inside saveDraft via setSaveWarning
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
          {/* LR_027: non-blocking amber toast for background auto-save warnings */}
          {saveWarning && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-6 py-4 rounded-3xl mb-4 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-amber-400 shrink-0" />
                <span className="font-medium text-sm">{saveWarning}</span>
              </div>
              <button onClick={() => setSaveWarning('')} className="text-amber-400/50 hover:text-amber-400 ml-4 shrink-0">
                <CheckCircle size={18} />
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
                            <div className="relative">
                              <select
                                name="loanPurpose"
                                value={formData.loanPurpose}
                                onChange={handleInputChange}
                                className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 pr-12 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
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
                              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                            </div>
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
                                  min="10000"
                                  max="50000000"
                                  className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Tenure (Months)</label>
                              <div className="relative">
                                <select
                                  name="tenureMonths"
                                  value={formData.tenureMonths}
                                  onChange={handleInputChange}
                                  className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 pr-12 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                >
                                  <option value="">Select Tenure</option>
                                  <option value="12">12 Months</option>
                                  <option value="24">24 Months</option>
                                  <option value="36">36 Months</option>
                                  <option value="48">48 Months</option>
                                  <option value="60">60 Months</option>
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                              </div>
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
                            <input
                              type="text"
                              name="fatherName"
                              value={formData.fatherName}
                              onChange={handleInputChange}
                              onBlur={handleNameBlur}
                              placeholder="e.g. Rajesh Kumar"
                              className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                step2Errors.fatherName ? 'border-red-500/50' : 'border-white/10'
                              }`}
                            />
                            {step2Errors.fatherName && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step2Errors.fatherName}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Mother's Name</label>
                            <input
                              type="text"
                              name="motherName"
                              value={formData.motherName}
                              onChange={handleInputChange}
                              onBlur={handleNameBlur}
                              placeholder="e.g. Sunita Devi"
                              className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                step2Errors.motherName ? 'border-red-500/50' : 'border-white/10'
                              }`}
                            />
                            {step2Errors.motherName && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step2Errors.motherName}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* UI_006: wrapped in relative div with ChevronDown icon */}
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Gender</label>
                            <div className="relative">
                              <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 pr-12 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer ${
                                  step2Errors.gender ? 'border-red-500/50' : 'border-white/10'
                                }`}
                              >
                                <option value="">Select</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                              </select>
                              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                            </div>
                            {step2Errors.gender && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step2Errors.gender}</p>
                            )}
                          </div>
                          {/* UI_006: wrapped in relative div with ChevronDown icon */}
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Marital Status</label>
                            <div className="relative">
                              <select
                                name="maritalStatus"
                                value={formData.maritalStatus}
                                onChange={handleInputChange}
                                className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 pr-12 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer ${
                                  step2Errors.maritalStatus ? 'border-red-500/50' : 'border-white/10'
                                }`}
                              >
                                <option value="">Select</option>
                                <option value="SINGLE">Single</option>
                                <option value="MARRIED">Married</option>
                              </select>
                              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                            </div>
                            {step2Errors.maritalStatus && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step2Errors.maritalStatus}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Dependents</label>
                            <input
                              type="number"
                              name="dependents"
                              value={formData.dependents}
                              onChange={handleInputChange}
                              min="0"
                              max="20"
                              step="1"
                              className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                step2Errors.dependents ? 'border-red-500/50' : 'border-white/10'
                              }`}
                            />
                            {step2Errors.dependents && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step2Errors.dependents}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Current Address</label>
                          <textarea
                            name="currentAddress"
                            value={formData.currentAddress}
                            onChange={handleInputChange as any}
                            onBlur={handleAddressBlur}
                            placeholder="e.g. 12 Sunshine Apartments, MG Road, Bengaluru"
                            maxLength={255}
                            className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all h-24 resize-none ${
                              step2Errors.currentAddress ? 'border-red-500/50' : 'border-white/10'
                            }`}
                          />
                          {/* PL-PER-003: submit-time and blur-time errors (incl. emoji) shown inline */}
                          {step2Errors.currentAddress ? (
                            <p className="text-xs text-red-400 font-medium mt-2">{step2Errors.currentAddress}</p>
                          ) : (
                            <p className="text-[11px] text-gray-600 mt-2">Must include street/area name (letters required, no emojis)</p>
                          )}
                        </div>

                        {/* Residential_013: Residential Stability field required by SRS.
                            Field existed in FormData, initialState, loadApplicationData and the
                            backend entity but was never rendered in the UI. */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Residential Stability</label>
                            <div className="relative">
                              <select
                                name="residentialStability"
                                value={formData.residentialStability}
                                onChange={handleInputChange}
                                className="w-full bg-[#2a2a32] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                              >
                                <option value="">Select Stability</option>
                                <option value="OWNED">Owned</option>
                                <option value="RENTED">Rented</option>
                                <option value="COMPANY_PROVIDED">Company Provided</option>
                              </select>
                              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                            </div>
                          </div>
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
                            <input
                              type="text"
                              name="companyName"
                              value={formData.companyName}
                              onChange={handleInputChange}
                              onBlur={handleStep3Blur}
                              maxLength={150}
                              className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                step3Errors.companyName ? 'border-red-500/50' : 'border-white/10'
                              }`}
                              placeholder="Acme Corp"
                            />
                            {step3Errors.companyName && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step3Errors.companyName}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Designation</label>
                            <input
                              type="text"
                              name="designation"
                              value={formData.designation}
                              onChange={handleInputChange}
                              onBlur={handleStep3Blur}
                              maxLength={100}
                              className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                step3Errors.designation ? 'border-red-500/50' : 'border-white/10'
                              }`}
                              placeholder="Senior Manager"
                            />
                            {step3Errors.designation && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step3Errors.designation}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Employee ID</label>
                            <input
                              type="text"
                              name="employeeId"
                              value={formData.employeeId}
                              onChange={handleInputChange}
                              onBlur={handleStep3Blur}
                              maxLength={50}
                              className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                step3Errors.employeeId ? 'border-red-500/50' : 'border-white/10'
                              }`}
                              placeholder="EMP123"
                            />
                            {step3Errors.employeeId && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step3Errors.employeeId}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Official Email</label>
                            <input
                              type="email"
                              name="officialEmail"
                              value={formData.officialEmail}
                              onChange={handleInputChange}
                              onBlur={handleStep3Blur}
                              maxLength={120}
                              className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                step3Errors.officialEmail ? 'border-red-500/50' : 'border-white/10'
                              }`}
                              placeholder="name@company.com"
                            />
                            {step3Errors.officialEmail && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step3Errors.officialEmail}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Current Experience (Months)</label>
                            <input
                              type="number"
                              name="currentExperienceMonths"
                              min="0"
                              max="720"
                              value={formData.currentExperienceMonths}
                              onChange={handleInputChange}
                              onBlur={handleStep3Blur}
                              className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                step3Errors.currentExperienceMonths ? 'border-red-500/50' : 'border-white/10'
                              }`}
                              placeholder="24"
                            />
                            {step3Errors.currentExperienceMonths && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step3Errors.currentExperienceMonths}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Total Experience (Months)</label>
                            <input
                              type="number"
                              name="totalExperienceMonths"
                              min="0"
                              max="720"
                              value={formData.totalExperienceMonths}
                              onChange={handleInputChange}
                              onBlur={handleStep3Blur}
                              className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                step3Errors.totalExperienceMonths ? 'border-red-500/50' : 'border-white/10'
                              }`}
                              placeholder="60"
                            />
                            {step3Errors.totalExperienceMonths && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step3Errors.totalExperienceMonths}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Office Address</label>
                          <textarea
                            name="officeAddress"
                            value={formData.officeAddress}
                            onChange={handleInputChange as any}
                            onBlur={handleStep3Blur}
                            placeholder="e.g. 5th Floor, Tech Park, Whitefield, Bengaluru"
                            maxLength={255}
                            className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all h-24 resize-none ${
                              step3Errors.officeAddress ? 'border-red-500/50' : 'border-white/10'
                            }`}
                          />
                          {step3Errors.officeAddress ? (
                            <p className="text-xs text-red-400 font-medium mt-2">{step3Errors.officeAddress}</p>
                          ) : (
                            <p className="text-[11px] text-gray-600 mt-2">Must include building/street name (letters required, no emojis)</p>
                          )}
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
                              <input
                                type="text"
                                inputMode="numeric"
                                name="grossMonthlyIncome"
                                value={formData.grossMonthlyIncome}
                                onChange={handleInputChange}
                                onBlur={handleStep4Blur}
                                maxLength={15}
                                className={`w-full bg-[#2a2a32] border rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                  step4Errors.grossMonthlyIncome ? 'border-red-500/50' : 'border-white/10'
                                }`}
                                placeholder="1,00,000"
                              />
                            </div>
                            {step4Errors.grossMonthlyIncome && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step4Errors.grossMonthlyIncome}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Net Take Home Salary (₹)</label>
                            <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                name="netTakeHomeSalary"
                                value={formData.netTakeHomeSalary}
                                onChange={handleInputChange}
                                onBlur={handleStep4Blur}
                                maxLength={15}
                                className={`w-full bg-[#2a2a32] border rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                  step4Errors.netTakeHomeSalary ? 'border-red-500/50' : 'border-white/10'
                                }`}
                                placeholder="85,000"
                              />
                            </div>
                            {step4Errors.netTakeHomeSalary && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step4Errors.netTakeHomeSalary}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Existing EMIs (₹)</label>
                            <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                name="existingEmi"
                                value={formData.existingEmi}
                                onChange={handleInputChange}
                                onBlur={handleStep4Blur}
                                maxLength={15}
                                className={`w-full bg-[#2a2a32] border rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                  step4Errors.existingEmi ? 'border-red-500/50' : 'border-white/10'
                                }`}
                                placeholder="10,000"
                              />
                            </div>
                            {step4Errors.existingEmi && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step4Errors.existingEmi}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Existing Loans Count</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              name="existingLoansCount"
                              value={formData.existingLoansCount}
                              onChange={handleInputChange}
                              onBlur={handleStep4Blur}
                              maxLength={5}
                              className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                step4Errors.existingLoansCount ? 'border-red-500/50' : 'border-white/10'
                              }`}
                              placeholder="2"
                            />
                            {step4Errors.existingLoansCount && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step4Errors.existingLoansCount}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Other Income Sources (₹)</label>
                            <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                name="otherIncome"
                                value={formData.otherIncome}
                                onChange={handleInputChange}
                                onBlur={handleStep4Blur}
                                maxLength={15}
                                className={`w-full bg-[#2a2a32] border rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                  step4Errors.otherIncome ? 'border-red-500/50' : 'border-white/10'
                                }`}
                                placeholder="5,000"
                              />
                            </div>
                            {step4Errors.otherIncome && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step4Errors.otherIncome}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Credit Card Outstanding Balances (₹)</label>
                            <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                name="creditCardOutstanding"
                                value={formData.creditCardOutstanding}
                                onChange={handleInputChange}
                                onBlur={handleStep4Blur}
                                maxLength={15}
                                className={`w-full bg-[#2a2a32] border rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                  step4Errors.creditCardOutstanding ? 'border-red-500/50' : 'border-white/10'
                                }`}
                                placeholder="15,000"
                              />
                            </div>
                            {step4Errors.creditCardOutstanding && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step4Errors.creditCardOutstanding}</p>
                            )}
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
                            <input
                              type="text"
                              name="bankName"
                              value={formData.bankName}
                              onChange={handleInputChange}
                              onBlur={handleStep5Blur}
                              maxLength={110}
                              className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                step5Errors.bankName ? 'border-red-500/50' : 'border-white/10'
                              }`}
                              placeholder="HDFC Bank"
                            />
                            {step5Errors.bankName && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step5Errors.bankName}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Account Number</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              name="bankAccountNumber"
                              value={formData.bankAccountNumber}
                              onChange={handleInputChange}
                              onBlur={handleStep5Blur}
                              maxLength={25}
                              className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                step5Errors.bankAccountNumber ? 'border-red-500/50' : 'border-white/10'
                              }`}
                              placeholder="501000..."
                            />
                            {step5Errors.bankAccountNumber && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step5Errors.bankAccountNumber}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">IFSC Code</label>
                            <input
                              type="text"
                              name="bankIfsc"
                              value={formData.bankIfsc}
                              onChange={handleInputChange}
                              onBlur={handleStep5Blur}
                              maxLength={15}
                              className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all ${
                                step5Errors.bankIfsc ? 'border-red-500/50' : 'border-white/10'
                              }`}
                              placeholder="HDFC0001234"
                            />
                            {step5Errors.bankIfsc && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step5Errors.bankIfsc}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Account Type</label>
                            <div className="relative">
                              <select
                                name="bankAccountType"
                                value={formData.bankAccountType}
                                onChange={handleInputChange}
                                onBlur={handleStep5Blur}
                                className={`w-full bg-[#2a2a32] border rounded-2xl py-4 px-6 pr-12 text-white font-bold focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer ${
                                  step5Errors.bankAccountType ? 'border-red-500/50' : 'border-white/10'
                                }`}
                              >
                                <option value="">Select Type</option>
                                <option value="SAVINGS">Savings</option>
                                <option value="CURRENT">Current</option>
                              </select>
                              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                            </div>
                            {step5Errors.bankAccountType && (
                              <p className="text-xs text-red-400 font-medium mt-2">{step5Errors.bankAccountType}</p>
                            )}
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
