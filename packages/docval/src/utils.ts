import { spawn } from "child_process";
import consola from "consola";
import { Language } from "./adapters";
import { Directive as DirectiveRust } from "./adapters/rust/utils";
import { getComments as getCommentsJavaScript } from "./adapters/javascript/utils";
import { getComments as getCommentsRust } from "./adapters/rust/utils";

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

type Directive = "hidden";

type Comment = {
  value: string;
  start: number;
  end: number;
};

type DirectiveValue = {
  args: string[];
  /**
   * Code associated with the directive
   */
  code?: string;
};

type DirectiveKey = Directive | DirectiveRust;
type DirectiveMap = Partial<Record<DirectiveKey, DirectiveValue[]>>;

function isDirective(comment: string): boolean {
  return /@docval-.+/.test(comment.trim());
}

function isCodeDirective(directive: string): boolean {
  return directive === "hidden";
}

function getAssociatedCode(code: string, comment: Comment): string | undefined {
  const commentLineStart = code.lastIndexOf("\n", comment.start - 1);
  const start = commentLineStart === -1 ? 0 : commentLineStart + 1;
  const currentLineEnd = code.indexOf("\n", comment.end);
  if (currentLineEnd === -1) {
    return code.slice(start);
  }

  const nextLineStart = currentLineEnd + 1;
  const nextLineEnd = code.indexOf("\n", nextLineStart);

  return code.slice(start, nextLineEnd === -1 ? code.length : nextLineEnd + 1);
}

async function getDirectives(code: string, language: Language): Promise<DirectiveMap> {
  let comments: Comment[] = [];
  switch (language) {
    case "javascript":
    case "js":
    case "jsx":
    case "typescript":
    case "ts":
    case "tsx":
      const jsType = ["javascript", "js"].includes(language)
        ? "js"
        : language === "jsx"
          ? "jsx"
          : ["typescript", "ts"].includes(language)
            ? "ts"
            : "tsx";
      comments = await getCommentsJavaScript(code, jsType);
      break;
    case "rust":
    case "rs":
      comments = await getCommentsRust(code);
      break;
  }

  const directives: DirectiveMap = {};
  const prefix = "@docval-";
  for (const comment of comments) {
    if (!isDirective(comment.value)) continue;
    const trimmed = comment.value.trim();
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
    const key = directive as DirectiveKey;
    directives[key] ??= [];
    directives[key].push({
      args,
      code: isCodeDirective(directive) ? getAssociatedCode(code, comment) : undefined,
    });
  }

  return directives;
}

async function filterHiddenCode(code: string, language: Language): Promise<string> {
  const directives = await getDirectives(code, language);
  let filteredCode = code;
  if (directives.hidden) {
    for (const directive of directives.hidden) {
      if (directive.code) {
        filteredCode = filteredCode.replace(directive.code, "");
      }
    }
  }

  return filteredCode;
}

export { execUntilExit, cleanupEnvironment, logger, getDirectives, filterHiddenCode };
export type { Comment };
