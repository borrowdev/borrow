import adapters from "@/adapters";
import { CONTENT_CACHE_DIR } from "@/constants";
import { logger } from "@/utils";
import { hash } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import type { Root } from "mdast";

export type DocValOptions = {
  cache: boolean;
  include: boolean;
};

mkdirSync(CONTENT_CACHE_DIR, { recursive: true });

const defaultOptions: DocValOptions = {
  cache: process.env.CI !== "true" && process.env.NODE_ENV !== "test",
  include: false,
};

export default function remarkDocval(options: Partial<DocValOptions> = defaultOptions) {
  const { cache, include } = { ...defaultOptions, ...options };

  return async function (tree: Root) {
    const promises: Promise<{
      result: any;
      contentHash: string;
    }>[] = [];
    await Promise.all(
      tree.children.map(async (node) => {
        if (node.type === "code" && node.lang && node.lang in adapters) {
          const contentHash = hash("sha1", JSON.stringify([node.value, node.lang, node.meta]));
          if (cache) {
            const [success, originalResults]: [boolean | null, any] = await readFile(
              `${CONTENT_CACHE_DIR}/${contentHash}.txt`,
              { encoding: "utf-8" },
            )
              .then((content) => {
                const [success, results] = content.split("\n");

                if (!["true", "false"].includes(success)) {
                  return [null, null] as [boolean | null, any];
                }
                return [success === "true", JSON.parse(results ?? "null")] as [boolean, any];
              })
              .catch(() => [null, null]);

            if (typeof success === "boolean") {
              logger.debug("Result found in cache, skipping validation");

              if (!success) {
                throw JSON.stringify({
                  message: "One or more code blocks failed validation.",
                  originalResults: originalResults,
                });
              } else {
                return;
              }
            }
          }

          const metadata = node.meta?.split(" ") ?? [];
          const docValIndex = metadata.findIndex((item) => item === "docval");
          const noDocValIndex = metadata.findIndex((item) => item === "no-docval");
          if ((include && noDocValIndex === -1) || docValIndex !== -1) {
            promises.push(
              (async () => {
                try {
                  const result = await adapters[node.lang as keyof typeof adapters](
                    node.value,
                    metadata,
                  );
                  return {
                    result,
                    contentHash,
                  };
                } catch (err) {
                  throw {
                    result: err,
                    contentHash,
                  };
                }
              })(),
            );
          }
        } else if (node.type === "code" && process.env.DOCVAL_TEST_NO_SKIP === "true") {
          throw new Error(`Skipped code block: ${JSON.stringify(node)}`);
        }
      }),
    );
    const res = await Promise.allSettled(promises);

    if (cache) {
      await Promise.all(
        res.map(async (r) => {
          const path = (hash: string) => `${CONTENT_CACHE_DIR}/${hash}.txt`;
          if (r.status === "rejected" && !existsSync(path(r.reason.contentHash))) {
            await writeFile(
              `${CONTENT_CACHE_DIR}/${r.reason.contentHash}.txt`,
              `false\n${JSON.stringify(r.reason)}`,
            );
          } else if (r.status === "fulfilled" && !existsSync(path(r.value.contentHash))) {
            await writeFile(`${CONTENT_CACHE_DIR}/${r.value.contentHash}.txt`, "true");
          }
        }),
      );
    }

    if (res.some((r) => r.status === "rejected")) {
      throw JSON.stringify({
        message: "One or more code blocks failed validation.",
        originalResults: res,
      });
    }

    return tree;
  };
}
