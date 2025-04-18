import {
  Limiters,
  LimiterResult,
  TokenLimiter,
  ErrorCode,
  AnyLimiter,
} from "./types.js";

/**
 * Custom error class for limiter
 * @property {string} message - Error message
 * @property {ErrorCode} code - Error code
 */
export class LimiterError extends Error {
  code: string;

  constructor(message: string, code: ErrorCode) {
    super(message);
    this.name = "LimiterError";
    this.code = code;
  }
}

/**
 * Type guard to check if the limiters array contains at least one token limiter.
 */
export function isTokenLimiterArray<T extends readonly AnyLimiter[]>(
  limiters: T
): limiters is T & ReadonlyArray<TokenLimiter> {
  return limiters.some((limiter) => limiter.type === "token");
}

/**
 * Handles error responses based on limiter types and bypass setting.
 * Throws errors when bypass is false, otherwise returns a success response.
 */
export function handleErrorResponse<T extends Limiters>(
  error: any,
  limiters: T,
  bypass = true
): LimiterResult<T, true> {
  const errorCode = error?.error || error?.code || "UNKNOWN_ERROR";
  const errorMessage = error?.message || "An unknown error occurred";

  // Throw error if bypass is false
  if (!bypass) {
    throw new LimiterError(errorMessage, errorCode);
  }

  // Create a success response for error bypass case
  const baseResponse = {
    success: true,
    timeLeft: null,
    message: errorMessage || "Error bypassed",
  };

  // Add tokensLeft property if we have token limiters
  // Convert limiters to array and check if any are token limiters
  const limitersArray = Array.isArray(limiters) ? limiters : [limiters];
  if (isTokenLimiterArray(limitersArray as readonly AnyLimiter[])) {
    return {
      ...baseResponse,
      tokensLeft: 0, // Use 0 as default when an error occurs
    } as LimiterResult<T, true>;
  }

  return baseResponse as LimiterResult<T, true>;
}
