import { limiter, UpstashRedisAdapter } from "@borrowdev/node/limiter/host";
import { Redis } from "@upstash/redis/cloudflare";
import config from "../../config.js";

const BORROW_LIMITER_INVOKE_SECRET = "test-secret";
const redis: Redis = new Redis({
  url: "mock-url-cloudflare",
  token: "mock-token-cloudflare",
});

export default {
  async fetch(request, _env, ctx) {
    const adapters = { storage: new UpstashRedisAdapter(redis) };
    const req: any = await request.json();

    const response = await limiter({
      env: {
        BORROW_LIMITER_INVOKE_SECRET: config.limiterSecret,
      },
      req: {
        ...req,
        invokeSecret: request.headers.get("X-Borrow-Api-Key") || "",
      } as any,
      adapters,
      backgroundExecute: ctx.waitUntil.bind(ctx),
    });

    return new Response(
      JSON.stringify({
        result: response.result,
        timeLeft: response.timeLeft,
        tokensLeft: response.tokensLeft,
      }),
      {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  },
} satisfies ExportedHandler<Env>;

export { BORROW_LIMITER_INVOKE_SECRET, redis };
