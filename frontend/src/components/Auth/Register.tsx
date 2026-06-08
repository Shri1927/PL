import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Phone, Shield, User, Mail, Calendar, MapPin, Briefcase, Lock, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import heroImage from '../../assets/hero.png';

const Register = () => {
  const [step, setStep] = useState<'mobile' | 'otp' | 'profile'>(() => {
    return (sessionStorage.getItem('register_step') as any) || 'mobile';
  });
  const [formData, setFormData] = useState(() => {
    return {
      mobile: sessionStorage.getItem('register_mobile') || '',
      fullName: '',
      email: '',
      dob: '',
      city: '',
      employmentType: 'SALARIED',
      password: '',
      confirmPassword: '',
    };
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingOtp, setFetchingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dobError, setDobError] = useState('');
  // BUG-005: live field-level validation state for Security Key and Confirm Key
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  // CITY_001: live field-level validation state for Current City
  const [cityError, setCityError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // BUG-003: today/maxDob used for input[max] attribute and submit-time range check
  const todayIso = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const currentYear = new Date().getFullYear();

  const validateDob = (value: string): string => {
    if (!value) return 'Date of Birth is required';
    // Must be strictly YYYY-MM-DD with a 4-digit year
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Please enter a valid Date of Birth (YYYY-MM-DD).';
    const year = parseInt(value.split('-')[0], 10);
    if (year < 1900 || year > currentYear) return `Year must be between 1900 and ${currentYear}.`;
    const dobDate = new Date(value);
    if (isNaN(dobDate.getTime())) return 'Please enter a valid Date of Birth.';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (dobDate > today) return 'Date of Birth cannot be in the future.';
    return '';
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, dob: value }));
    setDobError(validateDob(value));
    setError('');
  };

  // DOB_002: onBlur catches the case where Chrome silently resets the input to ""
  // for extreme years (>9999) without firing a meaningful onChange — so the user
  // sees the error the moment they tab/click away from the field.
  const handleDobBlur = () => {
    setDobError(validateDob(formData.dob));
  };

  // CITY_001: City validator — must contain at least one letter.
  // Rejects special-character-only values like "@@@@@@@@@".
  const validateCity = (value: string): string => {
    if (!value.trim()) return 'Current City is required';
    // Allow letters (including accented), spaces, hyphens, apostrophes, dots.
    // Must contain at least one alphabetic character.
    if (!/^[a-zA-Z\u00C0-\u024F][\w\u00C0-\u024F\s\-''.]*$/.test(value.trim())) {
      return 'Please enter a valid city name (letters only, no special characters).';
    }
    return '';
  };

  // CITY_001: Live handler — validates on every keystroke.
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, city: value }));
    setCityError(validateCity(value));
    setError('');
  };

  // BUG-005: Security Key validator — rules: 8–32 chars.
  // Returns an error string or '' when valid.
  const validatePassword = (value: string): string => {
    if (!value) return 'Security Key is required';
    if (value.length < 8) return `Too short — minimum 8 characters (${value.length}/8)`;
    if (value.length > 32) return 'Security Key must be at most 32 characters';
    return '';
  };

  // Live handler for Security Key: validates on every keystroke and re-validates
  // the Confirm Key if it already has a value, so mismatch errors update in real time.
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => {
      const next = { ...prev, password: value };
      // Re-validate confirm field against the new password value
      if (prev.confirmPassword) {
        setConfirmPasswordError(
          value !== prev.confirmPassword ? 'Passwords do not match' : ''
        );
      }
      return next;
    });
    setPasswordError(validatePassword(value));
    setError('');
  };

  // Live handler for Confirm Key: shows mismatch error immediately.
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, confirmPassword: value }));
    setConfirmPasswordError(
      value && value !== formData.password ? 'Passwords do not match' : ''
    );
    setError('');
  };

  // Sync state to sessionStorage whenever it changes to ensure persistence across page refreshes (BUG-002)
  useEffect(() => {
    sessionStorage.setItem('register_step', step);
  }, [step]);

  useEffect(() => {
    sessionStorage.setItem('register_mobile', formData.mobile);
  }, [formData.mobile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Strict client-side mobile number validation (BUG-001 & BUG-003)
    const mobileRegex = /^[6-9][0-9]{9}$/;
    if (!mobileRegex.test(formData.mobile)) {
      setError('Invalid mobile number. Must be exactly 10 digits and start with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/send-otp', { mobile: formData.mobile });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGetOtp = async () => {
    setError('');
    setFetchingOtp(true);

    try {
      const response = await api.get(`/auth/get-otp/${formData.mobile}`);
      if (response.data.data.found) {
        setOtp(response.data.data.otp);
      } else {
        setError('No OTP found. Please send OTP first.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve OTP');
    } finally {
      setFetchingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        mobile: formData.mobile,
        otp,
      });

      if (response.data.data.existingUser && response.data.data.authResponse) {
        const authData = response.data.data.authResponse;
        // Clean up transient registration storage
        sessionStorage.removeItem('register_step');
        sessionStorage.removeItem('register_mobile');
        // Tokens are now in HttpOnly cookies — only pass the profile to context
        login({
          userId: authData.userId,
          role: authData.role,
          name: `User ${authData.userId}`,
        });
        navigate('/apply');
      } else {
        setStep('profile');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all mandatory fields first
    if (!formData.fullName.trim()) {
      setError('Full Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email Address is required');
      return;
    }
    if (!formData.dob) {
      setError('Date of Birth is required');
      return;
    }
    if (!formData.city.trim()) {
      const e = 'Current City is required';
      setError(e); setCityError(e);
      return;
    }
    // CITY_001: reject special-char-only city values at submit as final gate.
    const cityErr = validateCity(formData.city);
    if (cityErr) { setError(cityErr); setCityError(cityErr); return; }
    if (!formData.password) {
      const e = 'Security Key is required';
      setError(e); setPasswordError(e);
      return;
    }
    if (!formData.confirmPassword) {
      const e = 'Confirm Key is required';
      setError(e); setConfirmPasswordError(e);
      return;
    }

    // BUG-005: Security Key validation — use the same validator as the live handler.
    const pwErr = validatePassword(formData.password);
    if (pwErr) { setError(pwErr); setPasswordError(pwErr); return; }

    // Confirm Key: maxLength=32 enforced at input level; mismatch check here as final gate.
    if (formData.confirmPassword.length > 32) {
      const e = 'Confirm Key must be at most 32 characters';
      setError(e); setConfirmPasswordError(e);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      const e = 'Passwords do not match';
      setError(e); setConfirmPasswordError(e);
      return;
    }

    // Full name validation: must contain at least one alphabetic character, cannot be only special characters or numbers
    const fullNameRegex = /^(?=.*[a-zA-Z]).{2,}$/;
    if (!fullNameRegex.test(formData.fullName.trim())) {
      setError('Full Name must contain at least one letter and cannot be only special characters or numbers.');
      return;
    }

    // UI_019: DOB errors now surface ONLY as inline field errors (setDobError).
    // Previously setError() was also called, pushing DOB errors into the global
    // PROCESS ERROR banner — inconsistent with all other inline-validated fields.
    const dobValidationError = validateDob(formData.dob);
    if (dobValidationError) {
      setDobError(dobValidationError);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register-profile', {
        mobile: formData.mobile,
        fullName: formData.fullName,
        email: formData.email,
        dob: formData.dob,
        city: formData.city,
        employmentType: formData.employmentType,
        password: formData.password,
      });

      const data = response.data.data;
      // Clean up transient registration storage
      sessionStorage.removeItem('register_step');
      sessionStorage.removeItem('register_mobile');
      // Tokens are now in HttpOnly cookies — only pass the profile to context
      login({
        userId: data.userId,
        role: data.role,
        name: formData.fullName,
      });
      navigate('/apply');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-6xl flex flex-col md:flex-row bg-[#16161a] rounded-[48px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 h-full min-h-[800px]">
        
        {/* Left Section: Visual Branding */}
        <div className="hidden md:flex md:w-4/12 relative overflow-hidden bg-gradient-to-br from-indigo-900/40 to-black">
          <img 
            src={heroImage} 
            alt="Fintech Hero" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16161a] via-transparent to-transparent" />
          
          <div className="relative z-10 p-12 flex flex-col justify-between h-full">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                <ShieldCheck className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">FintechLOS</span>
            </div>

            <div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-white mb-6 leading-tight"
              >
                Join the <br /> 
                <span className="text-indigo-400">Elite Network</span> <br />
                of Finance.
              </motion.h2>
              <p className="text-gray-400 text-lg font-medium leading-relaxed max-w-xs">
                Access bespoke financial solutions tailored for performance and precision.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Form */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full">
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    {step === 'mobile' && 'Verification'}
                    {step === 'otp' && 'Validation'}
                    {step === 'profile' && 'Configuration'}
                  </h1>
                  <p className="text-gray-500 font-medium">Step {step === 'mobile' ? '01' : step === 'otp' ? '02' : '03'} of 03</p>
                </div>
                
                <div className="flex gap-2">
                  <div className={`w-12 h-1.5 rounded-full transition-all duration-500 ${['mobile', 'otp', 'profile'].includes(step) ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />
                  <div className={`w-12 h-1.5 rounded-full transition-all duration-500 ${['otp', 'profile'].includes(step) ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />
                  <div className={`w-12 h-1.5 rounded-full transition-all duration-500 ${step === 'profile' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`} />
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-8 flex items-start gap-3"
              >
                <div className="mt-0.5 text-red-500">
                  <Shield size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Process Error</p>
                  <p className="text-sm text-red-200/80 font-medium">{error}</p>
                </div>
              </motion.div>
            )}

            <form
              onSubmit={
                step === 'mobile'
                  ? handleSendOtp
                  : step === 'otp'
                  ? handleVerifyOtp
                  : handleRegisterProfile
              }
              noValidate
              className="space-y-8"
            >
              <AnimatePresence mode="wait">
                {step === 'mobile' && (
                  <motion.div 
                    key="mobile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Mobile Number</label>
                      <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                          <Phone size={18} />
                        </div>
                        <Input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          required
                          maxLength={10}
                          className="pl-14 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner"
                          placeholder="0000000000"
                        />
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium ml-1">We'll send a secure OTP to verify your identity.</p>
                  </motion.div>
                )}

                {step === 'otp' && (
                  <motion.div 
                    key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Security Code</label>
                        <button
                          type="button"
                          onClick={handleGetOtp}
                          disabled={fetchingOtp}
                          className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {fetchingOtp ? 'Retrieving...' : 'Get OTP'}
                        </button>
                      </div>
                      <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                          <Shield size={18} />
                        </div>
                        <Input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                          maxLength={6}
                          className="pl-14 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner text-center tracking-[12px] text-xl font-bold"
                          placeholder="000000"
                        />
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Check your device for the 6-digit code sent to {formData.mobile}.</p>
                  </motion.div>
                )}

                {step === 'profile' && (
                  <motion.div 
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
                        <div className="relative group">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                          <Input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                            className="pl-14 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
                        <div className="relative group">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                          <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="pl-14 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner"
                            placeholder="name@example.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Date of Birth</label>
                        <div className="relative group">
                          <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                          <Input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleDobChange}
                            onBlur={handleDobBlur}
                            required
                            min="1900-01-01"
                            max={todayIso}
                            className={`pl-14 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner ${dobError ? 'border-red-500/40' : ''}`}
                          />
                        </div>
                        {/* DOB_002 + UI_019: inline error below field, never in global banner */}
                        {dobError && (
                          <p className="text-xs text-red-400 font-medium mt-1 ml-1">{dobError}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Current City</label>
                         <div className="relative group">
                           <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                           <Input
                             type="text"
                             name="city"
                             value={formData.city}
                             onChange={handleCityChange}
                             required
                             className={`pl-14 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner ${
                               cityError ? 'border-red-500/40' : ''
                             }`}
                             placeholder="Mumbai"
                           />
                         </div>
                         {/* CITY_001: inline error shown live, not just on submit */}
                         {cityError && (
                           <p className="text-xs text-red-400 font-medium mt-1 ml-1">{cityError}</p>
                         )}
                       </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Employment Type</label>
                      <div className="relative group">
                        <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <select
                          name="employmentType"
                          value={formData.employmentType}
                          onChange={handleInputChange}
                          required
                          className="h-14 w-full rounded-2xl bg-[#1e1e24] border border-white/5 pl-14 pr-10 text-white focus:outline-none focus:border-indigo-500/50 focus:bg-[#25252d] appearance-none cursor-pointer transition-all shadow-inner font-medium"
                        >
                          <option value="SALARIED" className="bg-[#16161a]">Salaried Professional</option>
                          <option value="SELF_EMPLOYED" className="bg-[#16161a]">Self Employed</option>
                        </select>
                      </div>
                    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Security Key */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Security Key</label>
          {/* BUG-005: live character counter — amber near limit, red at cap */}
          <span className={`text-[10px] font-mono tabular-nums transition-colors ${
            formData.password.length >= 32
              ? 'text-red-400 font-bold'
              : formData.password.length >= 24
              ? 'text-amber-400'
              : 'text-gray-600'
          }`}>
            {formData.password.length} / 32
          </span>
        </div>
        <div className="relative group">
          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handlePasswordChange}
            required
            maxLength={32}
            className={`pl-14 pr-12 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner ${
              passwordError ? 'border-red-500/40' : ''
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-400 transition-colors"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
        {/* Inline error OR hint text — hint shown until user starts typing */}
        {passwordError
          ? <p className="text-xs text-red-400 font-medium ml-1 mt-1">{passwordError}</p>
          : <p className="text-[11px] text-gray-600 ml-1 mt-1">8–32 characters required</p>
        }
      </div>

      {/* Confirm Key */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Confirm Key</label>
        <div className="relative group">
          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
          <Input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
            maxLength={32}
            className={`pl-14 pr-12 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner ${
              confirmPasswordError ? 'border-red-500/40' : ''
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-400 transition-colors"
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </button>
        </div>
        {/* BUG-005: inline mismatch error with no wait for submit */}
        {confirmPasswordError
          ? <p className="text-xs text-red-400 font-medium ml-1 mt-1">{confirmPasswordError}</p>
          : <p className="text-[11px] text-gray-600 ml-1 mt-1">Must match Security Key</p>
        }
      </div>
    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-4">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-[0_10px_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3 group transition-all"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="font-bold tracking-tight">
                          {step === 'mobile' ? 'Send Code' : step === 'otp' ? 'Validate Identity' : 'Complete Registration'}
                        </span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </motion.div>

                {(step === 'otp' || step === 'profile') && (
                  <button
                    type="button"
                    onClick={() => setStep(step === 'profile' ? 'otp' : 'mobile')}
                    className="w-full h-12 flex items-center justify-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-bold tracking-tight"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous Step</span>
                  </button>
                )}
              </div>
            </form>

            {step === 'mobile' && (
              <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
                <p className="text-gray-500 text-sm font-medium">Already have an account?</p>
                <Link
                  to="/login"
                  className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-2 transition-colors group"
                >
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
