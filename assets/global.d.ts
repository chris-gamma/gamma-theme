export {};

declare global {
  interface Shopify {
    country: string;
    currency: {
      active: string;
      rate: string;
    };
    designMode: boolean;
    locale: string;
    shop: string;
    loadFeatures(features: ShopifyFeature[], callback?: LoadCallback): void;
    ModelViewerUI?: ModelViewer;
    visualPreviewMode: boolean;
  }

  interface Theme {
    translations: Record<string, string>;
    routes: {
      cart_add_url: string;
      cart_change_url: string;
      cart_update_url: string;
      cart_url: string;
      predictive_search_url: string;
      search_url: string;
    };
    utilities: {
      scheduler: {
        schedule: (task: () => void) => void;
      };
    };
    template: {
      name: string;
    };
    popoverPolyfillReady: Promise<void>;
    supportsNativePopover: boolean;
  }

  /**
   * Minimal Navigation API surface: only `activation`, which view-transitions.js reads. `from === null`
   * means no outgoing same-origin document to snapshot.
   */
  interface NavigationActivation {
    from: NavigationHistoryEntry | null;
    entry: NavigationHistoryEntry;
    navigationType: 'push' | 'replace' | 'reload' | 'traverse';
  }

  interface NavigationHistoryEntry {
    url: string | null;
  }

  interface Window {
    Shopify: Shopify;
    navigation?: {
      activation?: NavigationActivation;
    };
  }

  declare const Shopify: Shopify;
  declare const Theme: Theme;

  type LoadCallback = (error: Error | undefined) => void;

  interface ShopifyFeature {
    name: string;
    version: string;
    onLoad?: LoadCallback;
  }

  interface ModelViewer {
    new (
      element: Element,
      options?: {
        focusOnPlay?: boolean;
      }
    ): ModelViewer;
    play(): void;
    pause(): void;
    toggleFullscreen(): void;
    zoom(amount: number): void;
    destroy(): void;
  }

  interface Navigator {
    readonly deviceMemory?: number;
  }
}

declare module '@shopify/events' {
  interface ProductSelectPayloadDetail {
    optionValueId?: string;
    /** Synchronous variant ID; '' means none. Await the promise for full variant data. */
    variantId?: string;
    connectedProductUrl?: string;
  }
  interface ProductSelectResultDetail {
    /** The requested selection failed and the last confirmed variant was restored. */
    selectionRestored?: boolean;
    html: Document;
    productId: string;
    newProduct?: { id: string; url: string };
    sourceId: string;
    resource?: {
      id?: string;
      title?: string;
      sku?: string;
      available?: boolean;
      price?: number;
      featured_media?: {
        preview_image?: {
          src?: string;
        };
      };
      [k: string]: unknown;
    };
  }
}

declare module '@shopify/events' {
  interface CartErrorPayloadDetail {
    errors?: Record<string, string[]>;
  }
}

declare module '@shopify/events' {
  interface CartDiscountUpdateResultDetail {
    sections?: Record<string, string>;
  }
}

declare module '@shopify/events' {
  interface CartLinesUpdateResultDetail {
    sections?: Record<string, string>;
    didError?: boolean;
    source?: string;
    sourceId?: string;
    itemCount?: number;
  }
}
