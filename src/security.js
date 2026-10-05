import CryptoJS from 'crypto-js';

const SECRET_KEY = 'ekomobil_web_2024_secure_key';
const TIME_WINDOW = 4000;

/**
 * Generate security token matching ekomobil's security.js
 * Format: md5(timestamp + secret_key)
 */
export function generateToken(customTimestamp) {
  const timestamp = customTimestamp || Date.now();
  const hashInput = `${timestamp}${SECRET_KEY}`;
  const token = CryptoJS.MD5(hashInput).toString();
  return {
    token,
    timestamp,
  };
}

/**
 * Get security headers for AJAX / Fetch requests
 */
export function getSecurityHeaders() {
  const tokenData = generateToken();
  return {
    'X-Security-Token': tokenData.token,
    'X-Security-Timestamp': tokenData.timestamp.toString(),
  };
}

/**
 * Determine API base URL.
 * In development or when localhost / dev server is detected,
 * route requests through the Vite dev proxy to prevent CORS issues.
 */
export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || import.meta.env.DEV) {
      return '/ekomobil-api';
    }
    // If a custom proxy is provided in window or localStorage
    if (window.EKOMOBIL_PROXY_URL) {
      return window.EKOMOBIL_PROXY_URL.replace(/\/$/, '');
    }
    const savedProxy = localStorage.getItem('EKOMOBIL_PROXY_URL') || localStorage.getItem('proxyUrl');
    if (savedProxy) {
      return savedProxy.replace(/\/$/, '');
    }
  }
  return 'https://e-komobil.com';
}

/**
 * Helper to build the full API URL
 */
export function getEndpointUrl(endpoint) {
  const base = getApiBaseUrl();
  const cleanedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanedEndpoint}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Robust fetch wrapper that applies fresh security headers and auto-retries transient 500 errors.
 */
export async function fetchWithSecurity(endpointOrUrl, options = {}, retries = 3) {
  let url = endpointOrUrl;
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/ekomobil-api')) {
    url = getEndpointUrl(endpointOrUrl);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const securityHeaders = getSecurityHeaders();
      const headers = {
        ...securityHeaders,
        ...(options.headers || {}),
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // e-komobil occasionally returns transient HTTP 500 on high concurrency/load
        if (response.status === 500 && attempt < retries) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (err) {
      if (attempt < retries) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
}

// Attach to window for global compatibility matching https://e-komobil.com/js/security.js
if (typeof window !== 'undefined') {
  window.EkomobilSecurity = {
    generateToken,
    getSecurityHeaders,
    SECRET_KEY,
    TIME_WINDOW,
  };
}

export default {
  generateToken,
  getSecurityHeaders,
  getApiBaseUrl,
  getEndpointUrl,
  fetchWithSecurity,
};
