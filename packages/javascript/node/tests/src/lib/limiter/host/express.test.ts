import { it as baseIt } from "vitest";
import limiterTests from "./limiter.base";
import app from "~/tests/fixtures/environments/express/src";
import config from "~/tests/fixtures/environments/config";
import { redis } from "~/tests/fixtures/environments/express/src";

const it = baseIt
  // oxlint-disable-next-line no-empty-pattern
  .extend("endpoint", { scope: "file" }, async ({}, { onCleanup }) => {
    let resolveServerPromise: (value: string) => void;
    let serverPromise: Promise<string> | null = new Promise((resolve) => {
      resolveServerPromise = resolve;
    });
    const server = app.listen(config.ports.express, "127.0.0.1", () => {
      let address = server.address();
      if (typeof address === "string") {
        address = `http://${address}`;
      } else if (address) {
        address = `http://${address.address}:${address.port}`;
      } else {
        throw new Error("Failed to determine fixture Express.js server address");
      }

      console.log(`Fixture Express.js server running on address ${address}`);
      resolveServerPromise(address);
    });

    onCleanup(() => {
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            console.error("Error closing fixture Express.js server: ", err);
            reject(err);
          } else {
            console.log("Fixture Express.js server closed successfully");
            resolve();
          }
        });
      });
    });

    return serverPromise;
  });

// @ts-ignore TODO: Find a way to fix this error.
limiterTests(it, redis);
