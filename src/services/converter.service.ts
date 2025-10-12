/**
 * Converter Service
 * Handles timestamp, color, and unit conversions
 */

import { ServiceResult } from './json.service';
import { format, parse } from 'date-fns';

/**
 * Convert timestamp to human-readable date
 * @param timestamp - Unix timestamp (seconds or milliseconds)
 * @param formatString - Output format string (default: 'yyyy-MM-dd HH:mm:ss')
 * @returns Formatted date result
 */
export const timestampToDate = (
    timestamp: number,
    formatString: string = 'yyyy-MM-dd HH:mm:ss'
): ServiceResult => {
    try {
        if (!timestamp) {
            return {
                success: false,
                error: 'Timestamp cannot be empty'
            };
        }

        // Auto-detect if timestamp is in seconds or milliseconds
        const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
        const date = new Date(timestampMs);

        if (isNaN(date.getTime())) {
            return {
                success: false,
                error: 'Invalid timestamp'
            };
        }

        const formatted = format(date, formatString);

        return {
            success: true,
            data: formatted
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to convert timestamp'
        };
    }
};

/**
 * Convert human-readable date to timestamp
 * @param dateString - Date string
 * @param inputFormat - Input format string (default: 'yyyy-MM-dd HH:mm:ss')
 * @returns Unix timestamp result
 */
export const dateToTimestamp = (
    dateString: string,
    inputFormat: string = 'yyyy-MM-dd HH:mm:ss'
): ServiceResult<number> => {
    try {
        if (!dateString) {
            return {
                success: false,
                error: 'Date string cannot be empty'
            };
        }

        const date = parse(dateString, inputFormat, new Date());

        if (isNaN(date.getTime())) {
            return {
                success: false,
                error: 'Invalid date string'
            };
        }

        const timestamp = Math.floor(date.getTime() / 1000);

        return {
            success: true,
            data: timestamp
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to convert date'
        };
    }
};

/**
 * Color formats
 */
export type ColorFormat = 'hex' | 'rgb' | 'hsl';

/**
 * Color value interface
 */
export interface ColorValue {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
}

/**
 * Convert HEX to RGB
 * @param hex - HEX color string (e.g., '#FF5733' or 'FF5733')
 * @returns RGB values
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const sanitized = hex.replace('#', '');

    if (sanitized.length !== 6) {
        return null;
    }

    const r = parseInt(sanitized.substring(0, 2), 16);
    const g = parseInt(sanitized.substring(2, 4), 16);
    const b = parseInt(sanitized.substring(4, 6), 16);

    return { r, g, b };
};

/**
 * Convert RGB to HEX
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns HEX color string
 */
const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => {
        const hex = Math.round(n).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

/**
 * Convert RGB to HSL
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns HSL values
 */
const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
};

/**
 * Convert HSL to RGB
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns RGB values
 */
const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h /= 360;
    s /= 100;
    l /= 100;

    let r: number, g: number, b: number;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
};

/**
 * Convert color between formats
 * @param input - Input color string
 * @param fromFormat - Source format
 * @returns Color in all formats
 */
export const convertColor = (input: string, fromFormat: ColorFormat): ServiceResult<ColorValue> => {
    try {
        if (!input) {
            return {
                success: false,
                error: 'Input cannot be empty'
            };
        }

        let rgb: { r: number; g: number; b: number } | null = null;

        // Parse input based on format
        if (fromFormat === 'hex') {
            rgb = hexToRgb(input);
            if (!rgb) {
                return {
                    success: false,
                    error: 'Invalid HEX color format'
                };
            }
        } else if (fromFormat === 'rgb') {
            const match = input.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (!match) {
                return {
                    success: false,
                    error: 'Invalid RGB color format. Use: rgb(r, g, b)'
                };
            }
            rgb = {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3])
            };
        } else if (fromFormat === 'hsl') {
            const match = input.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (!match) {
                return {
                    success: false,
                    error: 'Invalid HSL color format. Use: hsl(h, s%, l%)'
                };
            }
            rgb = hslToRgb(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
        }

        if (!rgb) {
            return {
                success: false,
                error: 'Failed to parse color'
            };
        }

        // Convert to all formats
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        return {
            success: true,
            data: {
                hex,
                rgb,
                hsl
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to convert color'
        };
    }
};

/**
 * Generate UUID v4
 * @returns UUID string
 */
export const generateUUID = (): ServiceResult => {
    try {
        const uuid = crypto.randomUUID();

        return {
            success: true,
            data: uuid
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate UUID'
        };
    }
};
