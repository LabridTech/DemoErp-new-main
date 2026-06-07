/**
 * Cache utility functions to help with cache busting and version management
 */

// Get the current build version (you can update this when deploying)
export const APP_VERSION = '1.0.0';

// Get the current build timestamp
export const BUILD_TIMESTAMP = new Date().toISOString();

/**
 * Add cache busting parameter to URLs
 */
export function addCacheBuster(url: string, version?: string): string {
  const separator = url.includes('?') ? '&' : '?';
  const versionParam = version || APP_VERSION;
  return `${url}${separator}v=${versionParam}&t=${Date.now()}`;
}

/**
 * Generate a unique cache key for data
 */
export function generateCacheKey(key: string, version?: string): string {
  const versionParam = version || APP_VERSION;
  return `${key}_v${versionParam}_${Date.now()}`;
}

/**
 * Check if the current version matches the stored version
 */
export function isVersionCurrent(storedVersion: string): boolean {
  return storedVersion === APP_VERSION;
}

/**
 * Clear all caches (localStorage, sessionStorage, etc.)
 */
export function clearAllCaches(): void {
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear IndexedDB if used
    if ('indexedDB' in window) {
      indexedDB.databases?.().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      });
    }
    
    // Clear Service Worker caches
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    
    // Clear Cache API if available
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    
    // Force reload to clear memory caches
    window.location.reload();
  } catch (error) {
    console.error('Error clearing caches:', error);
  }
}

/**
 * Clear cache from browser history (more aggressive)
 */
export function clearCacheFromHistory(): void {
  try {
    // Clear all storage
    clearAllCaches();
    
    // Additional history-based clearing
    if (window.history && window.history.replaceState) {
      // Clear URL parameters that might be cached
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
    
    // Clear any stored form data
    if (window.sessionStorage) {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.includes('form') || key.includes('input') || key.includes('cache')) {
          sessionStorage.removeItem(key);
        }
      });
    }
    
  } catch (error) {
    console.error('Error clearing cache from history:', error);
  }
}

/**
 * Force refresh the page with cache busting
 */
export function forceRefresh(): void {
  const url = new URL(window.location.href);
  url.searchParams.set('_cb', Date.now().toString());
  window.location.href = url.toString();
}

/**
 * Check if the page was loaded from cache
 */
export function isPageFromCache(): boolean {
  return window.performance.navigation.type === 2; // TYPE_BACK_FORWARD
}

/**
 * Get cache information for debugging
 */
export function getCacheInfo(): {
  version: string;
  buildTime: string;
  lastModified: string;
  isFromCache: boolean;
  userAgent: string;
} {
  return {
    version: APP_VERSION,
    buildTime: BUILD_TIMESTAMP,
    lastModified: document.lastModified,
    isFromCache: isPageFromCache(),
    userAgent: navigator.userAgent,
  };
}
