/**
 * JSON Service
 * Handles JSON formatting, validation, and minification operations
 */

export interface ServiceResult<T = string> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Format JSON with specified indentation
 * @param input - Raw JSON string
 * @param spaces - Number of spaces for indentation (default: 2)
 * @returns Formatted result with success status
 */
export const formatJson = (input: string, spaces: number = 2): ServiceResult => {
    try {
        if (!input.trim()) {
            return {
                success: false,
                error: 'Input cannot be empty'
            };
        }

        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, spaces);

        return {
            success: true,
            data: formatted
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Invalid JSON'
        };
    }
};

/**
 * Minify JSON by removing whitespace
 * @param input - Raw JSON string
 * @returns Minified result with success status
 */
export const minifyJson = (input: string): ServiceResult => {
    try {
        if (!input.trim()) {
            return {
                success: false,
                error: 'Input cannot be empty'
            };
        }

        const parsed = JSON.parse(input);
        const minified = JSON.stringify(parsed);

        return {
            success: true,
            data: minified
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Invalid JSON'
        };
    }
};

/**
 * Validate JSON structure
 * @param input - Raw JSON string
 * @returns Validation result
 */
export const validateJson = (input: string): ServiceResult<boolean> => {
    try {
        if (!input.trim()) {
            return {
                success: false,
                error: 'Input cannot be empty'
            };
        }

        JSON.parse(input);

        return {
            success: true,
            data: true
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Invalid JSON',
            data: false
        };
    }
};

/**
 * Parse CSV and convert to JSON
 * Note: This is a basic implementation, for complex CSV use a library like PapaParse
 * @param csv - CSV string
 * @param delimiter - Column delimiter (default: ',')
 * @returns JSON array result
 */
export const csvToJson = (csv: string, delimiter: string = ','): ServiceResult => {
    try {
        if (!csv.trim()) {
            return {
                success: false,
                error: 'CSV input cannot be empty'
            };
        }

        const lines = csv.trim().split('\n');
        if (lines.length < 2) {
            return {
                success: false,
                error: 'CSV must have at least a header and one data row'
            };
        }

        const headers = lines[0].split(delimiter).map(h => h.trim());
        const result = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim());
            const obj: Record<string, string> = {};

            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });

            result.push(obj);
        }

        return {
            success: true,
            data: JSON.stringify(result, null, 2)
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to convert CSV to JSON'
        };
    }
};
