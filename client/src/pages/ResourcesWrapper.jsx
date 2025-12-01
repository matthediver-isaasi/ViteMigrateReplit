import { useMemo } from "react";
import Resources from "./Resources";
import PublicResources from "./PublicResources";

export default function ResourcesWrapper(props) {
  const isAuthenticated = useMemo(() => {
    const storedMember = sessionStorage.getItem('agcas_member');
    if (!storedMember) return false;
    
    try {
      const member = JSON.parse(storedMember);
      if (member.sessionExpiry && new Date(member.sessionExpiry) < new Date()) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  console.log('[ResourcesWrapper] isAuthenticated:', isAuthenticated, '- Rendering:', isAuthenticated ? 'Resources (member)' : 'PublicResources');

  if (isAuthenticated) {
    return <Resources {...props} />;
  }
  
  return <PublicResources {...props} />;
}
