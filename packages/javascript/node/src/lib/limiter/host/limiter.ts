import { StorageAdapter } from "./adapters/storage/StorageAdapter.js";
import { borrow, fixed, sliding, token } from "./algorithms.js";
import { z } from "zod";

type LimiterParams = z.infer<typeof inputLimiterParamsSchema>;
export type ParsedLimiterParams = z.infer<typeof outputLimiterParamsSchema>;

export function getUsageKey(userUuid: string, projectId: string) {
  return `limiter:usage:${userUuid}:${projectId}`;
}

export function isomorphicExecute(
  promise: Promise<unknown>,
  backgroundExecute: ParsedLimiterParams["backgroundExecute"]
) {
  if (typeof backgroundExecute === "function") {
    backgroundExecute(promise);
  }

  return promise;
}

function getBiggest(numbers: number[]) {
  return Math.max(...numbers);
}

export function getCurrentWindow(
  dateInSeconds = Date.now() / 1000,
  // Only fixed windows need this
  interval?: number
) {
  return typeof interval === "number"
    ? dateInSeconds / interval
    : dateInSeconds;
}

export function isNewWindow(
  lastWindow: number,
  currentWindow: number,
  // TODO: Remove or implement timeout
  _timeout: number,
  // Only sliding windows need this, fixed windows have
  // their interval calculated differently
  interval?: number
) {
  const cleanLastWindow = Math.trunc(lastWindow);
  const cleanCurrentWindow = Math.trunc(currentWindow);
  return interval
    ? cleanCurrentWindow - cleanLastWindow > interval
    : cleanCurrentWindow > cleanLastWindow;
}

const asyncNoop = () => Promise.resolve();
export type UserData = z.infer<typeof userDataSchema>;

type LimiterHandlerResponse = {
  result: "success" | "error" | "limited";
  status: number;
  error?: "INVALID_PARAMS" | "UNAUTHORIZED";
  message: string;
  timeLeft: number | null;
  tokensLeft?: number | null;
};

export type Storage = typeof storage;
const storage = {
  storeUserData: async (params: {
    key: string | null;
    userId: string | null;
    amount: number;
    type: "exact" | "relative";
    limiterType: LimiterType;
    adapters: z.infer<typeof adaptersSchema>;
    userData?: UserData | null;
  }) => {
    const key = params.adapters.storage.getStorageKey({
      key: params.key,
      userId: params.userId,
      limiterType: params.limiterType,
    });

    if (params.type === "exact") {
      const { key: _key, ...userData } = params.userData || {};
      await params.adapters.storage.set(key, {
        ...userData,
        requests: params.amount,
      });
    } else if (params.type === "relative") {
      await params.adapters.storage.relative(key, "requests", params.amount);
    }
  },

  getUserData: async (params: z.infer<typeof retrievalAdapterParamsSchema>) => {
    if (!params.adapters) {
      throw new Error("You must provide storage adapters");
    }

    const key = params.adapters.storage.getStorageKey({
      key: params.key,
      userId: params.userId,
      limiterType: params.limiterType,
    });

    const userData = (await params.adapters.storage.get(
      key
    )) as UserData | null;

    // If the user doesn't exist yet
    if (!userData) {
      const fallbackUserData: z.infer<typeof userDataSchema> = {
        key,
        type: params.limiterType,
        requests: 0,
        lastWindow: getCurrentWindow(
          Date.now() / 1000,
          params.limiterType === "fixed" ? params.interval : undefined
        ),
        ...(params.interval ? { interval: params.interval } : {}),
      } as const;

      await storage.storeUserData({
        key: params.key,
        userId: params.userId,
        amount: 0,
        type: "exact",
        adapters: params.adapters,
        limiterType: params.limiterType,
        userData: fallbackUserData,
      });

      return fallbackUserData;
    }

    if (typeof userData.lastWindow === "string") {
      userData.lastWindow = parseFloat(userData.lastWindow);
    }

    return userData;
  },

  beforeResponse: asyncNoop,
};

const positiveIntSchema = z.number().positive().int();

export type LimiterType = z.infer<typeof limiterTypeSchema>;
const limiterTypeSchema = z.enum(["fixed", "sliding", "token", "borrow"]);

const identifierSchema = z.object({
  userId: z.string().nullable(),
  key: z.string().nullable(),
});

// TODO: Discriminated union for limiter types instead of using `optional`
const userDataSchema = z.object({
  key: z.string(),
  type: limiterTypeSchema,
  requests: positiveIntSchema.optional(),
  lastWindow: positiveIntSchema.optional(),
  interval: positiveIntSchema.optional(),
  maxTokens: positiveIntSchema.optional(),
});

const limiterIntervalSchema = z.union([
  z.enum(["minute", "hour", "day"]),
  positiveIntSchema,
]);

const limitersSchema = z
  .array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("fixed"),
        maxRequests: positiveIntSchema,
        interval: limiterIntervalSchema,
      }),
      z.object({
        type: z.literal("sliding"),
        maxRequests: positiveIntSchema,
        interval: limiterIntervalSchema,
      }),
      z.object({
        type: z.literal("token"),
        maxRequests: positiveIntSchema.optional(),
        interval: limiterIntervalSchema,
        tokensCost: positiveIntSchema,
        tokensPerReplenish: positiveIntSchema,
        maxTokens: positiveIntSchema,
      }),
      z.object({
        type: z.literal("borrow"),
        borrowAction: z.enum(["start", "end"]).optional(),
        timeout: positiveIntSchema,
      }),
    ])
  )
  .min(1, "You must provide at least 1 limiter configuration")
  .max(4, "You can provide at most 4 limiter configurations")
  .refine((limiters) => {
    const types = limiters.map((l) => l.type);
    return new Set(types).size === types.length;
  }, "All limiters must have a unique 'type'");

const requestCommonSchema = z.object({
  /**
   * If provided, will check if `invokeSecret` matches the secret stored in the environment variable `BORROW_LIMITER_INVOKE_SECRET`
   * before allowing the request to proceed. Only use this along with `BORROW_LIMITER_INVOKE_SECRET` when you want your servers to be able to call this function, such as when using this API
   * to rate limit your own servers.
   */
  invokeSecret: z.string().optional(),
});

export type RequestCheckSchema = z.infer<typeof requestCheckSchema>;
const requestCheckSchema = requestCommonSchema.extend({
  ...identifierSchema.shape,
  action: z.literal("check"),
  limiters: limitersSchema,
});
export type RequestRefillTokensSchema = z.infer<
  typeof requestRefillTokensSchema
>;
const requestRefillTokensSchema = requestCommonSchema.extend({
  action: z.literal("refillTokens"),
  keys: z
    .array(
      z.object({
        userId: z.string().nullable(),
        key: z.string().nullable(),
      })
    )
    .min(1)
    .max(100)
    .nullable(),
});

const requestSchema = z.discriminatedUnion("action", [
  requestCheckSchema,
  requestRefillTokensSchema,
]);

export type Adapters = z.infer<typeof adaptersSchema>;
const adaptersSchema = z.object({
  /**
   * The storage adapter to use for keeping track of requests to the rate limiter.
   * We highly recommend using Redis or other atomic and high-throughput database for production environments, as the amount of requests
   * Limiter can handle is highly limited by the database performance.
   */
  storage: z.instanceof(StorageAdapter),
});

const retrievalAdapterParamsSchema = z.object({
  key: z.string().nullable(),
  userId: z.string().nullable(),
  limiterType: limiterTypeSchema,
  interval: z.number().optional(),
  adapters: adaptersSchema,
});

const inputLimiterParamsSchema = z.object({
  req: requestSchema,
  /**
   * By default, Borrow updates the request counter in the background to avoid high latency, this is the function to use to perform operations in the background.
   * When using serverless functions, this is usually a variation of `waitUntil`, but may be called something else. For example, in Supabase Edge Functions, this is `EdgeRuntime.waitUntil`.
   * If you want to update the request counter synchronously, you can provide this parameter with `false`.
   * @default false
   */
  backgroundExecute: z
    .union([
      z.function().args(z.promise(z.any())).returns(z.void()),
      z.literal(false),
    ])
    .optional(),
  adapters: adaptersSchema,
  /**
   * Environment variables. Use this when deploying to a serverless environment such as Cloudflare Workers.
   */
  env: z.record(z.string(), z.any()).default({}).optional(),
  /**
   * Optional hooks to get notified when certain actions happen.
   */
  hooks: z
    .object({
      /**
       * Execute a function before the response is sent. This gets executed in the background, unless `backgroundExecute` is set to `false`.
       */
      beforeResponse: z
        .function(
          z.tuple([
            z.object({
              result: z.enum(["success", "error", "limited"]),
              error: z.enum(["INVALID_PARAMS", "UNAUTHORIZED"]).optional(),
              status: positiveIntSchema,
              message: z.string(),
              timeLeft: positiveIntSchema.nullable().optional().default(null),
              tokensLeft: positiveIntSchema.nullable().optional().default(null),
            }),
          ]),
          z.promise(z.void())
        )
        .optional(),
    })
    .optional(),
});

const outputLimiterParamsSchema = inputLimiterParamsSchema.transform((data) => {
  // Transform intervals to seconds
  return {
    ...data,
    req: {
      ...(data.req.action === "check"
        ? {
            // For some reason we need to repeat this so TypeScript can infer the discriminated union type correctly
            ...data.req,
            key: data.req.key?.trim?.() || null,
            limiters: data.req.limiters.map((l) =>
              l.type === "borrow"
                ? l
                : {
                    ...l,
                    interval:
                      typeof l.interval === "string"
                        ? l.interval === "minute"
                          ? 60
                          : l.interval === "hour"
                          ? 60 * 60
                          : l.interval === "day"
                          ? 60 * 60 * 24
                          : l.interval
                        : l.interval,
                  }
            ),
          }
        : {
            // For some reason we need to repeat this so TypeScript can infer the discriminated union type correctly
            ...data.req,
            keys: data.req.keys
              ? data.req.keys.map((k) => ({
                  userId: k.userId?.trim?.() || null,
                  key: k.key?.trim?.() || null,
                }))
              : null,
          }),
    },
    hooks: {
      beforeResponse: data.hooks?.beforeResponse || asyncNoop,
    },
    backgroundExecute: data.backgroundExecute || (false as const),
  };
});

async function refillTokens(params: {
  backgroundExecute: ParsedLimiterParams["backgroundExecute"];
  keys: { userId: string | null; key: string | null }[] | null;
  adapters: z.infer<typeof adaptersSchema>;
  storage: Storage; // Optional for testing purposes
}) {
  const finalKeys: {
    userId: string | null;
    key: string | null;
  }[] = [];

  // Refill global key
  if (params.keys === null) {
    finalKeys.push({
      userId: null,
      key: null,
    });
  } else {
    params.keys.forEach((key) =>
      finalKeys.push({
        userId: key.userId,
        key: key.key,
      })
    );
  }

  await Promise.all(
    finalKeys.map((key) =>
      params.storage.storeUserData({
        key: key.key,
        userId: key.userId,
        limiterType: "token",
        amount: 0,
        type: "exact",
        adapters: params.adapters,
      })
    )
  );
}

function getIsomorphicEnvVariable(
  variableName: string,
  env: any
): string | undefined {
  if (env) {
    return env[variableName];
  }

  // @ts-expect-error We're checking for Deno env
  if (typeof Deno !== "undefined" && Deno.env?.get) {
    // @ts-expect-error We're checking for Deno env
    return Deno.env.get(variableName);
  } else if (typeof process !== "undefined" && process.env) {
    return process.env[variableName];
  }
  return undefined;
}

export async function limiter(
  params: LimiterParams
): Promise<LimiterHandlerResponse> {
  const {
    success,
    data: parsedParams,
    error,
  } = outputLimiterParamsSchema.safeParse(params);

  if (!success) {
    const commonParams = {
      result: "error",
      status: 400,
      error: "INVALID_PARAMS",
      message: error.message,
      timeLeft: null,
    } as const;

    return commonParams;
  }

  if (
    typeof getIsomorphicEnvVariable(
      "BORROW_LIMITER_INVOKE_SECRET",
      parsedParams.env
    ) === "string" &&
    parsedParams.req.invokeSecret !==
      getIsomorphicEnvVariable("BORROW_LIMITER_INVOKE_SECRET", parsedParams.env)
  ) {
    const commonParams = {
      result: "error",
      status: 401,
      error: "UNAUTHORIZED",
      message: "Invalid invoke secret.",
      timeLeft: null,
    } as const;

    const beforeResponse = parsedParams.hooks.beforeResponse;
    await isomorphicExecute(
      beforeResponse(commonParams),
      parsedParams.backgroundExecute
    );
    return commonParams;
  }

  if (parsedParams.req.action === "refillTokens") {
    await refillTokens({
      backgroundExecute: parsedParams.backgroundExecute,
      keys: parsedParams.req.keys,
      adapters: parsedParams.adapters,
      storage,
    });

    const commonParams = {
      result: "success",
      status: 200,
      message: "Tokens refilled successfully.",
      timeLeft: null,
    } as const;

    const beforeResponse = parsedParams.hooks.beforeResponse;
    await isomorphicExecute(
      beforeResponse(commonParams),
      parsedParams.backgroundExecute
    );

    return commonParams;
  }

  const result: (
    | {
        success: boolean;
      }
    | {
        success: boolean;
        timeLeft: number | null;
      }
    | {
        success: boolean;
        timeLeft: number | null;
        tokensLeft: number | null;
      }
    | null
  )[] = await Promise.all(
    parsedParams.req.limiters.map(async (limiter) => {
      // For some reason TypeScript can't currently infer the type of `action` from previous code, so we need this.
      if (parsedParams.req.action !== "check") {
        throw new Error(
          `Invalid action: ${parsedParams.req.action}. Only 'check' action is supported.`
        );
      }

      const userData = await storage.getUserData({
        key: parsedParams.req.key,
        ...(limiter.type === "fixed" ? { interval: limiter.interval } : {}),
        userId: parsedParams.req?.userId || null,
        limiterType: limiter.type,
        adapters: parsedParams.adapters,
      });

      if (!userData) {
        throw new Error(
          `User data not found for key: ${parsedParams.req.key}, userId: ${parsedParams.req.userId}, limiterType: ${limiter.type}.`
        );
      }

      // Update algorithm functions to use adapters
      const result =
        limiter.type === "fixed"
          ? fixed({
              backgroundExecute: parsedParams.backgroundExecute,
              limiter,
              userData,
              userId: parsedParams.req.userId,
              key: parsedParams.req.key,
              adapters: parsedParams.adapters,
              storage,
            })
          : limiter.type === "sliding"
          ? sliding({
              backgroundExecute: parsedParams.backgroundExecute,
              limiter,
              userData,
              userId: parsedParams.req.userId,
              key: parsedParams.req.key,
              adapters: parsedParams.adapters,
              storage,
            })
          : limiter.type === "token"
          ? token({
              backgroundExecute: parsedParams.backgroundExecute,
              limiter,
              userData,
              userId: parsedParams.req.userId,
              key: parsedParams.req.key,
              adapters: parsedParams.adapters,
              storage,
            })
          : limiter.type === "borrow"
          ? borrow({
              backgroundExecute: parsedParams.backgroundExecute,
              limiter,
              userData,
              userId: parsedParams.req.userId,
              key: parsedParams.req.key,
              adapters: parsedParams.adapters,
              storage,
            })
          : null;

      return result;
    })
  );

  // Currently only gets the greatest time left
  const timeLeftArray = result.flatMap((r) =>
    r && "timeLeft" in r && typeof r.timeLeft === "number" ? r.timeLeft : []
  );
  const timeLeft =
    timeLeftArray.length > 0
      ? parseInt(getBiggest(timeLeftArray).toFixed(2))
      : null;
  // Currently only gets the greatest tokens left
  const tokensLeftArray = result.flatMap((r) =>
    r && "tokensLeft" in r && typeof r.tokensLeft === "number"
      ? r.tokensLeft
      : []
  );
  const tokensLeft =
    tokensLeftArray.length > 0
      ? parseInt(getBiggest(tokensLeftArray).toFixed(2))
      : null;
  const passedLimiters = result.filter((r) => r && r.success).length;

  if (passedLimiters < parsedParams.req.limiters.length) {
    const failedLimiters = parsedParams.req.limiters.length - passedLimiters;
    const message = `${failedLimiters} Limiter${
      failedLimiters === 1 ? "" : "s"
    } did not pass.`;
    const commonParams = {
      result: "limited",
      message,
      timeLeft,
      status: 200,
      ...(typeof tokensLeft === "number" ? { tokensLeft } : {}),
    } as const;

    const beforeResponse = parsedParams.hooks.beforeResponse;
    await isomorphicExecute(
      beforeResponse(commonParams),
      parsedParams.backgroundExecute
    );
    return commonParams;
  }

  const message = `Every limiter passed (${parsedParams.req.limiters.length}).`;
  const commonParams = {
    result: "success",
    status: 200,
    message,
    timeLeft: null,
    tokensLeft,
  } as const;

  const beforeResponse = parsedParams.hooks.beforeResponse;
  await isomorphicExecute(
    beforeResponse(commonParams),
    parsedParams.backgroundExecute
  );
  return commonParams;
}
