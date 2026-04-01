import { z } from "zod";
import workersPlacementRegions from "@borrowdev/data/cloudflare-workers-placement-regions";

const msParamsMeasureRequestCommonSchema = z.object({
  method: z.union([z.literal("GET"), z.literal("POST"), z.literal("PUT"), z.literal("DELETE")]),
  url: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
});

const msParamsSchema = z.object({
  action: z.literal("measure"),
  environment: z.union([z.literal("development"), z.literal("production")]),
  workers: z.object({
    domain: z.string(),
    invokeSecret: z.string(),
  }),
  measureRequest: z.discriminatedUnion("method", [
    msParamsMeasureRequestCommonSchema.extend({
      method: z.literal("GET"),
    }),
    msParamsMeasureRequestCommonSchema.extend({
      method: z.union([z.literal("POST"), z.literal("PUT"), z.literal("DELETE")]),
      body: z.string().optional(),
    }),
  ]),
});

const msResultSuccessSchema = z.object({
  result: z.literal("success"),
  status: z.number(),
  data: z.object({
    latency: z.record(
      z.union(
        Object.keys(workersPlacementRegions).map((region) => {
          const typedRegion = region as keyof typeof workersPlacementRegions;
          return z.literal(typedRegion);
        }),
      ),
      z.object({
        /**
         * The amount of requests made to the API
         */
        amount: z.number(),
        /**
         * The 50th percentile latency in milliseconds
         */
        p50: z.number(),
        /**
         * The 90th percentile latency in milliseconds
         */
        p90: z.number(),
        /**
         * The 99th percentile latency in milliseconds
         */
        p99: z.number(),
      }),
    ),
  }),
});

export { msParamsSchema, msResultSuccessSchema };
