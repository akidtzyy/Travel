const MIDTRANS_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY as string;
const SNAP_JS_URL = `https://app.sandbox.midtrans.com/snap/snap.js`;

let snapScriptLoaded = false;

/**
 * Dynamically load Midtrans snap.js script.
 * Safe to call multiple times — loads only once.
 */
export function loadSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (snapScriptLoaded && typeof window.snap !== 'undefined') {
      resolve();
      return;
    }

    // Remove any stale script tag
    const existing = document.getElementById('midtrans-snap-js');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = 'midtrans-snap-js';
    script.src = SNAP_JS_URL;
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    script.onload = () => {
      snapScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Midtrans snap.js'));
    document.head.appendChild(script);
  });
}

export interface SnapCallbacks {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
}

export interface SnapResult {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  [key: string]: unknown;
}

/**
 * Open Midtrans Snap payment popup.
 * Loads snap.js if not already loaded.
 */
export async function openSnapPayment(snapToken: string, callbacks: SnapCallbacks = {}): Promise<void> {
  await loadSnapScript();

  if (typeof window.snap === 'undefined') {
    throw new Error('Midtrans Snap SDK not available');
  }

  window.snap.pay(snapToken, {
    onSuccess: (result: SnapResult) => {
      callbacks.onSuccess?.(result);
    },
    onPending: (result: SnapResult) => {
      callbacks.onPending?.(result);
    },
    onError: (result: SnapResult) => {
      callbacks.onError?.(result);
    },
    onClose: () => {
      callbacks.onClose?.();
    },
  });
}

// Augment window type for snap
declare global {
  interface Window {
    snap: {
      pay: (token: string, options: Record<string, unknown>) => void;
    };
  }
}
