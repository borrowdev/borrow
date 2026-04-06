import { spawn } from "child_process";
import consola from "consola";

const logger = consola.withTag("Borrow").withTag("DocVal");

function execUntilExit(command: string, cwd: string): Promise<void> {
  let error = "";
  return new Promise((resolve, reject) => {
    const process = spawn(command, { cwd, shell: true });

    process.stdout.on("data", (data) => {
      logger.debug(data.toString());
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

type DocvalDirectives = Record<string, string[][]> & {
  "cargo-add-options"?: string[][];
};

function parseDirectives(comments: string[]): DocvalDirectives {
  const directives: DocvalDirectives = {};
  const prefix = "@docval-";
  for (const line of comments) {
    const trimmed = line.trim();
    const prefixIndex = trimmed.indexOf(prefix);
    if (prefixIndex === -1) continue;
    const content = trimmed.slice(prefixIndex + prefix.length);
    const spaceIdx = content.indexOf(" ");
    const directive = spaceIdx === -1 ? content : content.slice(0, spaceIdx);
    const args =
      spaceIdx === -1
        ? []
        : content
            .slice(spaceIdx + 1)
            .split(" ")
            .filter(Boolean);
    if (!Array.isArray(directives[directive])) {
      directives[directive] = [];
    }
    directives[directive].push(args);
  }
  return directives;
}

export { execUntilExit, cleanupEnvironment, logger, parseDirectives };
export type { DocvalDirectives };
