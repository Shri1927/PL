import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Phone, Shield, User, Mail, Calendar, MapPin, Briefcase, Lock, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import heroImage from '../../assets/hero.png';

const Register = () => {
  const [step, setStep] = useState<'mobile' | 'otp' | 'profile'>('mobile');
  const [formData, setFormData] = useState({
    mobile: '',
    fullName: '',
    email: '',
    dob: '',
    city: '',
    employmentType: 'SALARIED',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
        login(authData.accessToken, {
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
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
      login(data.accessToken, {
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
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Security Code</label>
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
                    <p className="text-gray-500 text-sm font-medium ml-1">Check your device for the 6-digit code sent to {formData.mobile}.</p>
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
                            onChange={handleInputChange}
                            required
                            className="pl-14 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Current City</label>
                        <div className="relative group">
                          <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                          <Input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            className="pl-14 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner"
                            placeholder="Mumbai"
                          />
                        </div>
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
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Security Key</label>
                        <div className="relative group">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                          <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            className="pl-14 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Confirm Key</label>
                        <div className="relative group">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                          <Input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                            className="pl-14 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner"
                            placeholder="••••••••"
                          />
                        </div>
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
