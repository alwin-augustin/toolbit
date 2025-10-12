/**
 * Text Service
 * Handles text manipulation operations like case conversion, whitespace stripping, word counting
 */

import { ServiceResult } from './json.service';

/**
 * Case conversion types
 */
export type CaseType =
    | 'camelCase'
    | 'PascalCase'
    | 'snake_case'
    | 'kebab-case'
    | 'CONSTANT_CASE'
    | 'Title Case'
    | 'Sentence case'
    | 'lowercase'
    | 'UPPERCASE';

/**
 * Convert text to specified case
 * @param input - Input text
 * @param caseType - Target case type
 * @returns Converted text result
 */
export const convertCase = (input: string, caseType: CaseType): ServiceResult => {
    try {
        if (!input) {
            return {
                success: false,
                error: 'Input cannot be empty'
            };
        }

        let result: string;

        switch (caseType) {
            case 'camelCase':
                result = input
                    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
                        index === 0 ? letter.toLowerCase() : letter.toUpperCase()
                    )
                    .replace(/\s+/g, '');
                break;

            case 'PascalCase':
                result = input
                    .replace(/(?:^\w|[A-Z]|\b\w)/g, letter => letter.toUpperCase())
                    .replace(/\s+/g, '');
                break;

            case 'snake_case':
                result = input
                    .replace(/\s+/g, '_')
                    .replace(/([a-z])([A-Z])/g, '$1_$2')
                    .toLowerCase();
                break;

            case 'kebab-case':
                result = input
                    .replace(/\s+/g, '-')
                    .replace(/([a-z])([A-Z])/g, '$1-$2')
                    .toLowerCase();
                break;

            case 'CONSTANT_CASE':
                result = input
                    .replace(/\s+/g, '_')
                    .replace(/([a-z])([A-Z])/g, '$1_$2')
                    .toUpperCase();
                break;

            case 'Title Case':
                result = input
                    .toLowerCase()
                    .replace(/\b\w/g, letter => letter.toUpperCase());
                break;

            case 'Sentence case':
                result = input
                    .toLowerCase()
                    .replace(/(^\w|\.\s+\w)/g, letter => letter.toUpperCase());
                break;

            case 'lowercase':
                result = input.toLowerCase();
                break;

            case 'UPPERCASE':
                result = input.toUpperCase();
                break;

            default:
                return {
                    success: false,
                    error: `Unknown case type: ${caseType}`
                };
        }

        return {
            success: true,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to convert case'
        };
    }
};

/**
 * Word count statistics
 */
export interface WordCountStats {
    characters: number;
    charactersNoSpaces: number;
    words: number;
    sentences: number;
    paragraphs: number;
    lines: number;
}

/**
 * Count words, characters, sentences, etc.
 * @param input - Input text
 * @returns Word count statistics
 */
export const countWords = (input: string): ServiceResult<WordCountStats> => {
    try {
        if (!input) {
            const emptyStats: WordCountStats = {
                characters: 0,
                charactersNoSpaces: 0,
                words: 0,
                sentences: 0,
                paragraphs: 0,
                lines: 0
            };

            return {
                success: true,
                data: emptyStats
            };
        }

        const stats: WordCountStats = {
            characters: input.length,
            charactersNoSpaces: input.replace(/\s/g, '').length,
            words: input.trim().split(/\s+/).filter(word => word.length > 0).length,
            sentences: input.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length,
            paragraphs: input.split(/\n\n+/).filter(para => para.trim().length > 0).length,
            lines: input.split(/\n/).length
        };

        return {
            success: true,
            data: stats
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to count words'
        };
    }
};

/**
 * Strip whitespace options
 */
export type StripWhitespaceMode = 'leading' | 'trailing' | 'both' | 'all' | 'extra';

/**
 * Strip whitespace from text
 * @param input - Input text
 * @param mode - Whitespace stripping mode
 * @returns Stripped text result
 */
export const stripWhitespace = (input: string, mode: StripWhitespaceMode): ServiceResult => {
    try {
        if (!input) {
            return {
                success: false,
                error: 'Input cannot be empty'
            };
        }

        let result: string;

        switch (mode) {
            case 'leading':
                result = input.replace(/^\s+/gm, '');
                break;

            case 'trailing':
                result = input.replace(/\s+$/gm, '');
                break;

            case 'both':
                result = input.replace(/^\s+|\s+$/gm, '');
                break;

            case 'all':
                result = input.replace(/\s+/g, '');
                break;

            case 'extra':
                result = input.replace(/\s+/g, ' ').trim();
                break;

            default:
                return {
                    success: false,
                    error: `Unknown strip mode: ${mode}`
                };
        }

        return {
            success: true,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to strip whitespace'
        };
    }
};

/**
 * Compare two texts and find differences
 * @param text1 - First text
 * @param text2 - Second text
 * @returns Comparison result with diff information
 */
export const diffTexts = (text1: string, text2: string): ServiceResult<string> => {
    try {
        // Simple line-by-line diff
        const lines1 = text1.split('\n');
        const lines2 = text2.split('\n');
        const maxLength = Math.max(lines1.length, lines2.length);

        const diff: string[] = [];

        for (let i = 0; i < maxLength; i++) {
            const line1 = lines1[i] || '';
            const line2 = lines2[i] || '';

            if (line1 !== line2) {
                diff.push(`Line ${i + 1}:`);
                if (line1) diff.push(`- ${line1}`);
                if (line2) diff.push(`+ ${line2}`);
                diff.push('');
            }
        }

        return {
            success: true,
            data: diff.length > 0 ? diff.join('\n') : 'No differences found'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to compare texts'
        };
    }
};
