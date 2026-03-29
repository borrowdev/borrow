import { default as limiterInternal } from "@/lib/limiter/limiter";
import { createHybridObject } from "./lib/utils";
import { refillTokens } from "./lib/limiter/tokens";

const limiter: typeof limiterInternal & { refillTokens: typeof refillTokens } = createHybridObject(
  limiterInternal,
  {
    refillTokens,
  },
);

export type { LimiterError } from "@/lib/limiter/utils";
export { limiter };

const defaultExport: { limiter: typeof limiter } = {
  limiter,
};

export default defaultExport;
