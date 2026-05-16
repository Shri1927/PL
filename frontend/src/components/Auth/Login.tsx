import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Lock, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import heroImage from '../../assets/hero.png';

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        mobile,
        password,
      });

      const data = response.data.data;
      login(data.accessToken, {
        userId: data.userId,
        role: data.role,
        name: data.fullName,
        mobile: data.mobile,
        email: data.email,
        customerId: data.customerId,
      });
      
      // Role-based redirection
      if (data.role === 'ADMIN') {
        navigate('/admin');
      } else if (data.role === 'LOAN_OFFICER' || data.role === 'RM') {
        navigate('/maker');
      } else if (['BRANCH_MANAGER', 'REGIONAL_CREDIT_MGR', 'ZONAL_HEAD', 'CREDIT_COMMITTEE', 'BOD'].includes(data.role)) {
        navigate('/checker');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-6xl flex flex-col md:flex-row bg-[#16161a] rounded-[48px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5">
        
        {/* Left Section: Visual Branding */}
        <div className="hidden md:flex md:w-5/12 relative overflow-hidden bg-gradient-to-br from-indigo-900/40 to-black">
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
                className="text-5xl font-bold text-white mb-6 leading-tight"
              >
                Experience <br /> 
                <span className="text-indigo-400">Next-Gen</span> <br />
                Finance.
              </motion.h2>
              <p className="text-gray-400 text-lg font-medium leading-relaxed max-w-xs">
                Premium lending solutions engineered for modern institutions.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Form */}
        <div className="flex-1 p-8 md:p-20 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-gray-500 font-medium">Please sign in to your dashboard</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-8 flex items-start gap-3"
              >
                <div className="mt-0.5 text-red-500">
                  <Lock size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Access Denied</p>
                  <p className="text-sm text-red-200/80 font-medium">{error}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Mobile Number</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                    <Phone size={18} />
                  </div>
                  <Input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    maxLength={10}
                    className="pl-14 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner"
                    placeholder="Enter mobile"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-14 h-14 bg-[#1e1e24] border-white/5 rounded-2xl focus:border-indigo-500/50 focus:bg-[#25252d] transition-all text-white shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
              </div>

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
                      <span className="font-bold tracking-tight">Sign In to Dashboard</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
              <p className="text-gray-500 text-sm font-medium">New to the platform?</p>
              <Link
                to="/register"
                className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-2 transition-colors group"
              >
                <span>Create an Account</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
