import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = Capacitor.isNativePlatform();

export function hapticCorrect(): void {
  if (!isNative) return;
  Haptics.notification({ type: NotificationType.Success });
}

export function hapticIncorrect(): void {
  if (!isNative) return;
  Haptics.notification({ type: NotificationType.Error });
}

export function hapticTap(): void {
  if (!isNative) return;
  Haptics.impact({ style: ImpactStyle.Light });
}
