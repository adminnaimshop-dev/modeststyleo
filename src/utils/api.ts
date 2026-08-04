/**
 * Utility to manage and resolve the absolute API base URL
 */

export function getApiBaseUrl(): string {
  // 1. Compile-time environment variable override
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
  if (envUrl) {
    return envUrl.replace(/\/$/, ''); // strip trailing slash
  }

  // 2. Runtime explicit override set by admin
  if (typeof window !== 'undefined') {
    const overrideUrl = localStorage.getItem('naimshop_api_base_url');
    if (overrideUrl) {
      return overrideUrl.replace(/\/$/, '');
    }

    // 3. Automatically captured last known backend server origin or default production server fallback
    const lastKnownOrigin = localStorage.getItem('naimshop_last_known_server_origin');
    const isCustomDomain = !window.location.hostname.endsWith('.run.app') && 
                          !window.location.hostname.includes('localhost') && 
                          !window.location.hostname.includes('127.0.0.1') && 
                          !window.location.hostname.includes('gitpod') && 
                          !window.location.hostname.includes('stackblitz');
    
    if (isCustomDomain) {
      const fallbackUrl = lastKnownOrigin || 'https://ais-pre-arur6uzegonedscmwchpa7-210019841488.asia-east1.run.app';
      return fallbackUrl.replace(/\/$/, '');
    }
  }

  // 4. Default relative path (relative to current origin)
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
  (window as any).__fetchInterceptorSetup = true;

  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
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
          return originalFetch(newRequest, init);
        } else {
          const modifiedInit = {
            ...init,
            mode: 'cors' as const,
            credentials: (init?.credentials || 'include') as RequestCredentials,
          };
          return originalFetch(absoluteUrl, modifiedInit);
        }
      }
    }

    return originalFetch(input, init);
  };
}

// Automatically setup the fetch interceptor on module load
if (typeof window !== 'undefined') {
  setupGlobalFetchInterceptor();
}

/**
 * Check if the response is valid JSON. If not, log and return safe representation or throw.
 */
export async function safeParseJson(response: Response, rawText: string): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    console.error(`[API Error] Expected JSON response but received: ${contentType}`);
    console.error(`[API Error] Response content preview: ${rawText.substring(0, 500)}`);
    throw new Error(
      `Server returned non-JSON response (${response.status}). This usually indicates a routing issue or misconfigured custom domain. Please verify that the API server is active and accessible.`
    );
  }

  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch (err: any) {
    console.error("[API Error] JSON parse failure:", err);
    throw new Error(`Server returned invalid JSON response (${response.status}): ${rawText.substring(0, 100)}`);
  }
}
