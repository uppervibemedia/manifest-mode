import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Hook to manage notification permission requests and default setup.
 * Triggers after Daily Shift completion or after first assessment.
 */
export function useNotificationSetup(user, profile, isFirstShift) {
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    // Check if notifications are already asked or permission modal should show
    const shouldPrompt =
      !profile.notifications_permission_asked &&
      isFirstShift &&
      "Notification" in window &&
      Notification.permission === "default";

    if (shouldPrompt) {
      setShowPermissionModal(true);
    }
  }, [user?.email, profile?.notifications_permission_asked, isFirstShift]);

  const handleAllowNotifications = async (settings) => {
    try {
      // Update user profile with default notification settings
      await base44.auth.updateMe({
        ...settings,
        notifications_permission_asked: true,
      });
      setShowPermissionModal(false);
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    }
  };

  const handleDismissModal = async () => {
    try {
      // Mark that we asked, even if user said no
      await base44.auth.updateMe({
        notifications_permission_asked: true,
      });
      setShowPermissionModal(false);
    } catch (error) {
      console.error("Failed to update notification preference:", error);
    }
  };

  return {
    showPermissionModal,
    onAllowNotifications: handleAllowNotifications,
    onDismissModal: handleDismissModal,
  };
}