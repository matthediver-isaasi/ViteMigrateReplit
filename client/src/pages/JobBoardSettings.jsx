import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Plus, X, Settings } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { useMemberAccess } from "@/hooks/useMemberAccess";

export default function JobBoardSettingsPage() {
  const { isAdmin, isFeatureExcluded, isAccessReady } = useMemberAccess();
  const [accessChecked, setAccessChecked] = useState(false);
  const [price, setPrice] = useState('50');
  const [jobTypes, setJobTypes] = useState(['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship']);
  const [hours, setHours] = useState(['Full-time', 'Part-time', 'Flexible']);
  const [newJobType, setNewJobType] = useState('');
  const [newHour, setNewHour] = useState('');
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAccessReady) {
      if (!isAdmin || isFeatureExcluded('page_JobBoardSettings')) {
        window.location.href = createPageUrl('Events');
      } else {
        setAccessChecked(true);
      }
    }
  }, [isAdmin, isAccessReady, isFeatureExcluded]);

  const { data: priceSettings } = useQuery({
    queryKey: ['job-board-price-settings'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      return allSettings.find(s => s.setting_key === 'job_posting_price');
    }
  });

  const { data: jobTypeSettings } = useQuery({
    queryKey: ['job-type-settings'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      return allSettings.find(s => s.setting_key === 'job_types');
    }
  });

  const { data: hoursSettings } = useQuery({
    queryKey: ['hours-settings'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      return allSettings.find(s => s.setting_key === 'job_hours');
    }
  });

  useEffect(() => {
    if (priceSettings?.setting_value) {
      setPrice(priceSettings.setting_value);
    }
    if (jobTypeSettings?.setting_value) {
      try {
        const parsed = JSON.parse(jobTypeSettings.setting_value);
        setJobTypes(parsed);
      } catch (e) {
        console.error('Failed to parse job types:', e);
      }
    }
    if (hoursSettings?.setting_value) {
      try {
        const parsed = JSON.parse(hoursSettings.setting_value);
        setHours(parsed);
      } catch (e) {
        console.error('Failed to parse hours:', e);
      }
    }
  }, [priceSettings, jobTypeSettings, hoursSettings]);

  const savePriceMutation = useMutation({
    mutationFn: async (newPrice) => {
      if (priceSettings) {
        return await base44.entities.SystemSettings.update(priceSettings.id, {
          setting_value: newPrice
        });
      } else {
        return await base44.entities.SystemSettings.create({
          setting_key: 'job_posting_price',
          setting_value: newPrice,
          description: 'Price in GBP for non-member job postings'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-board-price-settings'] });
      toast.success('Job posting price updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update price: ' + error.message);
    }
  });

  const saveJobTypesMutation = useMutation({
    mutationFn: async (types) => {
      const value = JSON.stringify(types);
      if (jobTypeSettings) {
        return await base44.entities.SystemSettings.update(jobTypeSettings.id, {
          setting_value: value
        });
      } else {
        return await base44.entities.SystemSettings.create({
          setting_key: 'job_types',
          setting_value: value,
          description: 'Available job type options for job postings'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-type-settings'] });
      toast.success('Job types updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update job types: ' + error.message);
    }
  });

  const saveHoursMutation = useMutation({
    mutationFn: async (hourOptions) => {
      const value = JSON.stringify(hourOptions);
      if (hoursSettings) {
        return await base44.entities.SystemSettings.update(hoursSettings.id, {
          setting_value: value
        });
      } else {
        return await base44.entities.SystemSettings.create({
          setting_key: 'job_hours',
          setting_value: value,
          description: 'Available hours options for job postings'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hours-settings'] });
      toast.success('Hours options updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update hours options: ' + error.message);
    }
  });

  const handleSavePrice = () => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    savePriceMutation.mutate(price);
  };

  const handleAddJobType = () => {
    if (!newJobType.trim()) return;
    if (jobTypes.includes(newJobType.trim())) {
      toast.error('This job type already exists');
      return;
    }
    const updated = [...jobTypes, newJobType.trim()];
    setJobTypes(updated);
    setNewJobType('');
    saveJobTypesMutation.mutate(updated);
  };

  const handleRemoveJobType = (type) => {
    const updated = jobTypes.filter(t => t !== type);
    setJobTypes(updated);
    saveJobTypesMutation.mutate(updated);
  };

  const handleAddHour = () => {
    if (!newHour.trim()) return;
    if (hours.includes(newHour.trim())) {
      toast.error('This hours option already exists');
      return;
    }
    const updated = [...hours, newHour.trim()];
    setHours(updated);
    setNewHour('');
    saveHoursMutation.mutate(updated);
  };

  const handleRemoveHour = (hour) => {
    const updated = hours.filter(h => h !== hour);
    setHours(updated);
    saveHoursMutation.mutate(updated);
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
            Job Board Settings
          </h1>
          <p className="text-slate-600">
            Configure pricing and dropdown options for the job board
          </p>
        </div>

        <div className="space-y-6">
          {/* Price Settings */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Non-Member Job Posting Price
              </CardTitle>
              <CardDescription>
                Set the price in GBP that non-members must pay to post a job listing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="price">Price (GBP)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg font-semibold text-slate-400">£</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-10"
                    placeholder="50.00"
                  />
                </div>
                <p className="text-sm text-slate-500">
                  AGCAS members can always post jobs for free
                </p>
              </div>

              <Button 
                onClick={handleSavePrice}
                disabled={savePriceMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {savePriceMutation.isPending ? 'Saving...' : 'Save Price'}
              </Button>
            </CardContent>
          </Card>

          {/* Job Type Options */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Job Type Options
              </CardTitle>
              <CardDescription>
                Configure the available options for the "Job Type" dropdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new job type..."
                  value={newJobType}
                  onChange={(e) => setNewJobType(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddJobType()}
                />
                <Button onClick={handleAddJobType} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {jobTypes.map((type) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">{type}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveJobType(type)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hours Options */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Hours Options
              </CardTitle>
              <CardDescription>
                Configure the available options for the "Hours" dropdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new hours option..."
                  value={newHour}
                  onChange={(e) => setNewHour(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddHour()}
                />
                <Button onClick={handleAddHour} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {hours.map((hour) => (
                  <div key={hour} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">{hour}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveHour(hour)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}