import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function SEOSettings({ 
  seoTitle, 
  onSeoTitleChange, 
  seoDescription, 
  onSeoDescriptionChange,
  defaultTitle,
  defaultDescription 
}) {
  return (
    <Collapsible>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-70">
            <CardTitle className="text-base">SEO Settings</CardTitle>
            <ChevronDown className="w-4 h-4 transition-transform ui-open:rotate-180" />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="seo-title" className="text-sm">SEO Title</Label>
              <Input
                id="seo-title"
                value={seoTitle}
                onChange={(e) => onSeoTitleChange(e.target.value)}
                placeholder={defaultTitle || "Article title for search engines..."}
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                {seoTitle.length || defaultTitle?.length || 0} / 60 characters recommended
              </p>
            </div>

            <div>
              <Label htmlFor="seo-desc" className="text-sm">SEO Description</Label>
              <Textarea
                id="seo-desc"
                value={seoDescription}
                onChange={(e) => onSeoDescriptionChange(e.target.value)}
                placeholder={defaultDescription || "Brief description for search results..."}
                className="mt-2 min-h-[80px]"
              />
              <p className="text-xs text-slate-500 mt-1">
                {seoDescription.length || defaultDescription?.length || 0} / 160 characters recommended
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}