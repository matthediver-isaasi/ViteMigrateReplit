import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, Globe, Users, Phone, Mail, MapPin, ClipboardList, ExternalLink } from "lucide-react";
import { useMemberAccess } from "@/hooks/useMemberAccess";
import { createPageUrl } from "@/utils";

export default function MyOrganisationPage() {
  const { memberInfo, organizationInfo, isFeatureExcluded, isAccessReady } = useMemberAccess();
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    if (isAccessReady) {
      if (isFeatureExcluded('page_user_MyOrganisation')) {
        window.location.href = createPageUrl('Events');
      } else {
        setAccessChecked(true);
      }
    }
  }, [isAccessReady, isFeatureExcluded]);

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['myOrganization', memberInfo?.organization_id],
    enabled: !!memberInfo?.organization_id && accessChecked,
    queryFn: async () => {
      if (!memberInfo?.organization_id) return null;
      const org = await base44.entities.Organization.get(memberInfo.organization_id);
      return org;
    }
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['organizationMembers', memberInfo?.organization_id],
    enabled: !!memberInfo?.organization_id && accessChecked,
    queryFn: async () => {
      if (!memberInfo?.organization_id) return [];
      const allMembers = await base44.entities.Member.list({
        filter: { organization_id: memberInfo.organization_id }
      });
      return allMembers || [];
    }
  });

  const { data: orgCustomFields = [] } = useQuery({
    queryKey: ['/api/entities/PreferenceField', 'organization'],
    enabled: accessChecked,
    queryFn: async () => {
      try {
        const fields = await base44.entities.PreferenceField.list({
          filter: { is_active: true, entity_scope: 'organization' },
          sort: { display_order: 'asc' }
        });
        return (fields || []).filter(f => f.entity_scope === 'organization');
      } catch {
        try {
          const allFields = await base44.entities.PreferenceField.list({
            filter: { is_active: true },
            sort: { display_order: 'asc' }
          });
          return (allFields || []).filter(f => f.entity_scope === 'organization');
        } catch {
          return [];
        }
      }
    }
  });

  const { data: orgValues = [], isLoading: valuesLoading } = useQuery({
    queryKey: ['organizationPreferenceValues', memberInfo?.organization_id],
    enabled: !!memberInfo?.organization_id && accessChecked,
    queryFn: async () => {
      if (!memberInfo?.organization_id) return [];
      try {
        const values = await base44.entities.OrganizationPreferenceValue.list({
          filter: { organization_id: memberInfo.organization_id }
        });
        return values || [];
      } catch {
        return [];
      }
    }
  });

  const isLoading = !accessChecked || orgLoading || membersLoading;

  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!memberInfo?.organization_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Organisation Found</h3>
              <p className="text-slate-600">You are not currently associated with an organisation.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getCustomFieldDisplayValue = (field, valueRecord) => {
    let displayValue = valueRecord?.value;
    
    if (displayValue === null || displayValue === undefined || displayValue === '') {
      return '';
    }

    switch (field.field_type) {
      case 'picklist':
        try {
          const parsed = JSON.parse(displayValue);
          if (Array.isArray(parsed) && field.options) {
            return parsed
              .map(v => field.options.find(o => o.value === v)?.label || v)
              .join(', ');
          }
        } catch {
          return displayValue;
        }
        break;
        
      case 'dropdown':
        if (field.options) {
          const option = field.options.find(o => o.value === displayValue);
          return option?.label || displayValue;
        }
        break;
        
      case 'boolean':
        if (displayValue === 'true' || displayValue === true) return 'Yes';
        if (displayValue === 'false' || displayValue === false) return 'No';
        return displayValue;
        
      case 'date':
        try {
          const date = new Date(displayValue);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          }
        } catch {
          return displayValue;
        }
        break;
        
      case 'number':
      case 'decimal':
        const num = parseFloat(displayValue);
        if (!isNaN(num)) {
          return field.field_type === 'decimal' 
            ? num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : num.toLocaleString('en-GB');
        }
        break;
        
      case 'textarea':
      case 'rich_text':
        return displayValue;
        
      case 'text':
      default:
        return displayValue;
    }
    
    return displayValue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              My Organisation
            </h1>
          </div>
          <p className="text-slate-600">
            View your organisation details and information
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : organization ? (
          <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {organization.logo_url ? (
                      <img
                        src={organization.logo_url}
                        alt={organization.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      {organization.name}
                    </h2>
                    {organization.domain && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
                        <Globe className="w-4 h-4" />
                        @{organization.domain}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <Users className="w-3 h-3 mr-1" />
                        {members.length} {members.length === 1 ? 'member' : 'members'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {organization.description && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-slate-600">{organization.description}</p>
                  </div>
                )}

                {organization.additional_verified_domains?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-2">Additional Domains</p>
                    <div className="flex flex-wrap gap-1">
                      {organization.additional_verified_domains.map((domain, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          @{domain}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact & Invoicing Details */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  Contact & Invoicing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Phone Number */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Phone className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Phone Number</p>
                      <p className="text-sm font-medium text-slate-900">
                        {organization.phone || <span className="text-slate-400 italic font-normal">Not set</span>}
                      </p>
                    </div>
                  </div>

                  {/* Website */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Globe className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Website</p>
                      {organization.website_url ? (
                        <a 
                          href={organization.website_url.startsWith('http') ? organization.website_url : `https://${organization.website_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {organization.website_url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Not set</p>
                      )}
                    </div>
                  </div>

                  {/* Invoicing Email */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Invoicing Email</p>
                      {organization.invoicing_email ? (
                        <a 
                          href={`mailto:${organization.invoicing_email}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          {organization.invoicing_email}
                        </a>
                      ) : (
                        <p className="text-sm text-slate-400 italic">Not set</p>
                      )}
                    </div>
                  </div>

                  {/* Invoicing Address */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Invoicing Address</p>
                      <p className="text-sm font-medium text-slate-900 whitespace-pre-line">
                        {organization.invoicing_address || <span className="text-slate-400 italic font-normal">Not set</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Fields Section */}
            {orgCustomFields.length > 0 && (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {valuesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orgCustomFields.map((field) => {
                        const valueRecord = orgValues.find(v => v.field_id === field.id);
                        const displayValue = getCustomFieldDisplayValue(field, valueRecord);
                        
                        return (
                          <div key={field.id} className="flex justify-between items-start gap-4 p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-600">{field.label}</span>
                            <span className="text-sm font-medium text-slate-900 text-right">
                              {displayValue || <span className="text-slate-400 italic font-normal">Not set</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Organisation Not Found</h3>
              <p className="text-slate-600">Unable to load your organisation details.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
