import { it as baseIt } from "vitest";
import limiterTests from "./limiter.base";
import { redis } from "~/tests/fixtures/environments/cloudflare/src";
import config from "~/tests/fixtures/environments/config";
import { exports } from "cloudflare:workers";
import { http } from "msw";
import { setupServer } from "msw/node";

const it = baseIt
  // oxlint-disable-next-line no-empty-pattern
  .extend("endpoint", { scope: "file" }, async ({}, { onCleanup }) => {
    const endpoint = `http://127.0.0.1:${config.ports.cloudflare}`;
    const post = http.post(`${endpoint}/limiter`, async (info) => {
      const request = new Request(info.request.url, info.request);
      return exports.default.fetch(request);
    });

    const server = setupServer(post);
    server.listen();
    onCleanup(() => server.close());

    return endpoint;
  });

// @ts-ignore TODO: Find a way to fix this error.
limiterTests(it, redis);
