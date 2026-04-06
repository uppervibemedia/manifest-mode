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
  if (!context) {
    throw new Error('useScrollContainer must be used within ScrollProvider');
  }
  return context.containerRef;
}