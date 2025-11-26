import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

export function useNavigationRealtime(onChangeCallback) {
  const callbackRef = useRef(onChangeCallback);
  callbackRef.current = onChangeCallback;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('[useNavigationRealtime] Supabase not configured, skipping realtime subscription');
      return;
    }

    console.log('[useNavigationRealtime] Setting up realtime subscription for navigation_item table');

    const channelName = 'navigation-changes-' + Math.random().toString(36).substr(2, 9);
    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, []);
}

export function usePortalMenuRealtime(queryKeys = ['portal-menu']) {
  const queryClient = useQueryClient();
  const keysRef = useRef(queryKeys);
  keysRef.current = queryKeys;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('[usePortalMenuRealtime] Supabase not configured, skipping realtime subscription');
      return;
    }

    console.log('[usePortalMenuRealtime] Setting up realtime subscription for portal_menu table');

    const channelName = 'portal-menu-changes-' + Math.random().toString(36).substr(2, 9);
    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
