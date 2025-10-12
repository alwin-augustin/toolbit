/**
 * Tool Validation Hook
 * Provides common validation patterns for tool inputs
 */

import { useCallback } from 'react';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export interface ValidationOptions {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    customValidator?: (value: string) => ValidationResult;
}

/**
 * Hook for validating tool inputs
 * @returns Validation functions
 */
export const useToolValidation = () => {
    /**
     * Validate input against provided options
     * @param value - Input value to validate
     * @param options - Validation options
     * @returns Validation result
     */
    const validate = useCallback((
        value: string,
        options: ValidationOptions = {}
    ): ValidationResult => {
        const {
            required = false,
            minLength,
            maxLength,
            pattern,
            customValidator
        } = options;

        // Check required
        if (required && !value.trim()) {
            return {
                isValid: false,
                error: 'This field is required'
            };
        }

        // Check min length
        if (minLength !== undefined && value.length < minLength) {
            return {
                isValid: false,
                error: `Minimum length is ${minLength} characters`
            };
        }

        // Check max length
        if (maxLength !== undefined && value.length > maxLength) {
            return {
                isValid: false,
                error: `Maximum length is ${maxLength} characters`
            };
        }

        // Check pattern
        if (pattern && !pattern.test(value)) {
            return {
                isValid: false,
                error: 'Invalid format'
            };
        }

        // Run custom validator
        if (customValidator) {
            return customValidator(value);
        }

        return {
            isValid: true
        };
    }, []);

    /**
     * Validate JSON string
     * @param value - JSON string to validate
     * @returns Validation result
     */
    const validateJson = useCallback((value: string): ValidationResult => {
        if (!value.trim()) {
            return {
                isValid: false,
                error: 'JSON input cannot be empty'
            };
        }

        try {
            JSON.parse(value);
            return {
                isValid: true
            };
        } catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Invalid JSON'
            };
        }
    }, []);

    /**
     * Validate Base64 string
     * @param value - Base64 string to validate
     * @returns Validation result
     */
    const validateBase64 = useCallback((value: string): ValidationResult => {
        if (!value.trim()) {
            return {
                isValid: false,
                error: 'Base64 input cannot be empty'
            };
        }

        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Pattern.test(value)) {
            return {
                isValid: false,
                error: 'Invalid Base64 format'
            };
        }

        return {
            isValid: true
        };
    }, []);

    /**
     * Validate URL
     * @param value - URL string to validate
     * @returns Validation result
     */
    const validateUrl = useCallback((value: string): ValidationResult => {
        if (!value.trim()) {
            return {
                isValid: false,
                error: 'URL cannot be empty'
            };
        }

        try {
            new URL(value);
            return {
                isValid: true
            };
        } catch {
            return {
                isValid: false,
                error: 'Invalid URL format'
            };
        }
    }, []);

    /**
     * Validate HEX color
     * @param value - HEX color string to validate
     * @returns Validation result
     */
    const validateHexColor = useCallback((value: string): ValidationResult => {
        if (!value.trim()) {
            return {
                isValid: false,
                error: 'Color cannot be empty'
            };
        }

        const hexPattern = /^#?[0-9A-Fa-f]{6}$/;
        if (!hexPattern.test(value)) {
            return {
                isValid: false,
                error: 'Invalid HEX color format (e.g., #FF5733)'
            };
        }

        return {
            isValid: true
        };
    }, []);

    /**
     * Validate number
     * @param value - String to validate as number
     * @param options - Min and max constraints
     * @returns Validation result
     */
    const validateNumber = useCallback((
        value: string,
        options: { min?: number; max?: number } = {}
    ): ValidationResult => {
        if (!value.trim()) {
            return {
                isValid: false,
                error: 'Number cannot be empty'
            };
        }

        const num = Number(value);
        if (isNaN(num)) {
            return {
                isValid: false,
                error: 'Invalid number'
            };
        }

        if (options.min !== undefined && num < options.min) {
            return {
                isValid: false,
                error: `Number must be at least ${options.min}`
            };
        }

        if (options.max !== undefined && num > options.max) {
            return {
                isValid: false,
                error: `Number must be at most ${options.max}`
            };
        }

        return {
            isValid: true
        };
    }, []);

    return {
        validate,
        validateJson,
        validateBase64,
        validateUrl,
        validateHexColor,
        validateNumber
    };
};
