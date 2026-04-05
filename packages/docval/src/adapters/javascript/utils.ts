import { parse } from "oxc-parser";
import { tmpdir } from "os";
import { mkdir, writeFile } from "fs/promises";
import manifest from "~/assets/package.json";
import { spawn } from "child_process";
import { join } from "path";
import { randomUUID } from "crypto";
import { isBuiltin } from "module";

type Imports = {
  isExternal: boolean;
  package: string;
};

async function getImports(
  code: string,
  filename: string,
  type: JavaScriptType,
): Promise<Imports[]> {
  const ast = await parse(filename, code, {
    lang: type,
  });
  return [
    ...ast.module.dynamicImports.map((d) => {
      const packageSpec = code
        .slice(d.moduleRequest.start, d.moduleRequest.end)
        .replaceAll(/['"]/g, "");
      return { package: packageSpec, isExternal: !isBuiltin(packageSpec) };
    }),
    ...ast.module.staticImports.map((s) => ({
      package: s.moduleRequest.value,
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
  imports: Imports[],
  env: string | undefined,
  options: EnvironmentOptions = {
    installCommand: ["npm", "install"],
  },
) {
  console.log(
    "Creating environment with imports",
    imports.map((i) => i.package),
  );
  if (options.environmentPath) {
    console.log("Using explicit environment at", options.environmentPath);
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
  console.log("Created environment at", path);
  const cmd = options.installCommand
    .concat(imports.filter((i) => i.isExternal).map((i) => i.package))
    .join(" ");
  if (imports.length > 0) {
    console.log("Installing dependencies with command:", cmd);
    await execUntilExit(cmd, path);
  }
  return path;
}

function execUntilExit(command: string, cwd: string): Promise<void> {
  let error = "";
  return new Promise((resolve, reject) => {
    const process = spawn(command, { cwd, shell: true });

    process.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    process.stderr.on("data", (data) => {
      error += data;
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(`Command failed with exit code ${code}\n${error})`);
      }
    });
  });
}

async function cleanupEnvironment(path: string) {
  await execUntilExit(`rm -rf ${path}`, process.cwd());
}

type JavaScriptType = "js" | "ts" | "tsx" | "jsx";

export type { JavaScriptType };
export { getImports, createEnvironment, cleanupEnvironment, execUntilExit, getEntryPath };
