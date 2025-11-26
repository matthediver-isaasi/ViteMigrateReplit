import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let sharedSupabaseClient = null;
function getSupabaseClient() {
  if (!sharedSupabaseClient && supabaseUrl && supabaseAnonKey) {
    sharedSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      }
    });
  }
  return sharedSupabaseClient;
}

export function useResourceRealtime(queryKeys = ['resources', 'public-resources', 'admin-resources']) {
  const queryClient = useQueryClient();
  const keysRef = useRef(queryKeys);
  keysRef.current = queryKeys;

  useEffect(() => {
    const supabaseClient = getSupabaseClient();
    
    if (!supabaseClient) {
      console.log('[useResourceRealtime] Supabase not configured, skipping realtime subscription');
      return;
    }

    console.log('[useResourceRealtime] Setting up realtime subscription for resource table');

    const channelName = 'resource-changes-' + Math.random().toString(36).substr(2, 9);
    const channel = supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resource'
        },
        (payload) => {
          console.log('[useResourceRealtime] Resource change detected:', payload.eventType, payload.new?.id || payload.old?.id);
          
          keysRef.current.forEach(key => {
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
  }, [queryClient]);
}
