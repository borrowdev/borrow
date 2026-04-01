export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { url, method, headers, body, iterations } = (await request.json()) as {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: string;
      iterations: number;
    };

    const latencies: number[] = [];
    let amount = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        const res = await fetch(url, {
          method,
          headers,
          body: method !== "GET" ? body : undefined,
        });
        await res.arrayBuffer();
        if (res.ok) amount++;
      } catch {
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

    return Response.json({
      amount,
      p50: percentile(50),
      p90: percentile(90),
      p99: percentile(99),
    });
  },
};
