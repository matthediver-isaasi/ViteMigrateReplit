
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

export default function HomePage() {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setEmailSent(false);

    try {
      const response = await base44.functions.invoke('sendMagicLink', { email });
      
      if (response.data.success) {
        setEmailSent(true);
        setEmail("");
      } else {
        setError(response.data.error || 'Unable to send login link');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          {tenant.logoUrl && (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4 p-2">
              <img 
                src={tenant.logoUrl}
                alt={tenant.name || 'Portal'}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{tenant.displayName || tenant.name || 'Member Portal'}</h1>
          <p className="text-slate-600">Professional Development & Training Portal</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-slate-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">Member Access</CardTitle>
            <CardDescription className="text-center">
              Enter your member email to receive a secure login link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">Check your email!</h3>
                    <p className="text-sm text-green-700">
                      We've sent a secure login link to your email address. Click the link to access the portal.
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      The link will expire in 30 minutes.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setEmailSent(false)}
                  className="w-full"
                >
                  Send another link
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@institution.ac.uk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Login Link'
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                Only registered members can access this portal. If you're having trouble logging in, 
                please contact your membership administrator.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          © {new Date().getFullYear()} isaasi ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}
