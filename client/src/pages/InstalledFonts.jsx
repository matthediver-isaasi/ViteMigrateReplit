import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Type, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useMemberAccess } from "@/hooks/useMemberAccess";
import { createPageUrl } from "@/utils";

export default function InstalledFontsPage() {
  const { isAdmin, isFeatureExcluded, isAccessReady } = useMemberAccess();
  const [accessChecked, setAccessChecked] = useState(false);
  const [fontLoadStatus, setFontLoadStatus] = useState({});
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    if (isAccessReady) {
      if (!isAdmin || isFeatureExcluded('page_InstalledFonts')) {
        window.location.href = createPageUrl('Events');
      } else {
        setAccessChecked(true);
      }
    }
  }, [isAdmin, isAccessReady]);

  useEffect(() => {
    // Check if Font Loading API is available
    if ('fonts' in document) {
      // Check Degular Medium specifically
      document.fonts.load('500 16px "Degular Medium"').then(() => {
        const loaded = document.fonts.check('500 16px "Degular Medium"');
        setFontLoadStatus({ degular: loaded });
      }).catch((err) => {
        setFontLoadStatus({ degular: false, error: err.message });
      });

      // Listen for font load events
      document.fonts.addEventListener('loadingdone', (event) => {
        const fontFaces = Array.from(document.fonts.values());
        const degularFont = fontFaces.find(f => f.family === 'Degular Medium');
        setDebugInfo({
          totalFonts: fontFaces.length,
          degularFound: !!degularFont,
          degularStatus: degularFont?.status,
          allFontFamilies: fontFaces.map(f => f.family)
        });
      });
    }

    // Test fetch to check CORS
    fetch('https://teeone.pythonanywhere.com/font-assets/Degular-Medium.woff', { mode: 'cors' })
      .then(response => {
        setDebugInfo(prev => ({
          ...prev,
          fetchStatus: response.ok ? 'success' : 'failed',
          fetchStatusCode: response.status,
          corsHeaders: response.headers.get('Access-Control-Allow-Origin')
        }));
      })
      .catch(err => {
        setDebugInfo(prev => ({
          ...prev,
          fetchStatus: 'error',
          fetchError: err.message
        }));
      });
  }, []);

  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const fonts = [
    {
      name: "Poppins",
      family: "Poppins, sans-serif",
      source: "Google Fonts",
      weights: ["400 (Regular)", "600 (Semibold)"],
      usage: "Body text, general UI elements"
    },
    {
      name: "Degular Medium",
      family: "'Degular Medium', 'Poppins', sans-serif",
      source: "https://teeone.pythonanywhere.com/font-assets",
      weights: ["500 (Medium)"],
      usage: "H1 headers"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Type className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Installed Fonts</h1>
          </div>
          <p className="text-slate-600">
            View all fonts currently installed and available in the application
          </p>
        </div>

        {/* Debug Information Card */}
        <Card className="border-amber-200 bg-amber-50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Font Loading Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Font API Check</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {fontLoadStatus.degular ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>Degular Medium: </span>
                    <Badge variant={fontLoadStatus.degular ? "default" : "destructive"}>
                      {fontLoadStatus.degular ? 'Loaded' : 'Not Loaded'}
                    </Badge>
                  </div>
                  {fontLoadStatus.error && (
                    <div className="text-xs text-red-600 mt-1">Error: {fontLoadStatus.error}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-2">Network Fetch Test</h4>
                <div className="space-y-1 text-sm">
                  <div>Status: <Badge variant={debugInfo.fetchStatus === 'success' ? 'default' : 'destructive'}>{debugInfo.fetchStatus || 'Testing...'}</Badge></div>
                  {debugInfo.fetchStatusCode && <div>HTTP Code: {debugInfo.fetchStatusCode}</div>}
                  {debugInfo.corsHeaders && <div>CORS Header: {debugInfo.corsHeaders}</div>}
                  {debugInfo.fetchError && <div className="text-xs text-red-600">Error: {debugInfo.fetchError}</div>}
                </div>
              </div>
            </div>

            {debugInfo.allFontFamilies && (
              <div className="pt-3 border-t border-amber-200">
                <h4 className="font-semibold text-sm mb-2">All Loaded Font Families ({debugInfo.totalFonts}):</h4>
                <div className="flex flex-wrap gap-1">
                  {debugInfo.allFontFamilies.map((family, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {family}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-amber-200">
              <h4 className="font-semibold text-sm mb-2">Browser Console Check:</h4>
              <p className="text-xs text-slate-600">
                Open your browser's DevTools (F12) → Network tab → Filter by "font" to see if the font file is loading and check for CORS errors.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {fonts.map((font, index) => (
            <Card key={index} className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span style={{ fontFamily: font.family }}>{font.name}</span>
                  <span className="text-sm font-normal text-slate-500">{font.source}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Font Details</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-slate-500">Family: </span>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">{font.family}</code>
                      </div>
                      <div>
                        <span className="text-slate-500">Weights: </span>
                        <span className="text-slate-700">{font.weights.join(", ")}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Usage: </span>
                        <span className="text-slate-700">{font.usage}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Preview</h4>
                    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
                      <p style={{ fontFamily: font.family, fontSize: '24px' }}>
                        The quick brown fox jumps over the lazy dog
                      </p>
                      <p style={{ fontFamily: font.family, fontSize: '16px' }}>
                        ABCDEFGHIJKLMNOPQRSTUVWXYZ
                      </p>
                      <p style={{ fontFamily: font.family, fontSize: '16px' }}>
                        abcdefghijklmnopqrstuvwxyz
                      </p>
                      <p style={{ fontFamily: font.family, fontSize: '16px' }}>
                        0123456789
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Size Examples</h4>
                  <div className="space-y-3">
                    <p style={{ fontFamily: font.family, fontSize: '32px' }}>
                      32px - Large Heading
                    </p>
                    <p style={{ fontFamily: font.family, fontSize: '24px' }}>
                      24px - Medium Heading
                    </p>
                    <p style={{ fontFamily: font.family, fontSize: '16px' }}>
                      16px - Body Text
                    </p>
                    <p style={{ fontFamily: font.family, fontSize: '14px' }}>
                      14px - Small Text
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}