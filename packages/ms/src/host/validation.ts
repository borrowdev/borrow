import { z } from "zod";
import workersPlacementRegions from "@borrowdev/data/cloudflare-workers-placement-regions";

const msParamsMeasureRequestCommonSchema = z.object({
  method: z.union([z.literal("GET"), z.literal("POST"), z.literal("PUT"), z.literal("DELETE")]),
  url: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
});

const regionsUnion = z.union(
  Object.keys(workersPlacementRegions).map((region) =>
    z.literal(region as keyof typeof workersPlacementRegions),
  ),
);

const msParamsSchema = z.object({
  /**
   * An array of regions to measure against. If null, will measure against all regions.
   */
  regions: z.array(regionsUnion).nullable(),
  environment: z.union([z.literal("development"), z.literal("production")]),
  workers: z.object({
    domain: z.string(),
  }),

  req: z.object({
    action: z.literal("measure"),
    measureRequest: z.discriminatedUnion("method", [
      msParamsMeasureRequestCommonSchema.extend({
        method: z.literal("GET"),
      }),
      msParamsMeasureRequestCommonSchema.extend({
        method: z.union([z.literal("POST"), z.literal("PUT"), z.literal("DELETE")]),
        body: z.string().optional(),
      }),
    ]),
  }),
});

const msResultSuccessSchema = z.object({
  result: z.literal("success"),
  status: z.number(),
  latency: z.record(
    regionsUnion,
    z.object({
      metadata: z.object({
        country: z.string(),
        region: z.string(),
        direction: z.string(),
      }),
      data: z.object({
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
    }),
  ),
});

export { msParamsSchema, msResultSuccessSchema };
