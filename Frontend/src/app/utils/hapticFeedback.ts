// Haptic Feedback for Mobile Devices

export class HapticFeedback {
  private isSupported: boolean = false;

  constructor() {
    this.isSupported =
      typeof window !== 'undefined' &&
      'vibrate' in navigator &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  // Light tap - Nhẹ nhàng
  public light() {
    if (this.isSupported) {
      navigator.vibrate(10);
    }
  }

  // Medium tap - Vừa phải
  public medium() {
    if (this.isSupported) {
      navigator.vibrate(20);
    }
  }

  // Heavy tap - Mạnh
  public heavy() {
    if (this.isSupported) {
      navigator.vibrate(40);
    }
  }

  // Approval vibration - Khi nhấn Approve
  public approval() {
    if (this.isSupported) {
      navigator.vibrate([30, 50, 30]);
    }
  }

  // Error vibration - Khi có lỗi
  public error() {
    if (this.isSupported) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }
  }

  // Success vibration - Khi thành công
  public success() {
    if (this.isSupported) {
      navigator.vibrate([20, 50, 20]);
    }
  }

  // Check if haptic feedback is supported
  public isFeedbackSupported(): boolean {
    return this.isSupported;
  }
}

export const hapticManager = new HapticFeedback();
