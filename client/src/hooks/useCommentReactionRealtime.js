import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/api/supabaseClient';

export function useCommentReactionRealtime(articleId, userIdentifier) {
  const queryClient = useQueryClient();
  const articleIdRef = useRef(articleId);
  const userIdentifierRef = useRef(userIdentifier);
  articleIdRef.current = articleId;
  userIdentifierRef.current = userIdentifier;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('[useCommentReactionRealtime] Supabase not configured, skipping realtime subscription');
      return;
    }

    if (!articleId) {
      console.log('[useCommentReactionRealtime] No articleId provided, skipping subscription');
      return;
    }

    console.log('[useCommentReactionRealtime] Setting up realtime subscription for comment_reaction table');

    const channelName = 'comment-reaction-changes-' + articleId + '-' + Math.random().toString(36).substr(2, 9);
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_reaction'
        },
        (payload) => {
          console.log('[useCommentReactionRealtime] Reaction change detected:', payload.eventType, payload.new?.id || payload.old?.id);
          
          queryClient.invalidateQueries({ queryKey: ['article-comments', articleIdRef.current] });
          if (userIdentifierRef.current) {
            queryClient.invalidateQueries({ queryKey: ['user-reactions', userIdentifierRef.current] });
          }
        }
      )
      .subscribe((status) => {
        console.log('[useCommentReactionRealtime] Subscription status:', status);
      });

    return () => {
      console.log('[useCommentReactionRealtime] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient, articleId]);
}
