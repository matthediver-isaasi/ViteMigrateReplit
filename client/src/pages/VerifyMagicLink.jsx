import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function VerifyMagicLinkPage() {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing verification token');
        return;
      }

      try {
        const response = await base44.functions.invoke('verifyMagicLink', { token });

        if (response.data.success) {
          setStatus('success');
          setMessage('Login successful! Redirecting...');

          // Store user info with session expiry (30 minutes)
          const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          const memberInfo = {
            ...response.data.user,
            sessionExpiry
          };
          sessionStorage.setItem('agcas_member', JSON.stringify(memberInfo));
          
          // Clear old organization cache and fetch new one
          sessionStorage.removeItem('agcas_organization');
          if (response.data.user.organization_id) {
            try {
              const orgs = await base44.entities.Organization.list({ 
                filter: { id: response.data.user.organization_id } 
              });
              if (orgs && orgs.length > 0) {
                sessionStorage.setItem('agcas_organization', JSON.stringify(orgs[0]));
                console.log('[VerifyMagicLink] Cached organization:', orgs[0].name);
              }
            } catch (orgErr) {
              console.warn('[VerifyMagicLink] Could not cache organization:', orgErr.message);
            }
          }

          // Determine landing page based on role
          let landingPage = 'Events'; // Default fallback
          
          if (response.data.user.role_id) {
            try {
              // Fetch the role to get the default landing page
              const allRoles = await base44.entities.Role.list();
              const userRole = allRoles.find(r => r.id === response.data.user.role_id);
              
              if (userRole && userRole.default_landing_page) {
                landingPage = userRole.default_landing_page;
              }
            } catch (roleError) {
              console.error('Error fetching role:', roleError);
              // If there's an error fetching the role, just use default 'Events'
            }
          }

          // Redirect to the role's landing page
          setTimeout(() => {
            window.location.href = createPageUrl(landingPage);
          }, 1500);
        } else {
          setStatus('error');
          setMessage(response.data.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'An error occurred during verification');
      }
    };

    verifyToken();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardContent className="p-12">
          {status === 'verifying' && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Verifying...
              </h2>
              <p className="text-slate-600">
                Please wait while we verify your login link
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {message}
              </h2>
              <p className="text-slate-600">
                Taking you to your dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Verification Failed
              </h2>
              <p className="text-red-600 mb-6">
                {message}
              </p>
              <a
                href={createPageUrl('Home')}
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Request New Link
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}