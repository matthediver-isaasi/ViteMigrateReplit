import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle2, AlertCircle, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login"); // 'login', 'magic-link', 'set-password', 'forgot-password'
  const [emailSent, setEmailSent] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const member = await response.json();
          if (member && member.id) {
            // Already logged in, redirect to default page
            redirectToLandingPage(member);
          }
        }
      } catch (err) {
        // Not logged in, stay on login page
      }
    };
    checkAuth();
  }, []);

  const redirectToLandingPage = async (member) => {
    let landingPage = 'Preferences';
    
    if (member.role_id) {
      try {
        const allRoles = await base44.entities.Role.list();
        const userRole = allRoles.find(r => r.id === member.role_id);
        if (userRole && userRole.default_landing_page) {
          landingPage = userRole.default_landing_page;
        }
      } catch (err) {
        console.warn('[Login] Could not fetch role for landing page:', err);
      }
    }
    
    // Store member info for backward compatibility (but session is authoritative now)
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const memberInfo = { ...member, sessionExpiry };
    sessionStorage.setItem('agcas_member', JSON.stringify(memberInfo));
    
    window.location.href = createPageUrl(landingPage);
  };

  const checkPasswordStatus = async (emailToCheck) => {
    try {
      const response = await fetch('/api/auth/check-password-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToCheck })
      });
      const data = await response.json();
      setPasswordStatus(data);
      return data;
    } catch (err) {
      console.error('Error checking password status:', err);
      return null;
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError("");
    
    const status = await checkPasswordStatus(email);
    setLoading(false);
    
    if (!status?.exists) {
      setError("No account found with this email address.");
      return;
    }
    
    if (status.hasPassword) {
      setMode("login");
    } else {
      // Member exists but no password - offer to set one
      setMode("set-password");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.toLowerCase().trim(), password })
      });

      const data = await response.json();

      if (data.success) {
        // Store member info for backward compatibility
        const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const memberInfo = { ...data.member, sessionExpiry };
        sessionStorage.setItem('agcas_member', JSON.stringify(memberInfo));
        
        // Check if temporary password
        if (data.isTemporaryPassword) {
          setMode("change-password");
          setLoading(false);
          return;
        }
        
        await redirectToLandingPage(data.member);
      } else {
        if (data.needsPasswordSetup) {
          setMode("set-password");
        } else {
          setError(data.error || "Login failed");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.toLowerCase().trim(), password })
      });

      const data = await response.json();

      if (data.success) {
        await redirectToLandingPage(data.member);
      } else {
        setError(data.error || "Failed to set password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });

      const data = await response.json();
      
      if (data.success) {
        setEmailSent(true);
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await base44.functions.invoke('sendMagicLink', { email });
      
      if (response.data.success) {
        setEmailSent(true);
      } else {
        setError(response.data.error || 'Unable to send login link');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailSentSuccess = (type) => (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-green-800">
            {type === 'magic-link' ? 'Check your email!' : 'Reset link sent!'}
          </p>
          <p className="text-sm text-green-700 mt-1">
            {type === 'magic-link' 
              ? "We've sent a secure login link to your email. Click the link to access your account."
              : "We've sent a password reset link to your email. Click the link to reset your password."
            }
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => { setEmailSent(false); setMode("login"); }}
        data-testid="button-back-to-login"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to login
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4 p-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68efc20f3e0a30fafad6dde7/6cfe73a57_agcasRoundall.jpg"
              alt="AGCAS"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AGCAS Events</h1>
          <p className="text-slate-600">Professional Development & Training Portal</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-slate-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">
              {mode === "login" && "Member Access"}
              {mode === "magic-link" && "Magic Link Login"}
              {mode === "set-password" && "Create Your Password"}
              {mode === "forgot-password" && "Reset Password"}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === "login" && "Enter your email and password to sign in"}
              {mode === "magic-link" && "Enter your email to receive a secure login link"}
              {mode === "set-password" && "Create a password for your account"}
              {mode === "forgot-password" && "Enter your email to receive a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              renderEmailSentSuccess(mode === "magic-link" ? "magic-link" : "reset")
            ) : (
              <>
                {/* Error Message */}
                {error && (
                  <div className="flex items-start gap-3 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Login Form */}
                {mode === "login" && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                          data-testid="input-email"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || !email || !password}
                      data-testid="button-login"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={() => setMode("forgot-password")}
                        className="text-blue-600 hover:text-blue-800"
                        data-testid="link-forgot-password"
                      >
                        Forgot password?
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("magic-link")}
                        className="text-slate-500 hover:text-slate-700"
                        data-testid="link-magic-link"
                      >
                        Use magic link instead
                      </button>
                    </div>
                  </form>
                )}

                {/* Magic Link Form */}
                {mode === "magic-link" && (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                          data-testid="input-email-magic"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || !email}
                      data-testid="button-send-magic-link"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Magic Link
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setMode("login")}
                      data-testid="button-back-to-password"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Use password instead
                    </Button>
                  </form>
                )}

                {/* Set Password Form */}
                {mode === "set-password" && (
                  <form onSubmit={handleSetPassword} className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 mb-4">
                      Welcome! Since this is your first time, please create a password for your account.
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="bg-slate-50"
                        data-testid="input-email-set"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">Create Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 8 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                          minLength={8}
                          data-testid="input-new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10"
                          required
                          data-testid="input-confirm-password"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || !password || !confirmPassword}
                      data-testid="button-set-password"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Password & Sign In"
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => { setMode("magic-link"); setPassword(""); setConfirmPassword(""); }}
                      data-testid="button-use-magic-link-instead"
                    >
                      Use magic link instead
                    </Button>
                  </form>
                )}

                {/* Forgot Password Form */}
                {mode === "forgot-password" && (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                          data-testid="input-email-reset"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || !email}
                      data-testid="button-send-reset"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setMode("login")}
                      data-testid="button-back-from-reset"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to login
                    </Button>
                  </form>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer link to test login (development only) */}
        <div className="mt-6 text-center">
          <a 
            href="/test-login" 
            className="text-sm text-slate-400 hover:text-slate-600"
            data-testid="link-test-login"
          >
            Development: Test Login
          </a>
        </div>
      </div>
    </div>
  );
}
