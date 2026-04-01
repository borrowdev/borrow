import { default as limiterInternal } from "@/lib/limiter/limiter";
import { createHybridObject } from "./lib/utils";
import { refillTokens } from "./lib/limiter/tokens";

const limiter: typeof limiterInternal & { tokens: { refill: typeof refillTokens } } =
  createHybridObject(limiterInternal, {
    tokens: {
      refill: refillTokens,
    },
  });

export type { LimiterError } from "@/lib/limiter/utils";
export type {
  Key,
  AnyLimiter,
  BorrowLimiter,
  FixedLimiter,
  SlidingLimiter,
  TokenLimiter,
  CommonLimiterOptions,
  LimiterResult,
} from "@/lib/limiter/types";
export { limiter };

const defaultExport: { limiter: typeof limiter } = {
  limiter,
};

export default defaultExport;
