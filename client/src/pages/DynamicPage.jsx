import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PublicLayout from "../components/layouts/PublicLayout";
import IEditElementRenderer from "../components/iedit/IEditElementRenderer";

export default function DynamicPage() {
  const [pageSlug, setPageSlug] = useState(null);

  // Extract slug from URL path
  useEffect(() => {
    const path = window.location.pathname;
    // Remove leading slash to get the slug
    const slug = path.startsWith('/') ? path.substring(1) : path;
    setPageSlug(slug);
  }, []);

  // Fetch page by slug
  const { data: page, isLoading: pageLoading, error: pageError } = useQuery({
    queryKey: ['iedit-public-page', pageSlug],
    queryFn: async () => {
      const allPages = await base44.entities.IEditPage.filter({ 
        slug: pageSlug,
        status: 'published'
      });
      return allPages[0];
    },
    enabled: !!pageSlug
  });

  // Fetch page elements
  const { data: elements, isLoading: elementsLoading } = useQuery({
    queryKey: ['iedit-public-elements', page?.id],
    queryFn: () => base44.entities.IEditPageElement.filter({ 
      page_id: page.id 
    }, 'display_order'),
    initialData: [],
    enabled: !!page?.id
  });

  // Set page title and meta description
  useEffect(() => {
    if (page) {
      document.title = page.meta_title || page.title || 'AGCAS';
      
      // Set meta description if provided
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

  if (pageLoading || elementsLoading) {
    return (
      <PublicLayout currentPageName="DynamicPage">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-slate-600">Loading page...</div>
        </div>
      </PublicLayout>
    );
  }

  if (pageError || !page) {
    return (
      <PublicLayout currentPageName="DynamicPage">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Page Not Found</h1>
            <p className="text-slate-600 mb-2">
              The page you're looking for doesn't exist or hasn't been published yet.
            </p>
            <p className="text-sm text-slate-500">
              (Looking for: "/{pageSlug}")
            </p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Determine which layout to use
  const LayoutComponent = page.layout_type === 'member' 
    ? ({ children }) => <div className="min-h-screen">{children}</div>
    : PublicLayout;

  return (
    <LayoutComponent currentPageName="DynamicPage">
      <div className="w-full">
        {/* Render each element */}
        {elements.map((element) => (
          <IEditElementRenderer
            key={element.id}
            element={element}
          />
        ))}
        
        {/* Empty state */}
        {elements.length === 0 && (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-600">This page has no content yet.</p>
            </div>
          </div>
        )}
      </div>
    </LayoutComponent>
  );
}