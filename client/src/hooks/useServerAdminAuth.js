import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';

export function useServerAdminAuth(options = {}) {
  const { redirectOnDeny = true, redirectPath = 'Events' } = options;
  const [redirectTriggered, setRedirectTriggered] = useState(false);

  const { data: authData, isLoading, isError, error } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to verify authentication');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 30000, 
    refetchOnWindowFocus: false,
  });

  const isAuthenticated = !!authData && !!authData.id;
  const isAdmin = authData?.isAdmin === true;
  const isReady = !isLoading;
  const memberId = authData?.id || null;

  useEffect(() => {
    if (isReady && redirectOnDeny && !isAdmin && !redirectTriggered) {
      setRedirectTriggered(true);
      console.log('[useServerAdminAuth] Access denied - redirecting to:', redirectPath);
      window.location.href = createPageUrl(redirectPath);
    }
  }, [isReady, isAdmin, redirectOnDeny, redirectPath, redirectTriggered]);

  return {
    isAuthenticated,
    isAdmin,
    isReady,
    isLoading,
    isError,
    error,
    authData,
    memberId,
  };
}
