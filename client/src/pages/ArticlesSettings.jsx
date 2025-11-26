import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { toast } from "sonner";

export default function ArticlesSettingsPage({ isAdmin, isFeatureExcluded }) {
  const [displayName, setDisplayName] = useState("");
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['article-display-name-setting'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      const setting = allSettings.find(s => s.setting_key === 'article_display_name');
      return setting;
    },
    staleTime: 0
  });

  React.useEffect(() => {
    if (settings) {
      setDisplayName(settings.setting_value || 'Articles');
    } else {
      setDisplayName('Articles');
    }
  }, [settings]);

  const updateSettingMutation = useMutation({
    mutationFn: async (value) => {
      if (settings) {
        await base44.entities.SystemSettings.update(settings.id, {
          setting_value: value
        });
      } else {
        await base44.entities.SystemSettings.create({
          setting_key: 'article_display_name',
          setting_value: value,
          setting_type: 'text',
          description: 'Custom display name for articles section'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-display-name-setting'] });
      toast.success('Display name updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update setting: ' + error.message);
    }
  });

  const handleSave = () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }
    updateSettingMutation.mutate(displayName.trim());
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <p className="text-slate-600">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Articles Settings</h1>
          <p className="text-slate-600">Configure how articles appear throughout the portal</p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Display Name
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="display-name">Section Display Name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Articles, Blog, Letters, Insights"
                  className="max-w-md"
                />
                <p className="text-sm text-slate-500">
                  Customize how this section is labeled throughout the portal. For example, change "Articles" to "Blog", "Letters", or anything else.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Preview</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Page title: "{displayName || 'Articles'} & Insights"</li>
                  <li>• Management page: "All {displayName || 'Articles'}"</li>
                  <li>• Buttons: "New {displayName?.slice(0, -1) || 'Article'}"</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={updateSettingMutation.isPending || !displayName.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateSettingMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDisplayName(settings?.setting_value || 'Articles')}
                  disabled={updateSettingMutation.isPending}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}