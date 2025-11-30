
import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, User, CreditCard, LogOut, Ticket, Wallet, Shield, Users, Settings, Sparkles, ShoppingCart, History, BarChart3, Briefcase, FileEdit, Image, FileText, AtSign, FolderTree, Square, Trophy, BookOpen, Mail, MousePointer2, Building, Download, HelpCircle, Menu, ChevronRight } from "lucide-react";
import { useLayoutContext } from "@/contexts/LayoutContext";
import { useArticleUrl } from "@/contexts/ArticleUrlContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import PublicLayout from "@/components/layouts/PublicLayout";
import BarePublicLayout from "@/components/layouts/BarePublicLayout";
import FloaterDisplay from "@/components/floaters/FloaterDisplay";
import NewsTickerBar from "@/components/news/NewsTickerBar";
import PortalHeroBanner from "@/components/banners/PortalHeroBanner";

import { useQuery } from '@tanstack/react-query';
import { base44 } from "@/api/base44Client";




const navigationItems = [
  {
    title: "Buy Tickets",
    url: createPageUrl("BuyProgramTickets"),
    icon: ShoppingCart,
    featureId: "page_BuyProgramTickets"
  },
  {
    title: "Browse Events",
    url: createPageUrl("Events"),
    icon: Calendar,
    featureId: "page_Events"
  },
  {
    title: "Bookings",
    url: createPageUrl("Bookings"),
    icon: CreditCard,
    featureId: "page_Bookings"
  },
  {
    title: "My Tickets",
    url: createPageUrl("MyTickets"),
    icon: Ticket,
    featureId: "page_MyTickets"
  },
  {
    title: "Balances",
    url: createPageUrl("Balances"),
    icon: Wallet,
    featureId: "page_Balances"
  },
  {
    title: "History",
    url: createPageUrl("History"),
    icon: History,
    featureId: "page_History"
  },
  {
    title: "Team",
    url: createPageUrl("Team"),
    icon: Users,
    featureId: "page_Team"
  },
  {
    title: "Member Directory",
    url: createPageUrl("MemberDirectory"),
    icon: BookOpen,
    featureId: "page_MemberDirectory"
  },
  {
    title: "Organisation Directory",
    url: createPageUrl("OrganisationDirectory"),
    icon: Building,
    featureId: "page_OrganisationDirectory"
  },
  {
    title: "Resources",
    url: createPageUrl("Resources"),
    icon: Sparkles,
    featureId: "page_Resources"
  },
  {
    title: "Articles",
    icon: FileText,
    featureId: "page_ArticlesSection",
    isDynamicArticleSection: true,
    subItems: [
      {
        title: "My Articles",
        url: createPageUrl("MyArticles"),
        featureId: "page_MyArticles",
        isDynamicMyArticles: true
      },
      {
        title: "Articles",
        url: createPageUrl("Articles"),
        featureId: "page_Articles",
        isDynamicArticles: true
      }
    ]
  },
  {
    title: "News",
    url: createPageUrl("News"),
    icon: FileText,
    featureId: "page_user_News"
  },
  {
    title: "My Job Postings",
    url: createPageUrl("MyJobPostings"),
    icon: Briefcase,
    featureId: "page_MyJobPostings"
  },
  {
    title: "Preferences",
    url: createPageUrl("Preferences"),
    icon: Settings,
    featureId: "page_Preferences"
  },
  {
    title: "Support",
    url: createPageUrl("Support"),
    icon: HelpCircle,
    featureId: "page_Support"
  },
  ];

const adminNavigationItems = [
  {
    title: "News",
    icon: FileText,
    featureId: "page_NewsAdmin",
    subItems: [
      {
        title: "News Management",
        url: createPageUrl("MyNews"),
        featureId: "page_MyNews"
      },
      {
        title: "Settings",
        url: createPageUrl("NewsSettings"),
        featureId: "page_NewsSettings"
      }
    ]
  },
  {
    title: "Articles",
    icon: FileText,
    featureId: "page_ArticlesAdmin",
    isDynamicArticleSection: true,
    subItems: [
      {
        title: "All Articles",
        url: createPageUrl("ArticleManagement"),
        featureId: "page_ArticleManagement"
      },
      {
        title: "Settings",
        url: createPageUrl("ArticlesSettings"),
        featureId: "page_ArticlesSettings"
      }
    ]
  },
  {
    title: "Role Management",
    url: createPageUrl("RoleManagement"),
    icon: Shield,
    featureId: "page_RoleManagement"
  },
  {
    title: "Assign Member Roles",
    url: createPageUrl("MemberRoleAssignment"),
    icon: Users,
    featureId: "page_MemberRoleAssignment"
  },
  {
    title: "Team Members",
    url: createPageUrl("TeamMemberManagement"),
    icon: Users,
    featureId: "page_TeamMemberManagement"
  },
  {
    title: "Member Handle Management",
    url: createPageUrl("MemberHandleManagement"),
    icon: AtSign,
    featureId: "page_MemberHandleManagement"
  },
  {
    title: "Member Directory Settings",
    url: createPageUrl("MemberDirectorySettings"),
    icon: Users,
    featureId: "page_MemberDirectorySettings"
  },
  {
    title: "Discount Codes",
    url: createPageUrl("DiscountCodeManagement"),
    icon: Ticket,
    featureId: "page_DiscountCodeManagement"
  },
  {
    title: "Event Settings",
    url: createPageUrl("EventSettings"),
    icon: Settings,
    featureId: "page_EventSettings"
  },
  {
    title: "Ticket Sales Analytics",
    url: createPageUrl("TicketSalesAnalytics"),
    icon: BarChart3,
    featureId: "page_TicketSalesAnalytics"
  },
  {
    title: "Award Management",
    url: createPageUrl("AwardManagement"),
    icon: Trophy,
    featureId: "page_AwardManagement"
  },
  {
    title: "Category Management",
    url: createPageUrl("CategoryManagement"),
    icon: FolderTree,
    featureId: "page_CategoryManagement"
  },
  {
    title: "Category Setup",
    url: createPageUrl("ResourceSettings"),
    icon: FolderTree,
    featureId: "page_ResourceSettings"
  },
  {
    title: "Resource Management",
    icon: Sparkles,
    featureId: "page_ResourcesAdmin",
    subItems: [
      {
        title: "Resources",
        url: createPageUrl("ResourceManagement"),
        featureId: "page_ResourceManagement"
      },
      {
        title: "Tags",
        url: createPageUrl("TagManagement"),
        featureId: "page_TagManagement"
      },
      {
        title: "Settings",
        url: createPageUrl("ResourceSettings"),
        featureId: "page_ResourceSettings"
      },
      {
        title: "File Repository",
        url: createPageUrl("FileManagement"),
        featureId: "page_FileManagement"
      }
    ]
  },
  {
    title: "Job Board Management",
    icon: Briefcase,
    featureId: "page_JobBoardAdmin",
    subItems: [
      {
        title: "Job Postings",
        url: createPageUrl("JobPostingManagement"),
        featureId: "page_JobPostingManagement"
      },
      {
        title: "Settings",
        url: createPageUrl("JobBoardSettings"),
        featureId: "page_JobBoardSettings"
      }
    ]
  },
  {
    title: "Page Builder",
    icon: FileEdit,
    featureId: "page_PageBuilder",
    subItems: [
      {
        title: "Pages",
        url: createPageUrl("IEditPageManagement"),
        featureId: "page_IEditPageManagement"
      },
      {
        title: "Element Templates",
        url: createPageUrl("IEditTemplateManagement"),
        featureId: "page_IEditTemplateManagement"
      },
      {
        title: "Page Banners",
        url: createPageUrl("PageBannerManagement"),
        featureId: "page_PageBannerManagement"
      },
      {
        title: "Navigation Items",
        url: createPageUrl("NavigationManagement"),
        featureId: "page_NavigationManagement"
      },
      {
        title: "Buttons",
        url: createPageUrl("ButtonElements"),
        featureId: "page_ButtonElements"
      },
      {
        title: "Button Styles",
        url: createPageUrl("ButtonStyleManagement"),
        featureId: "page_ButtonStyleManagement"
      },
      {
        title: "Wall of Fame",
        url: createPageUrl("WallOfFameManagement"),
        featureId: "page_WallOfFameManagement"
      },
      {
        title: "Installed Fonts",
        url: createPageUrl("InstalledFonts"),
        featureId: "page_InstalledFonts"
      }
    ]
  },
  {
    title: "Forms",
    icon: FileText,
    featureId: "page_FormsAdmin",
    subItems: [
      {
        title: "Form Management",
        url: createPageUrl("FormManagement"),
        featureId: "page_FormManagement"
      },
      {
        title: "View Submissions",
        url: createPageUrl("FormSubmissions"),
        featureId: "page_FormSubmissions"
      }
    ]
  },
  {
    title: "Floater Management",
    url: createPageUrl("FloaterManagement"),
    icon: MousePointer2,
    featureId: "page_FloaterManagement"
  },
  {
    title: "Team Invite Settings",
    url: createPageUrl("TeamInviteSettings"),
    icon: Mail,
    featureId: "page_TeamInviteSettings"
  },
  {
    title: "Data Export",
    url: createPageUrl("DataExport"),
    icon: Download,
    featureId: "page_DataExport"
  },
  {
    title: "Site Map",
    url: createPageUrl("SiteMap"),
    icon: FileText,
    featureId: "page_SiteMap"
  },
  {
    title: "Support Management",
    url: createPageUrl("SupportManagement"),
    icon: HelpCircle,
    featureId: "page_SupportManagement"
  },
  {
    title: "Portal Navigation",
    url: createPageUrl("PortalNavigationManagement"),
    icon: Menu,
    featureId: "page_PortalNavigationManagement"
  },
  {
    title: "Tour Management",
    url: createPageUrl("TourManagement"),
    icon: Sparkles,
    featureId: "page_TourManagement"
  },
  ];



export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { getArticleListUrl, getMyArticlesUrl, articleDisplayName, isCustomSlug, urlSlug } = useArticleUrl();
  
  // Initialize from sessionStorage immediately to prevent flicker
  const [memberInfo, setMemberInfo] = useState(() => {
    const stored = sessionStorage.getItem('agcas_member');
    return stored ? JSON.parse(stored) : null;
  });
  const [organizationInfo, setOrganizationInfo] = useState(() => {
    const stored = sessionStorage.getItem('agcas_organization');
    return stored ? JSON.parse(stored) : null;
  });

  const mainContentRef = React.useRef(null);
  const sidebarContentRef = React.useRef(null);
  const lastActivityUpdateRef = React.useRef(null);



  // Fetch global border radius setting
  const DEFAULT_BORDER_RADIUS = '8px';

const { data: borderRadiusSetting = DEFAULT_BORDER_RADIUS } = useQuery({
  queryKey: ['borderRadiusSetting'],
  queryFn: async () => {
    try {
      const data = await base44.entities.SystemSettings.list({ 
        filter: { setting_key: 'global_border_radius' } 
      });
      if (data && data.length > 0 && data[0].setting_value) {
        return String(data[0].setting_value);
      }
      return DEFAULT_BORDER_RADIUS;
    } catch (error) {
      console.error('Error loading SystemSettings:', error);
      return DEFAULT_BORDER_RADIUS;
    }
  }
});


  // Fetch member record for profile photo
const { data: memberRecord } = useQuery({
  queryKey: ['memberRecord', memberInfo && memberInfo.email],
  enabled: !!(memberInfo && memberInfo.email),
  refetchOnMount: false,
  queryFn: async () => {
    try {
      const data = await base44.entities.Member.list({ 
        filter: { email: memberInfo.email } 
      });
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error loading memberRecord:', error);
      return null;
    }
  },
});

// Fetch member role
const { data: memberRole } = useQuery({
  queryKey: ['memberRole', memberInfo && memberInfo.role_id],
  enabled: !!(memberInfo && memberInfo.role_id),
  refetchOnMount: false,
  queryFn: async () => {
    if (!memberInfo || !memberInfo.role_id) return null;
    try {
      const data = await base44.entities.Role.get(memberInfo.role_id);
      return data || null;
    } catch (error) {
      console.error('Error loading memberRole:', error);
      return null;
    }
  },
});

// Fetch dynamic navigation items from database
const { data: dynamicNavItems = [] } = useQuery({
  queryKey: ['portal-menu'],
  refetchOnMount: false,
  queryFn: async () => {
    try {
      const data = await base44.entities.PortalMenu.list({ 
        sort: { display_order: 'asc' } 
      });
      return data || [];
    } catch (error) {
      console.error('Error loading PortalMenu:', error);
      return [];
    }
  },
});

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

// Get the portal page identifier for the current page
const currentPortalPageId = pageToPortalPageMap[currentPageName] || null;

// Fetch portal banner for the current page
const { data: portalBanner } = useQuery({
  queryKey: ['portal-banner', currentPortalPageId],
  enabled: !!currentPortalPageId,
  refetchOnMount: false,
  queryFn: async () => {
    try {
      // Fetch all active banners sorted by display_order
      const banners = await base44.entities.PageBanner.list({
        filter: { is_active: true },
        sort: { display_order: 'asc' }
      });
      // Find first banner that includes this portal page in its associated_pages array
      // Lower display_order takes priority
      const matchingBanner = banners?.find(banner => 
        banner.associated_pages && 
        Array.isArray(banner.associated_pages) && 
        banner.associated_pages.includes(currentPortalPageId)
      );
      return matchingBanner || null;
    } catch (error) {
      console.error('Error loading portal banner:', error);
      return null;
    }
  },
});

// Get the layout context to update banner status and share member/org info
const { 
  setHasBanner, 
  setPortalBanner,
  setMemberInfo: setContextMemberInfo,
  setOrganizationInfo: setContextOrganizationInfo,
  setMemberRole: setContextMemberRole,
  setIsAdmin: setContextIsAdmin,
  setIsFeatureExcluded: setContextIsFeatureExcluded,
  setRefreshOrganizationInfo: setContextRefreshOrganizationInfo,
  setReloadMemberInfo: setContextReloadMemberInfo,
} = useLayoutContext();

// Update the context whenever the portal banner changes
useEffect(() => {
  setHasBanner(!!portalBanner);
  setPortalBanner(portalBanner || null);
}, [portalBanner, setHasBanner, setPortalBanner]);

// Update the context with member and organization info for child pages
useEffect(() => {
  setContextMemberInfo(memberInfo);
}, [memberInfo, setContextMemberInfo]);

useEffect(() => {
  setContextOrganizationInfo(organizationInfo);
}, [organizationInfo, setContextOrganizationInfo]);

useEffect(() => {
  setContextMemberRole(memberRole);
}, [memberRole, setContextMemberRole]);

  const publicPages = ["Home", "TestLogin", "Login", "ResetPassword", "UnpackedInternationalEmployability", "PublicEvents", "PublicAbout", "PublicContact", "PublicResources", "PublicArticles", "PublicNews", "sharon", "content"];
  
  // Hybrid pages that work both as public (for non-members) and portal (for members)
  // "_DynamicPage" is a special marker for CMS pages (e.g. /homely) that handle their own auth
  const hybridPages = ["PostJob", "ArticleView", "NewsView", "icontent", "ViewPage", "OrganisationDirectory", "JobBoard", "JobDetails", "JobPostSuccess", "_DynamicPage"];
  
  const adminPages = ["RoleManagement", "MemberRoleAssignment", "TeamMemberManagement", "DiscountCodeManagement", "EventSettings", "TicketSalesAnalytics", "ResourceSettings", "ResourceManagement", "TagManagement", "ResourceAuthorSettings", "TourManagement", "FileManagement", "JobPostingManagement", "JobBoardSettings", "IEditPageManagement", "IEditTemplateManagement", "PageBannerManagement", "NavigationManagement", "MemberHandleManagement", "ButtonElements", "ButtonStyleManagement", "AwardManagement", "WallOfFameManagement", "TeamInviteSettings", "FormManagement", "FormSubmissions", "FloaterManagement", "MemberDirectorySettings", "SupportManagement"];

  // Pages that should use the bare layout (no new header/footer)
  const bareLayoutPages = ["Home", "TestLogin", "Login"];

  // Helper function to check if current user is an admin
  const isAdmin = () => {
    return memberRole?.is_admin === true;
  };

  // Helper function to check if a feature is excluded for the current member
  const isFeatureExcluded = (featureId) => {
    if (!memberInfo || !featureId) return false;
    
    // Combine role-level exclusions with member-specific exclusions
    const roleExclusions = memberRole?.excluded_features || [];
    const memberExclusions = memberInfo.member_excluded_features || [];
    const allExclusions = [...new Set([...roleExclusions, ...memberExclusions])];
    
    return allExclusions.includes(featureId);
  };

  // Mapping of page names to their correct feature IDs
  // This maps currentPageName to the feature ID used in AVAILABLE_FEATURES
  const pageToFeatureIdMap = {
    // User navigation pages use page_user_* pattern
    'BuyProgramTickets': 'page_user_BuyProgramTickets',
    'Events': 'page_user_Events',
    'Bookings': 'page_user_Bookings',
    'MyTickets': 'page_user_MyTickets',
    'Balances': 'page_user_Balances',
    'History': 'page_user_History',
    'Team': 'page_user_Team',
    'MemberDirectory': 'page_user_MemberDirectory',
    'OrganisationDirectory': 'page_user_OrganisationDirectory',
    'Resources': 'page_user_Resources',
    'MyArticles': 'page_user_MyArticles',
    'Articles': 'page_user_Articles',
    'News': 'page_user_News',
    'MyJobPostings': 'page_user_MyJobPostings',
    'Preferences': 'page_user_Preferences',
    'Support': 'page_user_Support',
    // Admin navigation pages use page_admin_* pattern  
    'MyNews': 'page_admin_MyNews',
    'NewsSettings': 'page_admin_NewsSettings',
    'ArticleManagement': 'page_admin_ArticleManagement',
    'ArticlesSettings': 'page_admin_ArticlesSettings',
    'RoleManagement': 'page_admin_RoleManagement',
    'MemberRoleAssignment': 'page_admin_MemberRoleAssignment',
    'TeamMemberManagement': 'page_admin_TeamMemberManagement',
    'MemberHandleManagement': 'page_admin_MemberHandleManagement',
    'MemberDirectorySettings': 'page_admin_MemberDirectorySettings',
    'DiscountCodeManagement': 'page_admin_DiscountCodeManagement',
    'EventSettings': 'page_admin_EventSettings',
    'TicketSalesAnalytics': 'page_admin_TicketSalesAnalytics',
    'AwardManagement': 'page_admin_AwardManagement',
    'CategoryManagement': 'page_admin_CategoryManagement',
    'ResourceSettings': 'page_admin_ResourceSettings',
    'ResourceManagement': 'page_admin_ResourceManagement',
    'TagManagement': 'page_admin_TagManagement',
    'FileManagement': 'page_admin_FileManagement',
    'JobPostingManagement': 'page_admin_JobPostingManagement',
    'JobBoardSettings': 'page_admin_JobBoardSettings',
    'IEditPageManagement': 'page_admin_IEditPageManagement',
    'IEditTemplateManagement': 'page_admin_IEditTemplateManagement',
    'PageBannerManagement': 'page_admin_PageBannerManagement',
    'NavigationManagement': 'page_admin_NavigationManagement',
    'ButtonElements': 'page_admin_ButtonElements',
    'ButtonStyleManagement': 'page_admin_ButtonStyleManagement',
    'WallOfFameManagement': 'page_admin_WallOfFameManagement',
    'InstalledFonts': 'page_admin_InstalledFonts',
    'FormManagement': 'page_admin_FormManagement',
    'FormSubmissions': 'page_admin_FormSubmissions',
    'FloaterManagement': 'page_admin_FloaterManagement',
    'TeamInviteSettings': 'page_admin_TeamInviteSettings',
    'DataExport': 'page_admin_DataExport',
    'SiteMap': 'page_admin_SiteMap',
    'SupportManagement': 'page_admin_SupportManagement',
    'PortalNavigationManagement': 'page_admin_PortalNavigationManagement',
    'PortalMenuManagement': 'page_admin_PortalMenuManagement',
    'TourManagement': 'page_admin_TourManagement',
    'MemberGroupManagement': 'page_admin_MemberGroupManagement',
  };

  // Helper function to check if current page is excluded
  const isCurrentPageExcluded = () => {
    // Use the mapped feature ID if available, otherwise fall back to legacy pattern
    const pageFeatureId = pageToFeatureIdMap[currentPageName] || `page_${currentPageName}`;
    return isFeatureExcluded(pageFeatureId);
  };

  // Helper function to check if current page requires admin access
  const isCurrentPageAdminOnly = () => {
    return adminPages.includes(currentPageName);
  };

  // Function to reload member info from sessionStorage
  const reloadMemberInfo = () => {
    const storedMember = sessionStorage.getItem('agcas_member');
    if (storedMember) {
      const member = JSON.parse(storedMember);
      setMemberInfo(member);
      

      
      console.log('[Layout] memberInfo reloaded from sessionStorage:', member);
    }
  };

  const fetchOrganizationInfo = async (orgId, forceRefresh = false) => {
    if (!orgId) return;
    
    // Check if cached organization matches the requested orgId (skip if force refresh)
    if (!forceRefresh) {
      const cachedOrg = sessionStorage.getItem('agcas_organization');
      if (cachedOrg) {
        try {
          const parsed = JSON.parse(cachedOrg);
          // Validate that cached org matches the member's organization
          if (parsed.id === orgId || parsed.base44_id === orgId || parsed.zoho_account_id === orgId) {
            if (!organizationInfo || organizationInfo.id !== parsed.id) {
              setOrganizationInfo(parsed);
            }
            return;
          } else {
            // Cached org doesn't match member's org - clear it
            console.log('[Layout] Cached organization mismatch, clearing cache');
            sessionStorage.removeItem('agcas_organization');
          }
        } catch (e) {
          console.warn('Failed to parse cached organization, ignoring cache:', e);
          sessionStorage.removeItem('agcas_organization');
        }
      }
    }

    try {
      console.log('[Layout] Fetching organization from API (forceRefresh:', forceRefresh, ')');
      const orgs = await base44.entities.Organization.list({ filter: { id: orgId } });
      const org = orgs && orgs.length > 0 ? orgs[0] : null;

      if (org) {
        sessionStorage.setItem('agcas_organization', JSON.stringify(org));
        setOrganizationInfo(org);
        console.log('[Layout] Fetched and cached organization:', org.name, 'balances:', org.program_ticket_balances);
      } else {
        console.warn('Organization not found for id:', orgId);
      }
    } catch (error) {
      console.error('Unexpected error fetching organization:', error);
    }
  };

  // Update context with isAdmin status when memberRole changes
  useEffect(() => {
    setContextIsAdmin(memberRole?.is_admin === true);
  }, [memberRole, setContextIsAdmin]);

  // Update context with isFeatureExcluded function when memberInfo or memberRole changes
  useEffect(() => {
    const isFeatureExcludedFn = (featureId) => {
      if (!memberInfo || !featureId) return false;
      const roleExclusions = memberRole?.excluded_features || [];
      const memberExclusions = memberInfo.member_excluded_features || [];
      const allExclusions = [...new Set([...roleExclusions, ...memberExclusions])];
      return allExclusions.includes(featureId);
    };
    setContextIsFeatureExcluded(isFeatureExcludedFn);
  }, [memberInfo, memberRole, setContextIsFeatureExcluded]);

  // Update context with reloadMemberInfo function
  useEffect(() => {
    const reloadFn = () => {
      const storedMember = sessionStorage.getItem('agcas_member');
      if (storedMember) {
        const member = JSON.parse(storedMember);
        setMemberInfo(member);
        console.log('[Layout] memberInfo reloaded from sessionStorage via context');
      }
    };
    setContextReloadMemberInfo(reloadFn);
  }, [setContextReloadMemberInfo]);

  // Update context with refreshOrganizationInfo function
  useEffect(() => {
    const refreshFn = () => {
      if (memberInfo && !memberInfo.is_team_member) {
        // Force refresh to bypass cache and get latest data from API
        fetchOrganizationInfo(memberInfo.organization_id, true);
      }
    };
    setContextRefreshOrganizationInfo(refreshFn);
  }, [memberInfo, setContextRefreshOrganizationInfo]);

  // Get layout context for dynamic pages that need to force public layout
  const { forcePublicLayout } = useLayoutContext();

  // Check if page is truly public (not hybrid with member logged in)
  const isPublicPage = () => {
    // If a dynamic page signals it should use public layout, respect that
    if (forcePublicLayout) {
      return true;
    }
    
    if (publicPages.includes(currentPageName)) {
      return true;
    }
    
    // For hybrid pages, check if member is logged in
    if (hybridPages.includes(currentPageName)) {
      const storedMember = sessionStorage.getItem('agcas_member');
      return !storedMember; // Public if no member logged in
    }
    
    return false;
  };

  useEffect(() => {
    // Check server session first for multi-tab persistence
    const checkServerSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.member) {
            console.log('[Layout] Server session found:', data.member.email);
            // Sync server session to sessionStorage for backwards compatibility
            const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            const memberData = { ...data.member, sessionExpiry };
            sessionStorage.setItem('agcas_member', JSON.stringify(memberData));
            setMemberInfo(memberData);
            
            // Fetch organization info for regular members
            if (data.member.organization_id && !data.member.is_team_member) {
              fetchOrganizationInfo(data.member.organization_id);
            }
            return true; // Session is valid
          }
        }
        return false; // No server session
      } catch (error) {
        console.log('[Layout] Server session check failed, falling back to sessionStorage');
        return false;
      }
    };

    const handleAuth = async () => {
      // Handle truly public pages - no auth required
      if (publicPages.includes(currentPageName)) {
        return;
      }

      // Try server session first (for password-based auth with cross-tab persistence)
      const hasServerSession = await checkServerSession();
      if (hasServerSession) {
        return; // Already authenticated via server session
      }

      // Handle hybrid pages - check sessionStorage
      if (hybridPages.includes(currentPageName)) {
        const storedMember = sessionStorage.getItem('agcas_member');
        if (!storedMember) {
          // No member logged in, treat as public
          return;
        }
        // Member is logged in via sessionStorage, continue to validate
      }

      // Fall back to sessionStorage for backward compatibility
      const storedMember = sessionStorage.getItem('agcas_member');
      if (!storedMember) {
        window.location.href = createPageUrl('Home');
        return;
      }

      const member = JSON.parse(storedMember);

      if (member.sessionExpiry && new Date(member.sessionExpiry) < new Date()) {
        sessionStorage.removeItem('agcas_member');
        window.location.href = createPageUrl('Home');
        return;
      }

      // Only update memberInfo if it's actually different (prevent unnecessary re-renders)
      if (!memberInfo || JSON.stringify(memberInfo) !== JSON.stringify(member)) {
        setMemberInfo(member);
      }

      // Only fetch organization info for regular members (not team members)
      if (member.organization_id && !member.is_team_member) {
        fetchOrganizationInfo(member.organization_id);
      }
    };

    handleAuth();
  }, []); // Only run once on mount

  // Update last_activity on navigation (throttled to once every 10 minutes)
  useEffect(() => {
    const updateLastActivity = async () => {
      if (!memberInfo?.email || isPublicPage()) return;
    
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
    
      // Throttle: only update once every 10 minutes
      if (lastActivityUpdateRef.current && (now - lastActivityUpdateRef.current) < tenMinutes) {
        return;
      }
    
      try {
        // Find member by email using base44 client
        const members = await base44.entities.Member.list({ filter: { email: memberInfo.email } });
        const member = members && members.length > 0 ? members[0] : null;
    
        if (!member) {
          console.warn('Member not found for email:', memberInfo.email);
          return;
        }
    
        // Update last_activity timestamp using base44 client
        await base44.entities.Member.update(member.id, {
          last_activity: new Date().toISOString()
        });
    
        // Update throttling ref
        lastActivityUpdateRef.current = now;
      } catch (error) {
        console.error('Unexpected error updating last_activity:', error);
      }
    };
    
    updateLastActivity();
  }, [location.pathname, memberInfo?.email]);

  // Check if current page is excluded or admin-only and redirect if needed
  useEffect(() => {
    if (!isPublicPage() && memberInfo && memberRole) {
      // Use role's default landing page or fallback to Preferences
      const fallbackPage = memberRole?.default_landing_page || 'Preferences';
      
      // Prevent redirect loop: don't redirect if we're already on the fallback page
      if (currentPageName === fallbackPage) {
        return;
      }
      
      // Check if page is excluded by role/member settings
      if (isCurrentPageExcluded()) {
        window.location.href = createPageUrl(fallbackPage);
        return;
      }
      
      // Check if page requires admin access
      if (isCurrentPageAdminOnly() && !isAdmin()) {
        window.location.href = createPageUrl(fallbackPage);
      }
    }
  }, [currentPageName, memberInfo, memberRole]);

  // Save sidebar scroll position to sessionStorage on scroll
  React.useEffect(() => {
    const sidebar = sidebarContentRef.current;
    if (sidebar) {
      // Save scroll position on scroll
      const handleScroll = () => {
        sessionStorage.setItem('agcas_sidebar_scroll', sidebar.scrollTop.toString());
      };
      sidebar.addEventListener('scroll', handleScroll);
      
      return () => {
        sidebar.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // Restore scroll position after SidebarContent mounts
  React.useEffect(() => {
    const sidebar = sidebarContentRef.current;
    if (sidebar) {
      const savedPosition = sessionStorage.getItem('agcas_sidebar_scroll');
      if (savedPosition) {
        // Use setTimeout to ensure this runs after the mount is complete
        setTimeout(() => {
          sidebar.scrollTop = parseFloat(savedPosition);
        }, 0);
      }
    }
  });

  // Scroll main content to top on navigation only
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      // Clear server session first
      await fetch('/api/auth/logout', { 
        method: 'POST', 
        credentials: 'include' 
      });
    } catch (error) {
      console.log('[Layout] Server logout error (may not have server session):', error);
    }
    // Always clear local storage
    sessionStorage.removeItem('agcas_member');
    sessionStorage.removeItem('agcas_organization');
    window.location.href = createPageUrl('Home');
  };

  // Render public layout for truly public pages
  if (isPublicPage()) {
    // Use BarePublicLayout for specific pages (like Home)
    if (bareLayoutPages.includes(currentPageName)) {
      return <BarePublicLayout>{children}</BarePublicLayout>;
    }
    // Use the new PublicLayout for other public pages
    return <PublicLayout currentPageName={currentPageName}>{children}</PublicLayout>;
  }

  // Icon mapping object
  const iconMap = {
    Menu, Calendar, CreditCard, Ticket, Wallet, ShoppingCart, History, Sparkles, FileText, 
    Briefcase, Settings, BookOpen, Building, HelpCircle, Users, Shield, BarChart3, FileEdit, 
    AtSign, FolderTree, Trophy, MousePointer2, Mail, Download
  };

  // Build navigation structure from dynamic items
  const buildNavigationFromDB = (section) => {
    const items = dynamicNavItems.filter(item => item.is_active && item.section === section);
    const topLevelItems = items.filter(item => !item.parent_id);
    
    // Helper to detect article-related URLs
    const isArticleUrl = (url) => {
      if (!url) return false;
      const lower = url.toLowerCase();
      return lower === 'articles' || lower === 'myarticles' || 
             lower.includes('article') || lower.includes('blog');
    };
    
    return topLevelItems.sort((a, b) => a.display_order - b.display_order).map(parent => {
      // Find children - look in ALL items, not just section-filtered ones
      const children = dynamicNavItems.filter(child => 
        child.is_active && child.parent_id === parent.id
      );
      
      const IconComponent = iconMap[parent.icon] || Menu;
      const isArticleSection = isArticleUrl(parent.url) || 
        children.some(child => isArticleUrl(child.url));
      
      if (children.length > 0) {
        return {
          title: parent.title,
          icon: IconComponent,
          featureId: parent.feature_id,
          isDynamicArticleSection: isArticleSection,
          subItems: children.sort((a, b) => a.display_order - b.display_order).map(child => ({
            title: child.title,
            url: child.url ? createPageUrl(child.url) : '',
            featureId: child.feature_id,
            isDynamicMyArticles: child.url?.toLowerCase() === 'myarticles',
            isDynamicArticles: child.url?.toLowerCase() === 'articles'
          }))
        };
      } else {
        return {
          title: parent.title,
          url: parent.url ? createPageUrl(parent.url) : '',
          icon: IconComponent,
          featureId: parent.feature_id,
          isDynamicArticles: parent.url?.toLowerCase() === 'articles',
          isDynamicMyArticles: parent.url?.toLowerCase() === 'myarticles'
        };
      }
    });
  };

  // Memoized navigation items with dynamic article URLs applied
  // CRITICAL: Must deep clone AND apply URL transformations in the SAME memoization
  // This prevents any mutation of cached clones when isCustomSlug changes
  const navigationItemsSource = useMemo(() => {
    // Get base items (from DB or hardcoded)
    const baseItems = dynamicNavItems.length > 0 
      ? buildNavigationFromDB('user')
      : navigationItems;
    
    // Deep clone with icons preserved - NEVER mutate originals
    const clonedItems = baseItems.map(item => ({
      ...item,
      icon: item.icon,
      subItems: item.subItems ? item.subItems.map(sub => ({ ...sub })) : undefined
    }));
    
    // When NOT using custom slug, return cloned items with original createPageUrl() URLs
    if (!isCustomSlug) {
      return clonedItems;
    }
    
    // Apply dynamic URLs only when custom slug is confirmed
    return clonedItems.map(item => {
      const processedItem = { ...item };
      
      if (item.isDynamicArticleSection && articleDisplayName) {
        processedItem.title = articleDisplayName;
      }
      
      if (item.isDynamicArticles) {
        processedItem.url = getArticleListUrl();
        if (articleDisplayName) processedItem.title = articleDisplayName;
      }
      if (item.isDynamicMyArticles) {
        processedItem.url = getMyArticlesUrl();
        if (articleDisplayName) processedItem.title = `My ${articleDisplayName}`;
      }
      
      if (item.subItems) {
        processedItem.subItems = item.subItems.map(subItem => {
          const processedSubItem = { ...subItem };
          if (subItem.isDynamicMyArticles) {
            processedSubItem.url = getMyArticlesUrl();
            if (articleDisplayName) processedSubItem.title = `My ${articleDisplayName}`;
          }
          if (subItem.isDynamicArticles) {
            processedSubItem.url = getArticleListUrl();
            if (articleDisplayName) processedSubItem.title = articleDisplayName;
          }
          return processedSubItem;
        });
      }
      
      return processedItem;
    });
  }, [dynamicNavItems, isCustomSlug, articleDisplayName, urlSlug, getArticleListUrl, getMyArticlesUrl]);
  
  const adminNavigationItemsSource = useMemo(() => {
    // Get base items (from DB or hardcoded)
    const baseItems = dynamicNavItems.length > 0 
      ? buildNavigationFromDB('admin')
      : adminNavigationItems;
    
    // Deep clone with icons preserved - NEVER mutate originals
    const clonedItems = baseItems.map(item => ({
      ...item,
      icon: item.icon,
      subItems: item.subItems ? item.subItems.map(sub => ({ ...sub })) : undefined
    }));
    
    // When NOT using custom slug, return cloned items with original createPageUrl() URLs
    if (!isCustomSlug) {
      return clonedItems;
    }
    
    // Apply dynamic URLs only when custom slug is confirmed
    return clonedItems.map(item => {
      const processedItem = { ...item };
      
      if (item.isDynamicArticleSection && articleDisplayName) {
        processedItem.title = articleDisplayName;
      }
      
      if (item.isDynamicArticles) {
        processedItem.url = getArticleListUrl();
        if (articleDisplayName) processedItem.title = articleDisplayName;
      }
      if (item.isDynamicMyArticles) {
        processedItem.url = getMyArticlesUrl();
        if (articleDisplayName) processedItem.title = `My ${articleDisplayName}`;
      }
      
      if (item.subItems) {
        processedItem.subItems = item.subItems.map(subItem => {
          const processedSubItem = { ...subItem };
          if (subItem.isDynamicMyArticles) {
            processedSubItem.url = getMyArticlesUrl();
            if (articleDisplayName) processedSubItem.title = `My ${articleDisplayName}`;
          }
          if (subItem.isDynamicArticles) {
            processedSubItem.url = getArticleListUrl();
            if (articleDisplayName) processedSubItem.title = articleDisplayName;
          }
          return processedSubItem;
        });
      }
      
      return processedItem;
    });
  }, [dynamicNavItems, isCustomSlug, articleDisplayName, urlSlug, getArticleListUrl, getMyArticlesUrl]);

  // Filter navigation items based on member's excluded features
  const filteredNavigationItems = navigationItemsSource
    .map(item => {
      if (item.subItems) {
        // If it has sub-items, filter them individually
        const filteredSubItems = item.subItems.filter(subItem => !isFeatureExcluded(subItem.featureId));
        // Only include the parent if it's not excluded and has at least one filtered sub-item
        if (filteredSubItems.length > 0 && !isFeatureExcluded(item.featureId)) {
          return { ...item, subItems: filteredSubItems };
        }
        return null; // Exclude parent if no sub-items left or parent is excluded
      } else {
        // Regular item, filter if its own featureId is not excluded
        return !isFeatureExcluded(item.featureId) ? item : null;
      }
    })
    .filter(Boolean);

  // Filter admin navigation items (only show if user is admin)
  const filteredAdminNavigationItems = isAdmin()
    ? adminNavigationItemsSource
        .map(item => {
          if (item.subItems) {
            // If it has sub-items, filter them individually
            const filteredSubItems = item.subItems.filter(subItem => !isFeatureExcluded(subItem.featureId));
            // Only include the parent if it's not excluded and has at least one filtered sub-item
            if (filteredSubItems.length > 0 && !isFeatureExcluded(item.featureId)) {
              return { ...item, subItems: filteredSubItems };
            }
            return null; // Exclude parent if no sub-items left or parent is excluded
          } else {
            // Regular item, filter if its own featureId is not excluded
            return !isFeatureExcluded(item.featureId) ? item : null;
          }
        })
        .filter(Boolean) // Remove any null entries
    : [];

  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { 
        memberInfo, 
        organizationInfo,
        memberRole,
        isAdmin: isAdmin(),
        refreshOrganizationInfo: () => { // Conditionally refresh org info for non-team members
          if (memberInfo && !memberInfo.is_team_member) {
            fetchOrganizationInfo(memberInfo.organization_id);
          }
        },
        isFeatureExcluded,
        reloadMemberInfo, // Add the new function to props
        hasBanner: !!portalBanner // Pass banner status to hide page headers when banner is present
      });
    }
    return child;
  });



  return (
    <div style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Google Fonts - Poppins */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');

          @font-face {
            font-family: 'Degular Medium';
            src: url('https://teeone.pythonanywhere.com/font-assets/Degular-Medium.woff') format('woff');
            font-weight: 500;
            font-style: normal;
            font-display: block;
          }

          :root {
            --border-radius: ${borderRadiusSetting || '8px'};
          }

          /* Degular Medium for H1 headers */
          h1 {
            font-family: 'Degular Medium', 'Poppins', sans-serif;
          }
          
          /* Apply border radius globally to common UI elements */
          .Card, [class*="Card"], 
          .card, [class*="card"],
          button:not(.unstyled),
          input:not([type="checkbox"]):not([type="radio"]),
          textarea,
          select,
          [role="dialog"],
          [role="menu"],
          [role="listbox"],
          .shadow, .shadow-sm, .shadow-md, .shadow-lg {
            border-radius: var(--border-radius) !important;
          }
        `}
      </style>

      <SidebarProvider key="main-sidebar-provider" style={{ height: '100vh', overflow: 'hidden' }}>
        <Sidebar className="border-r border-slate-200 bg-white" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <SidebarHeader className="border-b border-slate-200 p-6">
              <Link to={createPageUrl('Events')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md border border-slate-200 overflow-hidden">
                  {memberRecord?.profile_photo_url ? (
                    <img 
                      src={memberRecord.profile_photo_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">AGCAS Events</h2>
                  <p className="text-xs text-slate-500">Member Portal</p>
                </div>
              </Link>
            </SidebarHeader>
            
            <SidebarContent ref={sidebarContentRef} className="p-3">
              {/* Only render navigation once role data is loaded */}
              {!memberRole ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : (
                <>
              {/* Only show organization info for regular members */}
              {memberInfo && !memberInfo.is_team_member && organizationInfo && (
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 py-2">
                    Your Account
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <div className="px-3 py-2 space-y-3">
                      {organizationInfo.name && (
                        <div className="text-sm">
                          <span className="text-slate-600 block mb-1">Organisation</span>
                          <span className="font-medium text-slate-900">{organizationInfo.name}</span>
                        </div>
                      )}
                      {organizationInfo.voucher_balance > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Vouchers</span>
                          <span className="font-semibold text-blue-600">£{organizationInfo.voucher_balance}</span>
                        </div>
                      )}
                    </div>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}

              <SidebarGroup className={memberInfo && !memberInfo.is_team_member && organizationInfo ? "mt-4" : ""}>
                <SidebarGroupLabel className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 py-2">
                  Navigation
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredNavigationItems.map((item) => {
                      const Icon = item.icon;
                      // Determine if the current item (or any of its sub-items) is active
                      const isActive = item.url === location.pathname || 
                                       (item.subItems && item.subItems.some(sub => sub.url === location.pathname));

                      if (item.subItems) {
                        return (
                          <Collapsible key={item.title} defaultOpen={isActive}>
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton 
                                    className={`hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-lg mb-1 flex items-center gap-3 px-3 py-2.5 group ${
                                      isActive ? 'bg-blue-50 text-blue-700 font-medium' : ''
                                    }`}
                                  >
                                    <Icon className="w-4 h-4" />
                                    <span className="flex-1">{item.title}</span>
                                    <ChevronRight className="w-4 h-4 transition-transform group-data-[state=open]:rotate-90" />
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                            </SidebarMenuItem>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.subItems.map(subItem => {
                                  const isSubItemActive = subItem.url === location.pathname;
                                  return (
                                    <SidebarMenuSubItem key={subItem.title}>
                                      <Link
                                        to={subItem.url}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                                          isSubItemActive ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-blue-50 hover:text-blue-700'
                                        }`}
                                      >
                                        <span>{subItem.title}</span>
                                      </Link>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      } else {
                        return (
                          <SidebarMenuItem 
                            key={item.title}
                            id={item.title === "Buy Tickets" ? "buy-tickets-menu-item" : undefined}
                          >
                            <SidebarMenuButton 
                              asChild 
                              className={`hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-lg mb-1 ${
                                isActive ? 'bg-blue-50 text-blue-700 font-medium' : ''
                              }`}
                            >
                              <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                                <Icon className="w-4 h-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      }
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              {/* Admin Section */}
              {filteredAdminNavigationItems.length > 0 && (
                <SidebarGroup className="mt-4">
                  <SidebarGroupLabel className="text-xs font-medium text-amber-600 uppercase tracking-wider px-3 py-2">
                    Administration
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {filteredAdminNavigationItems.map((item) => {
                        const Icon = item.icon;
                        // Determine if the current item (or any of its sub-items) is active
                        const isActive = item.url === location.pathname || 
                                         (item.subItems && item.subItems.some(sub => sub.url === location.pathname));

                        if (item.subItems) {
                          return (
                            <Collapsible key={item.title} defaultOpen={isActive}>
                              <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton 
                                    className={`hover:bg-amber-50 hover:text-amber-700 transition-colors rounded-lg mb-1 flex items-center gap-3 px-3 py-2.5 group ${
                                      isActive ? 'bg-amber-50 text-amber-700 font-medium' : ''
                                    }`}
                                  >
                                    <Icon className="w-4 h-4" />
                                    <span className="flex-1">{item.title}</span>
                                    <ChevronRight className="w-4 h-4 transition-transform group-data-[state=open]:rotate-90" />
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                              </SidebarMenuItem>
                              <CollapsibleContent>
                                <SidebarMenuSub>
                                  {item.subItems.map(subItem => {
                                    const isSubItemActive = subItem.url === location.pathname;
                                    return (
                                      <SidebarMenuSubItem key={subItem.title}>
                                        <Link
                                          to={subItem.url}
                                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                                            isSubItemActive ? 'bg-amber-50 text-amber-700 font-medium' : 'hover:bg-amber-50 hover:text-amber-700'
                                          }`}
                                        >
                                          <span>{subItem.title}</span>
                                        </Link>
                                      </SidebarMenuSubItem>
                                    );
                                  })}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        } else {
                          return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton 
                                  asChild 
                                  className={`hover:bg-amber-50 hover:text-amber-700 transition-colors rounded-lg mb-1 ${
                                    isActive ? 'bg-amber-50 text-amber-700 font-medium' : ''
                                  }`}
                                >
                                  <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                                  <Icon className="w-4 h-4" />
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        }
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
              </>
              )}
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200 p-4">
              {memberInfo && (
                <div className="space-y-3">
                  <div className="px-3 py-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-900">
                        {memberInfo.first_name} {memberInfo.last_name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 pl-6">{memberInfo.email}</p>
                    {memberRole && (
                      <div className="pl-6 mt-2">
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          {memberRole.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
            </SidebarFooter>
          </Sidebar>

          <div className="flex-1 flex flex-col min-h-screen max-h-screen overflow-hidden">
            {!isFeatureExcluded('element_NewsTickerBar') && <NewsTickerBar />}
            <main ref={mainContentRef} className="flex-1 overflow-y-auto overflow-x-hidden">
              {portalBanner && <PortalHeroBanner banner={portalBanner} />}
              {childrenWithProps}
            </main>

            <footer className="bg-white border-t border-slate-200 py-6">
              <div className="max-w-7xl mx-auto px-4 text-center">
                <a 
                  href="https://isaasi.co.uk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mb-3 hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68efc20f3e0a30fafad6dde7/fe03f7c5e_linked-aa.png" 
                    alt="isaasi"
                    className="w-[50px] mx-auto"
                  />
                </a>
                <p className="text-sm text-slate-600">
                  <span style={{ color: '#eb008c' }}>i</span>Connect by{' '}
                  <a 
                    href="https://isaasi.co.uk" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity font-medium"
                    style={{ color: '#eb008c' }}
                  >
                    isaasi
                  </a>
                  {' '}- © Copyright {new Date().getFullYear() === 2025 ? '2025' : `2025-${new Date().getFullYear()}`}
                </p>
                <p className="text-xs text-orange-500 font-semibold mt-2">
                  BETA AUTH
                </p>
              </div>
            </footer>
          </div>
          
          {/* Floater Display for Portal Pages */}
          {!isFeatureExcluded('element_FloatersDisplay') && (
            <FloaterDisplay location="portal" memberInfo={memberInfo} organizationInfo={organizationInfo} />
          )}
      </SidebarProvider>
    </div>
  );
}
