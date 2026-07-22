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

export function sendNativeNotification(title: string, options?: { body?: string; icon?: string }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: options?.icon || '/logo_2.png',
        body: options?.body || 'Check your portal for updates!',
        badge: '/logo_2.png'
      })
    } catch (e) {
      console.error('Failed to trigger native notification:', e)
    }
  }
}
