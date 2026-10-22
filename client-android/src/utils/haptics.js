import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Mobile Haptics utility with native Capacitor + Web API fallback
 */
export async function triggerHaptic(type = 'light') {
  try {
    if (type === 'light') {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (type === 'medium') {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (type === 'heavy') {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (type === 'success') {
      await Haptics.notification({ type: 'SUCCESS' });
    }
    return;
  } catch {
    // Fallback to web navigator.vibrate if not inside native shell
    try {
      if ('vibrate' in navigator) {
        if (type === 'heavy') navigator.vibrate(30);
        else if (type === 'medium') navigator.vibrate(18);
        else navigator.vibrate(10);
      }
    } catch {}
  }
}
