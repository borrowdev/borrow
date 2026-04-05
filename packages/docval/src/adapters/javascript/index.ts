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

type AdapterOptions = {
  env: string;
  installCommand: string[];
  environmentPath?: string;
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
  const environmentPath = await createEnvironment(code, imports, dotenv, {
    environmentPath: options.environmentPath,
    installCommand: options.installCommand,
  });

  try {
    const envFlag = dotenv ? `--env-file=${environmentPath}/.env` : "";
    await execUntilExit(`node ${envFlag} ${getEntryPath(environmentPath)}`, process.cwd());
  } finally {
    await cleanupEnvironment(environmentPath);
  }
}

export const adapterWrapperJavaScript = (
  code: string,
  metadata: string[],
  type: JavaScriptType,
): Promise<void> =>
  adapterJavaScript(code, getFilename(metadata, code), getOptions(metadata, ADAPTER_OPTIONS), type);
export default (code: string, metadata: string[]) => adapterWrapperJavaScript(code, metadata, "js");
