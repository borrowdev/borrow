import { pluginRemark } from "@/index";
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { remark } from "remark";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const validMdFixtures = readdirSync(resolve(__dirname, "fixtures/md/valid")).map((file) =>
  readFileSync(resolve(__dirname, "fixtures/md/valid", file), "utf-8"),
);
const invalidMdFixtures = readdirSync(resolve(__dirname, "fixtures/md/invalid")).map((file) =>
  readFileSync(resolve(__dirname, "fixtures/md/invalid", file), "utf-8"),
);
const INVALID_MD_FIXTURES_AMOUNT = 4;

beforeEach(() => {
  vi.stubEnv("DOCVAL_TEST_NO_SKIP", "true");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("pluginRemark", () => {
  validMdFixtures.map((md) => {
    it("Should not throw an error for valid markdown", async () => {
      await expect(remark().use(pluginRemark).process(md)).resolves.not.toThrow();
    });
  });

  invalidMdFixtures.map((md) => {
    it("Should throw an error for invalid markdown", async () => {
      const result = await remark()
        .use(pluginRemark)
        .process(md)
        .catch((err) => err);
      expect(result.originalResults.length).toBe(INVALID_MD_FIXTURES_AMOUNT);
    });
  });
});
