
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    role: 'student',
    name: '',
    email: '',
    uid_ref: '', // Student ID or Executive ID
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (formData.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    
    setIsLoading(true);
    try {
      await signup(
        formData.email,
        formData.password,
        formData.name,
        formData.role,
        formData.uid_ref // Either studentId or executiveId based on prompt
      );
      
      if (formData.role === 'event_manager') navigate('/admin/events');
      else if (formData.role === 'resource_manager') navigate('/resources');
      else if (formData.role === 'complaint_manager') navigate('/complaints');
      else if (formData.role === 'notice_manager') navigate('/admin/notices');
      else navigate('/dashboard');
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const isStudent = formData.role === 'student';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712] text-white p-4 relative overflow-hidden">
      
      {/* Subtle ambient background effect & University Image */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.12] bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')" }} 
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent pointer-events-none" />
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none z-0" />


      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] relative z-10 my-8"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl p-2.5 mb-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center">
            <img src="/cu-logo.png" alt="CU Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Create Account</h1>
          <p className="text-sm text-slate-400 font-medium">Join CampusOS today.</p>
        </div>

        <div className="bg-[#0B1729]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">Role</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-11 px-3 bg-black/30 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="student" className="bg-[#0B1729] text-white">Student</option>
                <option value="event_manager" className="bg-[#0B1729] text-white">Event Manager</option>
                <option value="resource_manager" className="bg-[#0B1729] text-white">Resource Manager</option>
                <option value="complaint_manager" className="bg-[#0B1729] text-white">Complaint Manager</option>
                <option value="notice_manager" className="bg-[#0B1729] text-white">Notice Manager</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">Name</label>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full h-11 px-4 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">Email</label>
              <input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full h-11 px-4 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <AnimatePresence mode="popLayout">
              <motion.div 
                key="uid_field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">
                  {isStudent ? 'Student ID' : 'Executive ID'}
                </label>
                <input
                  type="text"
                  placeholder={isStudent ? "e.g. 20123456" : "e.g. EX-9012"}
                  value={formData.uid_ref}
                  onChange={e => setFormData({ ...formData, uid_ref: e.target.value })}
                  required
                  className="w-full h-11 px-4 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="w-full h-11 pl-4 pr-10 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">Re-type</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="w-full h-11 pl-4 pr-10 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold ml-1 transition-colors">Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
