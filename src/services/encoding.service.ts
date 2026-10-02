import { base64Transform } from '@/lib/tool-contract';
/**
 * Encoding Service
 * Handles Base64, URL encoding/decoding, and HTML entity operations
 */

import { type ServiceResult } from './result';

/**
 * Encode string to Base64
 * @param input - Plain text string
 * @returns Base64 encoded result
 */
export const encodeBase64 = (input: string): ServiceResult => {
  if (!input) return { success: false, error: 'Input cannot be empty' };
  const result = base64Transform(input, 'encode', false);
  return result.ok
    ? { success: true, data: result.value }
    : { success: false, error: 'Invalid Base64 input' };
};

/**
 * Decode Base64 string
 * @param input - Base64 encoded string
 * @returns Decoded plain text result
 */
export const decodeBase64 = (input: string): ServiceResult => {
  if (!input) return { success: false, error: 'Input cannot be empty' };
  const result = base64Transform(input, 'decode', false);
  return result.ok
    ? { success: true, data: result.value }
    : { success: false, error: 'Invalid Base64 input' };
};

/**
 * Encode URL component
 * @param input - Plain text string
 * @returns URL encoded result
 */
export const encodeUrl = (input: string): ServiceResult => {
  try {
    if (!input) {
      return {
        success: false,
        error: 'Input cannot be empty',
      };
    }

    const encoded = encodeURIComponent(input);

    return {
      success: true,
      data: encoded,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to encode URL',
    };
  }
};

/**
 * Decode URL component
 * @param input - URL encoded string
 * @returns Decoded plain text result
 */
export const decodeUrl = (input: string): ServiceResult => {
  try {
    if (!input) {
      return {
        success: false,
        error: 'Input cannot be empty',
      };
    }

    const decoded = decodeURIComponent(input);

    return {
      success: true,
      data: decoded,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid URL encoded string',
    };
  }
};

/**
 * Escape HTML entities
 * @param input - Plain text string
 * @returns HTML escaped result
 */
export const escapeHtml = (input: string): ServiceResult => {
  try {
    if (!input) {
      return {
        success: false,
        error: 'Input cannot be empty',
      };
    }

    const escaped = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return {
      success: true,
      data: escaped,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to escape HTML',
    };
  }
};

/**
 * Unescape HTML entities
 * @param input - HTML escaped string
 * @returns Plain text result
 */
export const unescapeHtml = (input: string): ServiceResult => {
  try {
    if (!input) {
      return {
        success: false,
        error: 'Input cannot be empty',
      };
    }

    const textarea = document.createElement('textarea');
    textarea.innerHTML = input;
    const unescaped = textarea.value;

    return {
      success: true,
      data: unescaped,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unescape HTML',
    };
  }
};
