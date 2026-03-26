import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LineChart,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Auth = () => {
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(location.pathname === '/signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [animateSwitch, setAnimateSwitch] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const { login, signup, googleLogin, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    if (credentialResponse.credential) {
      setIsSubmitting(true);
      setError('');
      try {
        await googleLogin(credentialResponse.credential);
        setSuccess('Signed in with Google! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 800);
      } catch (err) {
        const msg = err.response?.data?.error || 'Google sign-in failed. Please try again.';
        setError(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In failed. Please try again.');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const toggleMode = () => {
    setAnimateSwitch(true);
    setTimeout(() => {
      setIsSignUp(!isSignUp);
      setError('');
      setSuccess('');
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setAnimateSwitch(false);
    }, 300);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (isSignUp) {
      if (!formData.name.trim()) {
        setError('Please enter your full name.');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (isSignUp) {
        await signup(formData.name, formData.email, formData.password);
        setSuccess('Account created successfully! Redirecting...');
      } else {
        await login(formData.email, formData.password);
        setSuccess('Welcome back! Redirecting...');
      }
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to server. Please make sure the backend is running.'
          : 'Something went wrong. Please try again.');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // GitHub OAuth handler (placeholder — requires GitHub OAuth App setup)
  const handleGitHubLogin = () => {
    const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!GITHUB_CLIENT_ID) {
      setError('GitHub login is not configured yet. See setup instructions.');
      return;
    }
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = 'user:email';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  const features = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'AI-Powered Predictions',
      desc: 'ML models trained on historical data',
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: 'Real-Time Analytics',
      desc: 'Live market data and insights',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Secure & Private',
      desc: 'Your data is encrypted and safe',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Lightning Fast',
      desc: 'Instant predictions at your fingertips',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      {/* Ambient blobs */}
      <div className="absolute top-[20%] right-[15%] w-[25%] h-[25%] bg-accent-green/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[20%] left-[10%] w-[20%] h-[20%] bg-blue-500/8 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-[60%] right-[40%] w-[15%] h-[15%] bg-purple-500/6 rounded-full blur-[60px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 glass-panel overflow-hidden">
        {/* ── Left Panel - Branding ───────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-accent-green/10 via-dark-card/50 to-dark-navy/80 border-r border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent-green/10 rounded-full blur-[60px]" />
          <div className="absolute bottom-10 left-0 w-32 h-32 bg-blue-500/8 rounded-full blur-[50px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="p-2.5 bg-accent-green/15 rounded-xl border border-accent-green/20">
                <LineChart className="h-7 w-7 text-accent-green" />
              </div>
              <span className="font-bold text-2xl tracking-wide">
                Stock<span className="text-accent-green">Sight</span>
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-3 leading-tight">
              See the Market
              <br />
              <span className="text-accent-green">Before It Moves</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Join thousands of traders using AI-powered insights to make smarter
              investment decisions.
            </p>
          </div>

          <div className="relative z-10 space-y-4 mt-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 group">
                <div className="p-2 rounded-lg bg-accent-green/10 border border-accent-green/15 text-accent-green group-hover:bg-accent-green/20 group-hover:border-accent-green/30 transition-all duration-300 mt-0.5">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-accent-green transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 flex gap-6 mt-8 pt-6 border-t border-white/5">
            <div>
              <p className="text-2xl font-bold text-accent-green">50K+</p>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Active Traders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-green">95%</p>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Accuracy Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-green">24/7</p>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">Market Watch</p>
            </div>
          </div>
        </div>

        {/* ── Right Panel - Auth Form ─────────────────────────────────────────── */}
        <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <LineChart className="h-7 w-7 text-accent-green" />
            <span className="font-bold text-xl tracking-wide">
              Stock<span className="text-accent-green">Sight</span>
            </span>
          </div>

          {/* Form header */}
          <div
            className={`transition-all duration-300 ${
              animateSwitch ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
            }`}
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-400 text-sm mb-8">
              {isSignUp
                ? 'Start your journey with AI-powered stock insights'
                : 'Sign in to access your personalized dashboard'}
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 animate-fade-in">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 p-3.5 rounded-lg bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className={`space-y-5 transition-all duration-300 ${
              animateSwitch ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
            }`}
          >
            {/* Name (Sign Up only) */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-out ${
                isSignUp ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                Full Name
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 group-focus-within:text-accent-green transition-colors" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="input-field pl-11"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 group-focus-within:text-accent-green transition-colors" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="input-field pl-11"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    className="text-xs text-accent-green hover:text-accent-green-hover transition-colors"
                    onClick={() => alert('Password reset feature coming soon!')}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 group-focus-within:text-accent-green transition-colors" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="input-field pl-11 pr-11"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up only) */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-out ${
                isSignUp ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 group-focus-within:text-accent-green transition-colors" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="input-field pl-11 pr-11"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password strength indicator (Sign Up only) */}
            {isSignUp && formData.password && (
              <div className="animate-fade-in">
                <div className="flex gap-1.5 mb-1.5">
                  {[1, 2, 3, 4].map((level) => {
                    const strength =
                      formData.password.length >= 12
                        ? 4
                        : formData.password.length >= 8
                        ? 3
                        : formData.password.length >= 6
                        ? 2
                        : 1;
                    return (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          level <= strength
                            ? strength <= 1
                              ? 'bg-red-500'
                              : strength <= 2
                              ? 'bg-yellow-500'
                              : strength <= 3
                              ? 'bg-accent-green/70'
                              : 'bg-accent-green'
                            : 'bg-white/10'
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-500">
                  {formData.password.length < 6
                    ? 'Too short'
                    : formData.password.length < 8
                    ? 'Fair'
                    : formData.password.length < 12
                    ? 'Strong'
                    : 'Very strong'}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base group relative overflow-hidden"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Google Sign-In with @react-oauth/google */}
            <div className="flex flex-col gap-3">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_black"
                shape="rectangular"
                width="100%"
                text="continue_with"
                size="large"
              />
            </div>

            {/* GitHub */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-sm text-gray-300 group"
              onClick={handleGitHubLogin}
            >
              <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="group-hover:text-white transition-colors">GitHub</span>
            </button>
          </div>

          {/* Toggle Sign In / Sign Up */}
          <p className="text-center text-sm text-gray-400 mt-8">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-accent-green hover:text-accent-green-hover font-semibold transition-colors hover:underline underline-offset-4"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
