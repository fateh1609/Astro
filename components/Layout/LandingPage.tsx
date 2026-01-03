
import React, { useState } from 'react';
import StarBackground from './StarBackground';
import { sendAuthOtp, verifyAuthOtp, resetUserPassword } from '../../services/dbService';

interface LandingPageProps {
  onSeekerEnter: () => void;
  onSeekerLogin: (verifiedContact: string) => void;
  onVerifyCredentials: (contact: string, password: string) => Promise<boolean | string>;
  onGuruEnter: () => void;
  onAdminEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSeekerEnter, onSeekerLogin, onVerifyCredentials, onGuruEnter, onAdminEnter }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Login State Machine: 'credentials' | 'otp' | 'forgot_request' | 'forgot_otp' | 'forgot_new_password'
  const [loginStep, setLoginStep] = useState<'credentials' | 'otp' | 'forgot_request' | 'forgot_otp' | 'forgot_new_password'>('credentials');
  
  // Credentials
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // OTP
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Admin
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPin, setAdminPin] = useState('');

  // --- LOGIN FLOW ---
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Admin Check
    if (isAdminMode) {
        if (adminPin === '2904') {
            onAdminEnter();
        } else {
            setErrorMsg("Incorrect Admin PIN");
        }
        return;
    }

    // Admin Shortcut
    if (phoneNumber.toLowerCase().trim() === 'admin') {
        setIsAdminMode(true);
        return;
    }

    if (phoneNumber.length < 4 || password.length < 4) {
        setErrorMsg("Invalid credentials.");
        return;
    }

    setIsLoading(true);
    try {
        const result = await onVerifyCredentials(phoneNumber, password);
        
        if (result) {
            // If result is string, it's the corrected phone number (with country code)
            const targetContact = typeof result === 'string' ? result : phoneNumber;
            
            // Update state to use corrected contact for OTP
            if (typeof result === 'string') {
                setPhoneNumber(targetContact);
            }

            // Password Correct, Now Send OTP to the correct contact
            const otpResult = await sendAuthOtp(targetContact);
            
            if (otpResult.success) {
                setLoginStep('otp');
            } else if (otpResult.isRateLimit) {
                // Gracefully handle rate limit: advance flow assuming code was sent or user has old one
                console.warn("Rate limit hit, advancing flow anyway.");
                setLoginStep('otp');
            } else {
                setErrorMsg(otpResult.message || "Failed to send OTP.");
            }
        } else {
            setErrorMsg("Incorrect Phone/Email or Password.");
        }
    } catch (e) {
        setErrorMsg("Login failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setIsLoading(true);

      try {
          const result = await verifyAuthOtp(phoneNumber, otp);
          if (result.success) {
              onSeekerLogin(phoneNumber); // Log in
          } else {
              setErrorMsg(result.message || "Invalid OTP Code.");
          }
      } catch (e) {
          setErrorMsg("Verification failed.");
      } finally {
          setIsLoading(false);
      }
  };

  // --- RESET PASSWORD FLOW ---
  const handleForgotRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setIsLoading(true);
      
      try {
          // Just send OTP to the provided contact
          const result = await sendAuthOtp(phoneNumber);
          
          if (result.success) {
              setLoginStep('forgot_otp');
          } else if (result.isRateLimit) {
              // Rate limit hit? Advance anyway.
              setLoginStep('forgot_otp');
          } else {
              setErrorMsg(result.message || "Failed to send OTP. User may not exist.");
          }
      } catch (e) {
          setErrorMsg("Error sending OTP.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleForgotOtpVerify = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg('');
      setIsLoading(true);

      try {
          const result = await verifyAuthOtp(phoneNumber, otp);
          if (result.success) {
              setLoginStep('forgot_new_password');
          } else {
              setErrorMsg(result.message || "Invalid OTP Code.");
          }
      } catch (e) {
          setErrorMsg("Verification failed.");
      } finally {
          setIsLoading(false);
      }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
      e.preventDefault();
      if (password.length < 4) {
          setErrorMsg("Password must be at least 4 characters.");
          return;
      }
      if (password !== confirmPassword) {
          setErrorMsg("Passwords do not match.");
          return;
      }

      setIsLoading(true);
      try {
          const result = await resetUserPassword(phoneNumber, password);
          if (result.success) {
              alert("Password Reset Successfully! Please Login.");
              // Reset to login screen
              setLoginStep('credentials');
              setPassword('');
              setConfirmPassword('');
              setOtp('');
          } else {
              setErrorMsg(result.message || "Failed to reset password.");
          }
      } catch (e) {
          setErrorMsg("Error resetting password.");
      } finally {
          setIsLoading(false);
      }
  };


  const closeLogin = () => {
      setShowLoginModal(false);
      setIsAdminMode(false);
      setPhoneNumber('');
      setPassword('');
      setConfirmPassword('');
      setAdminPin('');
      setOtp('');
      setLoginStep('credentials');
      setErrorMsg('');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-mystic-900 text-white font-sans selection:bg-gold-500/30">
      <StarBackground />
      
      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-700">
        
        {/* Logo / Title Section */}
        <div className="mb-8 relative group cursor-default">
            <div className="absolute -inset-10 bg-gold-500/20 rounded-full blur-[60px] animate-pulse-slow group-hover:bg-gold-500/30 transition-all"></div>
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-600 to-indigo-900 rounded-full flex items-center justify-center text-5xl mb-6 shadow-[0_0_30px_rgba(124,58,237,0.5)] border border-white/20">
                🔮
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gold-200 to-mystic-300 drop-shadow-sm tracking-tighter">
                Astro21
            </h1>
            <p className="mt-4 text-lg text-mystic-300 font-light tracking-wide">
                Ancient Vedic Wisdom • Instant Solutions
            </p>
            <div className="mt-4 flex flex-col gap-1 items-center justify-center text-xs text-gold-400 font-bold uppercase tracking-widest bg-black/20 p-2 rounded-xl backdrop-blur-sm border border-white/5">
                <span>🔒 End-to-End Encrypted Chat</span>
                <span>✨ Live One-on-One Experience</span>
            </div>
        </div>

        {/* Main Action: I am a Seeker */}
        <div className="w-full mb-8">
            <button 
                onClick={onSeekerEnter}
                className="group relative overflow-hidden bg-mystic-800/60 backdrop-blur-md border border-white/10 hover:border-gold-500/50 rounded-t-2xl p-8 w-full transition-all duration-300 hover:bg-mystic-800"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] -mr-10 -mt-10 transition-all group-hover:bg-indigo-500/20"></div>
                <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-mystic-700/50 flex items-center justify-center text-3xl mb-4 mx-auto group-hover:scale-110 transition-transform">
                        ✨
                    </div>
                    <h3 className="text-3xl font-serif font-bold text-white mb-2 group-hover:text-gold-300 transition-colors">
                        I am a Seeker
                    </h3>
                    <p className="text-mystic-400 text-sm leading-relaxed max-w-xs mx-auto">
                        Start your spiritual journey and discover your cosmic blueprint.
                    </p>
                </div>
            </button>
            <button 
                onClick={onSeekerEnter}
                className="w-full bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-mystic-950 text-xl font-bold py-4 rounded-b-2xl shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] transition-all transform hover:-translate-y-1 relative z-20 flex items-center justify-center gap-2"
            >
                Start Your Journey Now <span>→</span>
            </button>
        </div>

        {/* Member Login */}
        <div className="text-sm text-mystic-400">
            Already a member? 
            <button 
                onClick={() => setShowLoginModal(true)}
                className="ml-2 text-gold-400 font-bold hover:text-gold-300 hover:underline transition-colors"
            >
                Login Here
            </button>
        </div>

        {/* Guru Option: Small and Hidden */}
        <div className="mt-24">
            <button 
                onClick={onGuruEnter} 
                className="text-[10px] text-mystic-600 hover:text-mystic-400 transition-colors uppercase tracking-[0.3em] opacity-40 hover:opacity-100 font-bold"
            >
                I am a Guru
            </button>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
                <div className="bg-mystic-800 border border-gold-500/30 p-8 rounded-3xl max-w-sm w-full relative shadow-2xl">
                    <button 
                        onClick={closeLogin}
                        className="absolute top-4 right-4 text-mystic-500 hover:text-white"
                    >
                        ✕
                    </button>
                    
                    {isAdminMode ? (
                        <>
                            <h3 className="text-2xl font-serif text-white mb-2">Admin Access</h3>
                            <p className="text-mystic-400 text-sm mb-6">Enter Security PIN</p>
                             <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                                <input 
                                    type="password"
                                    value={adminPin}
                                    onChange={(e) => setAdminPin(e.target.value)}
                                    placeholder="PIN Code"
                                    className="w-full bg-mystic-900 border border-mystic-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 text-center tracking-widest text-lg"
                                    autoFocus
                                />
                                {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
                                <button 
                                    type="submit"
                                    className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-mystic-900 font-bold py-3 rounded-xl transition-colors"
                                >
                                    Verify Access
                                </button>
                             </form>
                        </>
                    ) : (
                        <>
                             {/* STEP 1: CREDENTIALS */}
                             {loginStep === 'credentials' && (
                                <>
                                    <h3 className="text-2xl font-serif text-white mb-2">Welcome Back</h3>
                                    <p className="text-mystic-400 text-sm mb-6">Enter credentials to verify identity.</p>
                                    <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                                        <input 
                                            type="text"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="Phone Number or Email"
                                            className="w-full bg-mystic-900 border border-mystic-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-all"
                                            autoFocus
                                        />
                                        <input 
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Password"
                                            className="w-full bg-mystic-900 border border-mystic-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-all"
                                        />
                                        <div className="text-right">
                                            <button 
                                                type="button" 
                                                onClick={() => { setLoginStep('forgot_request'); setErrorMsg(''); }}
                                                className="text-xs text-gold-500 hover:text-white underline"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                        {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
                                        <button 
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-mystic-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center"
                                        >
                                            {isLoading ? <span className="w-5 h-5 border-2 border-mystic-900 border-t-transparent rounded-full animate-spin"></span> : 'Authenticate'}
                                        </button>
                                    </form>
                                </>
                             )}

                             {/* STEP 2: LOGIN OTP VERIFICATION */}
                             {loginStep === 'otp' && (
                                <>
                                    <h3 className="text-2xl font-serif text-white mb-2">Verify OTP</h3>
                                    <p className="text-mystic-400 text-sm mb-6">Code sent to your contact.</p>
                                    <form onSubmit={handleOtpSubmit} className="space-y-4">
                                        <input 
                                            type="text"
                                            value={otp}
                                            onChange={(e) => {
                                                const val = e.target.value.trim();
                                                if (val.length <= 6) setOtp(val);
                                            }}
                                            placeholder="Enter 6-digit Code"
                                            className="w-full bg-mystic-900 border border-mystic-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all text-center tracking-widest text-lg font-mono"
                                            maxLength={6}
                                            autoFocus
                                        />
                                        {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
                                        <button 
                                            type="submit"
                                            disabled={otp.length < 6 || isLoading}
                                            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-mystic-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center"
                                        >
                                             {isLoading ? <span className="w-5 h-5 border-2 border-mystic-900 border-t-transparent rounded-full animate-spin"></span> : 'Verify & Login'}
                                        </button>
                                    </form>
                                </>
                             )}

                             {/* --- FORGOT PASSWORD FLOW --- */}
                             
                             {/* FORGOT STEP 1: REQUEST */}
                             {loginStep === 'forgot_request' && (
                                 <>
                                    <h3 className="text-2xl font-serif text-white mb-2">Reset Password</h3>
                                    <p className="text-mystic-400 text-sm mb-6">Enter your registered contact to receive OTP.</p>
                                    <form onSubmit={handleForgotRequest} className="space-y-4">
                                        <input 
                                            type="text"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="Phone Number or Email"
                                            className="w-full bg-mystic-900 border border-mystic-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-all"
                                            autoFocus
                                        />
                                        <div className="text-right">
                                            <button 
                                                type="button" 
                                                onClick={() => setLoginStep('credentials')}
                                                className="text-xs text-mystic-500 hover:text-white"
                                            >
                                                Back to Login
                                            </button>
                                        </div>
                                        {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
                                        <button 
                                            type="submit"
                                            disabled={isLoading || !phoneNumber}
                                            className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-mystic-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center"
                                        >
                                            {isLoading ? <span className="w-5 h-5 border-2 border-mystic-900 border-t-transparent rounded-full animate-spin"></span> : 'Send Reset Code'}
                                        </button>
                                    </form>
                                 </>
                             )}

                             {/* FORGOT STEP 2: VERIFY OTP */}
                             {loginStep === 'forgot_otp' && (
                                 <>
                                    <h3 className="text-2xl font-serif text-white mb-2">Verify Reset Code</h3>
                                    <p className="text-mystic-400 text-sm mb-6">Enter the code sent to {phoneNumber}</p>
                                    <form onSubmit={handleForgotOtpVerify} className="space-y-4">
                                        <input 
                                            type="text"
                                            value={otp}
                                            onChange={(e) => {
                                                const val = e.target.value.trim();
                                                if (val.length <= 6) setOtp(val);
                                            }}
                                            placeholder="Enter 6-digit Code"
                                            className="w-full bg-mystic-900 border border-mystic-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-all text-center tracking-widest text-lg font-mono"
                                            maxLength={6}
                                            autoFocus
                                        />
                                        {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
                                        <button 
                                            type="submit"
                                            disabled={otp.length < 6 || isLoading}
                                            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-mystic-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center"
                                        >
                                             {isLoading ? <span className="w-5 h-5 border-2 border-mystic-900 border-t-transparent rounded-full animate-spin"></span> : 'Verify Code'}
                                        </button>
                                    </form>
                                 </>
                             )}

                             {/* FORGOT STEP 3: NEW PASSWORD */}
                             {loginStep === 'forgot_new_password' && (
                                 <>
                                    <h3 className="text-2xl font-serif text-white mb-2">Create New Password</h3>
                                    <p className="text-mystic-400 text-sm mb-6">Set a secure password for your account.</p>
                                    <form onSubmit={handlePasswordReset} className="space-y-4">
                                        <input 
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="New Password"
                                            className="w-full bg-mystic-900 border border-mystic-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-all"
                                            autoFocus
                                        />
                                        <input 
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm Password"
                                            className="w-full bg-mystic-900 border border-mystic-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-all"
                                        />
                                        {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
                                        <button 
                                            type="submit"
                                            disabled={isLoading || password.length < 4}
                                            className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-mystic-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center"
                                        >
                                            {isLoading ? <span className="w-5 h-5 border-2 border-mystic-900 border-t-transparent rounded-full animate-spin"></span> : 'Reset Password'}
                                        </button>
                                    </form>
                                 </>
                             )}

                        </>
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default LandingPage;
