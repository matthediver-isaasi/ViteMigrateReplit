import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

export function useArticleCommentRealtime(articleId) {
  const queryClient = useQueryClient();
  const articleIdRef = useRef(articleId);
  articleIdRef.current = articleId;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('[useArticleCommentRealtime] Supabase not configured, skipping realtime subscription');
      return;
    }

    if (!articleId) {
      console.log('[useArticleCommentRealtime] No articleId provided, skipping subscription');
      return;
    }

    console.log('[useArticleCommentRealtime] Setting up realtime subscription for article_comment table, articleId:', articleId);

    const channelName = 'article-comment-changes-' + articleId + '-' + Math.random().toString(36).substr(2, 9);
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'article_comment',
          filter: `article_id=eq.${articleId}`
        },
        (payload) => {
          console.log('[useArticleCommentRealtime] Comment change detected:', payload.eventType, payload.new?.id || payload.old?.id);
          
          queryClient.invalidateQueries({ queryKey: ['article-comments', articleIdRef.current] });
        }
      )
      .subscribe((status) => {
        console.log('[useArticleCommentRealtime] Subscription status:', status);
      });

    return () => {
      console.log('[useArticleCommentRealtime] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, articleId]);
}
