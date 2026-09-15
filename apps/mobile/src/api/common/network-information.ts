import { onlineManager } from '@tanstack/react-query';

type NetworkChangeListener = (isOnline: boolean) => void;

/**
 * HealthTech network information listener integrating with TanStack Query's
 * `onlineManager`. Pauses mutations automatically when offline, and retries
 * queued operations in the background once connectivity is re-established.
 */
class NetworkInformationManager {
  private isOnline = true;
  private listeners: Set<NetworkChangeListener> = new Set();

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      this.isOnline = navigator.onLine;

      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('online', () => this.handleNetworkChange(true));
        window.addEventListener('offline', () =>
          this.handleNetworkChange(false)
        );
      }
    }

    onlineManager.setEventListener((setOnline) => {
      const listener: NetworkChangeListener = (status) => setOnline(status);
      this.listeners.add(listener);
      setOnline(this.isOnline);

      return () => {
        this.listeners.delete(listener);
      };
    });
  }

  public handleNetworkChange(status: boolean) {
    if (this.isOnline === status) return;
    this.isOnline = status;
    onlineManager.setOnline(status);
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.warn('[NetworkInformation] Error notifying listener:', err);
      }
    });
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

export const networkInformation = new NetworkInformationManager();
