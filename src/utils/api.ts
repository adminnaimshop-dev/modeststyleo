/**
 * Utility to manage and resolve the absolute API base URL
 */

export function getApiBaseUrl(): string {
  // 1. Compile-time environment variable override
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.replace(/\/$/, ''); // strip trailing slash
  }

  // 2. Runtime explicit override set by admin in settings
  if (typeof window !== 'undefined') {
    const overrideUrl = localStorage.getItem('naimshop_api_base_url');
    if (overrideUrl) {
      return overrideUrl.replace(/\/$/, '');
    }

    // 3. Fallback for custom domains (e.g. modeststyleo.com): route API calls directly to Cloud Run backend
    const hostname = window.location.hostname;
    const isCustomDomain = !hostname.endsWith('.run.app') && 
                          !hostname.includes('localhost') && 
                          !hostname.includes('127.0.0.1') && 
                          !hostname.includes('gitpod') && 
                          !hostname.includes('stackblitz') && 
                          !hostname.includes('aistudio');
    if (isCustomDomain) {
      const savedOrigin = localStorage.getItem('naimshop_last_known_server_origin');
      const fallbackUrl = savedOrigin || 'https://ais-pre-arur6uzegonedscmwchpa7-210019841488.asia-east1.run.app';
      return fallbackUrl.replace(/\/$/, '');
    }
  }

  // 4. Default relative path (for Cloud Run and localhost)
  return '';
}

/**
 * Capture the current server origin if running in a preview/development environment
 */
export function captureServerOrigin() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isServerEnv = hostname.endsWith('.run.app') || 
                        hostname.includes('localhost') || 
                        hostname.includes('127.0.0.1') || 
                        hostname.includes('gitpod') || 
                        hostname.includes('stackblitz') || 
                        hostname.includes('aistudio');
    if (isServerEnv) {
      localStorage.setItem('naimshop_last_known_server_origin', window.location.origin);
    }
  }
}

/**
 * Global fetch interceptor to automatically route relative API calls on custom domains to the absolute backend url.
 */
export function setupGlobalFetchInterceptor() {
  if (typeof window === 'undefined') return;
  if ((window as any).__fetchInterceptorSetup) return;

  try {
    const originalFetch = window.fetch;
    if (!originalFetch) return;

    const customFetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      let url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (input && typeof input === 'object' && 'url' in input) {
        url = input.url;
      }

      // Check if we are calling a relative `/api/` endpoint
      if (url.startsWith('/api/') || url === '/api') {
        const apiBase = getApiBaseUrl();
        if (apiBase) {
          // Rewrite the URL to be absolute pointing to the correct backend server
          const absoluteUrl = `${apiBase.replace(/\/$/, '')}${url}`;
          
          console.log(`[Fetch Interceptor] Routing relative API call ${url} -> ${absoluteUrl}`);
          
          // If input is a Request object, we need to clone it with the new URL
          if (input instanceof Request) {
            const newRequest = new Request(absoluteUrl, {
              method: input.method,
              headers: input.headers,
              body: input.body,
              mode: 'cors',
              credentials: input.credentials || 'include',
              cache: input.cache,
              redirect: input.redirect,
              referrer: input.referrer,
              integrity: input.integrity,
              keepalive: input.keepalive,
              signal: input.signal,
            });
            return originalFetch.call(window, newRequest, init);
          } else {
            const modifiedInit = {
              ...init,
              mode: 'cors' as const,
              credentials: (init?.credentials || 'include') as RequestCredentials,
            };
            return originalFetch.call(window, absoluteUrl, modifiedInit);
          }
        }
      }

      return originalFetch.call(window, input, init);
    };

    try {
      window.fetch = customFetch;
    } catch {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
      });
    }

    (window as any).__fetchInterceptorSetup = true;
  } catch (err) {
    console.warn('[Fetch Interceptor] Could not hook into window.fetch:', err);
  }
}

// Automatically setup the fetch interceptor on module load
if (typeof window !== 'undefined') {
  setupGlobalFetchInterceptor();
}

/**
 * Check if the response is valid JSON. If not, log and return safe representation or throw.
 */
export async function safeParseJson(response: Response, rawText: string): Promise<any> {
  const trimmed = rawText ? rawText.trim() : '';

  // 1. If text is valid JSON formatted string, parse and return it immediately
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // ignore and fall through
    }
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    console.error(`[API Error] Expected JSON response but received: ${contentType}`);
    console.error(`[API Error] Response content preview: ${trimmed.substring(0, 300)}`);
    throw new Error(
      `Server returned non-JSON response (${response.status}). This usually indicates a routing issue or misconfigured custom domain. Please verify that the API server is active and accessible.`
    );
  }

  try {
    return trimmed ? JSON.parse(trimmed) : {};
  } catch (err: any) {
    console.error("[API Error] JSON parse failure:", err);
    throw new Error(`Server returned invalid JSON response (${response.status}): ${trimmed.substring(0, 100)}`);
  }
}

/**
 * Utility to compress large base64 image data URLs on the client side
 */
export async function compressBase64Image(
  base64Str: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.75
): Promise<string> {
  if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image')) {
    return base64Str || '';
  }

  // If already small (< 80KB), return as is
  if (base64Str.length < 80000) {
    return base64Str;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/webp', quality);
        resolve(compressed);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}

/**
 * Universal helper to upload image base64 strings to server with automatic fallback & compression
 */
export async function uploadImageToServer(base64Str: string, folder = 'uploads'): Promise<string> {
  if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image')) {
    return base64Str || '';
  }

  try {
    // 1. First compress base64 to keep payload lightweight
    const compressed = await compressBase64Image(base64Str, 800, 800, 0.75);

    // 2. Resolve absolute API base URL
    const baseUrl = getApiBaseUrl();
    const uploadEndpoint = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/upload` : '/api/upload';

    const res = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: compressed, folder })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.url) {
        return data.url;
      }
    }

    return compressed;
  } catch (err) {
    console.warn('[uploadImageToServer] Upload endpoint error, using compressed base64 fallback:', err);
    return await compressBase64Image(base64Str, 400, 400, 0.6);
  }
}

