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

export function useNavigationRealtime(onChangeCallback) {
  const callbackRef = useRef(onChangeCallback);
  callbackRef.current = onChangeCallback;

  useEffect(() => {
    const supabaseClient = getSupabaseClient();
    
    if (!supabaseClient) {
      console.log('[useNavigationRealtime] Supabase not configured, skipping realtime subscription');
      return;
    }

    console.log('[useNavigationRealtime] Setting up realtime subscription for navigation_item table');

    const channelName = 'navigation-changes-' + Math.random().toString(36).substr(2, 9);
    const channel = supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'navigation_item'
        },
        (payload) => {
          console.log('[useNavigationRealtime] Navigation change detected:', payload.eventType, payload.new?.id || payload.old?.id);
          
          if (callbackRef.current) {
            callbackRef.current();
          }
        }
      )
      .subscribe((status) => {
        console.log('[useNavigationRealtime] Subscription status:', status);
      });

    return () => {
      console.log('[useNavigationRealtime] Cleaning up realtime subscription');
      supabaseClient.removeChannel(channel);
    };
  }, []);
}

export function usePortalMenuRealtime(queryKeys = ['portal-menu']) {
  const queryClient = useQueryClient();
  const keysRef = useRef(queryKeys);
  keysRef.current = queryKeys;

  useEffect(() => {
    const supabaseClient = getSupabaseClient();
    
    if (!supabaseClient) {
      console.log('[usePortalMenuRealtime] Supabase not configured, skipping realtime subscription');
      return;
    }

    console.log('[usePortalMenuRealtime] Setting up realtime subscription for portal_menu table');

    const channelName = 'portal-menu-changes-' + Math.random().toString(36).substr(2, 9);
    const channel = supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portal_menu'
        },
        (payload) => {
          console.log('[usePortalMenuRealtime] Portal menu change detected:', payload.eventType, payload.new?.id || payload.old?.id);
          
          keysRef.current.forEach(key => {
            queryClient.invalidateQueries({ queryKey: [key] });
          });
        }
      )
      .subscribe((status) => {
        console.log('[usePortalMenuRealtime] Subscription status:', status);
      });

    return () => {
      console.log('[usePortalMenuRealtime] Cleaning up realtime subscription');
      supabaseClient.removeChannel(channel);
    };
  }, [queryClient]);
}
