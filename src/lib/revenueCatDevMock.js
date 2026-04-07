/**
 * RevenueCat dev-mode mock bridge.
 * Injected into window.rcBridge when running in browser (non-iOS native)
 * so the RevenueCatPaywall can be tested without a real native wrapper.
 *
 * To enable: add ?rc_mock=1 to the URL in your browser.
 * e.g. https://yourapp.com/pricing?rc_mock=1
 *
 * Console helpers:
 *   window._rcSetTier('supporter')  — set current mock tier
 *   window._rcSetTier('premium')    — set current mock tier
 *   window._rcSetTier('free')       — simulate downgrade / expiry
 *
 * Import this file in main.jsx BEFORE the app renders.
 */

const MOCK_PACKAGES = [
  {
    identifier: "plus_monthly",
    product: { priceString: "$7.99", title: "Plus Monthly", productIdentifier: "plus_monthly" },
  },
  {
    identifier: "plus_annual",
    product: { priceString: "$59.99", title: "Plus Annual", productIdentifier: "plus_annual" },
  },
  {
    identifier: "premium_monthly",
    product: { priceString: "$14.99", title: "Premium Monthly", productIdentifier: "premium_monthly" },
  },
  {
    identifier: "premium_annual",
    product: { priceString: "$119.99", title: "Premium Annual", productIdentifier: "premium_annual" },
  },
];

function makeEntitlements(tier) {
  if (tier === "free") return {};
  const key = tier === "premium" ? "premium" : "plus";
  return {
    [key]: {
      isActive: true,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      productIdentifier: tier === "premium" ? "premium_monthly" : "plus_monthly",
    },
  };
}

function createMockBridge() {
  let mockTier = "free";

  const bridge = {
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
      const active = makeEntitlements(tier);
      return {
        userID: "mock_user_123",
        entitlements: { active },
      };
    },

    getCustomerInfo: async () => {
      await delay(400);
      return {
        userID: "mock_user_123",
        entitlements: { active: makeEntitlements(mockTier) },
      };
    },

    restorePurchases: async () => {
      await delay(800);
      return {
        userID: "mock_user_123",
        entitlements: { active: makeEntitlements(mockTier) },
      };
    },
  };

  return bridge;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Auto-inject if ?rc_mock=1 is in URL
if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  if (params.get("rc_mock") === "1") {
    const bridge = createMockBridge();
    window.rcBridge = bridge;

    // Expose helper to change mock tier from the console
    window._rcSetTier = (tier) => {
      window.rcBridge._mockTier = tier;
      // Patch getCustomerInfo/restorePurchases to use the new tier
      console.info(`[RC Mock] Tier set to: ${tier}`);
    };

    console.info(
      "[RevenueCat] 🧪 Dev mock bridge injected (4 packages: plus/premium × monthly/annual).\n" +
      "  Use window._rcSetTier('supporter' | 'premium' | 'free') to simulate entitlement changes."
    );
  }
}