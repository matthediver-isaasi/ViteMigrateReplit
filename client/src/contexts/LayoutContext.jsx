import { createContext, useContext, useState, useCallback } from 'react';

const LayoutContext = createContext({
  forcePublicLayout: false,
  setForcePublicLayout: () => {},
  hasBanner: false,
  setHasBanner: () => {},
  portalBanner: null,
  setPortalBanner: () => {},
  memberInfo: null,
  setMemberInfo: () => {},
  organizationInfo: null,
  setOrganizationInfo: () => {},
  memberRole: null,
  setMemberRole: () => {},
  isAdmin: false,
  setIsAdmin: () => {},
  isFeatureExcluded: () => false,
  setIsFeatureExcluded: () => {},
  refreshOrganizationInfo: () => {},
  setRefreshOrganizationInfo: () => {},
  reloadMemberInfo: () => {},
  setReloadMemberInfo: () => {},
});

export function LayoutProvider({ children }) {
  const [forcePublicLayout, setForcePublicLayout] = useState(false);
  const [hasBanner, setHasBannerState] = useState(false);
  const [portalBanner, setPortalBannerState] = useState(null);
  const [memberInfo, setMemberInfoState] = useState(null);
  const [organizationInfo, setOrganizationInfoState] = useState(null);
  const [memberRole, setMemberRoleState] = useState(null);
  const [isAdmin, setIsAdminState] = useState(false);
  const [isFeatureExcludedFn, setIsFeatureExcludedFn] = useState(() => () => false);
  const [refreshOrganizationInfoFn, setRefreshOrganizationInfoFn] = useState(() => () => {});
  const [reloadMemberInfoFn, setReloadMemberInfoFn] = useState(() => () => {});
  
  const setLayout = useCallback((value) => {
    setForcePublicLayout(value);
  }, []);

  const setHasBanner = useCallback((value) => {
    setHasBannerState(value);
  }, []);

  const setPortalBanner = useCallback((value) => {
    setPortalBannerState(value);
  }, []);

  const setMemberInfo = useCallback((value) => {
    setMemberInfoState(value);
  }, []);

  const setOrganizationInfo = useCallback((value) => {
    setOrganizationInfoState(value);
  }, []);

  const setMemberRole = useCallback((value) => {
    setMemberRoleState(value);
  }, []);

  const setIsAdmin = useCallback((value) => {
    setIsAdminState(value);
  }, []);

  const setIsFeatureExcluded = useCallback((fn) => {
    setIsFeatureExcludedFn(() => fn);
  }, []);

  const setRefreshOrganizationInfo = useCallback((fn) => {
    setRefreshOrganizationInfoFn(() => fn);
  }, []);

  const setReloadMemberInfo = useCallback((fn) => {
    setReloadMemberInfoFn(() => fn);
  }, []);

  return (
    <LayoutContext.Provider value={{ 
      forcePublicLayout, 
      setForcePublicLayout: setLayout,
      hasBanner,
      setHasBanner,
      portalBanner,
      setPortalBanner,
      memberInfo,
      setMemberInfo,
      organizationInfo,
      setOrganizationInfo,
      memberRole,
      setMemberRole,
      isAdmin,
      setIsAdmin,
      isFeatureExcluded: isFeatureExcludedFn,
      setIsFeatureExcluded,
      refreshOrganizationInfo: refreshOrganizationInfoFn,
      setRefreshOrganizationInfo,
      reloadMemberInfo: reloadMemberInfoFn,
      setReloadMemberInfo,
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext() {
  return useContext(LayoutContext);
}

export default LayoutContext;
