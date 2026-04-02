import z from "zod";
import { msParamsSchema } from "./validation";
import { env } from "cloudflare:workers";
import workersPlacementRegions from "@borrowdev/data/cloudflare-workers-placement-regions";

type RegionKey = keyof typeof workersPlacementRegions;
type MeasureResult = { amount: number; p50: number; p90: number; p99: number };
type EnhancedMeasureResult = {
  metadata: (typeof workersPlacementRegions)[RegionKey];
  data: MeasureResult;
};

type ErrorCode = "INVALID_PARAMS" | "UNAUTHORIZED" | "UPSTREAM";

type MsResult =
  | { result: "error"; status: 400; error: ErrorCode; message: string; timeLeft: null }
  | {
      result: "success";
      status: 200;
      latency: Partial<Record<RegionKey, EnhancedMeasureResult>>;
    };

async function ms(params: z.infer<typeof msParamsSchema>): Promise<MsResult> {
  const { success, data, error } = msParamsSchema.safeParse(params);
  if (!success) {
    return {
      result: "error" as const,
      status: 400,
      error: "INVALID_PARAMS" as const,
      message: error.message,
      timeLeft: null,
    };
  }

  const measureRequest = data.req.measureRequest;
  const workersDomain = data.workers.domain;
  const regions = data.regions ?? (Object.keys(workersPlacementRegions) as RegionKey[]);

  const results = await Promise.allSettled(
    regions.map(async (region) => {
      const workerUrl = `https://borrow-ms-${region.replace(":", "-")}-${data.environment}.${workersDomain}`;

      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invokeSecret: env.MS_INVOKE_SECRET,
          url: measureRequest.url,
          method: measureRequest.method,
          headers: measureRequest.headers,
          body: "body" in measureRequest ? measureRequest.body : undefined,
          iterations: env.ITERATIONS || 10,
        }),
      });

      if (!res.ok) {
        throw new Error(`${workerUrl}: ${res.status} ${await res.text()}`);
      }
      return { region, ...((await res.json()) as MeasureResult) };
    }),
  );

  if (results.every((r) => r.status === "rejected")) {
    return {
      result: "error" as const,
      status: 400,
      error: "UPSTREAM" as const,
      message:
        "All requests to workers failed. Check if your API parameters are correct. Original errors: " +
        results.map((r) => (r.status === "rejected" ? r.reason.message : "")),
      timeLeft: null,
    };
  }

  const latency: Partial<Record<RegionKey, EnhancedMeasureResult>> = {};

  for (const result of results) {
    if (result.status === "fulfilled") {
      const { region, ...data } = result.value;
      latency[region] = {
        metadata: workersPlacementRegions[region],
        data,
      };
    }
  }

  return {
    result: "success" as const,
    status: 200,
    latency,
  };
}

export default ms;
