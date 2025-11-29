import { createContext, useContext, useState, useCallback } from 'react';

const LayoutContext = createContext({
  forcePublicLayout: false,
  setForcePublicLayout: () => {},
});

export function LayoutProvider({ children }) {
  const [forcePublicLayout, setForcePublicLayout] = useState(false);
  
  const setLayout = useCallback((value) => {
    setForcePublicLayout(value);
  }, []);

  return (
    <LayoutContext.Provider value={{ forcePublicLayout, setForcePublicLayout: setLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext() {
  return useContext(LayoutContext);
}

export default LayoutContext;
