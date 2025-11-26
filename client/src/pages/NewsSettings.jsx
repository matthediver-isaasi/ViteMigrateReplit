import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useMemberAccess } from "@/hooks/useMemberAccess";
import { createPageUrl } from "@/utils";

export default function NewsSettingsPage() {
  const { isAdmin, isAccessReady } = useMemberAccess();
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    if (isAccessReady) {
      if (!isAdmin) {
        window.location.href = createPageUrl('Events');
      } else {
        setAccessChecked(true);
      }
    }
  }, [isAdmin, isAccessReady]);
  const [tickerCount, setTickerCount] = useState(3);
  const [cycleSeconds, setCycleSeconds] = useState(5);
  const [tickerEnabled, setTickerEnabled] = useState(true);
  const [showAuthor, setShowAuthor] = useState(true);

  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['news-ticker-settings'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      return allSettings.filter(s => 
        s.setting_key === 'news_ticker_count' || 
        s.setting_key === 'news_ticker_cycle_seconds' ||
        s.setting_key === 'news_ticker_enabled' ||
        s.setting_key === 'news_show_author'
      );
    },
    enabled: accessChecked,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (settings.length > 0) {
      const countSetting = settings.find(s => s.setting_key === 'news_ticker_count');
      const cycleSetting = settings.find(s => s.setting_key === 'news_ticker_cycle_seconds');
      const enabledSetting = settings.find(s => s.setting_key === 'news_ticker_enabled');
      const authorSetting = settings.find(s => s.setting_key === 'news_show_author');
      
      if (countSetting) setTickerCount(parseInt(countSetting.setting_value) || 3);
      if (cycleSetting) setCycleSeconds(parseInt(cycleSetting.setting_value) || 5);
      if (enabledSetting) setTickerEnabled(enabledSetting.setting_value === 'true');
      if (authorSetting) setShowAuthor(authorSetting.setting_value === 'true');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const countSetting = settings.find(s => s.setting_key === 'news_ticker_count');
      const cycleSetting = settings.find(s => s.setting_key === 'news_ticker_cycle_seconds');
      const enabledSetting = settings.find(s => s.setting_key === 'news_ticker_enabled');
      const authorSetting = settings.find(s => s.setting_key === 'news_show_author');

      const promises = [];

      if (countSetting) {
        promises.push(
          base44.entities.SystemSettings.update(countSetting.id, {
            setting_value: tickerCount.toString()
          })
        );
      } else {
        promises.push(
          base44.entities.SystemSettings.create({
            setting_key: 'news_ticker_count',
            setting_value: tickerCount.toString(),
            description: 'Number of news articles to display in ticker'
          })
        );
      }

      if (cycleSetting) {
        promises.push(
          base44.entities.SystemSettings.update(cycleSetting.id, {
            setting_value: cycleSeconds.toString()
          })
        );
      } else {
        promises.push(
          base44.entities.SystemSettings.create({
            setting_key: 'news_ticker_cycle_seconds',
            setting_value: cycleSeconds.toString(),
            description: 'Seconds between news ticker transitions'
          })
        );
      }

      if (enabledSetting) {
        promises.push(
          base44.entities.SystemSettings.update(enabledSetting.id, {
            setting_value: tickerEnabled.toString()
          })
        );
      } else {
        promises.push(
          base44.entities.SystemSettings.create({
            setting_key: 'news_ticker_enabled',
            setting_value: tickerEnabled.toString(),
            description: 'Whether the news ticker is enabled'
          })
        );
      }

      if (authorSetting) {
        promises.push(
          base44.entities.SystemSettings.update(authorSetting.id, {
            setting_value: showAuthor.toString()
          })
        );
      } else {
        promises.push(
          base44.entities.SystemSettings.create({
            setting_key: 'news_show_author',
            setting_value: showAuthor.toString(),
            description: 'Whether to show author on news cards and articles'
          })
        );
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-ticker-settings'] });
      toast.success('News ticker settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    }
  });

  const handleSave = () => {
    if (tickerCount < 1) {
      toast.error('Number of articles must be at least 1');
      return;
    }
    if (cycleSeconds < 2) {
      toast.error('Cycle time must be at least 2 seconds');
      return;
    }
    saveMutation.mutate();
  };

  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <div className="animate-pulse text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            News Ticker Settings
          </h1>
          <p className="text-slate-600">Configure the news ticker displayed at the top of the member portal</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Ticker Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {isLoading ? (
              <div className="text-center py-8 text-slate-600">Loading settings...</div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg mb-6">
                  <Switch
                    id="ticker-enabled"
                    checked={tickerEnabled}
                    onCheckedChange={setTickerEnabled}
                  />
                  <div className="flex-1">
                    <Label htmlFor="ticker-enabled" className="cursor-pointer font-medium">
                      Enable News Ticker
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Show or hide the news ticker bar at the top of the member portal
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticker-count">Number of Articles to Display</Label>
                  <Input
                    id="ticker-count"
                    type="number"
                    min="1"
                    max="10"
                    value={tickerCount}
                    onChange={(e) => setTickerCount(parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-slate-500">
                    The latest published news articles to cycle through in the ticker
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cycle-seconds">Cycle Time (seconds)</Label>
                  <Input
                    id="cycle-seconds"
                    type="number"
                    min="2"
                    max="60"
                    value={cycleSeconds}
                    onChange={(e) => setCycleSeconds(parseInt(e.target.value) || 2)}
                  />
                  <p className="text-xs text-slate-500">
                    Time in seconds before switching to the next article (minimum 2 seconds)
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Switch
                    id="show-author"
                    checked={showAuthor}
                    onCheckedChange={setShowAuthor}
                  />
                  <div className="flex-1">
                    <Label htmlFor="show-author" className="cursor-pointer font-medium">
                      Show Author
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Display author information on news cards and articles
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Settings
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}