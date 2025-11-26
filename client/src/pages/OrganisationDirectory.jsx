import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, Search, Globe, Users, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrganisationDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      return await base44.entities.Organization.list('name');
    },
    refetchOnMount: true
  });

  // Fetch display settings
  const { data: displaySettings } = useQuery({
    queryKey: ['organisation-directory-settings'],
    queryFn: async () => {
      const allSettings = await base44.entities.SystemSettings.list();
      const logoSetting = allSettings.find(s => s.setting_key === 'org_directory_show_logo');
      const domainsSetting = allSettings.find(s => s.setting_key === 'org_directory_show_domains');
      const memberCountSetting = allSettings.find(s => s.setting_key === 'org_directory_show_member_count');
      const excludedOrgsSetting = allSettings.find(s => s.setting_key === 'org_directory_excluded_orgs');
      
      let excludedOrgIds = [];
      if (excludedOrgsSetting) {
        try {
          excludedOrgIds = JSON.parse(excludedOrgsSetting.setting_value);
        } catch {
          excludedOrgIds = [];
        }
      }
      
      return {
        showLogo: logoSetting?.setting_value !== 'false',
        showDomains: domainsSetting?.setting_value !== 'false',
        showMemberCount: memberCountSetting?.setting_value !== 'false',
        excludedOrgIds: excludedOrgIds
      };
    },
    initialData: {
      showLogo: true,
      showDomains: true,
      showMemberCount: true,
      excludedOrgIds: []
    },
    refetchOnMount: true
  });

  const { data: members = [] } = useQuery({
    queryKey: ['all-members'],
    queryFn: async () => {
      return await base44.entities.Member.list();
    }
  });

  const organizationMemberCounts = useMemo(() => {
    const counts = {};
    members.forEach((member) => {
      if (member.organization_id) {
        counts[member.organization_id] = (counts[member.organization_id] || 0) + 1;
      }
    });
    return counts;
  }, [members]);

  const filteredOrganizations = useMemo(() => {
    const excludedIds = displaySettings?.excludedOrgIds || [];
    
    // First filter out excluded organizations
    let filtered = organizations.filter(org => 
      !excludedIds.includes(org.id)
    );
    
    // Then apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((org) =>
        org.name?.toLowerCase().includes(searchLower) ||
        org.domain?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [organizations, searchQuery, displaySettings?.excludedOrgIds]);

  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);
  const paginatedOrganizations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrganizations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrganizations, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">University Directory

            </h1>
          </div>
          <p className="text-slate-600">
            {filteredOrganizations.length} {filteredOrganizations.length === 1 ? 'organisation' : 'organisations'}
          </p>
        </div>

        <Card className="mb-6 border-slate-200">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search organisations by name or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10" />

            </div>
          </CardContent>
        </Card>

        {filteredOrganizations.length === 0 ?
        <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No organisations found</h3>
              <p className="text-slate-600">
                {searchQuery ? 'Try adjusting your search criteria' : 'No organisations available'}
              </p>
            </CardContent>
          </Card> :

        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedOrganizations.map((org) => {
              const memberCount = organizationMemberCounts[org.id] || 0;
              const allDomains = [org.domain, ...(org.additional_verified_domains || [])].filter(Boolean);

              return (
                <Card key={org.id} className="border-slate-200 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-start gap-3">
                        {displaySettings.showLogo && (
                          <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                            {org.logo_url ?
                          <img
                            src={org.logo_url}
                            alt={org.name}
                            className="w-full h-full object-cover" /> :


                          <Building2 className="w-5 h-5 text-slate-400" />
                          }
                          </div>
                        )}
                        <span className="text-base line-clamp-2">{org.name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {displaySettings.showDomains && allDomains.length > 0 &&
                    <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">
                              {allDomains.length > 1 ? 'Domains' : 'Domain'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 ml-6">
                            {allDomains.map((domain, idx) =>
                        <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                                @{domain}
                              </span>
                        )}
                          </div>
                        </div>
                    }

                      {displaySettings.showMemberCount && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">Members</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900">{memberCount}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>);

            })}
            </div>

            {totalPages > 1 &&
          <div className="mt-6 flex justify-center items-center gap-2">
                <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}>

                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) =>
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-9">

                      {page}
                    </Button>
              )}
                </div>

                <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}>

                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
          }
          </>
        }
      </div>
    </div>);

}