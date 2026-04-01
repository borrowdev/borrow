import z from "zod";
import { msParamsSchema } from "./validation";
import workersPlacementRegions from "@borrowdev/data/cloudflare-workers-placement-regions";

const ITERATIONS = 10;

type RegionKey = keyof typeof workersPlacementRegions;
type MeasureResult = { amount: number; p50: number; p90: number; p99: number };

type ErrorCode = "INVALID_PARAMS" | "UNAUTHORIZED";

type MsResult =
  | { result: "error"; status: 400; error: ErrorCode; message: string; timeLeft: null }
  | {
      result: "success";
      status: 200;
      data: { latency: Partial<Record<RegionKey, MeasureResult>> };
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

  if (data.workers.invokeSecret !== import.meta.env.WORKERS_INVOKE_SECRET) {
    return {
      result: "error" as const,
      status: 400,
      error: "UNAUTHORIZED" as const,
      message: "Invalid invoke secret",
      timeLeft: null,
    };
  }

  const { measureRequest } = data;
  const workersDomain = data.workers.domain;
  const regions = Object.keys(workersPlacementRegions) as RegionKey[];

  const results = await Promise.allSettled(
    regions.map(async (region) => {
      const workerUrl = `https://borrow-ms-${region.replace(":", "-")}-${data.environment}.${workersDomain}`;

      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: measureRequest.url,
          method: measureRequest.method,
          headers: measureRequest.headers,
          body: "body" in measureRequest ? measureRequest.body : undefined,
          iterations: ITERATIONS,
        }),
      });

      if (!res.ok) throw new Error(`${workerUrl}: ${res.status} ${await res.text()}`);
      return { region, ...((await res.json()) as MeasureResult) };
    }),
  );

  const latency: Partial<Record<RegionKey, MeasureResult>> = {};

  for (const result of results) {
    if (result.status === "fulfilled") {
      const { region, ...data } = result.value;
      latency[region] = data;
    }
  }

  return {
    result: "success" as const,
    status: 200,
    data: { latency },
  };
}

export default ms;
