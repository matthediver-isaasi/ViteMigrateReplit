import { createContext, useContext, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

function slugify(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

const ArticleUrlContext = createContext({
  displayName: 'Articles',
  articleDisplayName: 'Articles',
  urlSlug: 'Articles',
  viewSlug: 'ArticleView',
  editorSlug: 'ArticleEditor',
  mySlug: 'MyArticles',
  publicSlug: 'PublicArticles',
  isLoading: true,
  isCustomSlug: false,
  getArticleListUrl: () => createPageUrl('Articles'),
  getArticleViewUrl: (articleSlug) => `${createPageUrl('ArticleView')}?slug=${articleSlug}`,
  getArticleEditorUrl: (articleId) => articleId ? `${createPageUrl('ArticleEditor')}?id=${articleId}` : createPageUrl('ArticleEditor'),
  getMyArticlesUrl: () => createPageUrl('MyArticles'),
  getPublicArticlesUrl: () => createPageUrl('PublicArticles')
});

export function ArticleUrlProvider({ children }) {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['article-url-settings'],
    queryFn: async () => {
      try {
        const allSettings = await base44.entities.SystemSettings.list();
        const setting = allSettings.find(s => s.setting_key === 'article_display_name');
        return setting?.setting_value || 'Articles';
      } catch (error) {
        console.error('Error loading article display name:', error);
        return 'Articles';
      }
    },
    staleTime: 5000, // Short stale time to pick up settings changes quickly
    refetchOnWindowFocus: true // Refetch when user returns to tab
  });

  const value = useMemo(() => {
    const displayName = settings || 'Articles';
    const baseSlug = slugify(displayName);
    const isCustomSlug = displayName.toLowerCase() !== 'articles' && baseSlug !== 'articles';
    
    // For custom slugs, use lowercase dynamic routes
    // For default, use canonical createPageUrl routes that match static route definitions
    const urlSlug = isCustomSlug ? baseSlug : 'Articles';
    const viewSlug = isCustomSlug ? `${baseSlug}view` : 'ArticleView';
    const editorSlug = isCustomSlug ? `${baseSlug}editor` : 'ArticleEditor';
    const mySlug = isCustomSlug ? `my${baseSlug}` : 'MyArticles';
    const publicSlug = isCustomSlug ? `public${baseSlug}` : 'PublicArticles';

    return {
      displayName,
      articleDisplayName: displayName,
      urlSlug,
      viewSlug,
      editorSlug,
      mySlug,
      publicSlug,
      isLoading,
      isCustomSlug,
      getArticleListUrl: () => isCustomSlug ? `/${urlSlug}` : createPageUrl('Articles'),
      getArticleViewUrl: (articleSlug) => isCustomSlug 
        ? `/${viewSlug}?slug=${articleSlug}` 
        : `${createPageUrl('ArticleView')}?slug=${articleSlug}`,
      getArticleEditorUrl: (articleId) => isCustomSlug
        ? (articleId ? `/${editorSlug}?id=${articleId}` : `/${editorSlug}`)
        : (articleId ? `${createPageUrl('ArticleEditor')}?id=${articleId}` : createPageUrl('ArticleEditor')),
      getMyArticlesUrl: () => isCustomSlug ? `/${mySlug}` : createPageUrl('MyArticles'),
      getPublicArticlesUrl: () => isCustomSlug ? `/${publicSlug}` : createPageUrl('PublicArticles')
    };
  }, [settings, isLoading]);

  return (
    <ArticleUrlContext.Provider value={value}>
      {children}
    </ArticleUrlContext.Provider>
  );
}

export function useArticleUrl() {
  return useContext(ArticleUrlContext);
}
