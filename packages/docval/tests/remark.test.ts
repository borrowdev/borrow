import { remarkDocVal } from "@/index";
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { remark } from "remark";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const validMdFixtures = readdirSync(resolve(__dirname, "fixtures/md/valid")).map((file) => [
  file,
  readFileSync(resolve(__dirname, "fixtures/md/valid", file), "utf-8"),
]);
const invalidMdFixtures = readdirSync(resolve(__dirname, "fixtures/md/invalid")).map((file) => [
  file,
  readFileSync(resolve(__dirname, "fixtures/md/invalid", file), "utf-8"),
]);

beforeEach(() => {
  vi.stubEnv("DOCVAL_TEST_NO_SKIP", "true");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("pluginRemark", () => {
  validMdFixtures.forEach(([file, md]) => {
    const codeblocks = md.match(/```[\s\S]*?```/g) || [];
    for (let i = 0; i < codeblocks.length; i++) {
      const block = codeblocks[i];
      it(`Should not throw an error for valid markdown: ${file} - ${i + 1}`, async () => {
        try {
          const result = await remark().use(remarkDocVal).process(block);
          expect(result.value.toString().trim()).toEqual(block.trim());
        } catch (err: any) {
          console.error("Original results", err.originalResults);
          throw err;
        }
      });
    }
  });

  invalidMdFixtures.forEach(([file, md]) => {
    const codeblocks = md.match(/```[\s\S]*?```/g) || [];
    for (let i = 0; i < codeblocks.length; i++) {
      const block = codeblocks[i];
      it(`Should throw an error for invalid markdown: ${file} - ${i + 1}`, async () => {
        await expect(remark().use(remarkDocVal).process(block)).rejects.toThrow();
      });
    }
  });
});
