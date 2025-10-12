/**
 * Tool Input/Output Hook
 * Provides common state management for tool input and output
 */

import { useState, useCallback } from 'react';

export interface ToolIOState {
    input: string;
    output: string;
    isValid: boolean;
    error?: string;
    setInput: (value: string) => void;
    setOutput: (value: string) => void;
    setValidation: (isValid: boolean, error?: string) => void;
    clear: () => void;
    clearOutput: () => void;
}

/**
 * Hook for managing tool input/output state
 * @param defaultInput - Default input value
 * @param defaultOutput - Default output value
 * @returns Tool I/O state and handlers
 */
export const useToolIO = (
    defaultInput: string = '',
    defaultOutput: string = ''
): ToolIOState => {
    const [input, setInputState] = useState<string>(defaultInput);
    const [output, setOutputState] = useState<string>(defaultOutput);
    const [isValid, setIsValid] = useState<boolean>(true);
    const [error, setError] = useState<string | undefined>(undefined);

    const setInput = useCallback((value: string) => {
        setInputState(value);
        // Reset validation when input changes
        setIsValid(true);
        setError(undefined);
    }, []);

    const setOutput = useCallback((value: string) => {
        setOutputState(value);
    }, []);

    const setValidation = useCallback((valid: boolean, errorMessage?: string) => {
        setIsValid(valid);
        setError(errorMessage);
    }, []);

    const clear = useCallback(() => {
        setInputState('');
        setOutputState('');
        setIsValid(true);
        setError(undefined);
    }, []);

    const clearOutput = useCallback(() => {
        setOutputState('');
        setIsValid(true);
        setError(undefined);
    }, []);

    return {
        input,
        output,
        isValid,
        error,
        setInput,
        setOutput,
        setValidation,
        clear,
        clearOutput
    };
};
