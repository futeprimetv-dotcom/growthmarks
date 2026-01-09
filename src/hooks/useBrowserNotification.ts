import { useCallback, useEffect, useState } from "react";

export function useBrowserNotification() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("Este navegador não suporta notificações");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      return false;
    }
  }, []);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions & { onClick?: () => void }) => {
      if (!("Notification" in window)) {
        return null;
      }

      if (Notification.permission !== "granted") {
        return null;
      }

      const { onClick, ...notificationOptions } = options || {};

      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...notificationOptions,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        onClick?.();
      };

      return notification;
    },
    []
  );

  return {
    permission,
    isSupported: "Notification" in window,
    requestPermission,
    sendNotification,
  };
}
