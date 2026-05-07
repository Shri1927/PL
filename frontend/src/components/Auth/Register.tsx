import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Phone, Shield, User, Mail, Calendar, MapPin, Briefcase, Lock, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Info } from 'lucide-react';

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

  const steps = [
    { id: 'mobile', title: 'Mobile', icon: Phone },
    { id: 'otp', title: 'Verify', icon: Shield },
    { id: 'profile', title: 'Profile', icon: User },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="auth-shell">
      <div className="w-full max-w-md">
        {/* Register Card */}
        <div className="relative card-modern p-8 sm:p-10 animate-scaleIn">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={s.id} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 h-1 mx-1 rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">
              {step === 'mobile' && 'Get Started'}
              {step === 'otp' && 'Verify Mobile'}
              {step === 'profile' && 'Complete Profile'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {step === 'mobile' && 'Enter your mobile number to begin'}
              {step === 'otp' && 'Enter the OTP sent to your phone'}
              {step === 'profile' && 'Tell us a bit about yourself'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <form
            onSubmit={
              step === 'mobile'
                ? handleSendOtp
                : step === 'otp'
                ? handleVerifyOtp
                : handleRegisterProfile
            }
            className="space-y-5"
          >
            {step === 'mobile' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold mb-2">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    required
                    maxLength={10}
                    className="input-modern pl-12"
                    placeholder="9876543210"
                  />
                </div>
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">OTP Code</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="input-modern pl-12 text-center tracking-widest text-lg font-semibold"
                    placeholder="000000"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                  <Info className="w-4 h-4 text-teal-600 shrink-0" />
                  Check server logs for OTP (sent to {formData.mobile})
                </p>
              </div>
            )}

            {step === 'profile' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="input-modern pl-12"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="input-modern pl-12"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold mb-2">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        required
                        className="input-modern pl-12"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold mb-2">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="input-modern pl-12"
                        placeholder="Mumbai"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold mb-2">Employment Type</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleInputChange}
                      required
                      className="input-modern pl-12 appearance-none cursor-pointer"
                    >
                      <option value="SALARIED">Salaried</option>
                      <option value="SELF_EMPLOYED">Self Employed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="input-modern pl-12"
                        placeholder="Password"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="input-modern pl-12"
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{step === 'mobile' ? 'Send OTP' : step === 'otp' ? 'Verify OTP' : 'Complete Profile'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Back Button */}
          {(step === 'otp' || step === 'profile') && (
            <button
              type="button"
              onClick={() => setStep(step === 'profile' ? 'otp' : 'mobile')}
              className="w-full mt-4 flex items-center justify-center gap-2 text-slate-600 hover:text-teal-700 font-semibold transition-colors dark:text-slate-300 dark:hover:text-teal-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {/* Login Link */}
          {step === 'mobile' && (
            <div className="text-center mt-6">
              <p className="text-slate-600 dark:text-slate-300 mb-4">Already have an account?</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 hover:shadow-sm transition-all duration-200 group dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Register;
