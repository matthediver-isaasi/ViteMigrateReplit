import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Mail, MapPin, Phone, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PublicHeader from "./PublicHeader";
import PageBannerDisplay from "../banners/PageBannerDisplay";
import PortalHeroBanner from "../banners/PortalHeroBanner";
import FloaterDisplay from "../floaters/FloaterDisplay";
import { useArticleUrl } from "@/contexts/ArticleUrlContext";

// Map page names to portal page identifiers for banner matching
// These identifiers must match the PORTAL_PAGES values in PageBannerManagement.jsx
// Note: Public versions of pages (e.g., PublicArticles, PublicResources) should map to the same identifier
const pageToPortalPageMap = {
  'Events': 'portal_events',
  'PublicEvents': 'portal_events',
  'Bookings': 'portal_bookings',
  'MyTickets': 'portal_my_tickets',
  'BuyProgramTickets': 'portal_buy_tickets',
  'MemberDirectory': 'portal_member_directory',
  'OrganisationDirectory': 'portal_org_directory',
  'Resources': 'portal_resources',
  'PublicResources': 'portal_resources',
  'Articles': 'portal_articles',
  'PublicArticles': 'portal_articles',
  'MyArticles': 'portal_my_articles',
  'Team': 'portal_team',
  'Balances': 'portal_balances',
  'History': 'portal_history',
  'Profile': 'portal_profile',
  'JobBoard': 'portal_job_board',
  'PublicJobBoard': 'portal_job_board',
  'News': 'portal_news',
  'PublicNews': 'portal_news',
  'NewsView': 'portal_news_view',
  'MyJobPostings': 'portal_my_job_postings',
  'Preferences': 'portal_preferences',
  'Support': 'portal_support',
  'Dashboard': 'portal_dashboard'
};

export default function PublicLayout({ children, currentPageName }) {
  const { getPublicArticlesUrl, articleDisplayName, urlSlug, publicSlug, isCustomSlug, isLoading: articleUrlLoading } = useArticleUrl();
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [showNewsletterDialog, setShowNewsletterDialog] = useState(false);

  // Resolve page name to portal page ID, accounting for dynamic article URL remapping
  const resolvePortalPageId = (pageName) => {
    // First check static map
    if (pageToPortalPageMap[pageName]) {
      return pageToPortalPageMap[pageName];
    }
    
    // Handle dynamic article slugs - if articles are renamed (e.g., to "Blog"),
    // the URLs change but banners are still associated with portal_articles
    // Check both when isCustomSlug is true AND by matching common article-related patterns
    const lowerPageName = pageName?.toLowerCase() || '';
    const lowerUrlSlug = urlSlug?.toLowerCase() || '';
    const lowerPublicSlug = publicSlug?.toLowerCase() || '';
    
    // Check if this page matches the custom article slugs or common article patterns
    if (lowerPageName === lowerUrlSlug || 
        lowerPageName === lowerPublicSlug ||
        lowerPageName === 'articles' ||
        lowerPageName === 'publicarticles' ||
        // Also check for blog-related patterns as common renames
        lowerPageName === 'blog' ||
        lowerPageName === 'publicblog' ||
        lowerPageName === 'blogs' ||
        lowerPageName === 'publicblogs') {
      return 'portal_articles';
    }
    
    return null;
  };

  // Fetch banners for current page - wait for article URL context to load first
  useEffect(() => {
    const fetchBanners = async () => {
      // Wait for article URL context to finish loading before resolving page IDs
      if (articleUrlLoading) {
        return;
      }
      
      if (!currentPageName) {
        setLoadingBanners(false);
        return;
      }

      try {
        const allBanners = await base44.entities.PageBanner.filter({
          is_active: true
        });
        
        // Get the portal page identifier for this page (handles dynamic article slugs)
        const portalPageId = resolvePortalPageId(currentPageName);
        
        console.log('[PublicLayout] Fetching banners for page:', currentPageName, 'portalPageId:', portalPageId, 'isCustomSlug:', isCustomSlug, 'urlSlug:', urlSlug);
        console.log('[PublicLayout] All banners found:', allBanners?.length);
        
        // Filter banners that include this page (check both portal ID and page name for compatibility)
        const pageBanners = allBanners
          .filter(banner => {
            if (!banner.associated_pages) return false;
            const matches = banner.associated_pages.includes(portalPageId) || 
                   banner.associated_pages.includes(currentPageName);
            if (matches) {
              console.log('[PublicLayout] Matched banner:', banner.name, banner.associated_pages);
            }
            return matches;
          })
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        
        console.log('[PublicLayout] Matched banners:', pageBanners.length);
        setBanners(pageBanners);
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      } finally {
        setLoadingBanners(false);
      }
    };

    fetchBanners();
  }, [currentPageName, isCustomSlug, urlSlug, publicSlug, articleUrlLoading]);

  return (
    <>
      <div className="flex flex-col min-h-screen" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {/* Google Fonts - Poppins */}
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');

            @font-face {
              font-family: 'Degular Medium';
              src: url('https://teeone.pythonanywhere.com/font-assets/Degular-Medium.woff') format('woff');
              font-weight: 500;
              font-style: normal;
              font-display: swap;
            }
            
            h1 {
              font-family: 'Degular Medium', 'Poppins', sans-serif;
            }
            
            .nav-link:hover {
              color: #5C0085 !important;
            }
          `}
        </style>

        {/* Public Header - Now using dedicated component */}
        <PublicHeader />

        {/* Page Banners - Displayed between header and main content */}
        {/* Use PortalHeroBanner to support both regular banners and hero content */}
        {!loadingBanners && banners.length > 0 && (
          <div className="w-full">
            {banners.map((banner) => (
              <PortalHeroBanner key={banner.id} banner={banner} />
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1">
          {children}
        </main>

        {/* Public Footer */}
        <footer className="bg-slate-900 text-white">
          {/* Gradient Bar */}
          <div 
            className="w-full"
            style={{ 
              height: '5px',
              background: 'linear-gradient(to right, #5C0085, #BA0087, #EE00C3, #FF4229, #FFB000)'
            }}
          />
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-3 gap-12">
              
              {/* Left Column - Become a Member */}
              <div className="flex flex-col justify-start">
                <h2 
                  className="text-3xl text-white mb-8"
                  style={{ fontFamily: "'Degular Medium', sans-serif" }}
                >
                  Become a member today
                </h2>
                <Link to={createPageUrl('PublicJoinUs')}>
                  <Button 
                    className="text-white font-bold hover:opacity-90 transition-opacity px-6 py-5 rounded-none" 
                    style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      background: 'linear-gradient(to top right, #5C0085, #BA0087, #EE00C3, #FF4229, #FFB000)'
                    }}
                  >
                    Join Us
                    <ArrowUpRight className="ml-0.5 w-5 h-5" strokeWidth={2.5} />
                  </Button>
                </Link>
              </div>

              {/* Middle Column - Address & Contact */}
              <div className="space-y-8">
                {/* Address Section */}
                <div>
                  <h4 
                    className="text-white text-sm mb-3"
                    style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '5px'
                    }}
                  >
                    ADDRESS
                  </h4>
                  <div 
                    className="mb-4"
                    style={{ 
                      width: '36px', 
                      height: '2px', 
                      backgroundColor: 'rgba(255,255,255,0.5)' 
                    }}
                  />
                  <div className="text-slate-300 text-sm leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <p>Graduate Futures Institute</p>
                    <p>1st Floor, Velocity Tower</p>
                    <p>10 St Mary's Gate</p>
                    <p>Sheffield S1 4LR</p>
                    <p>United Kingdom</p>
                  </div>
                </div>

                {/* Contact Section */}
                <div>
                  <h4 
                    className="text-white text-sm mb-3"
                    style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '5px'
                    }}
                  >
                    CONTACT US
                  </h4>
                  <div 
                    className="mb-4"
                    style={{ 
                      width: '36px', 
                      height: '2px', 
                      backgroundColor: 'rgba(255,255,255,0.5)' 
                    }}
                  />
                  <ul className="space-y-3 text-sm text-slate-300" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <li className="flex items-center gap-3">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>+44 (0)114 251 5750</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>info@graduatefutures.org.uk</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column - Logo & Social */}
              <div className="flex flex-col items-center md:items-end">
                {/* Logo */}
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68efc20f3e0a30fafad6dde7/26710cf5a_GFIheaderlogo.png"
                  alt="Graduate Futures Institute"
                  className="h-20 object-contain mb-8"
                />
                
                {/* Follow Us Section */}
                <div className="text-center md:text-right">
                  <h4 
                    className="text-white text-sm mb-3"
                    style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '5px'
                    }}
                  >
                    FOLLOW US
                  </h4>
                  <div 
                    className="mb-4 ml-auto"
                    style={{ 
                      width: '36px', 
                      height: '2px', 
                      backgroundColor: 'rgba(255,255,255,0.5)' 
                    }}
                  />
                  
                  {/* Social Icons */}
                  <div className="flex gap-4 justify-center md:justify-end">
                    {/* LinkedIn */}
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                    
                    {/* Instagram */}
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                    
                    {/* YouTube */}
                    <a
                      href="https://youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-800 mt-12 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-slate-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  © {new Date().getFullYear()} Graduate Futures Institute. All rights reserved.
                </p>
                <div className="flex gap-6 text-sm text-slate-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-white transition-colors">Accessibility</a>
                </div>
              </div>
              
              {/* Powered by isaasi */}
              <div className="text-center mt-6">
                <a
                  href="https://isaasi.co.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block hover:opacity-80 transition-opacity"
                >
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68efc20f3e0a30fafad6dde7/fe03f7c5e_linked-aa.png"
                    alt="isaasi"
                    className="w-[40px] mx-auto mb-2"
                  />
                </a>
                <p className="text-xs text-slate-500">
                  <span style={{ color: '#eb008c' }}>i</span>Connect by{' '}
                  <a
                    href="https://isaasi.co.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity"
                    style={{ color: '#eb008c' }}
                  >
                    isaasi
                  </a>
                </p>
              </div>
            </div>
          </div>
        </footer>

        {/* Floater Display for Public Pages */}
        <FloaterDisplay location="public" />
      </div>

      {/* Newsletter Dialog */}
      <Dialog open={showNewsletterDialog} onOpenChange={setShowNewsletterDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl">Subscribe to Our Newsletter</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-slate-600">
              Stay up to date with the latest news, events, and resources from Graduate Futures. 
              Join our community and never miss an important update!
            </p>
            
            {/* Zoho Form Iframe */}
            <div className="w-full" style={{ minHeight: '500px' }}>
              <iframe
                src="https://forms.zohopublic.eu/isaasiagcas1/form/Newsletter/formperma/VRkTs4kbQec4LDCN5z0pRWyTRH7HGIqxhDx-dT35YTI"
                width="100%"
                height="600"
                frameBorder="0"
                marginHeight="0"
                marginWidth="0"
                title="Newsletter Signup Form"
                className="rounded-lg"
              >
                Loading newsletter form...
              </iframe>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}