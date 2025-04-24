import type { LiteralUnion, TaggedUnion, SimplifyDeep } from "type-fest";

/**
 * The interval in which requests are counted. If a number, treated as seconds.
 */
export type Interval = LiteralUnion<"minute" | "hour" | "day", number>;

/**
 * Configuration schema for a fixed-window limiter.
 */
export interface FixedLimiter extends Record<string, unknown> {
  /**
   * The type of limiter.
   */
  type: "fixed";

  /**
   * The maximum number of requests allowed within the clock interval.
   */
  maxRequests: number;

  /**
   * The interval in which requests are counted. If a number, treated as seconds.
   */
  interval: Interval;
}

/**
 * Configuration schema for a sliding-window limiter.
 */
export interface SlidingLimiter extends Record<string, unknown> {
  /**
   * The type of limiter.
   */
  type: "sliding";

  /**
   * The maximum number of requests allowed within the interval since the first request.
   */
  maxRequests: number;

  /**
   * The interval in which requests are counted. If a number, treated as seconds.
   */
  interval: Interval;
}

/**
 * Configuration schema for a token-bucket limiter.
 */
export interface TokenLimiter extends Record<string, unknown> {
  /**
   * The type of limiter.
   */
  type: "token";

  /**
   * The maximum number of tokens in the bucket.
   */
  maxTokens: number;

  /**
   * The number of tokens to add to the bucket per interval.
   */
  tokensPerReplenish: number;

  /**
   * The amount of tokens this request will consume if available.
   */
  tokensCost: number;

  /**
   * The interval in which tokens are added to the bucket. If a number, treated as seconds.
   */
  interval: Interval;
}

/**
 * Configuration schema for a borrow limiter.
 */
export interface BorrowLimiter extends Record<string, unknown> {
  /**
   * The type of limiter.
   */
  type: "borrow";

  /**
   * Whether this is the start or end of the borrow.
   */
  borrowAction: "start" | "end";

  /**
   * The timeout in seconds until the borrow expires. This is necessary to prevent a borrow from being open indefinitely.
   */
  timeout: number;
}

/**
 * Union type that accepts any type of limiter.
 */
export type AnyLimiter = TaggedUnion<
  "type",
  {
    fixed: FixedLimiter;
    sliding: SlidingLimiter;
    token: TokenLimiter;
    borrow: BorrowLimiter;
  }
>;

/**
 * An array of up to 4 limiter objects of unique types.
 * (TS can enforce minimum length via tuple; maximum length remains in documentation.)
 */
export type Limiters = [AnyLimiter, ...AnyLimiter[]];

/**
 * Common options used by limiter functions.
 */
export interface CommonLimiterOptions {
  /**
   * Your Borrow API key for the current project.
   * @default process.env.BORROW_API_KEY
   */
  apiKey?: string;

  /**
   * The endpoint to use for the Borrow API.
   * Use this option when self-hosting.
   */
  endpoint?: {
    /**
     * The base URL of the Borrow API.
     * @example "https://api.borrow.dev/v1"
     */
    baseUrl: string;
    /**
     * The path to the specific API endpoint.
     * @example "/limiter"
     */
    path?: string;
  };

  /**
   * Determines what happens when the API call fails (e.g: network failure, quota reached, incorrect parameters, etc): "fail" treats it as a failed check, "bypass" treats it as a successful check.
   * @default "bypass"
   */
  failBehavior?: "fail" | "bypass";

  /**
   * Whether to log debug information.
   * @default process.env.NODE_ENV === "development"
   */
  debug?: boolean;
}

/**
 * Parameters accepted by the `limiter` function.
 *
 * Note: Because of overloads, the user identifier may be provided as either a string
 * (explicit identifier), a Supabase Request object (to auto-extract the user), or omitted.
 * In the two-parameter overload, the limiter object is passed as the second argument.
 */
export type LimiterParams<T extends Limiters> = {
  /**
   * The unique identifier used to scope the limiter (e.g., 'download_file').
   */
  id: string;

  /**
   * A unique user identifier (e.g., user ID or email) or a Supabase Request object to extract the user ID from.
   */
  userIdentifier?: string | Request;

  /**
   * An array of up to 4 limiter objects of unique types.
   */
  limiters: T;

  /**
   * Optional settings for the limiter, including API key, failure behavior, and debug options.
   */
  options?: CommonLimiterOptions;
};

/** Common error codes */
export type ErrorCode =
  | "UNAUTHORIZED"
  | "QUOTA_REACHED"
  | "INVALID_PARAMETERS"
  | "MISSING_PARAMETERS";

interface BaseLimiterResult {
  success: boolean;
  message: string;
}

interface SuccessLimiterResult extends BaseLimiterResult {
  success: true;
  timeLeft: null;
}

interface FailureLimiterResult extends BaseLimiterResult {
  success: false;
  timeLeft: number;
}

interface TokenLimiterResultFields {
  tokensLeft: number;
}

/**
 * Extracts whether the limiters array contains token limiters
 */
export type ContainsTokenLimiter<T extends Limiters> = Extract<
  T[number],
  { type: "token" }
> extends never
  ? false
  : true;

/**
 * Creates the appropriate result type based on success state and limiter types
 */
export type LimiterResult<T extends Limiters, R extends boolean> = SimplifyDeep<
  R extends true
    ? SuccessLimiterResult &
        (ContainsTokenLimiter<T> extends true ? TokenLimiterResultFields : {})
    : FailureLimiterResult &
        (ContainsTokenLimiter<T> extends true ? TokenLimiterResultFields : {})
>;

export type Params<T extends Limiters> = {
  /**
   * An array of up to 4 limiter objects of unique types.
   */
  limiters: T;
  options?: CommonLimiterOptions;
};
