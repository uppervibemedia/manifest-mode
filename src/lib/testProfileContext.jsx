import React, { createContext, useContext, useState, useEffect } from "react";

const KEY = "b44_test_email_override";

const TestProfileContext = createContext();

export function TestProfileProvider({ children }) {
  const [testEmail, setTestEmailState] = useState(() => localStorage.getItem(KEY) || null);

  const setTestEmail = (email) => {
    if (email) {
      localStorage.setItem(KEY, email);
      setTestEmailState(email);
    } else {
      localStorage.removeItem(KEY);
      setTestEmailState(null);
    }
  };

  return (
    <TestProfileContext.Provider value={{ testEmail, setTestEmail }}>
      {children}
    </TestProfileContext.Provider>
  );
}

export function useTestProfile() {
  return useContext(TestProfileContext);
}

// Helper — returns the email to use for all entity queries
export function useActiveEmail(realUserEmail) {
  const { testEmail } = useTestProfile();
  return testEmail || realUserEmail;
}