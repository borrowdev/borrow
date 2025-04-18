import borrow, { BorrowClient } from "../client.js";
import { CommonLimiterOptions } from "./types.js";

/**
 * Key interface for refill tokens
 */
export interface Key {
  /**
   * The unique identifier used to scope the limiter.
   */
  key?: string;

  /**
   * A unique user identifier (e.g., user ID or email).
   */
  userId?: string;
}

// Function to validate a key
function validateKey(key: Key): boolean {
  if (!key.key && !key.userId) {
    throw new Error("At least one of 'id' or 'userId' must be provided");
  }
  return true;
}

// Options for refillTokens
export type RefillTokensOptions = CommonLimiterOptions;

// Response type for refill tokens operation
type RefillTokensResponse = {
  success: boolean;
  message: string;
};

/**
 * Refills tokens for a global limiter.
 *
 * @param {boolean} isGlobal - If true, refills tokens for the global token limiter.
 * @param {RefillTokensOptions} [options] - Optional settings.
 * @returns {Promise<RefillTokensResponse>} - The result of the refill operation.
 */
export function refillTokens(
  isGlobal: boolean,
  options?: RefillTokensOptions
): Promise<RefillTokensResponse>;

/**
 * Refills tokens for a specific key.
 *
 * @param {Key} key - Object containing either id or userId, or both.
 * @param {RefillTokensOptions} [options] - Optional settings.
 * @returns {Promise<RefillTokensResponse>} - The result of the refill operation.
 */
export function refillTokens(
  key: Key,
  options?: RefillTokensOptions
): Promise<RefillTokensResponse>;

/**
 * Refills tokens for multiple keys.
 *
 * @param {Key[]} keys - Array of objects containing either id or userId, or both.
 * @param {RefillTokensOptions} [options] - Optional settings.
 * @returns {Promise<RefillTokensResponse>} - The result of the refill operation.
 */
export function refillTokens(
  keys: Key[],
  options?: RefillTokensOptions
): Promise<RefillTokensResponse>;

export async function refillTokens(
  arg0: boolean | Key | Key[],
  arg1?: RefillTokensOptions
): Promise<RefillTokensResponse> {
  // Parse options
  const options = arg1 || {};

  // Choose the correct Borrow client
  const borrowClient = options?.apiKey
    ? new BorrowClient(options.apiKey)
    : borrow;

  try {
    // Prepare request body based on input
    let requestBody: any = {
      action: "refillTokens",
    };

    // Handle different argument patterns
    if (typeof arg0 === "boolean") {
      // Global refill case, no keys needed
      requestBody.keys = null;
    } else if (Array.isArray(arg0)) {
      // Array of keys
      const validatedKeys = arg0.map((key) => {
        validateKey(key);
        return key;
      });
      requestBody.keys = validatedKeys;
    } else {
      // Single key object
      validateKey(arg0);
      requestBody.keys = [arg0];
    }

    if (options?.debug) {
      console.info(`Refilling tokens with params:`, requestBody);
    }

    // Make the API call
    const response = await borrowClient.post("/limiter", {
      body: JSON.stringify(requestBody),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      const errorMessage = `Failed to refill tokens: ${
        data.message || response.statusText
      }`;

      if (options?.debug) {
        console.warn(errorMessage);
      }

      const bypassErrors = options?.failBehavior !== "fail";

      if (!bypassErrors) {
        throw new Error(errorMessage);
      }

      return {
        success: false,
        message: errorMessage,
      };
    }

    if (options?.debug) {
      console.info(`Successfully refilled tokens: ${data.message}`);
    }

    return {
      success: true,
      message: data.message || "Tokens refilled successfully",
    };
  } catch (err: any) {
    if (options?.debug) {
      console.error(`Error refilling tokens:`, err);
    }

    const bypassErrors = options?.failBehavior !== "fail";

    if (!bypassErrors) {
      throw err;
    }

    return {
      success: false,
      message: err.message || "Failed to refill tokens",
    };
  }
}
