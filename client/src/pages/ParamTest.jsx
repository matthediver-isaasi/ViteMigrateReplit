import React from "react";

export default function ParamTestPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">URL Parameter Test</h1>
        
        <div className="space-y-2">
          <div className="p-3 bg-slate-100 rounded">
            <p className="text-sm text-slate-600">Full URL:</p>
            <p className="font-mono text-sm">{window.location.href}</p>
          </div>

          <div className="p-3 bg-slate-100 rounded">
            <p className="text-sm text-slate-600">Search String:</p>
            <p className="font-mono text-sm">{window.location.search || '(empty)'}</p>
          </div>

          <div className="p-3 bg-slate-100 rounded">
            <p className="text-sm text-slate-600">Hash:</p>
            <p className="font-mono text-sm">{window.location.hash || '(empty)'}</p>
          </div>

          <div className="p-3 bg-slate-100 rounded">
            <p className="text-sm text-slate-600">Pathname:</p>
            <p className="font-mono text-sm">{window.location.pathname}</p>
          </div>

          <div className="p-3 bg-blue-50 rounded border-2 border-blue-200">
            <p className="text-sm text-slate-600">Slug Parameter Value:</p>
            <p className="font-mono text-lg font-bold">{slug || '(not found)'}</p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-slate-600">
            Test this page by visiting: <code className="bg-slate-100 px-2 py-1 rounded">/ParamTest?slug=test-value</code>
          </p>
        </div>
      </div>
    </div>
  );
}