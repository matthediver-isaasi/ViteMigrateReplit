
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Loader2, CheckCircle2, ExternalLink, RefreshCw, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [xeroLoading, setXeroLoading] = useState(false); // New state for Xero loading
  const [syncResult, setSyncResult] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [authWindow, setAuthWindow] = useState(null);
  const [xeroAuthWindow, setXeroAuthWindow] = useState(null); // New state for Xero auth window

  const { data: tokens = [] } = useQuery({
    queryKey: ['zoho-tokens'],
    queryFn: () => base44.entities.ZohoToken.list(),
    staleTime: 0,
    refetchOnMount: true,
  });

  // New query for Xero tokens
  const { data: xeroTokens = [] } = useQuery({
    queryKey: ['xero-tokens'],
    queryFn: () => base44.entities.XeroToken.list(),
    staleTime: 0,
    refetchOnMount: true,
  });

  const isAuthenticated = tokens.length > 0;
  const isXeroAuthenticated = xeroTokens.length > 0; // New derived state for Xero authentication

  const handleAuthenticate = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('getZohoAuthUrl');
      const { authUrl } = response.data;
      
      const popup = window.open(authUrl, 'ZohoAuth', 'width=600,height=700');
      setAuthWindow(popup);
      
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setAuthWindow(null);
          setLoading(false);
          window.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Auth error:', error);
      setLoading(false);
    }
  };

  const handleTestFunction = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const response = await base44.functions.invoke('testFunction', {
        accessToken: tokens.length > 0 ? tokens[0].access_token : null
      });
      setTestResult(response.data);
    } catch (error) {
      setTestResult({ 
        success: false, 
        error: error.response?.data?.error || error.message,
        fullError: JSON.stringify(error.response?.data || error, null, 2)
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSyncEvents = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const response = await base44.functions.invoke('syncBackstageEvents', {
        accessToken: tokens[0].access_token
      });
      
      setSyncResult(response.data);
    } catch (error) {
      setSyncResult({ 
        success: false, 
        error: error.response?.data?.error || error.message 
      });
    } finally {
      setSyncLoading(false);
    }
  };

  // New function for Xero authentication
  const handleXeroAuthenticate = async () => {
    setXeroLoading(true);
    try {
      const response = await base44.functions.invoke('getXeroAuthUrl');
      const { authUrl } = response.data;
      
      const popup = window.open(authUrl, 'XeroAuth', 'width=600,height=700');
      setXeroAuthWindow(popup);
      
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setXeroAuthWindow(null);
          setXeroLoading(false);
          window.location.reload();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Xero auth error:', error);
      setXeroLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Setup</h1>
          <p className="text-slate-600">Configure Zoho and Xero integrations for AGCAS Events</p> {/* Updated description */}
        </div>

        <Card className="shadow-xl border-slate-200 mb-6">
          <CardHeader>
            <CardTitle>Test Function</CardTitle>
            <CardDescription>
              Test that backend functions are working correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResult && (
              <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                {testResult.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div className="w-full">
                      <h3 className="font-semibold text-green-900 mb-1">Test Successful</h3>
                      <p className="text-sm text-green-700">{testResult.message}</p>
                      {testResult.backstageDomain && (
                        <p className="text-xs text-green-600 mt-1">Domain: {testResult.backstageDomain}</p>
                      )}
                      {testResult.portalName && (
                        <p className="text-xs text-green-600 mt-1">Portal: {testResult.portalName}</p>
                      )}
                      {testResult.constructedUrl && (
                        <p className="text-xs text-green-600 mt-1 break-all">URL: {testResult.constructedUrl}</p>
                      )}
                      {testResult.accessTokenPrefix && (
                        <p className="text-xs text-green-600 mt-1">Token: {testResult.accessTokenPrefix}</p>
                      )}
                      {testResult.statusCode && (
                        <p className="text-xs text-green-600 mt-1">Status: {testResult.statusCode}</p>
                      )}
                      {testResult.eventCount !== undefined && (
                        <p className="text-xs text-green-600 mt-1">Events: {testResult.eventCount}</p>
                      )}
                      <p className="text-xs text-green-600 mt-1">{testResult.timestamp}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="w-full">
                      <h3 className="font-semibold text-red-900 mb-1">Test Failed</h3>
                      <p className="text-sm text-red-700">{testResult.error}</p>
                      {testResult.fullError && (
                        <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40 bg-red-100 p-2 rounded">
                          {testResult.fullError}
                        </pre>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <Button
              onClick={handleTestFunction}
              disabled={testLoading}
              className="w-full"
              size="lg"
            >
              {testLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Run Test Function'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-slate-200 mb-6">
          <CardHeader>
            <CardTitle>Zoho Authentication</CardTitle>
            <CardDescription>
              Connect your Zoho CRM and Backstage accounts to sync members and events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isAuthenticated ? (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">✓ Connected</h3>
                  <p className="text-sm text-green-700">
                    Your Zoho account is connected and ready to sync data.
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    Last updated: {new Date(tokens[0].expires_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>⚠️ Authentication Required</strong><br />
                    You need to authenticate with Zoho before members can access the portal.
                  </p>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <p><strong>This will allow the app to:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Search and validate member contacts in Zoho CRM</li>
                    <li>Access organization and account information</li>
                    <li>Sync events from Zoho Backstage</li>
                    <li>Create registrations and manage bookings</li>
                  </ul>
                </div>
              </div>
            )}

            <Button
              onClick={handleAuthenticate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : isAuthenticated ? (
                <>
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Re-authenticate with Zoho
                </>
              ) : (
                <>
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Authenticate with Zoho
                </>
              )}
            </Button>

            {isAuthenticated && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center">
                  The app will automatically refresh tokens as needed. Re-authenticate only if you experience issues.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Xero Authentication Card */}
        <Card className="shadow-xl border-slate-200 mb-6">
          <CardHeader>
            <CardTitle>Xero Authentication</CardTitle>
            <CardDescription>
              Connect your Xero account to automatically create invoices for account charges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isXeroAuthenticated ? (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">✓ Connected</h3>
                  <p className="text-sm text-green-700">
                    Your Xero account is connected and ready to create invoices.
                  </p>
                  {xeroTokens[0] && xeroTokens[0].expires_at && (
                    <p className="text-xs text-green-600 mt-2">
                      Last updated: {new Date(xeroTokens[0].expires_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>⚠️ Authentication Required</strong><br />
                    Connect to Xero to enable automatic invoice creation for account charges.
                  </p>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <p><strong>This will allow the app to:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Create invoices in your Xero account</li>
                    <li>Access contact information for billing</li>
                    <li>Track invoice status and payments</li>
                  </ul>
                </div>
              </div>
            )}

            <Button
              onClick={handleXeroAuthenticate}
              disabled={xeroLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              size="lg"
            >
              {xeroLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : isXeroAuthenticated ? (
                <>
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Re-authenticate with Xero
                </>
              ) : (
                <>
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Authenticate with Xero
                </>
              )}
            </Button>

            {isXeroAuthenticated && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center">
                  The app will automatically refresh tokens as needed. Re-authenticate only if you experience issues.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {isAuthenticated && (
          <Card className="shadow-xl border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Backstage Event Sync
              </CardTitle>
              <CardDescription>
                Sync events from Zoho Backstage to make them available in the portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {syncResult && (
                <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                  syncResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  {syncResult.success ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-green-900 mb-1">Sync Complete</h3>
                        <p className="text-sm text-green-700">
                          Successfully synced {syncResult.synced} of {syncResult.total} events
                          {syncResult.errors > 0 && ` (${syncResult.errors} errors)`}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-900 mb-1">Sync Failed</h3>
                        <p className="text-sm text-red-700">{syncResult.error}</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <Button
                onClick={handleSyncEvents}
                disabled={syncLoading}
                className="w-full"
                size="lg"
              >
                {syncLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Syncing Events...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Sync Events from Backstage
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-500">
                This will fetch all events from Backstage and update the portal. Existing events will be updated with latest information.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
