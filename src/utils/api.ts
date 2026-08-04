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

    // 3. Automatically captured last known backend server origin
    const lastKnownOrigin = localStorage.getItem('naimshop_last_known_server_origin');
    if (lastKnownOrigin) {
      // Only use the saved fallback if we are on a custom domain that doesn't have its own backend.
      // E.g., modeststyleo.com or other domain.
      const isCustomDomain = !window.location.hostname.endsWith('.run.app') && 
                            !window.location.hostname.includes('localhost') && 
                            !window.location.hostname.includes('127.0.0.1') && 
                            !window.location.hostname.includes('gitpod') && 
                            !window.location.hostname.includes('stackblitz');
      if (isCustomDomain) {
        return lastKnownOrigin.replace(/\/$/, '');
      }
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
