import borrow, { BorrowClient } from "@/lib/client";
import {
  Limiters,
  LimiterResult,
  Params,
  AnyLimiter,
  ErrorCode,
  ResolvedLimiterParams,
  Key,
} from "@/lib/limiter/types";
import {
  handleErrorResponse,
  isTokenLimiterArray,
  // @ts-expect-error It's being used by JSDoc
  // oxlint-disable-next-line no-unused-vars
  LimiterError,
} from "@/lib/limiter/utils";
import { getSupabaseRequestInfo } from "@/lib/utils";

/**
 * @typedef {Object} Params This type represents the parameters object for the
 *   limiter function, including:
 *
 *   - limiters: A limiter object (or array of them) where each includes a 'type'
 *     field and type-specific properties:
 *
 *     - For 'fixed' and 'sliding' limiters:
 *
 *         - maxRequests: The maximum number of requests allowed
 *         - interval: Either one of "minute", "hour", "day", or a number (treated as
 *           seconds)
 *     - For 'token' limiters:
 *
 *         - maxTokens: The maximum number of tokens allowed
 *         - tokensCost: The cost of the request in tokens
 *         - tokensPerReplenish: The number of tokens to replenish
 *         - interval: Either one of "minute", "hour", "day", or a number (treated as
 *           seconds)
 *     - For 'borrow' limiters:
 *
 *         - borrowAction: The action to take when borrowing
 *         - timeout: The timeout duration
 *   - options: Optional common limiter options (apiKey, failBehavior, debug).
 */

/**
 * Checks the global rate limit.
 *
 * @param {Params<T>} params - The parameters object containing all limiter
 *   configuration.
 * @returns {LimiterResultPromise<T, R>}
 * @throws {LimiterError} - If the request fails and failBehavior is set to
 *   "fail".
 */
function limiter<T extends Limiters>(params: Params<T>): Promise<LimiterResult<T, boolean>>;

/**
 * Checks the rate limit for the given key and/or userId.
 *
 * @param {Key} key - Object containing `key` and/or `userId` to scope the
 *   limiter.
 * @param {Params<T>} params - The parameters object containing all limiter
 *   configuration.
 * @returns {LimiterResultPromise<T, R>}
 * @throws {LimiterError} - If the request fails and failBehavior is set to
 *   "fail".
 */
function limiter<T extends Limiters>(
  key: Key,
  params: Params<T>,
): Promise<LimiterResult<T, boolean>>;

/**
 * Checks the rate limit linked to this Supabase edge function endpoint and user
 * identifier who made the request.
 *
 * @param {Request} request - A Supabase Request object.
 * @param {Params<T>} params - The parameters object containing all limiter
 *   configuration.
 * @returns {LimiterResultPromise<T, R>}
 * @throws {LimiterError} - If the request fails and failBehavior is set to
 *   "fail".
 */
function limiter<T extends Limiters>(
  request: Request,
  params: Params<T>,
): Promise<LimiterResult<T, boolean>>;

async function limiter<T extends Limiters>(
  arg0: Key | Request | Params<T>,
  arg1?: Params<T>,
): Promise<LimiterResult<T, boolean>> {
  let finalParams: ResolvedLimiterParams<T>;

  if (arg1 !== undefined) {
    if (arg0 instanceof Request) {
      // limiter(request, params)
      finalParams = { ...(arg1 as any), key: null, userId: null, request: arg0 };
    } else {
      // limiter(key, params)
      finalParams = { ...(arg1 as any), key: (arg0 as Key).key, userId: (arg0 as Key).userId };
    }
  } else {
    // limiter(params)
    finalParams = { ...(arg0 as any), key: null, userId: null };
  }

  const params: ResolvedLimiterParams<T> = finalParams;

  // If a Supabase Request was provided, extract userId and key from it
  if (params.request) {
    const requestInfo = await getSupabaseRequestInfo(params.request, params.options?.debug);
    if (requestInfo.userId) {
      params.userId = requestInfo.userId;
    } else if (params.options?.debug) {
      console.warn("No user identifier found in Supabase Request object.");
    }
    if (requestInfo.url) {
      params.key = requestInfo.url;
      if (params.options?.debug) {
        console.info(`Using request URL as limiter key: ${params.key}`);
      }
    }
  }

  try {
    // Choose the correct Borrow client.
    const borrowClient =
      params.options?.apiKey || params.options?.endpoint
        ? new BorrowClient(params.options.apiKey, params.options.endpoint?.baseUrl)
        : borrow;

    // Format limiters according to API spec with 'type' field
    // Convert the Limiters type to an array for mapping
    const limitersArray = Array.isArray(params.limiters) ? params.limiters : [params.limiters];

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

    const response = await borrowClient.post(params.options?.endpoint?.path || "/limiter", {
      body: JSON.stringify({
        key: params.key,
        userId: params.userId,
        limiters: formattedLimiters,
        action: "check",
      }),
    });

    const data = (await response.json()) as {
      result: "success" | "limited" | "error";
      message: string;
      code?: ErrorCode;
      timeLeft?: number | null;
      tokensLeft?: number | null;
    };

    if (data.result === "limited") {
      if (params.options?.debug) {
        console.warn(
          `Rate limit exceeded for key: ${params.key} with userId: ${params.userId}. Message: ${data.message}`,
        );
      }

      // Use Array.isArray to check if params.limiters is an array before passing to isTokenLimiterArray
      if (Array.isArray(params.limiters) && isTokenLimiterArray(params.limiters)) {
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

    if (!response.ok || data.result === "error") {
      const errorMessage = `Limiter returned an error for key: ${
        params.key || "[not provided]"
      } with userId: ${params.userId || "[not provided]"}. Message: ${data.message}`;
      const bypassErrors = params.options?.failBehavior !== "fail";

      if (params.options?.debug) {
        console.warn(errorMessage);
      }

      return handleErrorResponse(
        {
          message: errorMessage,
          code: data.code!,
        },
        params.limiters as T,
        bypassErrors,
      );
    }

    if (params.options?.debug) {
      console.info(
        `Limiter passed for key: ${params.key} with userId: ${params.userId}. Message: ${data.message}`,
      );
    }

    // Use Array.isArray to check if params.limiters is an array before passing to isTokenLimiterArray
    if (Array.isArray(params.limiters) && isTokenLimiterArray(params.limiters)) {
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
        `Error calling Borrow API for key: ${params.key} with userId: ${params.userId}. Error: `,
        err,
      );
    }

    const bypassErrors = params.options?.failBehavior !== "fail";
    // Use Array.isArray to check if params.limiters is an array
    return handleErrorResponse(
      err,
      Array.isArray(params.limiters) ? params.limiters : ([params.limiters] as unknown as T),
      bypassErrors,
    );
  }
}

export default limiter;
