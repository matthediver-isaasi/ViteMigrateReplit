import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Check, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LinkGenerator({ numberOfLinks, setNumberOfLinks, event, memberInfo }) {
  const [generatedLink, setGeneratedLink] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm mt-6">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-xl">Generate Confirmation Link</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="numberOfLinks">Number of tickets</Label>
          <Input
            id="numberOfLinks"
            type="number"
            min="1"
            max="20"
            value={numberOfLinks}
            onChange={(e) => setNumberOfLinks(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
          />
          <p className="text-xs text-slate-500">
            {numberOfLinks} colleague{numberOfLinks > 1 ? 's' : ''} can use this link to confirm attendance
          </p>
        </div>

        {generatedLink && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              <Check className="w-4 h-4" />
              <span>Link generated! Share this with up to {numberOfLinks} colleague{numberOfLinks > 1 ? 's' : ''}.</span>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-slate-500 mb-1">Shareable Link</p>
                <code className="text-xs text-slate-700 break-all">{generatedLink}</code>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <p className="text-xs text-slate-500">
              Colleagues who use this link will need to enter their email address to confirm their attendance. 
              The link will stop working after {numberOfLinks} colleague{numberOfLinks > 1 ? 's have' : ' has'} confirmed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}