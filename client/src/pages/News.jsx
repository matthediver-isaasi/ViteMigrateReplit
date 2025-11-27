import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import ArticleFilter from "../components/blog/ArticleFilter";
import NewsCard from "../components/news/NewsCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemberAccess } from "@/hooks/useMemberAccess";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function NewsPage() {
  const { memberInfo, isFeatureExcluded, isAdmin } = useMemberAccess();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);

  const queryClient = useQueryClient();

  const canEditNews = isAdmin && !isFeatureExcluded('action_news_edit');
  const canDeleteNews = isAdmin && !isFeatureExcluded('action_news_delete');

  // Fetch current user's preferences
  const { data: currentMember } = useQuery({
    queryKey: ['current-member', memberInfo?.email],
    queryFn: async () => {
      const allMembers = await base44.entities.Member.list();
      return allMembers.find(m => m.email === memberInfo?.email);
    },
    enabled: !!memberInfo
  });

  // Fetch published news
  const { data: news = [], isLoading: newsLoading } = useQuery({
    queryKey: ['published-news'],
    queryFn: async () => {
      const allNews = await base44.entities.NewsPost.list('-published_date');
      const now = new Date();
      return allNews.filter(n => 
        n.status === 'published' && 
        (!n.published_date || new Date(n.published_date) <= now)
      );
    },
    staleTime: 0, // Always fetch fresh content for news feed
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['resourceCategories'],
    queryFn: async () => {
      const cats = await base44.entities.ResourceCategory.list();
      return cats
        .filter(c => c.is_active && c.applies_to_content_types?.includes("News"))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    },
    refetchOnWindowFocus: true
  });

  // Fetch button styles
  const { data: buttonStyles = [] } = useQuery({
    queryKey: ['article-button-styles'],
    queryFn: async () => {
      const allStyles = await base44.entities.ButtonStyle.list();
      return allStyles.filter(s => s.is_active && s.card_type === 'article');
    },
    refetchOnWindowFocus: true
  });

  // Load saved preferences
  useEffect(() => {
    if (currentMember?.news_filter_preferences && !preferencesLoaded) {
      const prefs = currentMember.news_filter_preferences;
      if (prefs.selectedSubcategories) setSelectedSubcategories(prefs.selectedSubcategories);
      if (prefs.sortBy) setSortBy(prefs.sortBy);
      if (prefs.itemsPerPage) setItemsPerPage(prefs.itemsPerPage);
      setPreferencesLoaded(true);
    }
  }, [currentMember, preferencesLoaded]);

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async () => {
      if (!currentMember) return;
      
      const preferences = {
        selectedSubcategories,
        sortBy,
        itemsPerPage
      };

      await base44.entities.Member.update(currentMember.id, {
        news_filter_preferences: preferences
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-member'] });
    }
  });

  // Delete news mutation
  const deleteNewsMutation = useMutation({
    mutationFn: async (newsId) => {
      await base44.entities.NewsPost.delete(newsId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['published-news'] });
      setDeleteDialogOpen(false);
      setNewsToDelete(null);
      toast.success('News article deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete news article: ' + error.message);
    }
  });

  const handleEditNews = (article) => {
    window.location.href = `${createPageUrl('NewsEditor')}?id=${article.id}`;
  };

  const handleDeleteNews = (article) => {
    setNewsToDelete(article);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (newsToDelete) {
      deleteNewsMutation.mutate(newsToDelete.id);
    }
  };

  // Filter news
  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesSubcategory = selectedSubcategories.length === 0 || 
        (item.subcategories && item.subcategories.some(sub => selectedSubcategories.includes(sub)));
      
      return matchesSearch && matchesSubcategory;
    });
  }, [news, searchQuery, selectedSubcategories]);

  // Sort news
  const sortedNews = useMemo(() => {
    const sorted = [...filteredNews];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.published_date || b.created_date) - new Date(a.published_date || a.created_date));
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.published_date || a.created_date) - new Date(b.published_date || b.created_date));
        break;
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }
    return sorted;
  }, [filteredNews, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNews = sortedNews.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 7;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleSubcategoryToggle = (subcategory) => {
    setSelectedSubcategories(prev => {
      if (prev.includes(subcategory)) {
        return prev.filter(s => s !== subcategory);
      } else {
        return [...prev, subcategory];
      }
    });
  };

  const handleSavePreferences = () => {
    savePreferencesMutation.mutate();
  };

  const isLoading = newsLoading || categoriesLoading;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSubcategories, sortBy, itemsPerPage]);

  const hasUnsavedChanges = useMemo(() => {
    if (!currentMember?.news_filter_preferences) return false;
    const saved = currentMember.news_filter_preferences;
    return JSON.stringify({
      selectedSubcategories,
      sortBy,
      itemsPerPage
    }) !== JSON.stringify({
      selectedSubcategories: saved.selectedSubcategories || [],
      sortBy: saved.sortBy || 'newest',
      itemsPerPage: saved.itemsPerPage || 12
    });
  }, [currentMember, selectedSubcategories, sortBy, itemsPerPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">News</h1>
          <p className="text-slate-600">Stay updated with our latest news</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-8">
              <ArticleFilter
                categories={categories}
                selectedSubcategories={selectedSubcategories}
                onSubcategoryToggle={handleSubcategoryToggle}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClearSearch={() => setSearchQuery("")}
              />
              
              {hasUnsavedChanges && (
                <Button
                  onClick={handleSavePreferences}
                  disabled={savePreferencesMutation.isPending}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {savePreferencesMutation.isPending ? 'Saving...' : 'Save as Default'}
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse border-slate-200">
                    <div className="h-48 bg-slate-200" />
                    <div className="p-6">
                      <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-slate-200 rounded w-full" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : paginatedNews.length === 0 ? (
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <FileQuestion className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {searchQuery || selectedSubcategories.length > 0 ? 'No news found' : 'No news available'}
                  </h3>
                  <p className="text-slate-600">
                    {searchQuery || selectedSubcategories.length > 0
                      ? 'Try adjusting your search or filters'
                      : 'Check back soon for updates'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <div className="text-sm text-slate-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, sortedNews.length)} of {sortedNews.length} {sortedNews.length === 1 ? 'article' : 'articles'}
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={String(itemsPerPage)} onValueChange={(val) => setItemsPerPage(Number(val))}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 per page</SelectItem>
                        <SelectItem value="12">12 per page</SelectItem>
                        <SelectItem value="24">24 per page</SelectItem>
                        <SelectItem value="48">48 per page</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48">
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="title-asc">Title A-Z</SelectItem>
                        <SelectItem value="title-desc">Title Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedNews.map(item => (
                    <NewsCard 
                      key={item.id} 
                      article={item} 
                      buttonStyles={buttonStyles}
                      canEdit={canEditNews}
                      canDelete={canDeleteNews}
                      onEdit={handleEditNews}
                      onDelete={handleDeleteNews}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      
                      {getPageNumbers().map((page, idx) => (
                        page === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
                        ) : (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        )
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete News Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{newsToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteNewsMutation.isPending}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteNewsMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteNewsMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}