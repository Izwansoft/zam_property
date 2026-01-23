/**
 * Sensitive Data Masking Utility
 * Session 4.4 - Audit Logging
 *
 * Masks PII and sensitive data in audit records.
 */

import { SENSITIVE_FIELDS } from '../types/audit.types';

const MASKED_VALUE = '***REDACTED***';

/**
 * Check if a field name is sensitive.
 */
export function isSensitiveField(fieldName: string): boolean {
  const lowerName = fieldName.toLowerCase();
  return SENSITIVE_FIELDS.some(
    (sensitive) =>
      lowerName === sensitive.toLowerCase() || lowerName.includes(sensitive.toLowerCase()),
  );
}

/**
 * Mask email address (show first 2 chars + domain).
 */
function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return email;
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart.substring(0, 2)}***@${domain}`;
}

/**
 * Mask phone number (show last 4 digits).
 */
function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return phone;
  return `***${digits.slice(-4)}`;
}

/**
 * Mask IP address (show first 2 octets).
 */
function maskIpAddress(ip: string): string {
  if (!ip || typeof ip !== 'string') return ip;
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  // IPv6 or other format
  return ip.substring(0, 8) + '***';
}

/**
 * Deep clone and mask sensitive data in an object.
 */
export function maskSensitiveData<T extends Record<string, unknown>>(
  data: T | undefined | null,
  options: {
    maskEmails?: boolean;
    maskPhones?: boolean;
    maskIps?: boolean;
    additionalFields?: string[];
  } = {},
): T | undefined {
  if (data === null || data === undefined) {
    return undefined;
  }

  const { maskEmails = true, maskPhones = true, maskIps = false, additionalFields = [] } = options;

  const allSensitiveFields = [...SENSITIVE_FIELDS, ...additionalFields.map((f) => f.toLowerCase())];

  function maskValue(key: string, value: unknown): unknown {
    const lowerKey = key.toLowerCase();

    // Check if field is in sensitive list
    if (
      allSensitiveFields.some(
        (sensitive) =>
          lowerKey === sensitive.toLowerCase() || lowerKey.includes(sensitive.toLowerCase()),
      )
    ) {
      return MASKED_VALUE;
    }

    // Mask emails
    if (
      maskEmails &&
      (lowerKey === 'email' || lowerKey.includes('email')) &&
      typeof value === 'string' &&
      value.includes('@')
    ) {
      return maskEmail(value);
    }

    // Mask phone numbers
    if (
      maskPhones &&
      (lowerKey === 'phone' ||
        lowerKey.includes('phone') ||
        lowerKey === 'mobile' ||
        lowerKey.includes('mobile')) &&
      typeof value === 'string'
    ) {
      return maskPhone(value);
    }

    // Mask IP addresses
    if (
      maskIps &&
      (lowerKey === 'ip' || lowerKey === 'ipaddress' || lowerKey === 'ip_address') &&
      typeof value === 'string'
    ) {
      return maskIpAddress(value);
    }

    // Recursively mask nested objects
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map((item, index) =>
          typeof item === 'object' && item !== null ? maskValue(String(index), item) : item,
        );
      }
      return maskObject(value as Record<string, unknown>);
    }

    return value;
  }

  function maskObject(obj: Record<string, unknown>): Record<string, unknown> {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      masked[key] = maskValue(key, value);
    }
    return masked;
  }

  return maskObject(data) as T;
}

/**
 * Compare two objects and return only the changed fields.
 */
export function getChangedFields<T extends Record<string, unknown>>(
  oldValue: T | undefined | null,
  newValue: T | undefined | null,
): { oldFields: Partial<T>; newFields: Partial<T> } {
  if (!oldValue && !newValue) {
    return { oldFields: {}, newFields: {} };
  }

  if (!oldValue) {
    return { oldFields: {}, newFields: newValue || {} };
  }

  if (!newValue) {
    return { oldFields: oldValue, newFields: {} };
  }

  const oldFields: Record<string, unknown> = {};
  const newFields: Record<string, unknown> = {};

  // Get all unique keys
  const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);

  for (const key of allKeys) {
    const oldVal = oldValue[key];
    const newVal = newValue[key];

    // Skip if values are the same
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) {
      continue;
    }

    // Record changed values
    if (oldVal !== undefined) {
      oldFields[key] = oldVal;
    }
    if (newVal !== undefined) {
      newFields[key] = newVal;
    }
  }

  return {
    oldFields: oldFields as Partial<T>,
    newFields: newFields as Partial<T>,
  };
}

/**
 * Truncate long string values for storage.
 */
export function truncateForAudit<T extends Record<string, unknown>>(
  data: T | undefined | null,
  maxStringLength = 1000,
  maxObjectDepth = 5,
): T | undefined {
  if (data === null || data === undefined) {
    return undefined;
  }

  function truncateValue(value: unknown, depth: number): unknown {
    if (depth > maxObjectDepth) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    if (typeof value === 'string' && value.length > maxStringLength) {
      return value.substring(0, maxStringLength) + '...[TRUNCATED]';
    }

    if (Array.isArray(value)) {
      if (value.length > 100) {
        return [
          ...value.slice(0, 100).map((v) => truncateValue(v, depth + 1)),
          `...[${value.length - 100} more items]`,
        ];
      }
      return value.map((v) => truncateValue(v, depth + 1));
    }

    if (value !== null && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const truncated: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        truncated[k] = truncateValue(v, depth + 1);
      }
      return truncated;
    }

    return value;
  }

  return truncateValue(data, 0) as T;
}
