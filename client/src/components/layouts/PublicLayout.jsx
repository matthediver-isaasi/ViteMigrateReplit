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
const pageToPortalPageMap = {
  'Events': 'portal_events',
  'Bookings': 'portal_bookings',
  'MyTickets': 'portal_my_tickets',
  'BuyProgramTickets': 'portal_buy_tickets',
  'MemberDirectory': 'portal_member_directory',
  'OrganisationDirectory': 'portal_org_directory',
  'Resources': 'portal_resources',
  'Articles': 'portal_articles',
  'MyArticles': 'portal_my_articles',
  'Team': 'portal_team',
  'Balances': 'portal_balances',
  'History': 'portal_history',
  'Profile': 'portal_profile',
  'JobBoard': 'portal_job_board',
  'News': 'portal_news',
  'MyJobPostings': 'portal_my_job_postings',
  'Preferences': 'portal_preferences',
  'Support': 'portal_support',
  'Dashboard': 'portal_dashboard'
};

export default function PublicLayout({ children, currentPageName }) {
  const { getPublicArticlesUrl, articleDisplayName } = useArticleUrl();
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [showNewsletterDialog, setShowNewsletterDialog] = useState(false);

  // Fetch banners for current page
  useEffect(() => {
    const fetchBanners = async () => {
      if (!currentPageName) {
        setLoadingBanners(false);
        return;
      }

      try {
        const allBanners = await base44.entities.PageBanner.filter({
          is_active: true
        });
        
        // Get the portal page identifier for this page
        const portalPageId = pageToPortalPageMap[currentPageName];
        
        console.log('[PublicLayout] Fetching banners for page:', currentPageName, 'portalPageId:', portalPageId);
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
  }, [currentPageName]);

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
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              {/* About Section */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68efc20f3e0a30fafad6dde7/6cfe73a57_agcasRoundall.jpg"
                    alt="AGCAS"
                    className="w-10 h-10 object-contain"
                  />
                  <h3 className="text-xl font-bold">AGCAS</h3>
                </div>
                <p className="text-slate-300 mb-4 text-sm">
                  The Association of Graduate Careers Advisory Services represents careers and employability services in higher education across the UK and Ireland.
                </p>
                
                {/* Newsletter Button */}
                <Button
                  onClick={() => setShowNewsletterDialog(true)}
                  className="text-white font-bold hover:opacity-90 transition-opacity px-6 py-5 rounded-none mt-4"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    background: 'linear-gradient(to top right, #5C0085, #BA0087, #EE00C3, #FF4229, #FFB000)'
                  }}
                >
                  Subscribe to Newsletter
                  <ArrowUpRight className="ml-0.5 w-5 h-5" strokeWidth={2.5} />
                </Button>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to={createPageUrl('PublicEvents')} className="text-slate-300 hover:text-white transition-colors">
                      Events
                    </Link>
                  </li>
                  <li>
                    <Link to={createPageUrl('PublicResources')} className="text-slate-300 hover:text-white transition-colors">
                      Resources
                    </Link>
                  </li>
                  <li>
                    <Link to={getPublicArticlesUrl()} className="text-slate-300 hover:text-white transition-colors">
                      {articleDisplayName}
                    </Link>
                  </li>
                  <li>
                    <Link to={createPageUrl('JobBoard')} className="text-slate-300 hover:text-white transition-colors">
                      Job Board
                    </Link>
                  </li>
                  <li>
                    <Link to={createPageUrl('PublicAbout')} className="text-slate-300 hover:text-white transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to={createPageUrl('PublicContact')} className="text-slate-300 hover:text-white transition-colors">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link to={createPageUrl('Home')} className="text-slate-300 hover:text-white transition-colors">
                      Member Login
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="font-semibold mb-4">Contact Us</h4>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>info@graduatefutures.org.uk</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Phone className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>+44 (0)114 251 5750</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Sheffield, United Kingdom</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-slate-800 mt-8 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-slate-400">
                  © {new Date().getFullYear()} AGCAS. All rights reserved.
                </p>
                <div className="flex gap-6 text-sm text-slate-400">
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