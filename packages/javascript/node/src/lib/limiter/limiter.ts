import borrow, { BorrowClient } from "@lib/client.js";
import {
  Limiters,
  LimiterResult,
  Params,
  LimiterParams,
  AnyLimiter,
} from "@lib/limiter/types.js";
import { getSupabaseRequestInfo } from "../utils.js";
import {
  handleErrorResponse,
  isTokenLimiterArray,
  // @ts-expect-error It's being used by JSDoc
  LimiterError,
} from "@lib/limiter/utils.js";

const failBehaviorString = {
  bypass: "Bypassing this error since failBehavior is set to 'bypass'.",
};

// Helper function to check if an object is a params object
function isParamsObject(obj: any): boolean {
  // Check if it's a Request object first
  if (obj instanceof Request) return false;

  // Check if it has typical Params object properties
  return (
    typeof obj === "object" &&
    obj !== null &&
    ("limiters" in obj || "options" in obj)
  );
}

/**
 * @typedef {Object} Params
 * This type represents the parameters object for the limiter function,
 * including:
 * - id: The unique identifier for the rate limiter.
 * - userIdentifier: Either a unique user identifier (string) or a Supabase Request object.
 * - limiters: A limiter object (or array of them) where each includes a 'type' field and type-specific properties:
 *   - For 'fixed' and 'sliding' limiters:
 *     - maxRequests: The maximum number of requests allowed
 *     - interval: Either one of "minute", "hour", "day", "week", "month", or a number (treated as seconds)
 *   - For 'token' limiters:
 *     - maxTokens: The maximum number of tokens allowed
 *     - tokensCost: The cost of the request in tokens
 *     - tokensPerReplenish: The number of tokens to replenish
 *     - interval: Either one of "minute", "hour", "day", "week", "month", or a number (treated as seconds)
 *   - For 'borrow' limiters:
 *     - borrowAction: The action to take when borrowing
 *     - timeout: The timeout duration
 * - options: Optional common limiter options (apiKey, failBehavior, debug).
 */

/**
 * Checks the global rate limit.
 *
 * @param {Params<T>} params - The parameters object containing all limiter configuration.
 * @throws {LimiterError} - If the request fails and failBehavior is set to "fail".
 * @returns {LimiterResultPromise<T, R>}
 */
export function limiter<T extends Limiters>(
  params: Params<T>
): Promise<LimiterResult<T, boolean>>;

/**
 * Checks the rate limit with an ID.
 *
 * @param {string} id - The unique identifier used to scope the limiter.
 * @param {Params<T>} params - The parameters object containing all limiter configuration.
 * @throws {LimiterError} - If the request fails and failBehavior is set to "fail".
 * @returns {LimiterResultPromise<T, R>}
 */
export function limiter<T extends Limiters>(
  id: string,
  params: Params<T>
): Promise<LimiterResult<T, boolean>>;

/**
 * Checks the rate limit with a userIdentifier.
 *
 * @param {string|Request} userIdentifier - A unique user identifier (e.g.: user ID, email).
 * @param {Params<T>} params - The parameters object containing all limiter configuration.
 * @throws {LimiterError} - If the request fails and failBehavior is set to "fail".
 * @returns {LimiterResultPromise<T, R>}
 */
export function limiter<T extends Limiters>(
  userIdentifier: string,
  params: Params<T>
): Promise<LimiterResult<T, boolean>>;

/**
 * Checks the rate limit linked to this Supabase edge function endpoint and user identifier who made the request.
 *
 * @param {string|Request} request - A Supabase Request object.
 * @param {Params<T>} params - The parameters object containing all limiter configuration.
 * @throws {LimiterError} - If the request fails and failBehavior is set to "fail".
 * @returns {LimiterResultPromise<T, R>}
 */
export function limiter<T extends Limiters>(
  supabaseRequest: Request,
  params: Params<T>
): Promise<LimiterResult<T, boolean>>;

/**
 * Checks the rate limit with an ID and userIdentifier.
 *
 * @param {string} id - The unique identifier used to scope the limiter.
 * @param {string|Request} userIdentifier - A unique user identifier (e.g., user ID, email) or a Supabase Request object.
 * @param {Params<T>} params - The parameters object containing all limiter configuration.
 * @throws {LimiterError} - If the request fails and failBehavior is set to "fail".
 * @returns {LimiterResultPromise<T, R>}
 */
export function limiter<T extends Limiters>(
  id: string,
  userIdentifier: string | Request,
  params: Params<T>
): Promise<LimiterResult<T, boolean>>;

export async function limiter<T extends Limiters>(
  arg0: string | Request | Params<T>,
  arg1?: string | Request | Params<T>,
  arg2?: Params<T>
): Promise<LimiterResult<T, boolean>> {
  // Initialize the params object that we'll build based on the arguments
  let finalParams: any = {};

  // Case 1: limiter(params)
  // Single params object
  if (typeof arg0 === "object" && isParamsObject(arg0)) {
    finalParams = arg0;
  }
  // Case 2: limiter(id, params)
  else if (
    typeof arg0 === "string" &&
    typeof arg1 === "object" &&
    isParamsObject(arg1)
  ) {
    finalParams = { ...arg1, id: arg0 };
  }
  // Case 3: limiter(userIdentifier, params)
  else if (
    (typeof arg0 === "string" || arg0 instanceof Request) &&
    typeof arg1 === "object" &&
    isParamsObject(arg1)
  ) {
    finalParams = { ...arg1, userIdentifier: arg0 };
  }
  // Case 4: limiter(id, userIdentifier, params)
  else if (
    typeof arg0 === "string" &&
    (typeof arg1 === "string" || arg1 instanceof Request) &&
    typeof arg2 === "object"
  ) {
    finalParams = { ...arg2, id: arg0, userIdentifier: arg1 };
  } else {
    throw new Error("Invalid arguments provided to limiter function");
  }

  const params: LimiterParams<T> = finalParams;

  // Resolve the final user identifier and possibly extract URL for id
  let finalUserIdentifier: string | null = null;
  let urlAsId: string | undefined;

  if (params.userIdentifier instanceof Request) {
    const requestInfo = await getSupabaseRequestInfo(
      params.userIdentifier,
      params.options?.debug
    );

    // If we got a user ID from the request, use that as the user identifier
    if (requestInfo.userId) {
      finalUserIdentifier = requestInfo.userId;
    } else {
      // If no user ID is found and we're in debug mode, log a warning
      if (params.options?.debug) {
        console.warn("No user identifier found in Supabase Request object.");
      }
    }

    // If we got a URL from the request and no explicit ID was provided, use the URL as the ID
    if (requestInfo.url && !params.id) {
      urlAsId = requestInfo.url;
      if (params.options?.debug) {
        console.info(`Using request URL as limiter ID: ${urlAsId}`);
      }
    }
  }

  // Use request URL as ID if no explicit ID was provided and URL is available
  const limiterKey = params.id || urlAsId;

  // If we don't have a user identifier or a limiter ID, we can't proceed
  if (!finalUserIdentifier && !limiterKey) {
    if (params.options?.debug) {
      console.warn("No user identifier or limiter ID available.");
    }
    const bypassErrors = params.options?.failBehavior !== "fail";

    return handleErrorResponse(
      {
        message:
          "No user identifier or limiter ID found. " +
          failBehaviorString.bypass,
        code: "MISSING_PARAMETERS",
      },
      params.limiters as T,
      bypassErrors
    );
  }

  // Choose the correct Borrow client.
  const borrowClient = params.options?.apiKey
    ? new BorrowClient(params.options.apiKey)
    : borrow;

  try {
    // Format limiters according to API spec with 'type' field
    // Convert the Limiters type to an array for mapping
    const limitersArray = Array.isArray(params.limiters)
      ? params.limiters
      : [params.limiters];

    // Use type assertion to tell TypeScript this is an array of AnyLimiter
    const formattedLimiters = (limitersArray as AnyLimiter[]).map((limiter) => {
      const type = limiter.type;

      // Base limiter with type
      const formattedLimiter: Record<string, any> = { type };

      switch (type) {
        case "fixed":
        case "sliding":
          // Fixed and sliding limiters have the same structure
          return {
            ...formattedLimiter,
            maxRequests: limiter.maxRequests,
            interval: limiter.interval,
          };
        case "token":
          return {
            ...formattedLimiter,
            maxTokens: limiter.maxTokens,
            tokensCost: limiter.tokensCost,
            tokensPerReplenish: limiter.tokensPerReplenish,
            interval: limiter.interval,
          };
        case "borrow":
          return {
            ...formattedLimiter,
            borrowAction: limiter.borrowAction,
            timeout: limiter.timeout,
          };
        default:
          // Unknown limiter type, pass through as is
          return limiter;
      }
    });

    const response = await borrowClient.post("/limiter", {
      body: JSON.stringify({
        key: limiterKey,
        userId: finalUserIdentifier,
        limiters: formattedLimiters,
        action: "check",
      }),
    });

    const data = (await response.json()) as {
      result: "success" | "limited" | "error";
      message: string;
      timeLeft?: number | null;
      tokensLeft?: number | null;
    };

    if (data.result === "limited") {
      if (params.options?.debug) {
        console.warn(
          `Rate limit exceeded for id: ${limiterKey} with userIdentifier: ${finalUserIdentifier}. Message: ${data.message}`
        );
      }

      // Use Array.isArray to check if params.limiters is an array before passing to isTokenLimiterArray
      if (
        Array.isArray(params.limiters) &&
        isTokenLimiterArray(params.limiters)
      ) {
        // For limiters with token type, include tokensLeft
        return {
          success: false,
          timeLeft: data.timeLeft as number,
          message: data.message,
          tokensLeft: data.tokensLeft as number,
        } as LimiterResult<T, boolean>;
      } else {
        // For limiters without token type, do NOT include tokensLeft
        return {
          success: false,
          timeLeft: data.timeLeft as number,
          message: data.message,
        } as LimiterResult<T, boolean>;
      }
    }

    if (!response.ok) {
      const errorMessage = `Limiter returned an error for id: ${
        limiterKey || "[not provided]"
      } with userIdentifier: ${
        finalUserIdentifier || "[not provided]"
      }. Message: ${data.message}`;
      const bypassErrors = params.options?.failBehavior !== "fail";

      if (params.options?.debug) {
        console.warn(errorMessage);
      }

      return handleErrorResponse(
        {
          message: errorMessage,
          code: "LIMITER_ERROR",
        },
        params.limiters as T,
        bypassErrors
      );
    }

    if (params.options?.debug) {
      console.info(
        `Limiter passed for id: ${limiterKey} with userIdentifier: ${finalUserIdentifier}. Message: ${data.message}`
      );
    }

    // Use Array.isArray to check if params.limiters is an array before passing to isTokenLimiterArray
    if (
      Array.isArray(params.limiters) &&
      isTokenLimiterArray(params.limiters)
    ) {
      return {
        success: true,
        timeLeft: null,
        message: data.message,
        tokensLeft: data.tokensLeft as number,
      } as LimiterResult<T, boolean>;
    } else {
      return {
        success: true,
        timeLeft: null,
        message: data.message,
      } as LimiterResult<T, boolean>;
    }
  } catch (err: any) {
    if (params.options?.debug) {
      console.error(
        `Error calling Borrow API for id: ${limiterKey} with userIdentifier: ${finalUserIdentifier}. Error: `,
        err
      );
    }

    const bypassErrors = params.options?.failBehavior !== "fail";
    // Use Array.isArray to check if params.limiters is an array
    return handleErrorResponse(
      err,
      Array.isArray(params.limiters)
        ? params.limiters
        : ([params.limiters] as unknown as T),
      bypassErrors
    );
  }
}
