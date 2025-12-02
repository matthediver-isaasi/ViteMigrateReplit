import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import IEditElementRenderer from "../components/iedit/IEditElementRenderer";
import Events from "./Events";

export default function HomePageRedirect() {
  const { data: homePageSlug, isLoading: settingsLoading } = useQuery({
    queryKey: ['home-page-setting'],
    queryFn: async () => {
      const settings = await base44.entities.SystemSettings.list();
      const homeSetting = settings.find(s => s.setting_key === 'public_home_page_slug');
      return homeSetting?.setting_value || null;
    },
    staleTime: 60000
  });

  const { data: page, isLoading: pageLoading } = useQuery({
    queryKey: ['home-page-content', homePageSlug],
    queryFn: async () => {
      if (!homePageSlug) return null;
      const pages = await base44.entities.IEditPage.list({ 
        filter: { slug: homePageSlug }
      });
      return pages[0] || null;
    },
    enabled: !!homePageSlug,
    staleTime: 0
  });

  const { data: elements = [], isLoading: elementsLoading } = useQuery({
    queryKey: ['home-page-elements', page?.id],
    queryFn: () => base44.entities.IEditPageElement.list({ 
      filter: { page_id: page.id },
      sort: { display_order: 'asc' }
    }),
    enabled: !!page?.id,
    staleTime: 0
  });

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!homePageSlug || !page) {
    return <Events />;
  }

  if (page.status !== 'published') {
    return <Events />;
  }

  if (pageLoading || elementsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-600">Loading...</div>
      </div>
    );
  }

  const sortedElements = [...elements].sort((a, b) => 
    (a.display_order || 0) - (b.display_order || 0)
  );

  return (
    <div className="iedit-page-container">
      {sortedElements.map((element) => (
        <IEditElementRenderer
          key={element.id}
          element={element}
          isPreview={false}
        />
      ))}
    </div>
  );
}
