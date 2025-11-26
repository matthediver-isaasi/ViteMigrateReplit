import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';

export function useMemberAccess() {
  const memberInfo = useMemo(() => {
    const stored = sessionStorage.getItem('agcas_member');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const organizationInfo = useMemo(() => {
    const stored = sessionStorage.getItem('agcas_organization');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const { data: memberRole, isLoading: isRoleLoading } = useQuery({
    queryKey: ['memberRole', memberInfo?.role_id],
    enabled: !!(memberInfo && memberInfo.role_id),
    staleTime: Infinity,
    queryFn: async () => {
      if (!memberInfo || !memberInfo.role_id) return null;
      try {
        const data = await base44.entities.Role.get(memberInfo.role_id);
        return data || null;
      } catch (error) {
        console.error('Error loading memberRole:', error);
        return null;
      }
    },
  });

  const isAdmin = memberRole?.is_admin === true;

  const isFeatureExcluded = (featureId) => {
    if (!memberInfo || !featureId) return false;
    const roleExclusions = memberRole?.excluded_features || [];
    const memberExclusions = memberInfo.member_excluded_features || [];
    return roleExclusions.includes(featureId) || memberExclusions.includes(featureId);
  };

  const reloadMemberInfo = async () => {
    if (!memberInfo?.id) return;
    try {
      const updatedMember = await base44.entities.Member.get(memberInfo.id);
      if (updatedMember) {
        sessionStorage.setItem('agcas_member', JSON.stringify(updatedMember));
      }
    } catch (error) {
      console.error('Error reloading member info:', error);
    }
  };

  const refreshOrganizationInfo = async () => {
    if (!organizationInfo?.id) return;
    try {
      const updatedOrg = await base44.entities.Organization.get(organizationInfo.id);
      if (updatedOrg) {
        sessionStorage.setItem('agcas_organization', JSON.stringify(updatedOrg));
      }
    } catch (error) {
      console.error('Error refreshing organization info:', error);
    }
  };

  const isAccessReady = memberInfo !== null && (!memberInfo.role_id || memberRole !== undefined);

  return {
    memberInfo,
    organizationInfo,
    memberRole,
    isAdmin,
    isFeatureExcluded,
    isRoleLoading,
    isAccessReady,
    reloadMemberInfo,
    refreshOrganizationInfo,
  };
}
