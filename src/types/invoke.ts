/**
 * IPC call result data structure
 * Consistent with Rust backend InvokeResponse
 * @template T Type of returned data
 */
export interface InvokeResult<T = any> {
    /** Status code, 0 means success, non-zero means failure */
    code: number;
    /** Error message */
    message: string;
    /** Returned data */
    data?: T;
}

/**
 * Create a successful call result
 * @param data Returned data
 * @returns InvokeResult object
 */
export function createSuccessResult<T>(data: T): InvokeResult<T> {
    return {
        code: 0,
        message: "",
        data
    };
}

/**
 * Create a failed call result
 * @param message Error message
 * @param code Error code, defaults to -1
 * @returns InvokeResult object
 */
export function createErrorResult(message: string, code: number = -1): InvokeResult<never> {
    return {
        code,
        message,
        data: undefined
    };
}

/**
 * Check if the call result is successful
 * @param result InvokeResult object
 * @returns Whether successful
 */
export function isSuccessResult<T>(result: InvokeResult<T>): result is InvokeResult<T> & { data: T } {
    return result.code === 0 && result.data !== undefined;
}

/**
 * Check if the call result is failed
 * @param result InvokeResult object
 * @returns Whether failed
 */
export function isErrorResult<T>(result: InvokeResult<T>): result is InvokeResult<T> & { message: string } {
    return result.code !== 0;
}
