import { createContext, useContext } from 'react';

const ScrollContext = createContext(null);

export function ScrollProvider({ children, containerRef }) {
  return (
    <ScrollContext.Provider value={{ containerRef }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollContainer() {
  const context = useContext(ScrollContext);
  return context?.containerRef || null;
}