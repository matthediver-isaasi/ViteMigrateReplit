import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

export function useArticleReactionRealtime(articleId, userIdentifier) {
  const queryClient = useQueryClient();
  const articleIdRef = useRef(articleId);
  const userIdentifierRef = useRef(userIdentifier);
  articleIdRef.current = articleId;
  userIdentifierRef.current = userIdentifier;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('[useArticleReactionRealtime] Supabase not configured, skipping realtime subscription');
      return;
    }

    if (!articleId) {
      console.log('[useArticleReactionRealtime] No articleId provided, skipping subscription');
      return;
    }

    console.log('[useArticleReactionRealtime] Setting up realtime subscription for article_reaction table, articleId:', articleId);

    const channelName = 'article-reaction-changes-' + articleId + '-' + Math.random().toString(36).substr(2, 9);
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'article_reaction',
          filter: `article_id=eq.${articleId}`
        },
        (payload) => {
          console.log('[useArticleReactionRealtime] Reaction change detected:', payload.eventType, payload.new?.id || payload.old?.id);
          
          queryClient.invalidateQueries({ queryKey: ['article-reactions', articleIdRef.current] });
          if (userIdentifierRef.current) {
            queryClient.invalidateQueries({ queryKey: ['user-article-reaction', articleIdRef.current, userIdentifierRef.current] });
          }
        }
      )
      .subscribe((status) => {
        console.log('[useArticleReactionRealtime] Subscription status:', status);
      });

    return () => {
      console.log('[useArticleReactionRealtime] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, articleId]);
}
