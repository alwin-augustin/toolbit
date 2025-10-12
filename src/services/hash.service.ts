/**
 * Hash Service
 * Handles generation of various hash algorithms (MD5, SHA-1, SHA-256, SHA-512)
 */

import { ServiceResult } from './json.service';

/**
 * Generate hash using specified algorithm
 * @param input - Input string to hash
 * @param algorithm - Hash algorithm to use
 * @returns Hash result
 */
export const generateHash = async (
    input: string,
    algorithm: 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512'
): Promise<ServiceResult> => {
    try {
        if (!input) {
            return {
                success: false,
                error: 'Input cannot be empty'
            };
        }

        // Convert algorithm name to SubtleCrypto format
        const algoMap: Record<string, string> = {
            'MD5': 'MD5', // Note: MD5 is not supported by SubtleCrypto, needs fallback
            'SHA-1': 'SHA-1',
            'SHA-256': 'SHA-256',
            'SHA-512': 'SHA-512'
        };

        const cryptoAlgo = algoMap[algorithm];

        // MD5 is not supported by Web Crypto API, we'll need a library for that
        if (algorithm === 'MD5') {
            return {
                success: false,
                error: 'MD5 requires external library implementation'
            };
        }

        // Encode the input string
        const encoder = new TextEncoder();
        const data = encoder.encode(input);

        // Generate hash
        const hashBuffer = await crypto.subtle.digest(cryptoAlgo, data);

        // Convert buffer to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return {
            success: true,
            data: hashHex
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : `Failed to generate ${algorithm} hash`
        };
    }
};

/**
 * Generate SHA-1 hash
 * @param input - Input string to hash
 * @returns SHA-1 hash result
 */
export const generateSHA1 = async (input: string): Promise<ServiceResult> => {
    return generateHash(input, 'SHA-1');
};

/**
 * Generate SHA-256 hash
 * @param input - Input string to hash
 * @returns SHA-256 hash result
 */
export const generateSHA256 = async (input: string): Promise<ServiceResult> => {
    return generateHash(input, 'SHA-256');
};

/**
 * Generate SHA-512 hash
 * @param input - Input string to hash
 * @returns SHA-512 hash result
 */
export const generateSHA512 = async (input: string): Promise<ServiceResult> => {
    return generateHash(input, 'SHA-512');
};

/**
 * Generate multiple hashes at once
 * @param input - Input string to hash
 * @param algorithms - Array of algorithms to use
 * @returns Object with all hash results
 */
export const generateMultipleHashes = async (
    input: string,
    algorithms: Array<'SHA-1' | 'SHA-256' | 'SHA-512'>
): Promise<Record<string, ServiceResult>> => {
    const results: Record<string, ServiceResult> = {};

    for (const algo of algorithms) {
        results[algo] = await generateHash(input, algo);
    }

    return results;
};
