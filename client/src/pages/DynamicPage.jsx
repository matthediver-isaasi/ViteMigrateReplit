import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PublicLayout from "../components/layouts/PublicLayout";
import IEditElementRenderer from "../components/iedit/IEditElementRenderer";
import { useMemberAccess } from "@/hooks/useMemberAccess";

export default function DynamicPage() {
  const { slug } = useParams();
  const { memberInfo, isAccessReady } = useMemberAccess();

  // Fetch page by slug (regardless of status - we check permissions separately)
  const { data: page, isLoading: pageLoading, error: pageError } = useQuery({
    queryKey: ['iedit-dynamic-page', slug],
    queryFn: async () => {
      const pages = await base44.entities.IEditPage.list({ 
        filter: { slug: slug }
      });
      return pages[0] || null;
    },
    enabled: !!slug,
    staleTime: 0
  });

  // Fetch page elements when page is loaded
  const { data: elements = [], isLoading: elementsLoading } = useQuery({
    queryKey: ['iedit-dynamic-elements', page?.id],
    queryFn: () => base44.entities.IEditPageElement.list({ 
      filter: { page_id: page.id },
      sort: { display_order: 'asc' }
    }),
    enabled: !!page?.id,
    staleTime: 0
  });

  // Set page title and meta description
  useEffect(() => {
    if (page) {
      document.title = page.meta_title || page.title || 'AGCAS';
      
      if (page.meta_description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.content = page.meta_description;
      }
    }
  }, [page]);

  // Check if page is accessible
  const isPublished = page?.status === 'published';
  const layoutType = page?.layout_type || 'public';
  const isMemberPage = layoutType === 'member';
  const isHybridPage = layoutType === 'hybrid';
  const isLoggedIn = !!memberInfo;

  // Show loading while fetching page data
  if (pageLoading || elementsLoading) {
    return (
      <PublicLayout currentPageName={slug}>
        <div className="min-h-screen flex items-center justify-center" data-testid="loading-dynamic-page">
          <div className="text-slate-600">Loading page...</div>
        </div>
      </PublicLayout>
    );
  }

  // Page doesn't exist - show 404 (catch-all route means we can't fall through)
  if (!page) {
    return (
      <PublicLayout currentPageName={slug}>
        <div className="min-h-screen flex items-center justify-center" data-testid="page-not-found">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-slate-300 mb-4">404</h1>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
            <p className="text-slate-600 mb-6">
              The page you're looking for doesn't exist.
            </p>
            <a 
              href="/" 
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="link-home"
            >
              Go Home
            </a>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Page exists but not published
  if (!isPublished) {
    return (
      <PublicLayout currentPageName={slug}>
        <div className="min-h-screen flex items-center justify-center" data-testid="page-not-published">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Page Not Available</h1>
            <p className="text-slate-600">
              This page is currently in draft mode and not publicly accessible.
            </p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // For member pages, wait for access to be ready before showing member-only gate
  if (isMemberPage && !isAccessReady) {
    return (
      <PublicLayout currentPageName={slug}>
        <div className="min-h-screen flex items-center justify-center" data-testid="loading-access-check">
          <div className="text-slate-600">Checking access...</div>
        </div>
      </PublicLayout>
    );
  }

  // Member page but user not logged in (only check after access is ready)
  if (isMemberPage && !isLoggedIn) {
    return (
      <PublicLayout currentPageName={slug}>
        <div className="min-h-screen flex items-center justify-center" data-testid="page-requires-login">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Members Only</h1>
            <p className="text-slate-600 mb-6">
              This page is only accessible to logged-in members.
            </p>
            <a 
              href="/Home" 
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="link-login"
            >
              Log In
            </a>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Render the page with appropriate layout
  // Member pages use a simple wrapper (Layout provides the sidebar)
  // Public pages use PublicLayout (header/footer)
  // Hybrid pages: logged-in users see portal layout, guests see public layout
  const usePortalLayout = isMemberPage || (isHybridPage && isLoggedIn);
  const LayoutComponent = usePortalLayout
    ? ({ children }) => <div className="min-h-screen">{children}</div>
    : PublicLayout;

  return (
    <LayoutComponent currentPageName={slug}>
      <div className="w-full" data-testid={`dynamic-page-${slug}`}>
        {elements.map((element) => (
          <IEditElementRenderer
            key={element.id}
            element={element}
          />
        ))}
        
        {elements.length === 0 && (
          <div className="min-h-screen flex items-center justify-center" data-testid="page-no-content">
            <div className="text-center">
              <p className="text-slate-600">This page has no content yet.</p>
            </div>
          </div>
        )}
      </div>
    </LayoutComponent>
  );
}
