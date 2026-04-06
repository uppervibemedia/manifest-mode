import { createContext, useContext, useState } from "react";

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [activeFullscreenModal, setActiveFullscreenModal] = useState(null);

  return (
    <ModalContext.Provider value={{ activeFullscreenModal, setActiveFullscreenModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModalState() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModalState must be used within ModalProvider");
  return ctx;
}

// Modal types that hide bottom nav
export const FULLSCREEN_MODALS = ["see-me-vision", "vision-upload"];