import { useState, useEffect } from "react";
import { useApi } from "./useApi";
import { useNotification } from "../context/NotificationContext";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { apiCall } = useApi();
  const { updateUnreadCount } = useNotification();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const profileId = sessionStorage.getItem("profileId");
      if (!profileId) {
        console.error("No profile ID found in session storage");
        return;
      }

      const response = await apiCall({
        method: "GET",
        url: `/api/Notification?profileId=${profileId}`,
      });

      setNotifications(response);

      // Update unread count
      const unreadCount = response.filter((n) => !n.isViewed).length;
      updateUnreadCount(unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (notificationId) => {
    try {
      const profileId = sessionStorage.getItem("profileId");
      if (!profileId) {
        console.error("No profile ID found in session storage");
        return;
      }

      await apiCall({
        method: "PUT",
        url: `/api/Notification/${notificationId}/viewed?profileId=${profileId}`,
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, isViewed: true, viewedDateTime: new Date().toISOString() }
            : n
        )
      );

      // Update unread count
      const unreadCount = notifications.filter((n) => !n.isViewed).length - 1;
      updateUnreadCount(unreadCount);
    } catch (error) {
      console.error("Error marking notification as viewed:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    loading,
    fetchNotifications,
    markAsViewed,
  };
};
