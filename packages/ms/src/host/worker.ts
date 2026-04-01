import { env } from "cloudflare:workers";

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { url, method, headers, body, iterations, invokeSecret } = (await request.json()) as {
      invokeSecret: string;
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: string;
      iterations: number;
    };

    if (invokeSecret !== env.MS_INVOKE_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const latencies: number[] = [];
    let amount = 0;

    const responses = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        const res = await fetch(url, {
          method,
          headers,
          body,
        });
        if (res.ok) {
          amount++;
        }
        responses.push({ text: await res.text(), status: res.status });
      } catch (err) {
        responses.push({ text: (err as Error).message, status: -1 });
        // request failed, don't count as successful
      }
      latencies.push(performance.now() - start);
    }

    latencies.sort((a, b) => a - b);

    const percentile = (p: number) => {
      if (latencies.length === 0) return 0;
      const idx = Math.ceil(latencies.length * (p / 100)) - 1;
      return Math.round(latencies[Math.max(0, idx)]! * 100) / 100;
    };

    if (amount === 0) {
      return new Response(
        `Upstream error: ${responses.map((r) => `${r.status} ${r.text}`).join(", ")}`,
        { status: 400 },
      );
    }

    return Response.json({
      amount,
      p50: percentile(50),
      p90: percentile(90),
      p99: percentile(99),
    });
  },
};
