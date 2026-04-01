import express from "express";
import type { Express } from "express";
import { limiter, UpstashRedisAdapter } from "@borrowdev/limiter/limiter/host";
import { Redis } from "@upstash/redis";
import config from "~/tests/fixtures/environments/config";

const app: Express = express();
app.use(express.json());

const redis: Redis = new Redis({
  url: "mock-url-express",
  token: "mock-token-express",
});

app.post("/limiter", async (request, res) => {
  try {
    const adapters = { storage: new UpstashRedisAdapter(redis) };

    const response = await limiter({
      env: {
        BORROW_LIMITER_INVOKE_SECRET: config.limiterSecret,
      },
      req: {
        ...request.body,
        invokeSecret: request.headers["x-borrow-api-key"] || "",
      } as any,
      adapters,
      backgroundExecute: false,
    });

    res.status(response.status).json({
      result: response.result,
      timeLeft: response.timeLeft,
      tokensLeft: response.tokensLeft,
    });
  } catch (err) {
    console.error("Error in /limiter endpoint: ", err);
    res.status(500).json({
      result: "error",
      message: "Internal server error",
    });
  }
});

export default app;
export { redis };
