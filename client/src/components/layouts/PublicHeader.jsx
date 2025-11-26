import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Search, User, ArrowUpRight, LogOut, ChevronDown, ChevronRight, Calendar, Building, Briefcase, FileText, Users, Sparkles, Home, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Icon mapping for commonly used Lucide icons
const iconMap = {
  Calendar,
  Building,
  Briefcase,
  FileText,
  Users,
  Sparkles,
  Home,
  Mail,
  Phone,
  Search,
  User,
  ChevronDown
};

export default function PublicHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [navItems, setNavItems] = useState({ topNav: [], mainNav: [] });
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);
  const [socialIcons, setSocialIcons] = useState(null);
  const [closeTimeout, setCloseTimeout] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = () => {
      const storedMember = sessionStorage.getItem('agcas_member');
      setIsLoggedIn(!!storedMember);
    };

    checkLoginStatus();
    
    // Listen for storage changes
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  // Fetch navigation items
  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        // Fetch all items and filter client-side to bypass any SDK caching
        const allItems = await base44.entities.NavigationItem.list('display_order');
        const items = allItems.filter(item => item.is_active);
        
        // Build hierarchy
        const buildTree = (parentId, location) => {
          return items
            .filter(item => item.parent_id === parentId && item.location === location)
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map(item => ({
              ...item,
              children: buildTree(item.id, location)
            }));
        };

        const topNav = buildTree(null, 'top_nav');
        const mainNav = buildTree(null, 'main_nav');

        setNavItems({ topNav, mainNav });
      } catch (error) {
        console.error('Failed to fetch navigation items:', error);
        setNavItems({ topNav: [], mainNav: [] });
      }
    };

    fetchNavItems();
    
    // Refetch on window focus and route changes
    const handleFocus = () => fetchNavItems();
    window.addEventListener('focus', handleFocus);
    
    // Poll for changes every 5 seconds when page is visible
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNavItems();
      }
    }, 5000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, [location.pathname]);

  // Fetch social icons configuration
  useEffect(() => {
    const fetchSocialConfig = async () => {
      try {
        const allSettings = await base44.entities.SystemSettings.list();
        const setting = allSettings.find(s => s.setting_key === 'social_icons_config');
        
        if (setting?.setting_value) {
          try {
            setSocialIcons(JSON.parse(setting.setting_value));
          } catch (e) {
            console.error('Failed to parse social icons config:', e);
          }
        }
      } catch (error) {
        console.error('Failed to fetch social icons config:', error);
      }
    };

    fetchSocialConfig();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('agcas_member');
    window.location.href = createPageUrl('Home');
  };

  // Check if a navigation item is active
  const isActive = (item) => {
    if (item.link_type === 'external') return false;
    
    const itemPath = createPageUrl(item.url);
    const currentPath = location.pathname;
    
    return currentPath === itemPath;
  };

  // Render navigation item with icon support and active state
  const renderNavItem = (item, isTopNav = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon && iconMap[item.icon] ? iconMap[item.icon] : null;
    const active = isActive(item);

    // Determine link props
    const linkProps = item.link_type === 'external' 
      ? {
          href: item.url,
          target: item.open_in_new_tab ? '_blank' : '_self',
          rel: item.open_in_new_tab ? 'noopener noreferrer' : undefined
        }
      : {
          to: createPageUrl(item.url)
        };

    const LinkComponent = item.link_type === 'external' ? 'a' : Link;

    // Build className with proper font weight handling
    const getFontClass = () => {
      if (active) return 'font-bold';
      if (isTopNav) return 'font-semibold text-sm';
      return 'font-medium';
    };

    const baseClassName = `nav-link text-${isTopNav ? 'white' : 'slate-900'} transition-colors ${getFontClass()} flex items-center gap-1`;

    // Gradient button style
    if (item.highlight_style === 'gradient_button') {
      return (
        <LinkComponent key={item.id} {...linkProps}>
          <Button 
            className="text-white font-bold hover:opacity-90 transition-opacity px-6 py-5 rounded-none" 
            style={{ 
              fontFamily: 'Poppins, sans-serif',
              background: 'linear-gradient(to top right, #5C0085, #BA0087, #EE00C3, #FF4229, #FFB000)'
            }}
          >
            {Icon && <Icon className="w-4 h-4 mr-2" />}
            {item.title}
            <ArrowUpRight className="ml-0.5 w-5 h-5" strokeWidth={2.5} />
          </Button>
        </LinkComponent>
      );
    }

    // Regular nav item with sub-menu
    if (hasChildren) {
      const handleMouseEnter = () => {
        if (closeTimeout) {
          clearTimeout(closeTimeout);
          setCloseTimeout(null);
        }
        setHoveredMenu(item.id);
      };

      const handleMouseLeave = () => {
        const timeout = setTimeout(() => {
          setHoveredMenu(null);
        }, 150);
        setCloseTimeout(timeout);
      };

      return (
        <div
          key={item.id}
          className="relative h-full flex items-center"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button className={baseClassName}>
            {Icon && <Icon className="w-4 h-4" />}
            {item.title}
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Active indicator - positioned at bottom of nav container */}
          {!isTopNav && active && (
            <div 
              className="absolute left-0 right-0 h-[5px]"
              style={{
                bottom: '-33px',
                background: 'linear-gradient(to right, #5C0085, #BA0087, #EE00C3, #FF4229, #FFB000)'
              }}
            />
          )}

          {/* Mega Menu Dropdown */}
          {hoveredMenu === item.id && (
            <div 
              className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 py-4 z-50 min-w-[240px]"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {item.children.map((child) => {
                const ChildIcon = child.icon && iconMap[child.icon] ? iconMap[child.icon] : null;
                const childActive = isActive(child);
                const hasGrandchildren = child.children && child.children.length > 0;
                const childLinkProps = child.link_type === 'external'
                  ? {
                      href: child.url,
                      target: child.open_in_new_tab ? '_blank' : '_self',
                      rel: child.open_in_new_tab ? 'noopener noreferrer' : undefined
                    }
                  : {
                      to: createPageUrl(child.url)
                    };
                
                const ChildLinkComponent = child.link_type === 'external' ? 'a' : Link;

                return (
                  <div 
                    key={child.id} 
                    className="relative"
                    onMouseEnter={() => hasGrandchildren && setHoveredSubmenu(child.id)}
                    onMouseLeave={() => hasGrandchildren && setHoveredSubmenu(null)}
                  >
                    <ChildLinkComponent
                      {...childLinkProps}
                      className="block px-4 py-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {ChildIcon && <ChildIcon className="w-5 h-5 text-slate-600 mt-0.5" />}
                        <div className="flex-1">
                          <div className={`text-slate-900 ${childActive ? 'font-bold' : 'font-medium'} flex items-center gap-2`}>
                            {child.title}
                            {hasGrandchildren && <ChevronRight className="w-3 h-3" />}
                          </div>
                          {child.description && (
                            <div className="text-xs text-slate-500 mt-0.5">{child.description}</div>
                          )}
                        </div>
                      </div>
                    </ChildLinkComponent>
                    
                    {/* Render grandchildren on hover */}
                    {hasGrandchildren && hoveredSubmenu === child.id && (
                      <div className="absolute left-full top-0 -ml-[11px] bg-white rounded-lg shadow-xl border border-slate-200 py-4 min-w-[220px]">
                        {child.children.map((grandchild) => {
                          const GrandchildIcon = grandchild.icon && iconMap[grandchild.icon] ? iconMap[grandchild.icon] : null;
                          const grandchildActive = isActive(grandchild);
                          const grandchildLinkProps = grandchild.link_type === 'external'
                            ? {
                                href: grandchild.url,
                                target: grandchild.open_in_new_tab ? '_blank' : '_self',
                                rel: grandchild.open_in_new_tab ? 'noopener noreferrer' : undefined
                              }
                            : {
                                to: createPageUrl(grandchild.url)
                              };
                          
                          const GrandchildLinkComponent = grandchild.link_type === 'external' ? 'a' : Link;

                          return (
                            <GrandchildLinkComponent
                              key={grandchild.id}
                              {...grandchildLinkProps}
                              className="block px-4 py-2 hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                {GrandchildIcon && <GrandchildIcon className="w-4 h-4 text-slate-500 mt-0.5" />}
                                <div className="flex-1">
                                  <div className={`text-slate-700 text-sm ${grandchildActive ? 'font-semibold' : 'font-normal'}`}>
                                    {grandchild.title}
                                  </div>
                                  {grandchild.description && (
                                    <div className="text-xs text-slate-400 mt-0.5">{grandchild.description}</div>
                                  )}
                                </div>
                              </div>
                            </GrandchildLinkComponent>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Simple nav item
    return (
      <div key={item.id} className="relative h-full flex items-center">
        <LinkComponent 
          {...linkProps}
          className={baseClassName}
          style={isTopNav ? {} : { fontFamily: 'Poppins, sans-serif' }}
        >
          {Icon && <Icon className="w-4 h-4" />}
          {item.title}
        </LinkComponent>

        {/* Active indicator - positioned at bottom of nav container */}
        {!isTopNav && active && (
          <div 
            className="absolute left-0 right-0 h-[5px]"
            style={{
              bottom: '-33px',
              background: 'linear-gradient(to right, #5C0085, #BA0087, #EE00C3, #FF4229, #FFB000)'
            }}
          />
        )}
      </div>
    );
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40 relative">
      {/* Overlapping Logo */}
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68efc20f3e0a30fafad6dde7/26710cf5a_GFIheaderlogo.png"
        alt="Graduate Futures Institute"
        className="mt-4 absolute z-50"
        style={{
          top: '0',
          left: 'max(1rem, calc((100vw - 80rem) / 2))',
          width: 'auto',
          height: '158px',
          transform: 'translateY(-10px)'
        }}
      />

      {/* Top Row - Gradient Header */}
      <div
        className="py-2 relative"
        style={{
          background: 'linear-gradient(to right, white 0%, white 33%, #5C0085 50%)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-end items-center">
            <div className="flex items-center gap-6">
              {/* Dynamic Top Nav Items */}
              {navItems.topNav?.map(item => renderNavItem(item, true))}

              {/* Static Items - Login / Member Area */}
              <Link
                to={isLoggedIn ? createPageUrl('Events') : createPageUrl('Home')}
                className="flex items-center gap-1 text-white hover:opacity-80 transition-opacity text-sm font-semibold"
              >
                <User className="w-4 h-4" />
                <span>{isLoggedIn ? 'Member Area' : 'Login'}</span>
              </Link>

              {/* Search */}
              <div className="relative">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity text-sm font-semibold"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>

                {searchOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-50">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Search..."
                          className="pl-10"
                          autoFocus
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setSearchOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      Search functionality coming soon
                    </p>
                  </div>
                )}
              </div>

              {/* Logout Icon */}
              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity text-sm font-semibold"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}

              {/* Social Media Icons */}
              {socialIcons && (
                <div className="flex items-center gap-2">
                  {socialIcons.linkedin?.enabled && socialIcons.linkedin?.url && (
                    <a
                      href={socialIcons.linkedin.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 bg-white rounded flex items-center justify-center hover:opacity-80 transition-opacity"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#5C0085">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>
                  )}
                  {socialIcons.twitter?.enabled && socialIcons.twitter?.url && (
                    <a
                      href={socialIcons.twitter.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 bg-white rounded flex items-center justify-center hover:opacity-80 transition-opacity"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#5C0085">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}
                  {socialIcons.facebook?.enabled && socialIcons.facebook?.url && (
                    <a
                      href={socialIcons.facebook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 bg-white rounded flex items-center justify-center hover:opacity-80 transition-opacity"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#5C0085">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {socialIcons.instagram?.enabled && socialIcons.instagram?.url && (
                    <a
                      href={socialIcons.instagram.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 bg-white rounded flex items-center justify-center hover:opacity-80 transition-opacity"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#5C0085">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  )}
                  {socialIcons.youtube?.enabled && socialIcons.youtube?.url && (
                    <a
                      href={socialIcons.youtube.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 bg-white rounded flex items-center justify-center hover:opacity-80 transition-opacity"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#5C0085">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Main Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center h-full">
            <div style={{ width: '210px' }}></div>
            
            <nav className="hidden md:flex items-center gap-8 h-full">
              {/* Dynamic Main Nav Items */}
              {navItems.mainNav?.map(item => renderNavItem(item, false))}

              {/* Static Join Us Button */}
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
            </nav>

            <button className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}