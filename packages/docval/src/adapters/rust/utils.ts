import { tmpdir } from "os";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

type EnvironmentOptions = {
  environmentPath?: string;
};

function getEntryPath(environmentPath: string) {
  return `${environmentPath}/src/main.rs`;
}

async function createEnvironment(code: string, options: EnvironmentOptions = {}) {
  if (options.environmentPath) {
    console.log("Using explicit environment at", options.environmentPath);
    await mkdir(`${options.environmentPath}/src`, { recursive: true });
    await writeFile(getEntryPath(options.environmentPath), code);
    return options.environmentPath;
  }

  const manifest = await readFile(new URL("../../../assets/Cargo.toml", import.meta.url), "utf-8");
  const path = join(tmpdir(), "docval", randomUUID());
  await mkdir(`${path}/src`, { recursive: true });
  await Promise.all([
    writeFile(`${path}/Cargo.toml`, manifest),
    writeFile(`${path}/src/main.rs`, code),
  ]);
  console.log("Created Rust environment at", path);
  return path;
}

export { createEnvironment, getEntryPath };
