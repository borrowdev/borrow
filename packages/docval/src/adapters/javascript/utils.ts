import { parse } from "oxc-parser";
import { tmpdir } from "os";
import { mkdir, writeFile } from "fs/promises";
import manifest from "~/assets/package.json";
import { join } from "path";
import { randomUUID } from "crypto";
import { isBuiltin } from "module";
import { cleanupEnvironment, execUntilExit, logger } from "@/utils";
import type { Comment } from "@/utils";

type Import = {
  isExternal: boolean;
  package: string;
};

function getTree(code: string, type: JavaScriptType, filename?: string) {
  return parse(filename ?? "unknown", code, {
    lang: type,
  });
}

async function getComments(code: string, type: JavaScriptType): Promise<Comment[]> {
  const ast = await getTree(code, type);
  return ast.comments.map((comment) => ({
    value: comment.value,
    start: comment.start,
    end: comment.end,
  }));
}

function getPackage(importSpec: string): string {
  let packageSpec = importSpec;
  // Deno environment
  if (packageSpec.startsWith("npm:")) {
    packageSpec = packageSpec.slice(4);
  }
  if (packageSpec.startsWith("@")) {
    return packageSpec.split("/").slice(0, 2).join("/");
  }
  return packageSpec.split("/")[0];
}

async function getImports(code: string, filename: string, type: JavaScriptType): Promise<Import[]> {
  const ast = await getTree(code, type, filename);
  return [
    ...ast.module.dynamicImports.map((d) => {
      const packageSpec = getPackage(
        code.slice(d.moduleRequest.start, d.moduleRequest.end).replaceAll(/['"]/g, ""),
      );
      return { package: packageSpec, isExternal: !isBuiltin(packageSpec) };
    }),
    ...ast.module.staticImports.map((s) => ({
      package: getPackage(s.moduleRequest.value),
      isExternal: !isBuiltin(s.moduleRequest.value),
    })),
  ];
}

type EnvironmentOptions = {
  environmentPath?: string;
  installCommand: string[];
};

function getEntryPath(environmentPath: string) {
  return `${environmentPath}/dist/index.js`;
}

async function createEnvironment(
  code: string,
  imports: Import[],
  env: string | undefined,
  options: EnvironmentOptions = {
    installCommand: ["npm", "install"],
  },
) {
  logger.info(
    "Creating environment with imports",
    imports.map((i) => i.package),
  );
  if (options.environmentPath) {
    logger.info("Using explicit environment at", options.environmentPath);
    await mkdir(`${options.environmentPath}/dist`, { recursive: true });
    await writeFile(`${options.environmentPath}/dist/index.js`, code);
    return options.environmentPath;
  }

  const path = join(tmpdir(), "docval", randomUUID());
  await mkdir(`${path}/dist`, { recursive: true });
  await Promise.all([
    writeFile(`${path}/package.json`, JSON.stringify(manifest)),
    writeFile(`${path}/dist/index.js`, code),
    env ? writeFile(`${path}/.env`, env) : Promise.resolve(),
  ]);
  logger.info("Created environment at", path);
  const cmd = options.installCommand
    .concat(imports.filter((i) => i.isExternal).map((i) => i.package))
    .join(" ");
  if (imports.length > 0) {
    logger.info("Installing dependencies with command:", cmd);
    await execUntilExit(cmd, path);
  }
  return path;
}

type JavaScriptType = "js" | "ts" | "tsx" | "jsx";

export type { JavaScriptType };
export {
  getImports,
  createEnvironment,
  cleanupEnvironment,
  execUntilExit,
  getEntryPath,
  getComments,
};
