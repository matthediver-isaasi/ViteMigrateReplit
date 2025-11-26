import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient = null;
if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export function useResourceRealtime(queryKeys = ['resources', 'public-resources', 'admin-resources']) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabaseClient) {
      console.log('[useResourceRealtime] Supabase not configured, skipping realtime subscription');
      return;
    }

    console.log('[useResourceRealtime] Setting up realtime subscription for resource table');

    const channel = supabaseClient
      .channel('resource-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resource'
        },
        (payload) => {
          console.log('[useResourceRealtime] Resource change detected:', payload.eventType, payload.new?.id || payload.old?.id);
          
          queryKeys.forEach(key => {
            queryClient.invalidateQueries({ queryKey: [key] });
          });
        }
      )
      .subscribe((status) => {
        console.log('[useResourceRealtime] Subscription status:', status);
      });

    return () => {
      console.log('[useResourceRealtime] Cleaning up realtime subscription');
      supabaseClient.removeChannel(channel);
    };
  }, [queryClient, queryKeys.join(',')]);
}
