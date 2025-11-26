import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Save, Settings, Search, Building } from "lucide-react";
import { toast } from "sonner";

export default function OrganisationDirectorySettingsPage({ isAdmin }) {
  const queryClient = useQueryClient();
  const [showLogo, setShowLogo] = useState(true);
  const [showDomains, setShowDomains] = useState(true);
  const [showMemberCount, setShowMemberCount] = useState(true);
  const [excludedOrgIds, setExcludedOrgIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all organizations
  const { data: organizations = [] } = useQuery({
    queryKey: ['all-organizations'],
    queryFn: () => base44.entities.Organization.list('name')
  });

  // Fetch current settings
  const { data: settings } = useQuery({
    queryKey: ['organisation-directory-settings'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      const logoSetting = allSettings.find((s) => s.setting_key === 'org_directory_show_logo');
      const domainsSetting = allSettings.find((s) => s.setting_key === 'org_directory_show_domains');
      const memberCountSetting = allSettings.find((s) => s.setting_key === 'org_directory_show_member_count');
      const excludedOrgsSetting = allSettings.find((s) => s.setting_key === 'org_directory_excluded_orgs');
      return {
        logo: logoSetting,
        domains: domainsSetting,
        memberCount: memberCountSetting,
        excludedOrgs: excludedOrgsSetting
      };
    },
    refetchOnMount: true
  });

  useEffect(() => {
    if (settings?.logo) {
      setShowLogo(settings.logo.setting_value === 'true');
    }
    if (settings?.domains) {
      setShowDomains(settings.domains.setting_value === 'true');
    }
    if (settings?.memberCount) {
      setShowMemberCount(settings.memberCount.setting_value === 'true');
    }
    if (settings?.excludedOrgs) {
      try {
        const excluded = JSON.parse(settings.excludedOrgs.setting_value);
        setExcludedOrgIds(Array.isArray(excluded) ? excluded : []);
      } catch {
        setExcludedOrgIds([]);
      }
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save logo setting
      if (settings?.logo) {
        await base44.entities.SystemSettings.update(settings.logo.id, {
          setting_value: showLogo.toString()
        });
      } else {
        await base44.entities.SystemSettings.create({
          setting_key: 'org_directory_show_logo',
          setting_value: showLogo.toString(),
          description: 'Show organization logo on directory cards'
        });
      }

      // Save domains setting
      if (settings?.domains) {
        await base44.entities.SystemSettings.update(settings.domains.id, {
          setting_value: showDomains.toString()
        });
      } else {
        await base44.entities.SystemSettings.create({
          setting_key: 'org_directory_show_domains',
          setting_value: showDomains.toString(),
          description: 'Show organization domains on directory cards'
        });
      }

      // Save member count setting
      if (settings?.memberCount) {
        await base44.entities.SystemSettings.update(settings.memberCount.id, {
          setting_value: showMemberCount.toString()
        });
      } else {
        await base44.entities.SystemSettings.create({
          setting_key: 'org_directory_show_member_count',
          setting_value: showMemberCount.toString(),
          description: 'Show member count on directory cards'
        });
      }

      // Save excluded organizations setting
      if (settings?.excludedOrgs) {
        await base44.entities.SystemSettings.update(settings.excludedOrgs.id, {
          setting_value: JSON.stringify(excludedOrgIds)
        });
      } else {
        await base44.entities.SystemSettings.create({
          setting_key: 'org_directory_excluded_orgs',
          setting_value: JSON.stringify(excludedOrgIds),
          description: 'List of organization IDs excluded from the directory'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisation-directory-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    }
  });

  const toggleOrganization = (orgId) => {
    setExcludedOrgIds((prev) =>
    prev.includes(orgId) ?
    prev.filter((id) => id !== orgId) :
    [...prev, orgId]
    );
  };

  const filteredOrganizations = organizations.filter((org) =>
  org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-8 text-center">
              <p className="text-amber-800">You do not have permission to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Organisation Directory Settings
          </h1>
          <p className="text-slate-600">
            Configure what information is displayed on organisation directory cards
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label htmlFor="showLogo" className="text-base font-medium cursor-pointer">
                  Show Organization Logo
                </Label>
                <p className="text-sm text-slate-600 mt-1">
                  Display organization logos on directory cards
                </p>
              </div>
              <input
                type="checkbox"
                id="showLogo"
                checked={showLogo}
                onChange={(e) => setShowLogo(e.target.checked)}
                className="w-5 h-5 cursor-pointer" />

            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label htmlFor="showDomains" className="text-base font-medium cursor-pointer">
                  Show Domains
                </Label>
                <p className="text-sm text-slate-600 mt-1">
                  Display organization domains on directory cards
                </p>
              </div>
              <input
                type="checkbox"
                id="showDomains"
                checked={showDomains}
                onChange={(e) => setShowDomains(e.target.checked)}
                className="w-5 h-5 cursor-pointer" />

            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label htmlFor="showMemberCount" className="text-base font-medium cursor-pointer">
                  Show Member Count
                </Label>
                <p className="text-sm text-slate-600 mt-1">
                  Display the number of members from each organization
                </p>
              </div>
              <input
                type="checkbox"
                id="showMemberCount"
                checked={showMemberCount}
                onChange={(e) => setShowMemberCount(e.target.checked)}
                className="w-5 h-5 cursor-pointer" />

            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700">

                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm mt-6">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold leading-none tracking-tight">Exclude Organisations</CardTitle>
            <p className="text-sm text-slate-600 mt-2">Hide specific organisations from appearing in the directory

            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search organisations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10" />

            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-4">
              {filteredOrganizations.length === 0 ?
              <p className="text-center text-slate-500 py-4">No organizations found</p> :

              filteredOrganizations.map((org) =>
              <div
                key={org.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">

                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900">{org.name}</p>
                        {org.domain &&
                    <p className="text-xs text-slate-500">{org.domain}</p>
                    }
                      </div>
                    </div>
                    <input
                  type="checkbox"
                  checked={!excludedOrgIds.includes(org.id)}
                  onChange={() => toggleOrganization(org.id)}
                  className="w-5 h-5 cursor-pointer"
                  title={excludedOrgIds.includes(org.id) ? "Click to include" : "Click to exclude"} />

                  </div>
              )
              }
            </div>

            {excludedOrgIds.length > 0 &&
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  {excludedOrgIds.length} organization{excludedOrgIds.length !== 1 ? 's' : ''} excluded from directory
                </p>
              </div>
            }

            <div className="pt-4 border-t">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700">

                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

}