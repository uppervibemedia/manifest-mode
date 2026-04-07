/**
 * RevenueCat dev-mode mock bridge.
 * Injected into window.rcBridge when running in browser (non-iOS native)
 * so the RevenueCatPaywall can be tested without a real native wrapper.
 *
 * To enable: add ?rc_mock=1 to the URL in your browser.
 * e.g. https://yourapp.com/pricing?rc_mock=1
 *
 * Import this file in main.jsx BEFORE the app renders.
 */

const MOCK_PACKAGES = [
  {
    identifier: "$rc_monthly_plus",
    product: { priceString: "$7.99", title: "Plus Monthly" },
  },
  {
    identifier: "$rc_monthly_premium",
    product: { priceString: "$14.99", title: "Premium Monthly" },
  },
];

function createMockBridge() {
  let mockTier = "free"; // Start as free, can be set via console: window._rcMockTier = "supporter"

  return {
    getOfferings: async () => {
      await delay(600);
      return { current: { availablePackages: MOCK_PACKAGES } };
    },

    purchasePackage: async (identifier) => {
      await delay(1200);
      // Simulate cancel 20% of the time
      if (Math.random() < 0.2) throw new Error("userCancelled");
      const tier = identifier.includes("premium") ? "premium" : "supporter";
      mockTier = tier;
      return {
        userID: "mock_user_123",
        entitlements: {
          active: {
            [tier === "premium" ? "premium" : "plus"]: { isActive: true },
          },
        },
      };
    },

    getCustomerInfo: async () => {
      await delay(400);
      const active = mockTier === "free" ? {} : {
        [mockTier === "premium" ? "premium" : "plus"]: { isActive: true },
      };
      return { userID: "mock_user_123", entitlements: { active } };
    },

    restorePurchases: async () => {
      await delay(800);
      return {
        entitlements: {
          active: mockTier === "free" ? {} : {
            [mockTier === "premium" ? "premium" : "plus"]: { isActive: true },
          },
        },
      };
    },
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Auto-inject if ?rc_mock=1 is in URL
if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  if (params.get("rc_mock") === "1") {
    window.rcBridge = createMockBridge();
    console.info("[RevenueCat] 🧪 Dev mock bridge injected. Use window._rcMockTier = 'supporter' | 'premium' to simulate tiers.");
  }
}