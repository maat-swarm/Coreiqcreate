/**
 * Security, sanitization, and URL validation helpers for CoreIQ API gateway and MCP tools.
 */

const DANGEROUS_PROTOCOL_REGEX = /^(javascript:|data:|http:|blob:|file:|vbscript:)/i;
const SCRIPT_TAG_REGEX = /<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi;
const INLINE_EVENT_HANDLER_REGEX = /\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;

/**
 * Validates URLs against XSS, dangerous protocols, and insecure transports.
 * Allows https:// or same-site relative paths starting with / (excluding //).
 */
export function validateUrl(
  url: string | null | undefined,
  allowRelative = true
): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: true };
  }

  const clean = url.trim();
  if (!clean) return { isValid: true };

  // Reject dangerous protocols
  if (DANGEROUS_PROTOCOL_REGEX.test(clean)) {
    return {
      isValid: false,
      error: 'Insecure or dangerous URL protocol. Only https:// or same-site relative paths (/...) are permitted.',
    };
  }

  // Check for protocol-relative // URLs
  if (clean.startsWith('//')) {
    return { isValid: false, error: 'Protocol-relative URLs starting with // are prohibited.' };
  }

  // Same-site relative URL
  if (clean.startsWith('/')) {
    if (!allowRelative) {
      return { isValid: false, error: 'Relative URLs are not permitted for this field; an https:// URL is required.' };
    }
    return { isValid: true };
  }

  // Absolute URL verification
  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== 'https:') {
      return { isValid: false, error: 'URL must use secure HTTPS protocol (https://).' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Malformed URL provided.' };
  }
}

/**
 * Sanitizes rich-text and text fields against script injection and event handler execution.
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  let sanitized = text;

  // Remove <script> tags and contents
  sanitized = sanitized.replace(SCRIPT_TAG_REGEX, '');

  // Remove inline on* handlers (e.g. onclick=..., onerror=...)
  sanitized = sanitized.replace(INLINE_EVENT_HANDLER_REGEX, '');

  // Strip javascript: occurrences inside href/src attributes
  sanitized = sanitized.replace(/href\s*=\s*['"]?javascript:[^'"]*['"]?/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*['"]?javascript:[^'"]*['"]?/gi, 'src=""');

  return sanitized.trim();
}

/**
 * Sanitizes record fields recursively.
 */
export function sanitizeRecord<T extends Record<string, any>>(record: T): T {
  if (!record || typeof record !== 'object') return record;
  const result: any = Array.isArray(record) ? [] : {};

  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string') {
      result[key] = sanitizeText(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeRecord(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => (typeof item === 'string' ? sanitizeText(item) : sanitizeRecord(item)));
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Strips secret columns from database rows before emitting over REST or MCP.
 * - agent_config.api_key -> removed, has_key: true returned
 * - agent_tools keys -> removed, has_key: true returned
 * - api_keys.key_hash -> removed
 * - store access tokens / signed paths -> removed
 */
export function maskSecrets(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSecrets(item));
  }

  const copy = { ...obj };

  // Agent config masking
  if ('api_key' in copy) {
    const rawKey = copy.api_key;
    delete copy.api_key;
    copy.has_key = Boolean(rawKey && String(rawKey).trim());
    copy.has_api_key = copy.has_key;
  }

  // Agent tools key masking
  if ('tool_api_key' in copy) {
    const rawKey = copy.tool_api_key;
    delete copy.tool_api_key;
    copy.has_key = Boolean(rawKey && String(rawKey).trim());
  }

  // API keys hash masking
  if ('key_hash' in copy) {
    delete copy.key_hash;
  }

  // Store access tokens
  if ('download_token' in copy) {
    delete copy.download_token;
    copy.has_token = true;
  }

  // Store download signed storage paths
  if ('storage_path' in copy && copy.is_signed) {
    delete copy.storage_path;
  }

  return copy;
}
