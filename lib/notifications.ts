// Utility for Web Push Notifications & In-App Alerts

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    alert('Browser notifications are not supported on this device/browser.')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      sendNativeNotification('🔔 Notifications Enabled!', {
        body: 'You will now receive alerts for incoming contract offers, bids, and market updates on your phone.'
      })
      return true
    } else {
      alert('Notification permission was denied. You can enable it in your browser site settings.')
      return false
    }
  } catch (err) {
    console.error('Error requesting notification permission:', err)
    return false
  }
}

export async function sendNativeNotification(title: string, options?: { body?: string; icon?: string; url?: string }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return

  if (Notification.permission === 'granted') {
    const notificationOptions = {
      icon: options?.icon || '/logo_2.png',
      body: options?.body || 'Check your portal for updates!',
      badge: '/logo_2.png',
      data: { url: options?.url || '/' }
    };

    try {
      // For iOS Safari, new Notification() doesn't work, so we use the service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, notificationOptions);
          return;
        }
      }

      // Fallback for browsers that support the constructor
      new Notification(title, notificationOptions);
    } catch (e) {
      console.error('Failed to trigger native notification:', e);
      
      // Secondary fallback
      try {
        new Notification(title, notificationOptions);
      } catch (innerError) {
        console.error('Fallback notification also failed:', innerError);
      }
    }
  }
}
