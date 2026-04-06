import { getFilename, getOptions } from "@/remark/utils";
import {
  cleanupEnvironment,
  createEnvironment,
  execUntilExit,
  getEntryPath,
  getImports,
  JavaScriptType,
} from "./utils";
import { readFile } from "fs/promises";
import { ADAPTER_OPTIONS } from "./constants";
import { existsSync } from "fs";
import { JsxEmit, transpileModule } from "typescript";

type AdapterOptions = {
  env: string;
  installCommand: string[];
  environment?: string;
};

async function adapterJavaScript(
  code: string,
  filename: string,
  options: AdapterOptions,
  type: JavaScriptType,
): Promise<void> {
  const dotenv = existsSync(options.env)
    ? await readFile(options.env, { encoding: "utf-8" })
    : undefined;
  const imports = await getImports(code, filename, type);
  const parsedCode =
    type !== "js"
      ? transpileModule(code, {
          fileName: filename + `.${type}`,
          compilerOptions: {
            jsx: JsxEmit.React,
          },
        }).outputText
      : code;
  const environmentPath = await createEnvironment(parsedCode, imports, dotenv, {
    environmentPath: options.environment,
    installCommand: options.installCommand,
  });

  try {
    const envFlag = dotenv ? `--env-file=${environmentPath}/.env` : "";
    await execUntilExit(`node ${envFlag} ${getEntryPath(environmentPath)}`, process.cwd());
  } finally {
    if (!options.environment) {
      await cleanupEnvironment(environmentPath);
    }
  }
}

export const adapterWrapperJavaScript = (
  code: string,
  metadata: string[],
  type: JavaScriptType,
): Promise<void> =>
  adapterJavaScript(code, getFilename(metadata, code), getOptions(metadata, ADAPTER_OPTIONS), type);
export default (code: string, metadata: string[]) => adapterWrapperJavaScript(code, metadata, "js");
