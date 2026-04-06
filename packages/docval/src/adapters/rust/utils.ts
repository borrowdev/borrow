import { Language, Parser } from "web-tree-sitter";
import { createRequire } from "module";
import { tmpdir } from "os";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { execUntilExit, logger } from "@/utils";

const require = createRequire(import.meta.url);
const RUST_WASM_PATH = require.resolve("tree-sitter-rust/tree-sitter-rust.wasm");

let rustLanguage: Language | undefined;

async function getRustLanguage(): Promise<Language> {
  if (!rustLanguage) {
    await Parser.init();
    rustLanguage = await Language.load(RUST_WASM_PATH);
  }
  return rustLanguage!;
}

const BUILTIN_CRATES = new Set(["std", "core", "alloc", "crate"]);
const ERROR_CRATES = new Set(["crate", "super", "self"]);

type Import = {
  isExternal: boolean;
  package: string;
};

async function getImports(code: string): Promise<Import[]> {
  const language = await getRustLanguage();
  const parser = new Parser();
  parser.setLanguage(language);
  const tree = parser.parse(code);
  const imports: Import[] = [];

  for (const node of tree!.rootNode.children) {
    let crateName: string | undefined;

    if (node.type === "use_declaration") {
      const arg = node.child(1);
      if (!arg) continue;
      if (arg.type === "identifier" || arg.type === "scoped_identifier") {
        crateName = arg.text.split("::")[0];
      }
    }

    if (crateName) {
      if (ERROR_CRATES.has(crateName)) {
        throw new Error(
          `Unsupported import of "${crateName}". ` +
            `Imports of ${Array.from(ERROR_CRATES)
              .map((c) => `"${c}"`)
              .join(", ")} are not supported.`,
        );
      }

      imports.push({
        package: crateName,
        isExternal: !BUILTIN_CRATES.has(crateName),
      });
    }
  }

  return imports;
}

type EnvironmentOptions = {
  environmentPath?: string;
};

function getEntryPath(environmentPath: string) {
  return `${environmentPath}/src/main.rs`;
}

async function createEnvironment(
  code: string,
  imports: Import[],
  options: EnvironmentOptions = {},
) {
  logger.info(
    "Creating Rust environment with crates",
    imports.map((i) => i.package),
  );

  if (options.environmentPath) {
    logger.info("Using explicit environment at", options.environmentPath);
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
  if (imports.length > 0) {
    const crates = imports.filter((i) => i.isExternal).map((i) => i.package);
    logger.info("Installing crates", crates);
    await execUntilExit(`cargo add ${crates.join(" ")}`, path);
  }
  logger.info("Created Rust environment at", path);
  return path;
}

export { getImports, createEnvironment, getEntryPath };
export type { Import };
